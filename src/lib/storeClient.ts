import type {
  BlogPost,
  BookingRequest,
  ExportVehicle,
  PortalUser,
  UnloadingVideo,
  VehicleStatus,
} from '../types/autoTrade.ts';
import { getPortalSessionToken, setPortalSessionToken } from './portalAuth.ts';

function buildAuthHeaders(includeJson = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getPortalSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    parsed = {};
  }

  if (!res.ok) {
    if (res.status === 401) {
      setPortalSessionToken(null);
    }
    const errMsg =
      typeof parsed.error === 'string' && parsed.error.trim().length > 0
        ? parsed.error
        : `Server returned status ${res.status}.`;
    throw new Error(errMsg);
  }

  return parsed as T;
}

export function slugifyBlogTitle(raw: string): string {
  const clean = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return clean || `article-${Date.now()}`;
}

export function formatPortalErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export async function fetchPublicCatalogSnapshot(): Promise<{
  vehicles: ExportVehicle[];
  videos: UnloadingVideo[];
  blogs: BlogPost[];
}> {
  const [vehRes, vidRes, blogRes] = await Promise.all([
    apiRequest<{ vehicles: ExportVehicle[] }>('/api/vehicles', {
      headers: buildAuthHeaders(false),
    }),
    apiRequest<{ videos: UnloadingVideo[] }>('/api/videos', {
      headers: buildAuthHeaders(false),
    }),
    apiRequest<{ blogs: BlogPost[] }>('/api/blogs', {
      headers: buildAuthHeaders(false),
    }),
  ]);
  return {
    vehicles: Array.isArray(vehRes.vehicles) ? vehRes.vehicles : [],
    videos: Array.isArray(vidRes.videos) ? vidRes.videos : [],
    blogs: Array.isArray(blogRes.blogs) ? blogRes.blogs : [],
  };
}

export function subscribePublicCatalog(
  onVehicles: (vehicles: ExportVehicle[]) => void,
  onVideos: (videos: UnloadingVideo[]) => void,
  onReady?: () => void,
  onBlogs?: (blogs: BlogPost[], isSeededInCloud: boolean) => void,
): () => void {
  let active = true;

  const refreshVehicles = async () => {
    try {
      const data = await apiRequest<{ vehicles: ExportVehicle[] }>('/api/vehicles', {
        headers: buildAuthHeaders(false),
      });
      if (active) onVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
    } catch {
      // Non-fatal network blip during background refresh
    }
  };

  const refreshVideos = async () => {
    try {
      const data = await apiRequest<{ videos: UnloadingVideo[] }>('/api/videos', {
        headers: buildAuthHeaders(false),
      });
      if (active) onVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch {
      // Non-fatal network blip during background refresh
    }
  };

  const refreshBlogs = async () => {
    if (!onBlogs) return;
    try {
      const data = await apiRequest<{ blogs: BlogPost[] }>('/api/blogs', {
        headers: buildAuthHeaders(false),
      });
      if (active) onBlogs(Array.isArray(data.blogs) ? data.blogs : [], true);
    } catch {
      // Non-fatal network blip during background refresh
    }
  };

  void Promise.all([refreshVehicles(), refreshVideos(), refreshBlogs()]).finally(() => {
    if (active && onReady) onReady();
  });

  let eventSource: EventSource | null = null;
  if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
    eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      if (!active) return;
      try {
        const msg = JSON.parse(event.data) as { type?: string; scope?: string };
        if (msg.type !== 'sync') return;
        if (msg.scope === 'vehicles') void refreshVehicles();
        if (msg.scope === 'videos') void refreshVideos();
        if (msg.scope === 'blogs') void refreshBlogs();
      } catch {
        // Ignore keepalive / malformed SSE payload
      }
    };
  }

  // Fallback interval sync for proxy/CDN environments that buffer SSE
  const pollTimer = window.setInterval(() => {
    if (!active || document.visibilityState === 'hidden') return;
    void refreshVehicles();
    void refreshVideos();
    void refreshBlogs();
  }, 15000);

  return () => {
    active = false;
    window.clearInterval(pollTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

export function subscribePortalPrivateData(
  user: PortalUser,
  callbacks: {
    onSelfUserChange: (nextUser: PortalUser | null, revokedMessage?: string) => void;
    onBookings: (bookings: BookingRequest[]) => void;
    onUsers: (users: PortalUser[]) => void;
    onBlogs?: (blogs: BlogPost[]) => void;
  },
): () => void {
  let active = true;
  let currentUserSnapshot = user;

  const refreshSelfAndPrivate = async (scopes?: Set<string>) => {
    if (!active) return;
    const token = getPortalSessionToken();
    if (!token) {
      callbacks.onSelfUserChange(null, 'Session ended. Please sign in again.');
      return;
    }

    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.status === 401 || meRes.status === 403) {
        const errPayload = await meRes.json().catch(() => ({} as { error?: string }));
        setPortalSessionToken(null);
        if (active) {
          callbacks.onSelfUserChange(
            null,
            typeof errPayload?.error === 'string'
              ? errPayload.error
              : 'Your portal access changed. Please sign in again.',
          );
        }
        return;
      }
      if (meRes.ok) {
        const meJson = (await meRes.json()) as { user?: PortalUser };
        if (meJson.user && active) {
          currentUserSnapshot = meJson.user;
          callbacks.onSelfUserChange(meJson.user);
        }
      }
    } catch {
      // Ignore transient network errors
    }

    if (!active) return;

    const shouldFetchBookings = !scopes || scopes.has('bookings');
    const shouldFetchUsers = !scopes || scopes.has('users');
    const shouldFetchBlogs = Boolean(callbacks.onBlogs) && (!scopes || scopes.has('blogs'));

    if (shouldFetchBookings) {
      if (currentUserSnapshot.isPrimaryOwner || currentUserSnapshot.permissions.bookingsRead) {
        try {
          const bRes = await apiRequest<{ bookings: BookingRequest[] }>('/api/bookings', {
            headers: buildAuthHeaders(false),
          });
          if (active) callbacks.onBookings(Array.isArray(bRes.bookings) ? bRes.bookings : []);
        } catch {
          // Ignore transient error
        }
      } else {
        callbacks.onBookings([]);
      }
    }

    if (shouldFetchUsers) {
      if (currentUserSnapshot.isPrimaryOwner || currentUserSnapshot.permissions.usersManage) {
        try {
          const uRes = await apiRequest<{ users: PortalUser[] }>('/api/users', {
            headers: buildAuthHeaders(false),
          });
          if (active) {
            callbacks.onUsers(Array.isArray(uRes.users) ? uRes.users : [currentUserSnapshot]);
          }
        } catch {
          // Ignore transient error
        }
      } else {
        callbacks.onUsers([currentUserSnapshot]);
      }
    }

    if (shouldFetchBlogs && callbacks.onBlogs) {
      try {
        const blogRes = await apiRequest<{ blogs: BlogPost[] }>('/api/blogs', {
          headers: buildAuthHeaders(false),
        });
        if (active) callbacks.onBlogs(Array.isArray(blogRes.blogs) ? blogRes.blogs : []);
      } catch {
        // Ignore transient error
      }
    }
  };

  void refreshSelfAndPrivate();

  let eventSource: EventSource | null = null;
  if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
    eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      if (!active) return;
      try {
        const msg = JSON.parse(event.data) as { type?: string; scope?: string };
        if (msg.type !== 'sync' || !msg.scope) return;
        if (msg.scope === 'bookings' || msg.scope === 'users' || msg.scope === 'blogs') {
          void refreshSelfAndPrivate(new Set([msg.scope]));
        }
      } catch {
        // Ignore non-JSON SSE messages
      }
    };
  }

  const pollTimer = window.setInterval(() => {
    if (!active || document.visibilityState === 'hidden') return;
    void refreshSelfAndPrivate();
  }, 12000);

  return () => {
    active = false;
    window.clearInterval(pollTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

export async function createVehicleRecord(
  input: Omit<ExportVehicle, 'id' | 'createdAt'>,
): Promise<ExportVehicle> {
  const data = await apiRequest<{ vehicle: ExportVehicle }>('/api/vehicles', {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(input),
  });
  return data.vehicle;
}

export async function updateVehicleRecord(
  id: string,
  updates: Partial<ExportVehicle>,
): Promise<ExportVehicle | null> {
  const data = await apiRequest<{ vehicle: ExportVehicle }>(
    `/api/vehicles/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(updates),
    },
  );
  return data.vehicle ?? null;
}

export async function updateVehicleStatusRecord(
  id: string,
  status: VehicleStatus,
): Promise<ExportVehicle | null> {
  return updateVehicleRecord(id, { status });
}

export async function deleteVehicleRecord(id: string): Promise<void> {
  await apiRequest<{ deletedId: string }>(`/api/vehicles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(false),
  });
}

export async function createBookingRecord(
  payload: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>,
): Promise<BookingRequest> {
  const data = await apiRequest<{ booking: BookingRequest }>('/api/bookings', {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  return data.booking;
}

export async function updateBookingRecord(
  id: string,
  updates: { status?: BookingRequest['status']; crmNotes?: string },
): Promise<{
  booking: BookingRequest | null;
  syncedVehicleStatus?: { id: string; status: VehicleStatus };
}> {
  const data = await apiRequest<{
    booking: BookingRequest;
    syncedVehicleStatus?: { id: string; status: VehicleStatus };
  }>(`/api/bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(updates),
  });
  return {
    booking: data.booking ?? null,
    syncedVehicleStatus: data.syncedVehicleStatus,
  };
}

export async function deleteBookingRecord(id: string): Promise<void> {
  await apiRequest<{ deletedId: string }>(`/api/bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(false),
  });
}

export async function createVideoRecord(
  input: Omit<UnloadingVideo, 'id' | 'createdAt'>,
): Promise<UnloadingVideo> {
  const data = await apiRequest<{ video: UnloadingVideo }>('/api/videos', {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(input),
  });
  return data.video;
}

export async function deleteVideoRecord(id: string): Promise<void> {
  await apiRequest<{ deletedId: string }>(`/api/videos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(false),
  });
}

export async function createPortalUserRecord(
  input: Omit<PortalUser, 'id' | 'createdAt'>,
): Promise<PortalUser> {
  const data = await apiRequest<{ user: PortalUser }>('/api/users', {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function updatePortalUserRecord(
  id: string,
  updates: Partial<PortalUser>,
): Promise<{ user: PortalUser | null; replacedId?: string }> {
  const data = await apiRequest<{ user: PortalUser; replacedId?: string }>(
    `/api/users/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(updates),
    },
  );
  return {
    user: data.user ?? null,
    replacedId: data.replacedId,
  };
}

export async function deletePortalUserRecord(id: string): Promise<void> {
  await apiRequest<{ deletedId: string }>(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(false),
  });
}

export async function createBlogRecord(
  input: Omit<BlogPost, 'id' | 'createdAt'>,
): Promise<BlogPost> {
  const data = await apiRequest<{ blog: BlogPost }>('/api/blogs', {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(input),
  });
  return data.blog;
}

export async function updateBlogRecord(
  id: string,
  updates: Partial<BlogPost>,
): Promise<BlogPost | null> {
  const data = await apiRequest<{ blog: BlogPost }>(
    `/api/blogs/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(updates),
    },
  );
  return data.blog ?? null;
}

export async function deleteBlogRecord(id: string): Promise<void> {
  await apiRequest<{ deletedId: string }>(`/api/blogs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(false),
  });
}
