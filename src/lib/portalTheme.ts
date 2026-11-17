const PORTAL_THEME_KEY = 'pjsventures_portal_theme_v1';

export function readPortalDarkMode(): boolean {
  try {
    return localStorage.getItem(PORTAL_THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

export function writePortalDarkMode(isDark: boolean): void {
  try {
    localStorage.setItem(PORTAL_THEME_KEY, isDark ? 'dark' : 'light');
  } catch {
    // Ignore storage errors
  }
}
