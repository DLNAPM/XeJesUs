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

