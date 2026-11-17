# PJS Ventures Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Default-Deny Catch-All**: All unmatched paths in `/databases/{database}/documents` are explicitly denied (`allow read, write: if false;`).
2. **Primary Owner Root of Trust**: `naseebsaleemvmi@gmail.com` with `request.auth.token.email_verified == true` is the immutable Primary Owner (`Admin`), and their `portalUsers` document cannot be deleted or downgraded.
3. **Zero-Trust RBAC Lookup**: Team member authorization (`Admin`, `Editor`, `Viewer`, and granular `permissions` flags) is verified exclusively from the server-stored `portalUsers/{emailKey}` document matching `request.auth.token.email.lower()` with `active == true` and `email_verified == true`.
4. **PII Isolation**: `bookings` (buyer names, emails, phones) and `portalUsers` (staff names, emails, role assignments) are never publicly readable; `bookings` supports public inquiry `create` with strict schema validation and `'Pending Review'` initial status lock.
5. **Strict Path & Schema Validation**: Every document ID matches `^[a-zA-Z0-9_-]+$` (`size <= 128`), every string has strict `.size()` bounds, arrays are bounded (`images.size() <= 8`), no shadow/ghost keys are permitted (`hasAll` + `hasOnly`), `id` and `createdAt` are immutable on update, and timestamps use `request.time`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Shadow Field Injection on Booking Create**: Sending `isAdmin: true` or `verified: true` in `bookings/{id}` create -> **MUST BE DENIED** (`keys().hasOnly(...)`).
2. **Unauthenticated Booking Read/List (PII Scrape)**: Calling `getDocs(collection(db, 'bookings'))` without auth -> **MUST BE DENIED**.
3. **Unverified Email Token Spoof**: Authenticated user with `email: 'naseebsaleemvmi@gmail.com'` and `email_verified: false` -> **MUST BE DENIED**.
4. **Privilege Escalation via Self-Registration**: Signing in as random verified Google user and trying to `setDoc(doc(db, 'portalUsers', ...), { role: 'Admin', permissions: ... })` -> **MUST BE DENIED**.
5. **Privilege Escalation via Profile Update**: A `Viewer` or `Editor` updating their own `portalUsers` document to set `usersManage: true` or `role: 'Admin'` -> **MUST BE DENIED**.
6. **Primary Owner Deletion / Downgrade**: Another Admin attempting to delete or deactivate `naseebsaleemvmi@gmail.com` or set `isPrimaryOwner: false` -> **MUST BE DENIED**.
7. **Unauthorized Vehicle Creation/Deletion**: A `Viewer` (`inventoryWrite: false`, `inventoryDelete: false`) attempting to add or delete a vehicle -> **MUST BE DENIED**.
8. **State Shortcutting on Public Booking**: Public visitor creating a booking with `status: 'Deposit Confirmed'` instead of `'Pending Review'` -> **MUST BE DENIED**.
9. **Terminal State Modification**: Non-Admin `Editor` trying to modify a booking whose status is already `'Cancelled'` -> **MUST BE DENIED**.
10. **ID Poisoning / Resource Exhaustion**: Writing to `/vehicles/` with a 500-char or special-character document ID, or oversized 1.5MB string field -> **MUST BE DENIED**.
11. **Timestamp Forgery**: Creating a vehicle or booking with a forged past/future client `createdAt` instead of `serverTimestamp()` (`request.time`) -> **MUST BE DENIED**.
12. **Ghost Field Update on Booking**: Updating `quotedAmountUsd` or `buyerEmail` during a CRM status/notes update (`affectedKeys().hasOnly(['status', 'crmNotes', 'updatedAt'])`) -> **MUST BE DENIED**.
