import { UserProfile } from '../types';
import { getAuthService, getDbService, doc, setDoc } from './firebase';

export interface ScholarVoicePreset {
  name: string;
  style: string;
  gender: 'male' | 'female';
}

export const MALE_VOICE_PRESETS: ScholarVoicePreset[] = [
  { name: 'Joel Osteen', style: 'Warm, Inspirational & Encouraging', gender: 'male' },
  { name: 'Charles Spurgeon', style: 'Classic Prince of Preachers & Regal', gender: 'male' },
  { name: 'C.S. Lewis', style: 'Scholarly, Oxbridge & Intellectually Rich', gender: 'male' },
  { name: 'Martin Luther', style: 'Bold, Resonant & Reformational', gender: 'male' },
  { name: 'Tim Keller', style: 'Thoughtful, Exegetical & Urban', gender: 'male' },
  { name: 'Billy Graham', style: 'Evangelistic, Authoritative & Clear', gender: 'male' },
];

export const FEMALE_VOICE_PRESETS: ScholarVoicePreset[] = [
  { name: 'Oprah Winfrey', style: 'Empathetic, Warm & Resonant', gender: 'female' },
  { name: 'Beth Moore', style: 'Passionate, Dynamic & Exegetical', gender: 'female' },
  { name: 'Joyce Meyer', style: 'Direct, Practical & Uplifting', gender: 'female' },
  { name: 'Priscilla Shirer', style: 'Faith-Filled, Energetic & Direct', gender: 'female' },
  { name: 'Kay Arthur', style: 'Inductive, Reverent & Methodical', gender: 'female' },
  { name: 'Corrie ten Boom', style: 'Gracious, Courageous & Wise', gender: 'female' },
];

export const ALL_SCHOLAR_PRESETS: ScholarVoicePreset[] = [
  ...MALE_VOICE_PRESETS,
  ...FEMALE_VOICE_PRESETS,
];

export function isFemalePreset(voiceName: string): boolean {
  return FEMALE_VOICE_PRESETS.some(p => p.name.toLowerCase() === voiceName.toLowerCase());
}

export function isMalePreset(voiceName: string): boolean {
  return MALE_VOICE_PRESETS.some(p => p.name.toLowerCase() === voiceName.toLowerCase());
}

export function getVoiceStyle(voiceName: string): string {
  const found = ALL_SCHOLAR_PRESETS.find(p => p.name.toLowerCase() === voiceName.toLowerCase());
  return found?.style || 'Distinguished Scholar & Exegete';
}

export function getCurrentScholarVoice(profile: UserProfile | null): {
  name: string;
  gender: 'male' | 'female';
  style: string;
  isCustom: boolean;
  enabled: boolean;
} {
  const enabled = profile?.scholarsVoicesEnabled !== false;
  const activeGender = profile?.activeScholarGender === 'female' ? 'female' : 'male';
  
  const maleVoice = profile?.maleScholarVoice || 'Joel Osteen';
  const femaleVoice = profile?.femaleScholarVoice || 'Oprah Winfrey';

  const name = activeGender === 'female' ? femaleVoice : maleVoice;
  const isCustom = !ALL_SCHOLAR_PRESETS.some(p => p.name.toLowerCase() === name.toLowerCase());
  const style = getVoiceStyle(name);

  return {
    name,
    gender: activeGender,
    style,
    isCustom,
    enabled
  };
}

export async function persistScholarVoice(
  voiceName: string,
  gender: 'male' | 'female',
  currentProfile: UserProfile | null
): Promise<UserProfile> {
  const auth = getAuthService();
  const db = getDbService();
  const uid = currentProfile?.uid || auth?.currentUser?.uid;

  const updatedProfile: UserProfile = {
    ...(currentProfile || {
      uid: uid || '',
      email: auth?.currentUser?.email || '',
      displayName: auth?.currentUser?.displayName || '',
      photoURL: auth?.currentUser?.photoURL || '',
    }),
    activeScholarGender: gender,
    maleScholarVoice: gender === 'male' ? voiceName : (currentProfile?.maleScholarVoice || 'Joel Osteen'),
    femaleScholarVoice: gender === 'female' ? voiceName : (currentProfile?.femaleScholarVoice || 'Oprah Winfrey'),
    scholarsVoicesEnabled: true,
  };

  if (db && uid) {
    try {
      await setDoc(doc(db, 'users', uid), {
        activeScholarGender: updatedProfile.activeScholarGender,
        maleScholarVoice: updatedProfile.maleScholarVoice,
        femaleScholarVoice: updatedProfile.femaleScholarVoice,
        scholarsVoicesEnabled: updatedProfile.scholarsVoicesEnabled,
      }, { merge: true });
    } catch (err) {
      console.warn("Could not persist scholar voice to Firestore:", err);
    }
  }

  return updatedProfile;
}
