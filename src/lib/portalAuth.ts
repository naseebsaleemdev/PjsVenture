import type { PortalUser } from '../types/autoTrade.ts';

const PORTAL_TOKEN_KEY = 'pjs_portal_session_token';

export function getPortalSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setPortalSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(PORTAL_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(PORTAL_TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

async function parseAuthJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg =
      typeof data.error === 'string' && data.error.trim().length > 0
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function signInPortalWithEmailPassword(
  email: string,
  password: string,
): Promise<PortalUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  const data = await parseAuthJson<{ token: string; user: PortalUser }>(res);
  setPortalSessionToken(data.token);
  return data.user;
}

export async function fetchCurrentPortalSession(): Promise<{
  user: PortalUser | null;
  errorMessage?: string;
}> {
  const token = getPortalSessionToken();
  if (!token) {
    return { user: null };
  }
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
      const data = await res.json().catch(() => ({} as { error?: string }));
      setPortalSessionToken(null);
      return {
        user: null,
        errorMessage:
          typeof data?.error === 'string' ? data.error : undefined,
      };
    }
    if (!res.ok) {
      return { user: null };
    }
    const data = (await res.json()) as { user?: PortalUser };
    return { user: data.user ?? null };
  } catch {
    return { user: null };
  }
}

export async function signOutPortal(): Promise<void> {
  const token = getPortalSessionToken();
  setPortalSessionToken(null);
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
