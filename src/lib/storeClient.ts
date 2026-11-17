import {
  INITIAL_BOOKINGS,
  INITIAL_UNLOADING_VIDEOS,
  INITIAL_VEHICLES,
} from '../data/seedInventory.ts';
import type {
  BookingRequest,
  ExportVehicle,
  PortalUser,
  UnloadingVideo,
  VehicleStatus,
} from '../types/autoTrade.ts';
import { INITIAL_PORTAL_USERS, normalizePortalUser } from './portalRoles.ts';

const VEHICLES_KEY = 'pjsventures_vehicles_v1';
const BOOKINGS_KEY = 'pjsventures_bookings_v1';
const VIDEOS_KEY = 'pjsventures_videos_v1';
const USERS_KEY = 'pjsventures_portal_users_v1';
const DELETED_USER_EMAILS_KEY = 'pjsventures_deleted_user_emails_v1';

function readDeletedUserEmails(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_USER_EMAILS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.map((e) => String(e).trim().toLowerCase()) : [];
  } catch {
    return [];
  }
}

function addDeletedUserEmail(email: string): void {
  try {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    const prev = readDeletedUserEmails();
    if (!prev.includes(clean)) {
      localStorage.setItem(DELETED_USER_EMAILS_KEY, JSON.stringify([...prev, clean]));
    }
  } catch {
    // Ignore storage errors
  }
}

function removeDeletedUserEmail(email: string): void {
  try {
    const clean = email.trim().toLowerCase();
    const prev = readDeletedUserEmails();
    if (prev.includes(clean)) {
      localStorage.setItem(
        DELETED_USER_EMAILS_KEY,
        JSON.stringify(prev.filter((e) => e !== clean)),
      );
    }
  } catch {
    // Ignore storage errors
  }
}

function readLocalVehicles(): ExportVehicle[] {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    const parsed = JSON.parse(raw) as ExportVehicle[];
    return Array.isArray(parsed) ? parsed : INITIAL_VEHICLES;
  } catch {
    return INITIAL_VEHICLES;
  }
}

function writeLocalVehicles(vehicles: ExportVehicle[]): void {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalBookings(): BookingRequest[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    const parsed = JSON.parse(raw) as BookingRequest[];
    return Array.isArray(parsed) ? parsed : INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
}

function writeLocalBookings(bookings: BookingRequest[]): void {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalVideos(): UnloadingVideo[] {
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    if (!raw) {
      localStorage.setItem(VIDEOS_KEY, JSON.stringify(INITIAL_UNLOADING_VIDEOS));
      return INITIAL_UNLOADING_VIDEOS;
    }
    const parsed = JSON.parse(raw) as UnloadingVideo[];
    return Array.isArray(parsed) ? parsed : INITIAL_UNLOADING_VIDEOS;
  } catch {
    return INITIAL_UNLOADING_VIDEOS;
  }
}

function writeLocalVideos(videos: UnloadingVideo[]): void {
  try {
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalUsers(): PortalUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_PORTAL_USERS));
      return INITIAL_PORTAL_USERS;
    }
    const parsed = JSON.parse(raw) as PortalUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_PORTAL_USERS;
    }
    return parsed.map((u) => normalizePortalUser(u, u.role));
  } catch {
    return INITIAL_PORTAL_USERS;
  }
}

function writeLocalUsers(users: PortalUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota errors
  }
}

function mergeServerAndLocalUsers(serverUsers: PortalUser[]): PortalUser[] {
  const localUsers = readLocalUsers();
  const deletedEmails = readDeletedUserEmails();
  const normalizedServer = serverUsers.map((u) => normalizePortalUser(u, u.role));
  const merged = [...normalizedServer];
  for (const localUser of localUsers) {
    const cleanEmail = localUser.email.trim().toLowerCase();
    if (!cleanEmail || deletedEmails.includes(cleanEmail)) continue;
    const alreadyOnServer = merged.some(
      (s) => s.email.trim().toLowerCase() === cleanEmail || s.id === localUser.id,
    );
    if (!alreadyOnServer) {
      merged.push(localUser);
    }
  }
  writeLocalUsers(merged);
  return merged;
}

class ApiBusinessError extends Error {}

async function fetchJsonIfApi<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadInitialData(): Promise<{
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  videos: UnloadingVideo[];
  users: PortalUser[];
}> {
  const [vehData, bkData, vidData, usrData] = await Promise.all([
    fetchJsonIfApi<{ vehicles: ExportVehicle[] }>('/api/vehicles'),
    fetchJsonIfApi<{ bookings: BookingRequest[] }>('/api/bookings'),
    fetchJsonIfApi<{ videos: UnloadingVideo[] }>('/api/videos'),
    fetchJsonIfApi<{ users: PortalUser[] }>('/api/users'),
  ]);

  if (vehData && bkData) {
    return {
      vehicles: vehData.vehicles,
      bookings: bkData.bookings,
      videos: vidData?.videos ?? readLocalVideos(),
      users:
        usrData?.users && usrData.users.length > 0
          ? mergeServerAndLocalUsers(usrData.users)
          : readLocalUsers(),
    };
  }

  return {
    vehicles: readLocalVehicles(),
    bookings: readLocalBookings(),
    videos: readLocalVideos(),
    users: readLocalUsers(),
  };
}

export async function createVehicleRecord(
  input: Omit<ExportVehicle, 'id' | 'createdAt'>,
): Promise<ExportVehicle> {
  const apiRes = await fetchJsonIfApi<{ vehicle: ExportVehicle }>('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (apiRes?.vehicle) {
    return apiRes.vehicle;
  }

  const created: ExportVehicle = {
    ...input,
    id: `veh-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...readLocalVehicles()];
  writeLocalVehicles(next);
  return created;
}

export async function updateVehicleRecord(
  id: string,
  updates: Partial<ExportVehicle>,
): Promise<ExportVehicle | null> {
  const apiRes = await fetchJsonIfApi<{ vehicle: ExportVehicle }>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (apiRes?.vehicle) {
    return apiRes.vehicle;
  }

  const current = readLocalVehicles();
  const idx = current.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const existing = current[idx];
  const mergedTransit = updates.transit
    ? { ...existing.transit, ...updates.transit }
    : existing.transit;
  if (mergedTransit.dealType !== 'balance-release') {
    delete mergedTransit.etaDate;
    delete mergedTransit.trackingStage;
  }
  const updated: ExportVehicle = {
    ...existing,
    ...updates,
    transit: mergedTransit,
    inspection: updates.inspection
      ? { ...existing.inspection, ...updates.inspection }
      : existing.inspection,
  };
  current[idx] = updated;
  writeLocalVehicles(current);
  return updated;
}

export async function updateVehicleStatusRecord(
  id: string,
  status: VehicleStatus,
): Promise<ExportVehicle | null> {
  return updateVehicleRecord(id, { status });
}

export async function deleteVehicleRecord(id: string): Promise<void> {
  const apiRes = await fetchJsonIfApi<{ deletedId: string }>(`/api/vehicles/${id}`, {
    method: 'DELETE',
  });
  if (apiRes) return;

  const next = readLocalVehicles().filter((v) => v.id !== id);
  writeLocalVehicles(next);
}

export async function createBookingRecord(
  payload: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>,
): Promise<BookingRequest> {
  const apiRes = await fetchJsonIfApi<{ booking: BookingRequest }>('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (apiRes?.booking) {
    return apiRes.booking;
  }

  const created: BookingRequest = {
    ...payload,
    leadSource: payload.leadSource || 'Website Booking Form',
    crmNotes: payload.crmNotes || '',
    id: `bk-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Pending Review',
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...readLocalBookings()];
  writeLocalBookings(next);
  return created;
}

export async function updateBookingRecord(
  id: string,
  updates: { status?: BookingRequest['status']; crmNotes?: string },
): Promise<{ booking: BookingRequest | null; vehicles: ExportVehicle[] }> {
  const apiRes = await fetchJsonIfApi<{
    booking: BookingRequest;
    vehicles: ExportVehicle[];
  }>(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (apiRes) {
    return apiRes;
  }

  const bookings = readLocalBookings();
  const vehicles = readLocalVehicles();
  const bIdx = bookings.findIndex((b) => b.id === id);
  if (bIdx === -1) {
    return { booking: null, vehicles };
  }
  bookings[bIdx] = {
    ...bookings[bIdx],
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.crmNotes !== undefined ? { crmNotes: updates.crmNotes } : {}),
  };
  const linkedId = bookings[bIdx].vehicleId;
  if (linkedId && updates.status) {
    const vIdx = vehicles.findIndex((v) => v.id === linkedId);
    if (vIdx !== -1) {
      if (updates.status === 'Deposit Confirmed') vehicles[vIdx].status = 'Booked';
      if (updates.status === 'Shipped / B/L Issued') vehicles[vIdx].status = 'In Transit';
    }
  }
  writeLocalBookings(bookings);
  writeLocalVehicles(vehicles);
  return { booking: bookings[bIdx], vehicles };
}

export async function deleteBookingRecord(id: string): Promise<void> {
  const apiRes = await fetchJsonIfApi<{ deletedId: string }>(`/api/bookings/${id}`, {
    method: 'DELETE',
  });
  if (apiRes) return;

  const next = readLocalBookings().filter((b) => b.id !== id);
  writeLocalBookings(next);
}

export async function createVideoRecord(
  input: Omit<UnloadingVideo, 'id' | 'createdAt'>,
): Promise<UnloadingVideo> {
  const apiRes = await fetchJsonIfApi<{ video: UnloadingVideo }>('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (apiRes?.video) {
    return apiRes.video;
  }

  const created: UnloadingVideo = {
    ...input,
    id: `vid-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...readLocalVideos()];
  writeLocalVideos(next);
  return created;
}

export async function deleteVideoRecord(id: string): Promise<void> {
  const apiRes = await fetchJsonIfApi<{ deletedId: string }>(`/api/videos/${id}`, {
    method: 'DELETE',
  });
  if (apiRes) return;

  const next = readLocalVideos().filter((v) => v.id !== id);
  writeLocalVideos(next);
}

export async function createPortalUserRecord(
  input: Omit<PortalUser, 'id' | 'createdAt'>,
): Promise<PortalUser> {
  const cleanEmail = input.email.trim().toLowerCase();
  removeDeletedUserEmail(cleanEmail);

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, email: cleanEmail }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as { user?: PortalUser; error?: string };
      if ((res.status === 400 || res.status === 409) && data.error) {
        throw new ApiBusinessError(data.error);
      }
      if (res.ok && data.user) {
        const normalized = normalizePortalUser(data.user, data.user.role);
        const current = readLocalUsers();
        const withoutDup = current.filter(
          (u) => u.id !== normalized.id && u.email.trim().toLowerCase() !== cleanEmail,
        );
        writeLocalUsers([...withoutDup, normalized]);
        return normalized;
      }
    }
  } catch (err) {
    if (err instanceof ApiBusinessError) {
      throw err;
    }
    // Network / static hosting error -> seamlessly fall back to browser storage
  }

  const current = readLocalUsers();
  if (current.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
    throw new Error('A user with this email already exists.');
  }
  const created = normalizePortalUser(
    {
      ...input,
      email: cleanEmail,
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isPrimaryOwner: false,
      createdAt: new Date().toISOString(),
    },
    input.role,
  );
  writeLocalUsers([...current, created]);
  return created;
}

export async function updatePortalUserRecord(
  id: string,
  updates: Partial<PortalUser>,
): Promise<PortalUser | null> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as { user?: PortalUser; error?: string };
      if ((res.status === 400 || res.status === 409) && data.error) {
        throw new ApiBusinessError(data.error);
      }
      if (res.ok && data.user) {
        const normalized = normalizePortalUser(data.user, data.user.role);
        const current = readLocalUsers();
        const idx = current.findIndex((u) => u.id === id);
        if (idx !== -1) {
          current[idx] = normalized;
          writeLocalUsers(current);
        } else {
          writeLocalUsers([...current, normalized]);
        }
        return normalized;
      }
    }
  } catch (err) {
    if (err instanceof ApiBusinessError) {
      throw err;
    }
  }

  const current = readLocalUsers();
  const idx = current.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const existing = current[idx];
  const nextEmail = updates.email ? updates.email.trim().toLowerCase() : existing.email;
  if (
    nextEmail !== existing.email &&
    current.some((u, i) => i !== idx && u.email.trim().toLowerCase() === nextEmail)
  ) {
    throw new Error('Another user already uses this email.');
  }
  const updated = normalizePortalUser(
    {
      ...existing,
      ...updates,
      email: nextEmail,
      password:
        updates.password && updates.password.trim().length > 0
          ? updates.password.trim()
          : existing.password,
      permissions: updates.permissions
        ? { ...existing.permissions, ...updates.permissions }
        : existing.permissions,
      isPrimaryOwner: existing.isPrimaryOwner,
    },
    updates.role || existing.role,
  );
  current[idx] = updated;
  writeLocalUsers(current);
  return updated;
}

export async function deletePortalUserRecord(id: string): Promise<void> {
  const localBefore = readLocalUsers();
  const targetLocal = localBefore.find((u) => u.id === id);
  if (targetLocal && !targetLocal.isPrimaryOwner) {
    addDeletedUserEmail(targetLocal.email);
  }
  const filteredLocal = localBefore.filter((u) => u.id !== id || u.isPrimaryOwner);
  writeLocalUsers(filteredLocal);

  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json') && res.status === 400) {
      const data = (await res.json()) as { error?: string };
      throw new ApiBusinessError(data.error || 'Could not delete user.');
    }
  } catch (err) {
    if (err instanceof ApiBusinessError) {
      throw err;
    }
  }
}

