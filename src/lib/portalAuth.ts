const PORTAL_PW_STORAGE_KEY = 'pjsventures_portal_pw_v1';

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
