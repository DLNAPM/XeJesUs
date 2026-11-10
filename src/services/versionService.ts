import { 
  getDbService, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from '../lib/firebase';
import { AppVersionInfo, AppVersionStatus } from '../types';
import { CURRENT_APP_VERSION, CANONICAL_RENDER_URL, getInstalledAppVersion } from '../config/version';

export const DEFAULT_APP_VERSION_INFO: AppVersionInfo = {
  version: "v2.7.0",
  releaseDate: "April 2026",
  releaseTitle: "Sacred Scholar Upgrade & Dynamic Version Tracking",
  releaseNotes: [
    "Dynamic Code Version & Upgrade Detector with interactive pilgrim upgrade modal",
    "Enhanced PDF Exegesis Export engine with full legacy color parsing and high-res rendering",
    "Scholar Voice AI selector with instant audio playback for saved theological chat sessions",
    "Guest Mode Read-Only Test Drive with guided Sanctuary access for sacred exegeses",
    "Extended Ge'ez biblical canon references to Asher Wilson's 81-book Ethiopian Orthodox canon"
  ],
  mandatory: false,
  minSupportedVersion: "v2.5.0",
  sourceUrl: CANONICAL_RENDER_URL
};

/**
 * Normalizes version strings into comparable integer arrays.
 * Handles: "v2.6.0" -> [2, 6, 0]
 *          "2.7"    -> [2, 7, 0]
 */
export function parseSemver(versionStr: string): number[] {
  const cleaned = String(versionStr || '').replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3);
}

/**
 * Compares two semver strings.
 * Returns > 0 if vA > vB, < 0 if vA < vB, and 0 if equal.
 */
export function compareSemver(vA: string, vB: string): number {
  const partsA = parseSemver(vA);
  const partsB = parseSemver(vB);

  for (let i = 0; i < 3; i++) {
    if (partsA[i] > partsB[i]) return 1;
    if (partsA[i] < partsB[i]) return -1;
  }
  return 0;
}

/**
 * Checks whether client code needs an upgrade relative to a target version.
 */
export function isUpgradeNeeded(currentClientVersion: string, targetVersion: string): boolean {
  return compareSemver(targetVersion, currentClientVersion) > 0;
}

/**
 * Subscribes to real-time changes to the app version settings document in Firestore.
 */
export function subscribeToAppVersion(
  onUpdate: (versionInfo: AppVersionInfo) => void
): () => void {
  const db = getDbService();
  if (!db) {
    onUpdate(DEFAULT_APP_VERSION_INFO);
    return () => {};
  }

  try {
    const unsub = onSnapshot(
      doc(db, 'system_settings', 'app_version'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppVersionInfo;
          onUpdate({
            ...DEFAULT_APP_VERSION_INFO,
            ...data,
            version: data.version || DEFAULT_APP_VERSION_INFO.version
          });
        } else {
          onUpdate(DEFAULT_APP_VERSION_INFO);
        }
      },
      (error) => {
        console.warn("Could not subscribe to app_version status:", error);
        onUpdate(DEFAULT_APP_VERSION_INFO);
      }
    );
    return unsub;
  } catch (err) {
    console.error("Error setting up app_version listener:", err);
    onUpdate(DEFAULT_APP_VERSION_INFO);
    return () => {};
  }
}

/**
 * Fetches latest app version information once, combining Firestore, Render remote API, and server fallback.
 */
export async function checkAppVersion(
  clientVersion: string = getInstalledAppVersion()
): Promise<AppVersionStatus> {
  let targetVersionInfo: AppVersionInfo = DEFAULT_APP_VERSION_INFO;

  // 1. Try Firestore system_settings/app_version
  const db = getDbService();
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'system_settings', 'app_version'));
      if (snap.exists()) {
        const data = snap.data() as AppVersionInfo;
        targetVersionInfo = {
          ...DEFAULT_APP_VERSION_INFO,
          ...data
        };
      }
    } catch (err) {
      console.warn("Failed fetching app_version from Firestore:", err);
    }
  }

  // 2. Query server /api/version/check endpoint to cross-check against deployed Render app
  try {
    const res = await fetch(`/api/version/check?clientVersion=${encodeURIComponent(clientVersion)}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.latestVersion) {
        // If server or Render remote is higher than Firestore, prioritize latest
        if (compareSemver(data.latestVersion, targetVersionInfo.version) > 0) {
          targetVersionInfo = {
            ...targetVersionInfo,
            version: data.latestVersion,
            releaseTitle: data.releaseTitle || targetVersionInfo.releaseTitle,
            releaseNotes: data.releaseNotes || targetVersionInfo.releaseNotes,
            releaseDate: data.releaseDate || targetVersionInfo.releaseDate,
            mandatory: Boolean(data.mandatory)
          };
        }
      }
    }
  } catch (err) {
    // Local offline or backend offline
  }

  const needsUpgrade = isUpgradeNeeded(clientVersion, targetVersionInfo.version);

  return {
    currentVersion: clientVersion,
    latestVersion: targetVersionInfo.version,
    needsUpgrade,
    mandatory: Boolean(targetVersionInfo.mandatory),
    releaseTitle: targetVersionInfo.releaseTitle,
    releaseNotes: targetVersionInfo.releaseNotes,
    releaseDate: targetVersionInfo.releaseDate,
    sourceUrl: targetVersionInfo.sourceUrl || CANONICAL_RENDER_URL,
    lastCheckedAt: Date.now()
  };
}

/**
 * Updates or broadcasts a new app version in Firestore (Admin tool).
 */
export async function updateAppVersionConfig(
  newVersionInfo: Partial<AppVersionInfo>,
  userEmail?: string
): Promise<void> {
  const db = getDbService();
  if (!db) throw new Error("Firebase database service unavailable");

  const versionRef = doc(db, 'system_settings', 'app_version');
  const payload: any = {
    ...newVersionInfo,
    publishedAt: serverTimestamp(),
    updatedBy: userEmail || 'admin'
  };

  await setDoc(versionRef, payload, { merge: true });
}
