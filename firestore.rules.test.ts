/**
 * Security Verification Suite (Phase 0) for PJS Ventures Firestore Rules.
 * Verifies the "Dirty Dozen" attack payloads against @firebase/rules-unit-testing
 * when running against a local Firestore Emulator.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: 'vehicles' | 'bookings' | 'videos' | 'portalUsers';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Booking Create',
    collection: 'bookings',
    operation: 'create',
    auth: null,
    payload: {
      id: 'bk-shadow-1',
      buyerName: 'Attacker',
      buyerEmail: 'attacker@example.com',
      isAdmin: true,
      status: 'Pending Review',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unauthenticated Booking List (PII Scrape)',
    collection: 'bookings',
    operation: 'list',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Token Spoof',
    collection: 'vehicles',
    operation: 'create',
    auth: { email: 'naseebsaleemvmi@gmail.com', email_verified: false },
    payload: { id: 'veh-spoof', makeModel: 'Fake', chassisCode: 'X1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Privilege Escalation via Self-Registration in portalUsers',
    collection: 'portalUsers',
    operation: 'create',
    auth: { email: 'outsider@gmail.com', email_verified: true },
    payload: {
      id: 'outsider_at_gmail_dot_com',
      email: 'outsider@gmail.com',
      role: 'Admin',
      active: true,
      isPrimaryOwner: false,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Self Privilege Escalation by Viewer in portalUsers',
    collection: 'portalUsers',
    operation: 'update',
    auth: { email: 'viewer@gmail.com', email_verified: true },
    payload: { role: 'Admin', permissions: { usersManage: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Primary Owner Deletion Attempt by Sub-Admin',
    collection: 'portalUsers',
    operation: 'delete',
    auth: { email: 'subadmin@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unauthorized Vehicle Creation by Viewer',
    collection: 'vehicles',
    operation: 'create',
    auth: { email: 'viewer@gmail.com', email_verified: true },
    payload: { id: 'veh-unauth', makeModel: 'Unauthorized', chassisCode: 'U1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'State Shortcutting on Public Booking Create',
    collection: 'bookings',
    operation: 'create',
    auth: null,
    payload: {
      id: 'bk-shortcut',
      buyerName: 'Buyer',
      buyerEmail: 'buyer@example.com',
      status: 'Deposit Confirmed',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Terminal State Modification by Non-Admin Editor',
    collection: 'bookings',
    operation: 'update',
    auth: { email: 'editor@gmail.com', email_verified: true },
    payload: { status: 'Contacted' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID Poisoning on Vehicles',
    collection: 'vehicles',
    operation: 'create',
    auth: { email: 'naseebsaleemvmi@gmail.com', email_verified: true },
    payload: { id: 'bad$id/with/slashes', makeModel: 'Poison', chassisCode: 'P1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Timestamp Forgery on Vehicle Create',
    collection: 'vehicles',
    operation: 'create',
    auth: { email: 'naseebsaleemvmi@gmail.com', email_verified: true },
    payload: { id: 'veh-time-1', createdAt: '1999-01-01T00:00:00.000Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Ghost Field Update on Booking (Tampering quotedAmountUsd)',
    collection: 'bookings',
    operation: 'update',
    auth: { email: 'editor@gmail.com', email_verified: true },
    payload: { quotedAmountUsd: 1, status: 'Contacted' },
    expected: 'PERMISSION_DENIED',
  },
];
