import { UserProfile } from '../types';
import { getAuthService, getDbService, doc, setDoc } from './firebase';

export interface ScholarVoicePreset {
  name: string;
  style: string;
  gender: 'male' | 'female';
  cadence: string;
  soundProfile: string;
  geminiVoice: 'Puck' | 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr';
  auditionQuote: string;
}

export const MALE_VOICE_PRESETS: ScholarVoicePreset[] = [
  {
    name: 'Joel Osteen',
    style: 'Warm, Inspirational & Encouraging',
    gender: 'male',
    cadence: 'Upbeat, smiling cadence with rising affirmative inflection',
    soundProfile: 'Bright, cheerful tenor with Texan warmth',
    geminiVoice: 'Puck',
    auditionQuote: "Remember, God didn't bring you this far to leave you! Psalm 23 says His favor and mercy are pursuing you right now. Keep your head high, stay in faith, and expect God's goodness today!"
  },
  {
    name: 'Charles Spurgeon',
    style: 'Classic Prince of Preachers & Regal Oratory',
    gender: 'male',
    cadence: '19th-century pulpit oratory, measured rhetorical pauses, and majestic gravitas',
    soundProfile: 'Deep, resonant, rich baritone',
    geminiVoice: 'Charon',
    auditionQuote: "Hearken, beloved pilgrim... The Lord is thy Shepherd. When the shadows lengthen in the valley of weeping, He hath not forsaken thee; no, He is nearest when the night is deepest! Rest thy weary soul upon His sovereign grace."
  },
  {
    name: 'C.S. Lewis',
    style: 'Scholarly, Oxbridge & Intellectually Rich',
    gender: 'male',
    cadence: 'Lucid Oxford tutorial cadence with gentle philosophical pacing',
    soundProfile: 'Articulate, warm British academic mid-tone',
    geminiVoice: 'Fenrir',
    auditionQuote: "Consider this, my friend. We are not merely mortals wandering an indifferent world; we are creatures destined for eternity. What is seen is temporary, but the unseen reality is everlasting. Let us look with quiet reason into the great mystery."
  },
  {
    name: 'Martin Luther',
    style: 'Bold, Resonant & Reformational',
    gender: 'male',
    cadence: 'Defiant, staccato emphasis with resolute, passionate convictions',
    soundProfile: 'Rugged, commanding German reformational baritone',
    geminiVoice: 'Charon',
    auditionQuote: "Stand fast, Christian soul! By faith alone—sola fide—we are justified before God! The devil would have you tremble, but Christ has conquered sin, death, and hell! Sing your psalm with bold defiance in the Lord!"
  },
  {
    name: 'Tim Keller',
    style: 'Thoughtful, Exegetical & Urban Pastoral',
    gender: 'male',
    cadence: 'Gentle, conversational deconstruction with contemplative cadence',
    soundProfile: 'Calm, intellectual, compassionate urban pastoral mid-tone',
    geminiVoice: 'Fenrir',
    auditionQuote: "You see, the gospel isn't 'good advice' to try harder; it's 'good news' of what Christ has already finished. In our moments of deepest doubt, we discover that God's grace is far more relentless than our skepticism."
  },
  {
    name: 'Billy Graham',
    style: 'Evangelistic, Authoritative & Heraldic',
    gender: 'male',
    cadence: 'Impassioned heraldic delivery with dramatic pauses and climactic urgency',
    soundProfile: 'Sonorous, clear, ringing proclamation tenor',
    geminiVoice: 'Puck',
    auditionQuote: "The Bible says, 'God so loved the world that He gave His only begotten Son.' Tonight, right where you are, God is speaking to your heart. Will you surrender your life and trust Him completely?"
  },
  {
    name: 'Asher Wilson',
    style: 'Ancient Ethiopian Canon & Apostolic Authority',
    gender: 'male',
    cadence: 'Solemn, liturgical rhythm with Aksumite prophetic reverence',
    soundProfile: 'Dignified, deep, ancient canonical authority',
    geminiVoice: 'Charon',
    auditionQuote: "From the ancient rock sanctuaries of Aksum and the sacred Ge'ez manuscripts of the eighty-one book canon, the ancient testimony stands firm: Henok beheld the Heavenly Throne, and the Lord of Spirits reigneth forever and ever."
  },
];

export const FEMALE_VOICE_PRESETS: ScholarVoicePreset[] = [
  {
    name: 'Oprah Winfrey',
    style: 'Empathetic, Warm & Soulful Storyteller',
    gender: 'female',
    cadence: 'Dynamic conversational range with soulful, lingering pauses on core truths',
    soundProfile: 'Rich, resonant, deeply comforting alto',
    geminiVoice: 'Kore',
    auditionQuote: "I know this for sure: when you get still—really, truly still—you realize that grace is not something you have to earn. It is already whispering to your soul. Open your heart to the wonder of this sacred moment."
  },
  {
    name: 'Beth Moore',
    style: 'Passionate, Dynamic & Exegetical Energy',
    gender: 'female',
    cadence: 'High-energy expressive shifts from earnest whisper to vibrant crescendo',
    soundProfile: 'Warm, spirited Southern cadence with intense emotional color',
    geminiVoice: 'Kore',
    auditionQuote: "Darlings, listen to me closely! God's Word is alive, sharper than any two-edged sword! When the enemy tells you you're defeated, you open your Bible and declare the promises of the Living God!"
  },
  {
    name: 'Joyce Meyer',
    style: 'Direct, Practical & Candidly Uplifting',
    gender: 'female',
    cadence: 'Crisp, punchy, declarative rhythm with frank conversational pauses',
    soundProfile: 'Confident, down-to-earth, energetic Midwestern projection',
    geminiVoice: 'Zephyr',
    auditionQuote: "Now let's be real today: you can be pitiful, or you can be powerful, but you cannot be both! God's grace is sufficient for you right where you are. Stop worrying about tomorrow, and let God do the heavy lifting!"
  },
  {
    name: 'Priscilla Shirer',
    style: 'Faith-Filled, Energetic & Commanding',
    gender: 'female',
    cadence: 'Musical, rhythmic cadence with commanding spiritual authority',
    soundProfile: 'Dynamic, clear, articulate alto with resonant power',
    geminiVoice: 'Zephyr',
    auditionQuote: "You are not defenseless, pilgrim! The Word of God is your sword, and the armor of light has been fitted to your frame. When you stand in prayer, heaven hears and every stronghold of fear must fall!"
  },
  {
    name: 'Kay Arthur',
    style: 'Inductive, Reverent & Methodical',
    gender: 'female',
    cadence: 'Deliberate, contemplative questioning with maternal scriptural gravitas',
    soundProfile: 'Reverent, steady, precise teaching cadence',
    geminiVoice: 'Kore',
    auditionQuote: "Beloved, look intently into the text. What does the Scripture say? Line upon line, precept upon precept, the Lord reveals His unchanging character. Be still, observe, and let His truth anchor your heart."
  },
  {
    name: 'Corrie ten Boom',
    style: 'Gracious, Courageous & Serene Fortitude',
    gender: 'female',
    cadence: 'Gentle, tranquil, unhurried pacing with profound spiritual peace',
    soundProfile: 'Soft, intimate, venerable Dutch elder cadence',
    geminiVoice: 'Kore',
    auditionQuote: "My dear friend... There is no pit so deep that the love of God is not deeper still. When you look at the world, you will be distressed; but when you look at Jesus, you will be at rest."
  },
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

export function getVoicePreset(voiceName: string): ScholarVoicePreset | undefined {
  return ALL_SCHOLAR_PRESETS.find(p => p.name.toLowerCase() === voiceName.toLowerCase());
}

export function getVoiceStyle(voiceName: string): string {
  const found = getVoicePreset(voiceName);
  return found?.style || 'Distinguished Scholar & Exegete';
}

export function getVoiceCadence(voiceName: string): string {
  const found = getVoicePreset(voiceName);
  return found?.cadence || 'Reverent, articulate biblical scholar inflection';
}

export function getVoiceSoundProfile(voiceName: string): string {
  const found = getVoicePreset(voiceName);
  return found?.soundProfile || 'Warm, resonant scholar voice';
}

export function getAuditionQuote(voiceName: string, gender: 'male' | 'female' = 'male'): string {
  const found = getVoicePreset(voiceName);
  if (found?.auditionQuote) {
    return found.auditionQuote;
  }
  return gender === 'female'
    ? `Greetings, pilgrim. I am your sanctuary scholar voice modeled in the spirit of ${voiceName}. May peace, divine grace, and wisdom illuminate your spiritual path.`
    : `Greetings, pilgrim. I am your sanctuary scholar voice modeled in the spirit of ${voiceName}. May peace, divine grace, and wisdom illuminate your spiritual path.`;
}

export function getCurrentScholarVoice(profile: UserProfile | null): {
  name: string;
  gender: 'male' | 'female';
  style: string;
  cadence: string;
  soundProfile: string;
  isCustom: boolean;
  enabled: boolean;
} {
  const enabled = profile?.scholarsVoicesEnabled !== false;
  const activeGender = profile?.activeScholarGender === 'female' ? 'female' : 'male';
  
  const maleVoice = profile?.maleScholarVoice || 'Joel Osteen';
  const femaleVoice = profile?.femaleScholarVoice || 'Oprah Winfrey';

  const name = activeGender === 'female' ? femaleVoice : maleVoice;
  const found = getVoicePreset(name);
  const isCustom = !found;
  const style = found?.style || 'Distinguished Scholar & Exegete';
  const cadence = found?.cadence || 'Reverent, articulate biblical scholar inflection';
  const soundProfile = found?.soundProfile || 'Warm, resonant scholar voice';

  return {
    name,
    gender: activeGender,
    style,
    cadence,
    soundProfile,
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
