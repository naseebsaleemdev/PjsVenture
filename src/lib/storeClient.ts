import { sendEmailVerification, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  INITIAL_BOOKINGS,
  INITIAL_UNLOADING_VIDEOS,
  INITIAL_VEHICLES,
} from '../data/seedInventory.ts';
import type {
  BookingRequest,
  ExportVehicle,
  PortalPermissions,
  PortalUser,
  UnloadingVideo,
  VehicleStatus,
} from '../types/autoTrade.ts';
import {
  OperationType,
  auth,
  db,
  emailToPortalUserId,
  handleFirestoreError,
} from './firebase.ts';
import {
  INITIAL_PORTAL_USERS,
  PRIMARY_OWNER_EMAIL,
  ROLE_DEFAULT_PERMISSIONS,
  normalizePortalUser,
} from './portalRoles.ts';

function clampStr(val: string | undefined | null, maxLen: number): string {
  return String(val ?? '')
    .trim()
    .slice(0, maxLen);
}

function toIsoString(val: unknown): string {
  if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    return val;
  }
  return new Date().toISOString();
}

function makeDocId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.replace(
    /[^a-zA-Z0-9_-]/g,
    '',
  );
}

function sanitizePermissions(perms: PortalPermissions): PortalPermissions {
  return {
    inventoryRead: Boolean(perms.inventoryRead),
    inventoryWrite: Boolean(perms.inventoryWrite),
    inventoryDelete: Boolean(perms.inventoryDelete),
    bookingsRead: Boolean(perms.bookingsRead),
    bookingsWrite: Boolean(perms.bookingsWrite),
    bookingsDelete: Boolean(perms.bookingsDelete),
    videosManage: Boolean(perms.videosManage),
    usersManage: Boolean(perms.usersManage),
  };
}

function buildVehicleDocPayload(
  id: string,
  input: Omit<ExportVehicle, 'id' | 'createdAt'>,
  mode: 'create' | 'update',
) {
  const gallery = (
    Array.isArray(input.images) && input.images.length > 0
      ? input.images
      : [input.image]
  )
    .filter((src): src is string => typeof src === 'string' && src.trim().length > 0)
    .slice(0, 8)
    .map((src) => src.trim().slice(0, 350000));

  const mainImage = gallery[0] || clampStr(input.image, 350000);
  if (!mainImage) {
    throw new Error('At least one vehicle photo is required.');
  }

  const dealType = input.transit.dealType === 'balance-release' ? 'balance-release' : 'direct-import';
  const transit: Record<string, unknown> = {
    dealType,
    destinationPortId: clampStr(input.transit.destinationPortId, 80) || 'worldwide',
    destinationPortLabel:
      clampStr(input.transit.destinationPortLabel, 160) || 'Ships Worldwide · Buyer Chooses Port',
    vesselName: clampStr(input.transit.vesselName, 160) || 'Weekly RoRo Sailing',
    arrivalStatus: clampStr(input.transit.arrivalStatus, 200) || 'Ready to Book',
    fullCifUsd: Math.max(0, Number(input.transit.fullCifUsd) || 0),
    priorDepositUsd: Math.max(0, Number(input.transit.priorDepositUsd) || 0),
    balanceDueUsd: Math.max(0, Number(input.transit.balanceDueUsd) || 0),
    blStatus:
      clampStr(input.transit.blStatus, 240) || 'Bill of Lading issued directly in buyer name',
  };

  if (dealType === 'balance-release') {
    if (input.transit.trackingStage) {
      transit.trackingStage = input.transit.trackingStage;
    }
    if (input.transit.etaDate && input.transit.etaDate.trim()) {
      transit.etaDate = clampStr(input.transit.etaDate, 32);
    }
  }

  const bodyNotes = (Array.isArray(input.inspection.bodyNotes) ? input.inspection.bodyNotes : [])
    .map((note) => clampStr(note, 300))
    .filter(Boolean)
    .slice(0, 12);

  const payload: Record<string, unknown> = {
    id,
    makeModel: clampStr(input.makeModel, 160),
    trim: clampStr(input.trim, 160) || 'Export Grade',
    category: input.category,
    status: input.status,
    year: Math.min(2035, Math.max(1980, Math.round(Number(input.year) || 2022))),
    mileageKm: Math.max(0, Number(input.mileageKm) || 0),
    chassisCode: clampStr(input.chassisCode, 64).toUpperCase(),
    engine: clampStr(input.engine, 120) || 'Standard',
    transmission: clampStr(input.transmission, 120) || 'Automatic',
    drive: input.drive,
    fuel: input.fuel,
    steering: input.steering,
    color: clampStr(input.color, 80) || 'White',
    port: clampStr(input.port, 160) || 'Yokohama Yard',
    fobUsd: Math.max(0, Number(input.fobUsd) || 0),
    cbm: Math.max(1, Number(input.cbm) || 11.6),
    image: mainImage,
    images: gallery,
    imageAlt:
      clampStr(input.imageAlt, 240) ||
      `${input.year} ${clampStr(input.makeModel, 120)}`,
    transit,
    inspection: {
      auctionHouse: clampStr(input.inspection.auctionHouse, 120) || 'USS Yokohama',
      lotNumber: clampStr(input.inspection.lotNumber, 40) || '10000',
      overallGrade: clampStr(input.inspection.overallGrade, 20) || '4.5',
      exteriorGrade: clampStr(input.inspection.exteriorGrade, 20) || 'B',
      interiorGrade: clampStr(input.inspection.interiorGrade, 20) || 'A',
      odometerVerified: Boolean(input.inspection.odometerVerified),
      radiationCheck: clampStr(input.inspection.radiationCheck, 80) || 'Cleared · 0.05 µSv/h',
      inspectorSummary: clampStr(input.inspection.inspectorSummary, 1500),
      bodyNotes,
    },
  };

  if (mode === 'create') {
    payload.createdAt = serverTimestamp();
  } else {
    payload.updatedAt = serverTimestamp();
  }

  return payload;
}

function docToVehicle(raw: Record<string, unknown>, docId: string): ExportVehicle {
  return {
    ...(raw as unknown as ExportVehicle),
    id: String(raw.id || docId),
    createdAt: toIsoString(raw.createdAt),
  };
}

function docToBooking(raw: Record<string, unknown>, docId: string): BookingRequest {
  return {
    ...(raw as unknown as BookingRequest),
    id: String(raw.id || docId),
    createdAt: toIsoString(raw.createdAt),
  };
}

function docToVideo(raw: Record<string, unknown>, docId: string): UnloadingVideo {
  return {
    ...(raw as unknown as UnloadingVideo),
    id: String(raw.id || docId),
    createdAt: toIsoString(raw.createdAt),
  };
}

function docToPortalUser(raw: Record<string, unknown>, docId: string): PortalUser {
  return normalizePortalUser(
    {
      ...(raw as Partial<PortalUser>),
      id: String(raw.id || docId),
      createdAt: toIsoString(raw.createdAt),
    },
    (raw.role as PortalUser['role']) || 'Viewer',
  );
}

export function subscribePublicCatalog(
  onVehicles: (vehicles: ExportVehicle[]) => void,
  onVideos: (videos: UnloadingVideo[]) => void,
  onReady?: () => void,
): Unsubscribe {
  let vehiclesReady = false;
  let videosReady = false;

  const markReady = () => {
    if (vehiclesReady && videosReady && onReady) {
      onReady();
    }
  };

  const unsubVehicles = onSnapshot(
    collection(db, 'vehicles'),
    (snapshot) => {
      vehiclesReady = true;
      if (snapshot.empty) {
        onVehicles(INITIAL_VEHICLES);
      } else {
        const list = snapshot.docs
          .map((d) => docToVehicle(d.data() as Record<string, unknown>, d.id))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onVehicles(list);
      }
      markReady();
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'vehicles');
    },
  );

  const unsubVideos = onSnapshot(
    collection(db, 'videos'),
    (snapshot) => {
      videosReady = true;
      if (snapshot.empty) {
        onVideos(INITIAL_UNLOADING_VIDEOS);
      } else {
        const list = snapshot.docs
          .map((d) => docToVideo(d.data() as Record<string, unknown>, d.id))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onVideos(list);
      }
      markReady();
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'videos');
    },
  );

  return () => {
    unsubVehicles();
    unsubVideos();
  };
}

export type PortalUserResolution =
  | { ok: true; user: PortalUser }
  | { ok: false; error: string };

export async function resolveAuthorizedPortalUser(
  firebaseUser: User,
): Promise<PortalUserResolution> {
  const extractUserEmailAndVerification = async (targetUser: User, forceRefresh: boolean) => {
    let claimEmail = '';
    let claimVerified = false;
    try {
      const tokenResult = await targetUser.getIdTokenResult(forceRefresh);
      if (typeof tokenResult.claims.email === 'string') {
        claimEmail = tokenResult.claims.email.trim().toLowerCase();
      }
      claimVerified = tokenResult.claims.email_verified === true;
    } catch {
      // Ignore token claim read failure and fall back to user profile
    }
    const providerEmail =
      targetUser.providerData
        ?.find((p) => Boolean(p.email))
        ?.email?.trim()
        .toLowerCase() || '';
    const resolvedEmail = targetUser.email?.trim().toLowerCase() || claimEmail || providerEmail;
    const resolvedVerified = Boolean(targetUser.emailVerified) || claimVerified;
    return { resolvedEmail, resolvedVerified };
  };

  let { resolvedEmail: email, resolvedVerified: isVerified } =
    await extractUserEmailAndVerification(firebaseUser, false);

  if (!email || !isVerified) {
    try {
      await firebaseUser.reload();
      const refreshedUser = auth.currentUser || firebaseUser;
      const refreshed = await extractUserEmailAndVerification(refreshedUser, true);
      email = refreshed.resolvedEmail || email;
      isVerified = refreshed.resolvedVerified || isVerified;
    } catch {
      // Ignore reload failure
    }
  }

  if (!email) {
    return {
      ok: false,
      error:
        'Google sign-in did not provide an email address. In Firebase Console → Authentication → Settings → User account linking, ensure "Link accounts that use the same email" is enabled, then try again.',
    };
  }

  if (!isVerified) {
    try {
      await sendEmailVerification(firebaseUser);
      return {
        ok: false,
        error: `Email ${email} is not marked as verified yet. We sent a verification link to ${email} — open that link in your inbox, then sign in again.`,
      };
    } catch {
      return {
        ok: false,
        error: `Email ${email} is not verified in Firebase Auth. Verify ${email} (or check User account linking in Firebase Console) and try again.`,
      };
    }
  }

  const userDocId = emailToPortalUserId(email);
  const userPath = `portalUsers/${userDocId}`;
  const userRef = doc(db, 'portalUsers', userDocId);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const resolved = docToPortalUser(snap.data() as Record<string, unknown>, snap.id);
      if (!resolved.active && !resolved.isPrimaryOwner) {
        return {
          ok: false,
          error:
            'This user account has been deactivated. Contact a Portal Admin to re-enable access.',
        };
      }
      return { ok: true, user: resolved };
    }

    if (email === PRIMARY_OWNER_EMAIL) {
      const ownerPayload = {
        id: userDocId,
        name: clampStr(firebaseUser.displayName || 'Owner Admin', 120) || 'Owner Admin',
        email,
        role: 'Admin' as const,
        active: true,
        permissions: { ...ROLE_DEFAULT_PERMISSIONS.Admin },
        isPrimaryOwner: true,
        createdAt: serverTimestamp(),
      };
      await setDoc(userRef, ownerPayload);
      return {
        ok: true,
        user: normalizePortalUser(
          {
            ...ownerPayload,
            createdAt: new Date().toISOString(),
          },
          'Admin',
        ),
      };
    }

    return {
      ok: false,
      error: `Access restricted: ${email} is not authorized in Team & Users. Ask a Portal Admin to add this email under Team & Users.`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

export async function seedInitialCatalogIfEmpty(user: PortalUser): Promise<void> {
  if (!user.isPrimaryOwner) {
    return;
  }

  if (user.permissions.inventoryWrite) {
    try {
      const vehSnap = await getDocs(collection(db, 'vehicles'));
      if (vehSnap.empty) {
        const batch = writeBatch(db);
        for (const v of INITIAL_VEHICLES) {
          const { id, createdAt: _ignoreCreatedAt, ...rest } = v;
          const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '-');
          batch.set(
            doc(db, 'vehicles', cleanId),
            buildVehicleDocPayload(cleanId, rest, 'create'),
          );
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vehicles');
    }
  }

  if (user.permissions.videosManage) {
    try {
      const vidSnap = await getDocs(collection(db, 'videos'));
      if (vidSnap.empty) {
        const batch = writeBatch(db);
        for (const vid of INITIAL_UNLOADING_VIDEOS) {
          const cleanId = vid.id.replace(/[^a-zA-Z0-9_-]/g, '-');
          batch.set(doc(db, 'videos', cleanId), {
            id: cleanId,
            title: clampStr(vid.title, 180),
            portLabel: clampStr(vid.portLabel, 160),
            containerType: clampStr(vid.containerType, 120),
            vehicleSummary: clampStr(vid.vehicleSummary, 200),
            videoUrl: clampStr(vid.videoUrl, 750000),
            posterUrl: clampStr(vid.posterUrl, 350000),
            durationLabel: clampStr(vid.durationLabel, 32),
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'videos');
    }
  }

  if (user.permissions.bookingsWrite) {
    try {
      const bkSnap = await getDocs(collection(db, 'bookings'));
      if (bkSnap.empty) {
        const batch = writeBatch(db);
        for (const b of INITIAL_BOOKINGS) {
          const cleanId = b.id.replace(/[^a-zA-Z0-9_-]/g, '-');
          batch.set(doc(db, 'bookings', cleanId), {
            id: cleanId,
            vehicleId: b.vehicleId,
            vehicleTitle: clampStr(b.vehicleTitle, 200),
            chassisCode: clampStr(b.chassisCode, 64),
            buyerName: clampStr(b.buyerName, 120),
            buyerEmail: clampStr(b.buyerEmail, 160),
            buyerPhone: clampStr(b.buyerPhone, 48),
            destinationPortId: clampStr(b.destinationPortId, 80),
            destinationPortName: clampStr(b.destinationPortName, 160),
            requestType: b.requestType,
            shippingMethod: b.shippingMethod,
            quotedAmountUsd: Math.max(0, Number(b.quotedAmountUsd) || 0),
            notes: clampStr(b.notes, 2000),
            leadSource: clampStr(b.leadSource || 'Website Booking Form', 120),
            crmNotes: clampStr(b.crmNotes || '', 3000),
            status: b.status,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
    }
  }
}

export async function loadPortalPrivateData(user: PortalUser): Promise<{
  bookings: BookingRequest[];
  users: PortalUser[];
}> {
  let bookings: BookingRequest[] = [];
  let users: PortalUser[] = [user];

  if (user.permissions.bookingsRead) {
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      bookings = snap.docs
        .map((d) => docToBooking(d.data() as Record<string, unknown>, d.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    }
  }

  if (user.permissions.usersManage) {
    try {
      const snap = await getDocs(collection(db, 'portalUsers'));
      const fetched = snap.docs.map((d) =>
        docToPortalUser(d.data() as Record<string, unknown>, d.id),
      );
      users = fetched.length > 0 ? fetched : INITIAL_PORTAL_USERS;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'portalUsers');
    }
  }

  return { bookings, users };
}

export async function createVehicleRecord(
  input: Omit<ExportVehicle, 'id' | 'createdAt'>,
): Promise<ExportVehicle> {
  const id = makeDocId('veh');
  const payload = buildVehicleDocPayload(id, input, 'create');
  const path = `vehicles/${id}`;
  try {
    await setDoc(doc(db, 'vehicles', id), payload);
    return {
      ...(input as ExportVehicle),
      id,
      image: payload.image as string,
      images: payload.images as string[],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVehicleRecord(
  id: string,
  updates: Partial<ExportVehicle>,
  currentVehicle?: ExportVehicle,
): Promise<ExportVehicle | null> {
  const path = `vehicles/${id}`;
  try {
    const ref = doc(db, 'vehicles', id);
    let existing = currentVehicle;
    if (!existing) {
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      existing = docToVehicle(snap.data() as Record<string, unknown>, snap.id);
    }

    const mergedTransit = updates.transit
      ? { ...existing.transit, ...updates.transit }
      : existing.transit;

    const merged: Omit<ExportVehicle, 'id' | 'createdAt'> = {
      makeModel: updates.makeModel ?? existing.makeModel,
      trim: updates.trim ?? existing.trim,
      category: updates.category ?? existing.category,
      status: updates.status ?? existing.status,
      year: updates.year ?? existing.year,
      mileageKm: updates.mileageKm ?? existing.mileageKm,
      chassisCode: updates.chassisCode ?? existing.chassisCode,
      engine: updates.engine ?? existing.engine,
      transmission: updates.transmission ?? existing.transmission,
      drive: updates.drive ?? existing.drive,
      fuel: updates.fuel ?? existing.fuel,
      steering: updates.steering ?? existing.steering,
      color: updates.color ?? existing.color,
      port: updates.port ?? existing.port,
      fobUsd: updates.fobUsd ?? existing.fobUsd,
      cbm: updates.cbm ?? existing.cbm,
      image: updates.image ?? existing.image,
      images: updates.images ?? existing.images,
      imageAlt: updates.imageAlt ?? existing.imageAlt,
      transit: mergedTransit,
      inspection: updates.inspection
        ? { ...existing.inspection, ...updates.inspection }
        : existing.inspection,
    };

    const payload = buildVehicleDocPayload(id, merged, 'update');
    await updateDoc(ref, payload);

    return {
      ...existing,
      ...merged,
      id,
      image: payload.image as string,
      images: payload.images as string[],
      transit: payload.transit as ExportVehicle['transit'],
      inspection: payload.inspection as ExportVehicle['inspection'],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateVehicleStatusRecord(
  id: string,
  status: VehicleStatus,
  currentVehicle?: ExportVehicle,
): Promise<ExportVehicle | null> {
  return updateVehicleRecord(id, { status }, currentVehicle);
}

export async function deleteVehicleRecord(id: string): Promise<void> {
  const path = `vehicles/${id}`;
  try {
    await deleteDoc(doc(db, 'vehicles', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createBookingRecord(
  payload: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>,
): Promise<BookingRequest> {
  const id = makeDocId('bk');
  const path = `bookings/${id}`;
  const cleanEmail = clampStr(payload.buyerEmail, 160).toLowerCase();
  const docData = {
    id,
    vehicleId: payload.vehicleId ? clampStr(payload.vehicleId, 128) : null,
    vehicleTitle: clampStr(payload.vehicleTitle, 200) || 'Custom Japan Import Request',
    chassisCode: clampStr(payload.chassisCode, 64) || 'TBD',
    buyerName: clampStr(payload.buyerName, 120),
    buyerEmail: cleanEmail,
    buyerPhone: clampStr(payload.buyerPhone, 48),
    destinationPortId: clampStr(payload.destinationPortId, 80) || 'worldwide',
    destinationPortName: clampStr(payload.destinationPortName, 160) || 'Buyer Selected Port',
    requestType: payload.requestType,
    shippingMethod: payload.shippingMethod,
    quotedAmountUsd: Math.max(0, Number(payload.quotedAmountUsd) || 0),
    notes: clampStr(payload.notes, 2000),
    leadSource: clampStr(payload.leadSource || 'Website Booking Form', 120),
    crmNotes: clampStr(payload.crmNotes || '', 3000),
    status: 'Pending Review' as const,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'bookings', id), docData);
    return {
      ...docData,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBookingRecord(
  id: string,
  updates: { status?: BookingRequest['status']; crmNotes?: string },
  currentBooking?: BookingRequest,
  canUpdateVehicleStatus = false,
): Promise<{ booking: BookingRequest | null; syncedVehicleStatus?: { id: string; status: VehicleStatus } }> {
  const path = `bookings/${id}`;
  try {
    const ref = doc(db, 'bookings', id);
    let existing = currentBooking;
    if (!existing) {
      const snap = await getDoc(ref);
      if (!snap.exists()) return { booking: null };
      existing = docToBooking(snap.data() as Record<string, unknown>, snap.id);
    }

    const patch: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.status !== undefined) {
      patch.status = updates.status;
    }
    if (updates.crmNotes !== undefined) {
      patch.crmNotes = clampStr(updates.crmNotes, 3000);
    }

    await updateDoc(ref, patch);

    const updatedBooking: BookingRequest = {
      ...existing,
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.crmNotes !== undefined ? { crmNotes: clampStr(updates.crmNotes, 3000) } : {}),
    };

    let syncedVehicleStatus: { id: string; status: VehicleStatus } | undefined;
    if (canUpdateVehicleStatus && existing.vehicleId && updates.status) {
      const nextVehStatus: VehicleStatus | null =
        updates.status === 'Deposit Confirmed'
          ? 'Booked'
          : updates.status === 'Shipped / B/L Issued'
            ? 'In Transit'
            : null;
      if (nextVehStatus) {
        try {
          await updateVehicleStatusRecord(existing.vehicleId, nextVehStatus);
          syncedVehicleStatus = { id: existing.vehicleId, status: nextVehStatus };
        } catch {
          // Non-fatal if linked vehicle was removed or caller lacks inventoryWrite
        }
      }
    }

    return { booking: updatedBooking, syncedVehicleStatus };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBookingRecord(id: string): Promise<void> {
  const path = `bookings/${id}`;
  try {
    await deleteDoc(doc(db, 'bookings', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createVideoRecord(
  input: Omit<UnloadingVideo, 'id' | 'createdAt'>,
): Promise<UnloadingVideo> {
  const id = makeDocId('vid');
  const path = `videos/${id}`;
  const docData = {
    id,
    title: clampStr(input.title, 180),
    portLabel: clampStr(input.portLabel, 160) || 'Caribbean Port Terminal',
    containerType: clampStr(input.containerType, 120) || '40ft Container',
    vehicleSummary: clampStr(input.vehicleSummary, 200) || 'Japanese Export Arrival',
    videoUrl: clampStr(input.videoUrl, 750000),
    posterUrl: clampStr(input.posterUrl, 350000),
    durationLabel: clampStr(input.durationLabel, 32) || '0:10',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'videos', id), docData);
    return {
      ...docData,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteVideoRecord(id: string): Promise<void> {
  const path = `videos/${id}`;
  try {
    await deleteDoc(doc(db, 'videos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createPortalUserRecord(
  input: Omit<PortalUser, 'id' | 'createdAt'>,
): Promise<PortalUser> {
  const cleanEmail = clampStr(input.email, 160).toLowerCase();
  const id = emailToPortalUserId(cleanEmail);
  const path = `portalUsers/${id}`;
  const userRef = doc(db, 'portalUsers', id);

  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      throw new Error('A user with this email already exists.');
    }

    const normalized = normalizePortalUser(
      {
        ...input,
        id,
        email: cleanEmail,
        isPrimaryOwner: false,
        createdAt: new Date().toISOString(),
      },
      input.role,
    );

    await setDoc(userRef, {
      id,
      name: clampStr(normalized.name, 120),
      email: cleanEmail,
      role: normalized.role,
      active: Boolean(normalized.active),
      permissions: sanitizePermissions(normalized.permissions),
      isPrimaryOwner: false,
      createdAt: serverTimestamp(),
    });

    return normalized;
  } catch (error) {
    if (error instanceof Error && error.message === 'A user with this email already exists.') {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePortalUserRecord(
  id: string,
  updates: Partial<PortalUser>,
  currentUser?: PortalUser,
): Promise<{ user: PortalUser | null; replacedId?: string }> {
  const path = `portalUsers/${id}`;
  const oldRef = doc(db, 'portalUsers', id);

  try {
    let existing = currentUser;
    if (!existing) {
      const snap = await getDoc(oldRef);
      if (!snap.exists()) return { user: null };
      existing = docToPortalUser(snap.data() as Record<string, unknown>, snap.id);
    }

    const nextEmail =
      !existing.isPrimaryOwner && updates.email
        ? clampStr(updates.email, 160).toLowerCase()
        : existing.email;

    const normalized = normalizePortalUser(
      {
        ...existing,
        ...updates,
        email: nextEmail,
        permissions: updates.permissions
          ? { ...existing.permissions, ...updates.permissions }
          : existing.permissions,
        isPrimaryOwner: existing.isPrimaryOwner,
      },
      updates.role || existing.role,
    );

    const nextId = emailToPortalUserId(nextEmail);
    if (nextId !== id && !existing.isPrimaryOwner) {
      const newRef = doc(db, 'portalUsers', nextId);
      const conflictSnap = await getDoc(newRef);
      if (conflictSnap.exists()) {
        throw new Error('Another user already uses this email.');
      }

      const batch = writeBatch(db);
      batch.set(newRef, {
        id: nextId,
        name: clampStr(normalized.name, 120),
        email: nextEmail,
        role: normalized.role,
        active: Boolean(normalized.active),
        permissions: sanitizePermissions(normalized.permissions),
        isPrimaryOwner: false,
        createdAt: serverTimestamp(),
      });
      batch.delete(oldRef);
      await batch.commit();
      return { user: { ...normalized, id: nextId }, replacedId: id };
    }

    await updateDoc(oldRef, {
      name: clampStr(normalized.name, 120),
      role: existing.isPrimaryOwner ? 'Admin' : normalized.role,
      active: existing.isPrimaryOwner ? true : Boolean(normalized.active),
      permissions: existing.isPrimaryOwner
        ? sanitizePermissions(ROLE_DEFAULT_PERMISSIONS.Admin)
        : sanitizePermissions(normalized.permissions),
      updatedAt: serverTimestamp(),
    });

    return { user: normalized };
  } catch (error) {
    if (error instanceof Error && error.message === 'Another user already uses this email.') {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePortalUserRecord(id: string): Promise<void> {
  const path = `portalUsers/${id}`;
  try {
    await deleteDoc(doc(db, 'portalUsers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
