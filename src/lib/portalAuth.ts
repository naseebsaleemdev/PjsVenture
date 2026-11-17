import type { PortalUser } from '../types/autoTrade.ts';
import { INITIAL_PORTAL_USERS, ROLE_DEFAULT_PERMISSIONS, normalizePortalUser } from './portalRoles.ts';

const PORTAL_PW_STORAGE_KEY = 'pjsventures_portal_pw_v1';
const PORTAL_SESSION_KEY = 'pjsventures_portal_auth_v1';
const PORTAL_SESSION_USER_KEY = 'pjsventures_portal_session_user_v2';

export const EXPECTED_PORTAL_EMAIL =
  (import.meta.env.VITE_PORTAL_EMAIL as string | undefined)?.trim().toLowerCase() ||
  'naseebsaleemvmi@gmail.com';

const ENV_PASSWORD = (import.meta.env.VITE_PORTAL_PASSWORD as string | undefined)?.trim();
const ENV_RECOVERY_KEY = (import.meta.env.VITE_PORTAL_RECOVERY_CODE as string | undefined)?.trim();

function getCustomStoredPassword(): string | null {
  try {
    const val = localStorage.getItem(PORTAL_PW_STORAGE_KEY);
    return val && val.trim().length > 0 ? val : null;
  } catch {
    return null;
  }
}

export function getPrimaryOwnerUser(users?: PortalUser[]): PortalUser {
  const existing = users?.find((u) => u.isPrimaryOwner);
  if (existing) {
    return {
      ...existing,
      email: existing.email || EXPECTED_PORTAL_EMAIL,
      role: 'Admin',
      active: true,
      permissions: { ...ROLE_DEFAULT_PERMISSIONS.Admin },
      isPrimaryOwner: true,
    };
  }
  return {
    ...INITIAL_PORTAL_USERS[0],
    email: EXPECTED_PORTAL_EMAIL,
    password: getCustomStoredPassword() || ENV_PASSWORD || 'PJS#2026',
  };
}

export function isValidPortalPassword(input: string): boolean {
  const custom = getCustomStoredPassword();
  if (custom) {
    return input === custom;
  }
  if (ENV_PASSWORD) {
    return input === ENV_PASSWORD;
  }
  return input === 'PJS#2026' || input === 'CrownWheel#2026';
}

export function isValidPortalEmail(email: string): boolean {
  return email.trim().toLowerCase() === EXPECTED_PORTAL_EMAIL;
}

export function isValidRecoveryKey(key: string): boolean {
  const trimmed = key.trim();
  if (ENV_RECOVERY_KEY) {
    return trimmed === ENV_RECOVERY_KEY;
  }
  return trimmed === 'PJS-RESET-2026';
}

export function savePortalPassword(nextPassword: string): void {
  try {
    localStorage.setItem(PORTAL_PW_STORAGE_KEY, nextPassword);
  } catch {
    // Ignore storage failures
  }
}

export function resetPortalPasswordToDefault(): void {
  try {
    localStorage.removeItem(PORTAL_PW_STORAGE_KEY);
  } catch {
    // Ignore storage failures
  }
}

export type AuthResult =
  | { ok: true; user: PortalUser }
  | { ok: false; error: string };

export function authenticatePortalUser(
  email: string,
  password: string,
  users: PortalUser[],
): AuthResult {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return {
      ok: false,
      error: 'Please enter both your email address and password.',
    };
  }

  const matched = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  if (matched) {
    if (!matched.active && !matched.isPrimaryOwner) {
      return {
        ok: false,
        error: 'This user account has been deactivated. Contact a Portal Admin to re-enable access.',
      };
    }

    if (matched.isPrimaryOwner) {
      const customPw = getCustomStoredPassword();
      const validPrimary = customPw
        ? password === customPw || password === matched.password
        : ENV_PASSWORD
          ? password === ENV_PASSWORD
          : password === matched.password || password === 'PJS#2026' || password === 'CrownWheel#2026';
      if (validPrimary) {
        return { ok: true, user: normalizePortalUser(matched, 'Admin') };
      }
      return {
        ok: false,
        error: 'Invalid email or password. Access is restricted to authorized team members.',
      };
    }

    if (password === matched.password) {
      return { ok: true, user: normalizePortalUser(matched, matched.role) };
    }

    return {
      ok: false,
      error: 'Invalid email or password. Access is restricted to authorized team members.',
    };
  }

  // Fallback for primary owner if VITE_PORTAL_EMAIL env override differs from seeded owner email
  if (isValidPortalEmail(cleanEmail) && isValidPortalPassword(password)) {
    return { ok: true, user: getPrimaryOwnerUser(users) };
  }

  return {
    ok: false,
    error: 'Invalid email or password. Access is restricted to authorized team members.',
  };
}

export function readPortalSession(users: PortalUser[]): PortalUser | null {
  try {
    const rawUser = sessionStorage.getItem(PORTAL_SESSION_USER_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as { id?: string; email?: string };
      const byId = parsed.id ? users.find((u) => u.id === parsed.id) : undefined;
      const byEmail = parsed.email
        ? users.find((u) => u.email.trim().toLowerCase() === parsed.email!.trim().toLowerCase())
        : undefined;
      const resolved = byId || byEmail;
      if (resolved) {
        if (!resolved.active && !resolved.isPrimaryOwner) return null;
        return normalizePortalUser(resolved, resolved.role);
      }
      if (parsed.email && isValidPortalEmail(parsed.email)) {
        return getPrimaryOwnerUser(users);
      }
    }
    if (sessionStorage.getItem(PORTAL_SESSION_KEY) === 'authenticated') {
      return getPrimaryOwnerUser(users);
    }
    return null;
  } catch {
    return null;
  }
}

export function writePortalSession(user: PortalUser): void {
  try {
    sessionStorage.setItem(PORTAL_SESSION_KEY, 'authenticated');
    sessionStorage.setItem(
      PORTAL_SESSION_USER_KEY,
      JSON.stringify({ id: user.id, email: user.email }),
    );
  } catch {
    // Ignore storage failures
  }
}

export function clearPortalSession(): void {
  try {
    sessionStorage.removeItem(PORTAL_SESSION_KEY);
    sessionStorage.removeItem(PORTAL_SESSION_USER_KEY);
  } catch {
    // Ignore storage failures
  }
}
