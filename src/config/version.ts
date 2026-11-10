/**
 * Canonical Application Version Constant & Dynamic Client Version Store
 */
export const BUNDLE_BASE_VERSION = 'v2.6.0';
export const CURRENT_APP_BUILD_DATE = 'April 2026';
export const CANONICAL_RENDER_URL = 'https://xejesus-app.onrender.com';

const LOCAL_STORAGE_VERSION_KEY = 'xejesus_installed_app_version';

/**
 * Returns the currently active version for this client.
 * Defaults to BUNDLE_BASE_VERSION unless an upgrade has been applied.
 */
export function getInstalledAppVersion(): string {
  try {
    const installed = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
    if (installed && installed.trim().length > 0) {
      return installed.trim();
    }
  } catch {}
  return BUNDLE_BASE_VERSION;
}

/**
 * Saves the upgraded version to client persistent storage.
 */
export function setInstalledAppVersion(version: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, version.trim());
  } catch {}
}

/**
 * Reverts/resets installed version to the bundle base (useful for testing and reset).
 */
export function resetInstalledAppVersion(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_VERSION_KEY);
  } catch {}
}

export const CURRENT_APP_VERSION = getInstalledAppVersion();
