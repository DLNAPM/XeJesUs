import { 
  getDbService, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from '../lib/firebase';
import { MaintenanceConfig } from '../types';

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  enabled: false,
  title: "Sanctuary Maintenance & Upgrades",
  message: "We are currently performing routine upgrades to improve your spiritual and exegetical study experience. Certain features may be temporarily paused.",
  severity: "upgrade",
  affectedServices: ["Scripture AI Interpretation", "Interactive AI Chatbot"],
  estimatedCompletion: "30-45 minutes",
  allowGuestAccess: true
};

export const COMMON_SANCTUARY_SERVICES = [
  "Scripture AI Interpretation & Exegesis",
  "Interactive AI Chatbot & Saved Sessions",
  "Theological Lexicon & Strong's Concordance",
  "TTS Scholar Voices & Audio Reading",
  "Small Groups & Collaborative Discussions",
  "Historical Maps & Geocoding",
  "Direct Pilgrim Study Sharing",
  "Pilgrim Account Registration"
];

export const MAINTENANCE_PRESETS: {
  id: string;
  label: string;
  badge: string;
  config: Partial<MaintenanceConfig>;
}[] = [
  {
    id: 'ai-quota',
    label: 'AI Quota & Engine Upgrade',
    badge: 'Gemini Engine',
    config: {
      title: "AI Engine Quota & Model Upgrades Underway",
      message: "We are currently upgrading to dedicated high-capacity Gemini 2.5 Flash engines to eliminate rate limits and improve response speeds. Scripture queries, chatbot analysis, and AI exegesis will resume momentarily.",
      severity: "upgrade",
      affectedServices: [
        "Scripture AI Interpretation & Exegesis",
        "Interactive AI Chatbot & Saved Sessions"
      ],
      estimatedCompletion: "20-30 minutes",
      allowGuestAccess: true
    }
  },
  {
    id: 'database-indexing',
    label: 'Database & Cloud Indexing',
    badge: 'Firestore Cloud',
    config: {
      title: "Sanctuary Cloud Database Maintenance",
      message: "Our engineering disciples are performing essential database indexing and security audits. Reading existing inquiries is unaffected, while saving new studies and updating small groups may experience momentary pauses.",
      severity: "maintenance",
      affectedServices: [
        "Small Groups & Collaborative Discussions",
        "Direct Pilgrim Study Sharing"
      ],
      estimatedCompletion: "45 minutes",
      allowGuestAccess: true
    }
  },
  {
    id: 'full-sanctuary',
    label: 'Full System Maintenance',
    badge: 'Full Sanctuary',
    config: {
      title: "Sanctuary Full Platform Maintenance",
      message: "XeJesUs is undergoing an extensive infrastructure upgrade. We are installing new linguistic concordances, enhanced Hebrew/Greek morphological tools, and performance patches. Full sanctuary access will be restored shortly.",
      severity: "maintenance",
      affectedServices: [
        "Scripture AI Interpretation & Exegesis",
        "Interactive AI Chatbot & Saved Sessions",
        "Theological Lexicon & Strong's Concordance",
        "TTS Scholar Voices & Audio Reading",
        "Small Groups & Collaborative Discussions"
      ],
      estimatedCompletion: "1 hour",
      allowGuestAccess: true
    }
  },
  {
    id: 'lexicon-audio',
    label: 'Lexicon & Scholar Voices Tuning',
    badge: 'Media & Voice',
    config: {
      title: "Lexicon & Scholar Audio Synthesizer Upgrades",
      message: "We are tuning the scholar voice models and lexicon duplicate checks. Lexicon queries and audio playback might be momentarily unavailable, while scripture text reading remains operational.",
      severity: "investigation",
      affectedServices: [
        "Theological Lexicon & Strong's Concordance",
        "TTS Scholar Voices & Audio Reading"
      ],
      estimatedCompletion: "15 minutes",
      allowGuestAccess: true
    }
  }
];

/**
 * Subscribes to real-time changes to the maintenance mode settings doc
 */
export function subscribeToMaintenance(
  onUpdate: (config: MaintenanceConfig) => void
): () => void {
  const db = getDbService();
  if (!db) {
    onUpdate(DEFAULT_MAINTENANCE_CONFIG);
    return () => {};
  }

  try {
    const unsub = onSnapshot(
      doc(db, 'system_settings', 'maintenance'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as MaintenanceConfig;
          onUpdate({
            ...DEFAULT_MAINTENANCE_CONFIG,
            ...data,
            // Ensure enabled is strictly a boolean
            enabled: Boolean(data.enabled)
          });
        } else {
          onUpdate(DEFAULT_MAINTENANCE_CONFIG);
        }
      },
      (error) => {
        console.warn("Could not subscribe to maintenance status:", error);
        onUpdate(DEFAULT_MAINTENANCE_CONFIG);
      }
    );
    return unsub;
  } catch (err) {
    console.error("Error setting up maintenance listener:", err);
    onUpdate(DEFAULT_MAINTENANCE_CONFIG);
    return () => {};
  }
}

/**
 * Fetches current maintenance configuration once
 */
export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  const db = getDbService();
  if (!db) return DEFAULT_MAINTENANCE_CONFIG;

  try {
    const snap = await getDoc(doc(db, 'system_settings', 'maintenance'));
    if (snap.exists()) {
      return {
        ...DEFAULT_MAINTENANCE_CONFIG,
        ...(snap.data() as MaintenanceConfig),
        enabled: Boolean(snap.data()?.enabled)
      };
    }
    return DEFAULT_MAINTENANCE_CONFIG;
  } catch (e) {
    console.error("Failed to fetch maintenance config:", e);
    return DEFAULT_MAINTENANCE_CONFIG;
  }
}

/**
 * Updates or toggles maintenance mode in Firestore
 */
export async function updateMaintenanceConfig(
  newConfig: Partial<MaintenanceConfig>,
  userEmail?: string
): Promise<void> {
  const db = getDbService();
  if (!db) throw new Error("Firebase database service unavailable");

  const maintenanceRef = doc(db, 'system_settings', 'maintenance');
  const payload: any = {
    ...newConfig,
    updatedAt: serverTimestamp(),
    updatedBy: userEmail || 'admin'
  };

  await setDoc(maintenanceRef, payload, { merge: true });
}
