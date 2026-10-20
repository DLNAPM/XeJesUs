export type AlertCategory = 'billing' | 'api_restriction' | 'rate_limit' | 'service_outage' | 'permission_denied' | 'other';
export type AlertSeverity = 'critical' | 'high' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface SystemAlert {
  id?: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  service: string;
  endpoint?: string;
  details?: string;
  userEmail?: string;
  userId?: string;
  status: AlertStatus;
  createdAt: any;
  acknowledgedAt?: any;
  acknowledgedBy?: string;
  resolvedAt?: any;
  resolvedBy?: string;
  emailNotified?: boolean;
  emailRecipient?: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  message: string;
  severity?: 'maintenance' | 'upgrade' | 'investigation';
  affectedServices?: string[];
  estimatedCompletion?: string;
  allowGuestAccess?: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bibleWebsite?: string;
  role?: 'user' | 'admin';
  tier?: 'basic' | 'premium';
  isFrozen?: boolean;
  theme?: 'modern' | 'midnight' | 'parchment';
  lastLoginAt?: any;
  maleScholarVoice?: string;
  femaleScholarVoice?: string;
  activeScholarGender?: 'male' | 'female' | 'auto';
  scholarsVoicesEnabled?: boolean;
}

export interface Inquiry {
  id?: string;
  userId: string;
  userEmail?: string;
  query: string;
  scripture: string;
  interpretation: string;
  historicalContext: string;
  grammarAnalysis: string;
  literaryGenre: string;
  godIntent: string;
  crossReferences: string[];
  geography: {
    location: string;
    thenDesc: string;
    nowDesc: string;
    thenImageUrl?: string;
    nowImageUrl?: string;
  };
  videoClipQuery?: string;
  createdAt: any;
}

export interface BibleGroup {
  id?: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: any;
}

export interface GroupMember {
  id?: string; // document id
  role: 'owner' | 'member';
  email: string;
  joinedAt: any;
  status?: 'active' | 'invited';
}

export interface DirectShare {
  id?: string;
  senderId: string;
  recipientEmail: string;
  inquiryId: string;
  createdAt: any;
}

export interface Discussion {
  id?: string;
  groupId: string;
  inquiryId: string;
  sharedBy: string;
  createdAt: any;
}

export interface Message {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

export interface ChatSession {
  id?: string;
  userId: string;
  name: string;
  messages: {
    role: 'user' | 'model';
    text: string;
  }[];
  createdAt: any;
  updatedAt?: any;
}

export interface LiteraryWorkExport {
  themeTitle: string;
  subtitle: string;
  executiveSummary: string;
  thematicAnalysis: string;
  familyTree: {
    generation: string;
    person: string;
    biblicalTitle: string;
    significance: string;
    keyScripture?: string;
  }[];
  scholarlyWorks: {
    title: string;
    author: string;
    era: string;
    summary: string;
    relevance: string;
  }[];
  youtubeVideos: {
    title: string;
    channel: string;
    searchQuery: string;
    url: string;
    description: string;
  }[];
  images: {
    title: string;
    caption: string;
    imageUrl: string;
  }[];
}

export interface DemographicSect {
  name: string;
  percentageThen: number;
  percentageNow: number;
  descriptionThen: string;
  descriptionNow: string;
  color?: string;
}

export interface ThenVsNowData {
  id?: string;
  customName?: string;
  savedAt?: any;
  query: string;
  category: 'place' | 'people' | 'event' | 'phrase';
  userId?: string;
  createdAt?: any;

  // 1. Historical meaning & God's intent to the Body of Christ
  title: string;
  originalName: string;
  etymology: string;
  historicalMeaning: string;
  godsIntentForBodyOfChrist: string;
  keyScriptures: { ref: string; text: string }[];

  // 2. Side-by-side images / visual representation
  thenVisual: {
    title: string;
    description: string;
    imageUrl: string;
    architecturalHighlights: string[];
    era: string;
  };
  nowVisual: {
    title: string;
    description: string;
    imageUrl: string;
    modernHighlights: string[];
    era: string;
  };

  // 3. Historical meanings vs Modern Day view
  antiquityPerspective: string;
  modernWorldPerspective: string;
  theologicalEvolution: string;

  // 4. Illustrated charts of sects / peoples represented then vs today
  demographicComparison: {
    regionName: string;
    summaryThen: string;
    summaryNow: string;
    sects: DemographicSect[];
  };

  // 5. Challenges in the region today & End-Times Prophetic Destiny
  modernRegionalChallenges: {
    title: string;
    challenge: string;
    spiritualSignificance: string;
  }[];
  endTimesProphecy: {
    scripturalProphecies: string[];
    divineDestinySummary: string;
    godsRedemptivePlan: string;
  };

  pilgrimTakeaway: string;
}
