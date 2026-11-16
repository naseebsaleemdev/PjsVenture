import { INITIAL_BOOKINGS, INITIAL_VEHICLES } from '../data/seedInventory.ts';
import type { BookingRequest, ExportVehicle, VehicleStatus } from '../types/autoTrade.ts';

const VEHICLES_KEY = 'crownwheel_vehicles_v2';
const BOOKINGS_KEY = 'crownwheel_bookings_v2';

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
}> {
  const [vehData, bkData] = await Promise.all([
    fetchJsonIfApi<{ vehicles: ExportVehicle[] }>('/api/vehicles'),
    fetchJsonIfApi<{ bookings: BookingRequest[] }>('/api/bookings'),
  ]);

  if (vehData && bkData) {
    return {
      vehicles: vehData.vehicles,
      bookings: bkData.bookings,
    };
  }

  return {
    vehicles: readLocalVehicles(),
    bookings: readLocalBookings(),
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

export async function updateVehicleStatusRecord(
  id: string,
  status: VehicleStatus,
): Promise<ExportVehicle | null> {
  const apiRes = await fetchJsonIfApi<{ vehicle: ExportVehicle }>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (apiRes?.vehicle) {
    return apiRes.vehicle;
  }

  const current = readLocalVehicles();
  const idx = current.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const updated = { ...current[idx], status };
  current[idx] = updated;
  writeLocalVehicles(current);
  return updated;
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
    id: `bk-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Pending Review',
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...readLocalBookings()];
  writeLocalBookings(next);
  return created;
}

export async function updateBookingStatusRecord(
  id: string,
  status: BookingRequest['status'],
): Promise<{ booking: BookingRequest | null; vehicles: ExportVehicle[] }> {
  const apiRes = await fetchJsonIfApi<{
    booking: BookingRequest;
    vehicles: ExportVehicle[];
  }>(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
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
  bookings[bIdx] = { ...bookings[bIdx], status };
  const linkedId = bookings[bIdx].vehicleId;
  if (linkedId) {
    const vIdx = vehicles.findIndex((v) => v.id === linkedId);
    if (vIdx !== -1) {
      if (status === 'Deposit Confirmed') vehicles[vIdx].status = 'Booked';
      if (status === 'Shipped / B/L Issued') vehicles[vIdx].status = 'In Transit';
    }
  }
  writeLocalBookings(bookings);
  writeLocalVehicles(vehicles);
  return { booking: bookings[bIdx], vehicles };
}
