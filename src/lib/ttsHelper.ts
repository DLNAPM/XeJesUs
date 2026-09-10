import { UserProfile } from '../types';
import { generateScholarTTS } from '../services/geminiService';

export interface ScholarSpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  percent: number;
  text: string;
  currentChunkIndex: number;
  totalChunks: number;
}

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let activePlaybackId = 0;

type ProgressSubscriber = (state: ScholarSpeechState) => void;
const progressSubscribers = new Set<ProgressSubscriber>();

interface ActiveSession {
  playbackId: number;
  rawText: string;
  personaName: string;
  gender: 'male' | 'female';
  isBrowserFallback: boolean;
  chunks: string[];
  chunkDurations: number[];
  chunkPromises: Map<number, Promise<{ wavBlob: Blob; audioUrl: string; duration: number } | null>>;
  currentChunkIndex: number;
  isPaused: boolean;
  isPlaying: boolean;
  unlockedAudio?: HTMLAudioElement | null;
  progressInterval?: any;
  options?: {
    gender?: 'male' | 'female' | 'auto';
    personaName?: string;
    profile?: UserProfile | null;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onProgress?: (state: ScholarSpeechState) => void;
  };
}

export function clearScholarAudioCache() {
  clientAudioCache.forEach((entry) => {
    if (entry?.audioUrl) {
      try {
        URL.revokeObjectURL(entry.audioUrl);
      } catch (_) {}
    }
  });
  clientAudioCache.clear();
}

if (typeof window !== 'undefined') {
  window.addEventListener('scholar-profile-updated', () => {
    clearScholarAudioCache();
  });
}

export function getEffectiveScholarVoiceInfo(profile?: UserProfile | null): {
  personaName: string;
  gender: 'male' | 'female';
  maleScholarVoice: string;
  femaleScholarVoice: string;
  activeScholarGender: 'male' | 'female' | 'auto';
  scholarsVoicesEnabled: boolean;
} {
  const p: any = profile ? { ...profile } : {};
  let parsed: any = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('xejesus_user_scholar_voice_profile');
      if (stored) {
        parsed = JSON.parse(stored);
      }
    } catch (_) {}
  }

  const activeGender: 'male' | 'female' | 'auto' = 
    p?.activeScholarGender || parsed?.activeScholarGender || 'male';

  const maleVoiceName = p?.maleScholarVoice || parsed?.maleScholarVoice || 'Joel Osteen';
  const femaleVoiceName = p?.femaleScholarVoice || parsed?.femaleScholarVoice || 'Oprah Winfrey';

  let genderToUse: 'male' | 'female' = activeGender === 'female' ? 'female' : 'male';
  let personaName = genderToUse === 'female' ? femaleVoiceName : maleVoiceName;

  // Auto-align gender based on preset catalog if persona is recognized
  const lowerPersona = (personaName || '').toLowerCase();
  if (
    lowerPersona.includes('oprah') || 
    lowerPersona.includes('moore') || 
    lowerPersona.includes('meyer') || 
    lowerPersona.includes('shirer') || 
    lowerPersona.includes('arthur') || 
    lowerPersona.includes('ten boom') || 
    lowerPersona.includes('corrie')
  ) {
    genderToUse = 'female';
  } else if (
    lowerPersona.includes('osteen') || 
    lowerPersona.includes('spurgeon') || 
    lowerPersona.includes('lewis') || 
    lowerPersona.includes('luther') || 
    lowerPersona.includes('keller') || 
    lowerPersona.includes('graham')
  ) {
    genderToUse = 'male';
  }

  const scholarsVoicesEnabled = p?.scholarsVoicesEnabled !== undefined
    ? p.scholarsVoicesEnabled
    : (parsed?.scholarsVoicesEnabled !== undefined ? parsed.scholarsVoicesEnabled : true);

  return {
    personaName,
    gender: genderToUse,
    maleScholarVoice: maleVoiceName,
    femaleScholarVoice: femaleVoiceName,
    activeScholarGender: activeGender,
    scholarsVoicesEnabled,
  };
}

export interface ScholarVoiceOption {
  name: string;
  style: string;
  gender: 'male' | 'female';
}

export const SCHOLAR_MALE_VOICES: ScholarVoiceOption[] = [
  { name: 'Joel Osteen', style: 'Warm, Inspirational & Encouraging', gender: 'male' },
  { name: 'Charles Spurgeon', style: 'Classic Prince of Preachers & Regal', gender: 'male' },
  { name: 'C.S. Lewis', style: 'Scholarly, Oxbridge & Intellectually Rich', gender: 'male' },
  { name: 'Martin Luther', style: 'Bold, Resonant & Reformational', gender: 'male' },
  { name: 'Tim Keller', style: 'Thoughtful, Exegetical & Urban', gender: 'male' },
  { name: 'Billy Graham', style: 'Evangelistic, Authoritative & Clear', gender: 'male' }
];

export const SCHOLAR_FEMALE_VOICES: ScholarVoiceOption[] = [
  { name: 'Oprah Winfrey', style: 'Empathetic, Warm & Resonant', gender: 'female' },
  { name: 'Beth Moore', style: 'Passionate, Dynamic & Exegetical', gender: 'female' },
  { name: 'Joyce Meyer', style: 'Direct, Practical & Uplifting', gender: 'female' },
  { name: 'Priscilla Shirer', style: 'Faith-Filled, Energetic & Direct', gender: 'female' },
  { name: 'Kay Arthur', style: 'Inductive, Reverent & Methodical', gender: 'female' },
  { name: 'Corrie ten Boom', style: 'Gracious, Courageous & Wise', gender: 'female' }
];

export const ALL_SCHOLAR_VOICES: ScholarVoiceOption[] = [
  ...SCHOLAR_MALE_VOICES,
  ...SCHOLAR_FEMALE_VOICES
];

export function saveAndApplyScholarVoice(
  voiceName: string,
  gender: 'male' | 'female',
  profile?: UserProfile | null
): {
  maleScholarVoice: string;
  femaleScholarVoice: string;
  activeScholarGender: 'male' | 'female';
  scholarsVoicesEnabled: boolean;
} {
  const current = getEffectiveScholarVoiceInfo(profile);
  const payload = {
    maleScholarVoice: gender === 'male' ? voiceName : current.maleScholarVoice,
    femaleScholarVoice: gender === 'female' ? voiceName : current.femaleScholarVoice,
    activeScholarGender: gender,
    scholarsVoicesEnabled: true
  };

  try {
    localStorage.setItem('xejesus_user_scholar_voice_profile', JSON.stringify(payload));
    clearScholarAudioCache();
    window.dispatchEvent(new CustomEvent('scholar-profile-updated', { detail: payload }));
  } catch (_) {}

  return payload;
}

let activeSession: ActiveSession | null = null;

export function subscribeScholarSpeechProgress(subscriber: ProgressSubscriber): () => void {
  progressSubscribers.add(subscriber);
  if (activeSession) {
    subscriber(getCurrentProgressState());
  } else {
    subscriber({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      percent: 0,
      text: '',
      currentChunkIndex: 0,
      totalChunks: 0
    });
  }
  return () => {
    progressSubscribers.delete(subscriber);
  };
}

function notifySubscribers(state: ScholarSpeechState) {
  for (const sub of progressSubscribers) {
    try {
      sub(state);
    } catch (e) {
      console.warn("Error in progress subscriber:", e);
    }
  }
  activeSession?.options?.onProgress?.(state);
}

function getCurrentProgressState(): ScholarSpeechState {
  if (!activeSession) {
    return {
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      percent: 0,
      text: '',
      currentChunkIndex: 0,
      totalChunks: 0
    };
  }

  let elapsed = 0;
  for (let i = 0; i < activeSession.currentChunkIndex; i++) {
    elapsed += activeSession.chunkDurations[i] || 0;
  }
  if (currentAudio && !isNaN(currentAudio.currentTime)) {
    elapsed += currentAudio.currentTime;
  }

  let totalDuration = 0;
  for (const d of activeSession.chunkDurations) {
    totalDuration += d || 0;
  }
  if (totalDuration < elapsed) totalDuration = elapsed;

  const percent = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

  return {
    isPlaying: activeSession.isPlaying,
    isPaused: activeSession.isPaused,
    currentTime: Math.round(elapsed * 10) / 10,
    duration: Math.round(totalDuration * 10) / 10,
    percent: Math.round(percent * 10) / 10,
    text: activeSession.rawText,
    currentChunkIndex: activeSession.currentChunkIndex,
    totalChunks: activeSession.chunks.length
  };
}

export function getBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function stopScholarSpeech() {
  activePlaybackId++;
  if (activeSession) {
    if (activeSession.progressInterval) {
      clearInterval(activeSession.progressInterval);
    }
    // Clean up cached audio URLs
    activeSession.chunkPromises.forEach(async (p) => {
      try {
        const res = await p;
        if (res?.audioUrl) URL.revokeObjectURL(res.audioUrl);
      } catch (_) {}
    });
    activeSession = null;
  }

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.onended = null;
      currentAudio.onerror = null;
    } catch (e) {
      console.warn("Error stopping audio playback:", e);
    }
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("Error stopping synthesis:", e);
    }
  }
  currentUtterance = null;

  notifySubscribers({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    percent: 0,
    text: '',
    currentChunkIndex: 0,
    totalChunks: 0
  });
}

export function pauseScholarSpeech() {
  if (activeSession) {
    activeSession.isPaused = true;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch (e) {
      console.warn("Error pausing audio:", e);
    }
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.pause();
    } catch (e) {
      console.warn("Error pausing synthesis:", e);
    }
  }
  notifySubscribers(getCurrentProgressState());
}

export function resumeScholarSpeech() {
  if (activeSession) {
    activeSession.isPaused = false;
  }
  if (currentAudio) {
    currentAudio.play().catch(err => console.error("Error resuming audio:", err));
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn("Error resuming synthesis:", e);
    }
  }
  notifySubscribers(getCurrentProgressState());
}

/**
 * 10-Second Rewind: Jumps back 10 seconds in audio playback
 */
export function rewindScholarSpeech(seconds = 10) {
  if (!activeSession) return;
  const current = getCurrentProgressState();
  const targetTime = Math.max(0, current.currentTime - seconds);
  seekScholarSpeech(targetTime);
}

/**
 * 10-Second Fast-Forward: Jumps forward 10 seconds in audio playback
 */
export function fastForwardScholarSpeech(seconds = 10) {
  if (!activeSession) return;
  const current = getCurrentProgressState();
  const targetTime = Math.min(current.duration, current.currentTime + seconds);
  seekScholarSpeech(targetTime);
}

/**
 * Seek to any point in the playback (in seconds)
 */
export function seekScholarSpeech(targetTimeSeconds: number) {
  if (!activeSession) return;

  if (activeSession.isBrowserFallback) {
    // Browser speech synthesis fallback seek by sentence chunk
    const totalChunks = activeSession.chunks.length;
    const totalEstDuration = activeSession.chunkDurations.reduce((a, b) => a + b, 0) || 1;
    const targetRatio = Math.max(0, Math.min(1, targetTimeSeconds / totalEstDuration));
    const targetIndex = Math.min(totalChunks - 1, Math.floor(targetRatio * totalChunks));
    
    activeSession.currentChunkIndex = targetIndex;
    const remainingText = activeSession.chunks.slice(targetIndex).join(' ');
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speakWithBrowserFallback(remainingText, activeSession.personaName, activeSession.gender, {
        onStart: activeSession.options?.onStart,
        onEnd: activeSession.options?.onEnd,
        onError: activeSession.options?.onError
      });
    }
    return;
  }

  // Gemini Scholar audio seek across chunks
  let accumulated = 0;
  let targetChunk = 0;
  let offsetInChunk = 0;

  for (let i = 0; i < activeSession.chunks.length; i++) {
    const chunkDur = activeSession.chunkDurations[i] || 3;
    if (accumulated + chunkDur >= targetTimeSeconds || i === activeSession.chunks.length - 1) {
      targetChunk = i;
      offsetInChunk = Math.max(0, targetTimeSeconds - accumulated);
      break;
    }
    accumulated += chunkDur;
  }

  if (targetChunk === activeSession.currentChunkIndex && currentAudio) {
    try {
      currentAudio.currentTime = Math.min(offsetInChunk, currentAudio.duration || offsetInChunk);
      if (!activeSession.isPaused && currentAudio.paused) {
        currentAudio.play().catch(() => {});
      }
    } catch (e) {
      console.warn("Seek within current chunk failed:", e);
    }
    notifySubscribers(getCurrentProgressState());
  } else {
    // Switch to target chunk
    activeSession.currentChunkIndex = targetChunk;
    playScholarChunk(targetChunk, offsetInChunk);
  }
}

function pcmToWav(pcmBase64: string, sampleRate = 24000): Blob {
  const binaryString = atob(pcmBase64);
  const len = binaryString.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBytes.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  /* RIFF identifier */
  view.setUint32(0, 0x52494646, false); // "RIFF"
  /* file length */
  view.setUint32(4, totalSize - 8, true);
  /* RIFF type */
  view.setUint32(8, 0x57415645, false); // "WAVE"
  /* format chunk identifier */
  view.setUint32(12, 0x666d7420, false); // "fmt "
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate */
  view.setUint32(28, byteRate, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitsPerSample, true);
  /* data chunk identifier */
  view.setUint32(36, 0x64617461, false); // "data"
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, 44);

  return new Blob([buffer], { type: 'audio/wav' });
}

// In-memory client-side audio cache for repeated chunks and instant previews
const clientAudioCache = new Map<string, { wavBlob: Blob; audioUrl: string; duration: number }>();

function splitTextIntoChunks(text: string, firstChunkMax = 350, standardMax = 450): string[] {
  const clean = text
    .replace(/&amp;/gi, ' and ')
    .replace(/&lt;/gi, ' less than ')
    .replace(/&gt;/gi, ' greater than ')
    .replace(/&quot;/gi, '')
    .replace(/&apos;/gi, '')
    .replace(/&#39;/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&/g, ' and ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/\*+/g, '')
    .replace(/#+/g, '')
    .replace(/`+/g, '')
    .replace(/_+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/["“”«»]/g, '')
    .replace(/['‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return [];

  // Match sentences or clauses
  const rawSentences = clean.match(/[^.!?\n]+[.!?\n]+/g) || [clean];
  const atomicParts: string[] = [];

  // If any sentence is excessively long, split by comma or semicolon
  for (const s of rawSentences) {
    if (s.length > standardMax) {
      const subClauses = s.match(/[^,;:]+[,;:]?/g) || [s];
      for (const sub of subClauses) {
        if (sub.trim()) atomicParts.push(sub.trim());
      }
    } else {
      if (s.trim()) atomicParts.push(s.trim());
    }
  }

  const chunks: string[] = [];
  let currentChunk = "";
  let maxLen = firstChunkMax;

  for (const part of atomicParts) {
    if ((currentChunk + " " + part).trim().length > maxLen && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = part;
      maxLen = standardMax;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${part}` : part;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Cache for loaded browser synthesis voices
let cachedBrowserVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedBrowserVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedBrowserVoices = window.speechSynthesis.getVoices();
  };
}

function speakWithBrowserFallback(
  text: string,
  personaName: string,
  gender: 'male' | 'female',
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onError?.("Speech synthesis not supported");
    return;
  }

  const cleanText = text
    .replace(/\*+/g, '')
    .replace(/#+/g, '')
    .replace(/`+/g, '')
    .replace(/_+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance = utterance;

  let voices = cachedBrowserVoices;
  if (!voices || voices.length === 0) {
    voices = window.speechSynthesis.getVoices();
    cachedBrowserVoices = voices;
  }

  const lowerName = (personaName || "").toLowerCase();

  // Distinct pitch & rate profiles for each scholar persona in browser fallback
  if (gender === 'male') {
    if (lowerName.includes('osteen')) {
      utterance.pitch = 1.15;
      utterance.rate = 1.05;
    } else if (lowerName.includes('spurgeon')) {
      utterance.pitch = 0.65;
      utterance.rate = 0.85;
    } else if (lowerName.includes('lewis')) {
      utterance.pitch = 0.82;
      utterance.rate = 0.90;
    } else if (lowerName.includes('luther')) {
      utterance.pitch = 0.62;
      utterance.rate = 0.95;
    } else if (lowerName.includes('keller')) {
      utterance.pitch = 0.88;
      utterance.rate = 0.92;
    } else if (lowerName.includes('graham')) {
      utterance.pitch = 0.98;
      utterance.rate = 1.02;
    } else {
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
    }

    // Try finding specific distinct voice candidates based on persona
    let maleVoice: SpeechSynthesisVoice | undefined;
    if (lowerName.includes('spurgeon') || lowerName.includes('lewis')) {
      // Prefer British / UK voices if available
      maleVoice = voices.find(v => /en[-_]gb|british|george|oliver|uk/i.test(v.lang || v.name));
    }
    if (!maleVoice) {
      maleVoice = voices.find(v => /male|david|george|james|daniel|alex|mark|google us english|en-us/i.test(v.name));
    }
    if (maleVoice) utterance.voice = maleVoice;
  } else {
    if (lowerName.includes('oprah') || lowerName.includes('winfrey')) {
      utterance.pitch = 0.95;
      utterance.rate = 0.90;
    } else if (lowerName.includes('moore')) {
      utterance.pitch = 1.25;
      utterance.rate = 1.05;
    } else if (lowerName.includes('meyer')) {
      utterance.pitch = 1.12;
      utterance.rate = 1.02;
    } else if (lowerName.includes('shirer')) {
      utterance.pitch = 1.15;
      utterance.rate = 1.0;
    } else if (lowerName.includes('arthur')) {
      utterance.pitch = 0.98;
      utterance.rate = 0.86;
    } else if (lowerName.includes('ten boom') || lowerName.includes('corrie')) {
      utterance.pitch = 1.02;
      utterance.rate = 0.82;
    } else {
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
    }

    let femaleVoice: SpeechSynthesisVoice | undefined;
    if (lowerName.includes('ten boom') || lowerName.includes('arthur')) {
      femaleVoice = voices.find(v => /en[-_]gb|fiona|moira|karen/i.test(v.name) || /en[-_]gb/i.test(v.lang));
    }
    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        /female|zira|samantha|karen|victoria|fiona|google us english female|en-us.*female/i.test(v.name)
      );
    }
    if (femaleVoice) utterance.voice = femaleVoice;
  }

  utterance.onstart = () => {
    if (activeSession) {
      activeSession.isPlaying = true;
      activeSession.isPaused = false;
    }
    options?.onStart?.();
    notifySubscribers(getCurrentProgressState());
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (activeSession) {
      activeSession.isPlaying = false;
      activeSession.isPaused = false;
    }
    options?.onEnd?.();
    notifySubscribers(getCurrentProgressState());
  };

  utterance.onerror = (e) => {
    console.error(`Browser speech synthesis error (${personaName}):`, e);
    currentUtterance = null;
    if (activeSession) {
      activeSession.isPlaying = false;
      activeSession.isPaused = false;
    }
    options?.onError?.(e);
    notifySubscribers(getCurrentProgressState());
  };

  window.speechSynthesis.speak(utterance);
}

function fetchSessionChunk(session: ActiveSession, index: number): Promise<{ wavBlob: Blob; audioUrl: string; duration: number } | null> {
  if (index >= session.chunks.length) return Promise.resolve(null);
  if (!session.chunkPromises.has(index)) {
    const thisPlaybackId = session.playbackId;
    const chunkText = session.chunks[index];
    const cacheKey = `${session.personaName}::${session.gender}::${chunkText.trim()}`;

    // Check client-side audio cache first
    if (clientAudioCache.has(cacheKey)) {
      const cached = clientAudioCache.get(cacheKey)!;
      session.chunkDurations[index] = cached.duration;
      return Promise.resolve(cached);
    }

    const promise = (async () => {
      try {
        let pcmBase64 = await generateScholarTTS(chunkText, session.personaName, session.gender);
        if (activePlaybackId !== thisPlaybackId) return null;
        if (!pcmBase64) {
          // Retry once with a brief 200ms delay to prevent momentary network hiccup from dropping to browser robot fallback
          await new Promise(r => setTimeout(r, 200));
          if (activePlaybackId !== thisPlaybackId) return null;
          pcmBase64 = await generateScholarTTS(chunkText, session.personaName, session.gender);
        }
        if (!pcmBase64) return null;

        const wavBlob = pcmToWav(pcmBase64, 24000);
        const duration = Math.max(0.5, (wavBlob.size - 44) / 48000);
        const audioUrl = URL.createObjectURL(wavBlob);
        session.chunkDurations[index] = duration;

        const entry = { wavBlob, audioUrl, duration };
        clientAudioCache.set(cacheKey, entry);
        return entry;
      } catch (e) {
        console.warn(`Error generating audio chunk ${index}:`, e);
        return null;
      }
    })();
    session.chunkPromises.set(index, promise);
  }
  return session.chunkPromises.get(index)!;
}

async function playScholarChunk(index: number, startTime = 0) {
  const session = activeSession;
  if (!session || session.playbackId !== activePlaybackId) return;

  if (index >= session.chunks.length) {
    session.isPlaying = false;
    session.isPaused = false;
    session.options?.onEnd?.();
    notifySubscribers(getCurrentProgressState());
    return;
  }

  // Pre-fetch ONLY the next chunk in background while this one plays (prevents burst rate-limits)
  if (index + 1 < session.chunks.length) {
    fetchSessionChunk(session, index + 1);
  }

  // Stop previous audio
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio.onerror = null;
    } catch (_) {}
  }

  try {
    const chunkData = await fetchSessionChunk(session, index);

    if (activePlaybackId !== session.playbackId) {
      return;
    }

    if (!chunkData) {
      // Fallback to browser TTS for remaining text
      const remainingText = session.chunks.slice(index).join(" ");
      session.isBrowserFallback = true;
      speakWithBrowserFallback(remainingText, session.personaName, session.gender, session.options);
      return;
    }

    let audio: HTMLAudioElement;
    if (index === 0 && session.unlockedAudio) {
      session.unlockedAudio.src = chunkData.audioUrl;
      audio = session.unlockedAudio;
    } else {
      audio = new Audio(chunkData.audioUrl);
    }
    currentAudio = audio;

    if (startTime > 0) {
      audio.currentTime = startTime;
    }

    audio.onended = () => {
      if (activePlaybackId !== session.playbackId) return;
      currentAudio = null;
      session.currentChunkIndex = index + 1;
      playScholarChunk(index + 1, 0);
    };

    audio.onerror = (e) => {
      console.warn(`Audio playback error on chunk ${index}, fallback to browser TTS:`, e);
      if (activePlaybackId !== session.playbackId) return;
      currentAudio = null;
      const remainingText = session.chunks.slice(index).join(" ");
      session.isBrowserFallback = true;
      speakWithBrowserFallback(remainingText, session.personaName, session.gender, session.options);
    };

    if (!session.isPaused) {
      await audio.play();
      session.isPlaying = true;
    }

    notifySubscribers(getCurrentProgressState());

  } catch (err) {
    console.warn(`Gemini TTS playback error on chunk ${index}:`, err);
    if (activePlaybackId !== session.playbackId) return;
    const remainingText = session.chunks.slice(index).join(" ");
    session.isBrowserFallback = true;
    speakWithBrowserFallback(remainingText, session.personaName, session.gender, session.options);
  }
}

export function speakWithScholarVoice(
  text: string,
  options?: {
    gender?: 'male' | 'female' | 'auto';
    personaName?: string;
    profile?: UserProfile | null;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onProgress?: (state: ScholarSpeechState) => void;
  }
) {
  stopScholarSpeech();

  if (!text || !text.trim()) return;

  const voiceInfo = getEffectiveScholarVoiceInfo(options?.profile);
  const activeGender = options?.gender && options.gender !== 'auto' 
    ? options.gender 
    : voiceInfo.gender;
  const genderToUse: 'male' | 'female' = activeGender === 'female' ? 'female' : 'male';

  const defaultVoice = genderToUse === 'male' ? voiceInfo.maleScholarVoice : voiceInfo.femaleScholarVoice;
  const personaName = options?.personaName || defaultVoice;

  const chunks = splitTextIntoChunks(text, 250, 500);
  if (chunks.length === 0) return;

  const thisPlaybackId = activePlaybackId;

  // Initialize chunk duration estimates (approx. 14 characters per second or 3 sec minimum)
  const initialDurations = chunks.map(c => Math.max(2.5, c.length / 14));

  // iOS / Safari Audio unlock on user gesture
  const unlockedAudio = new Audio();
  unlockedAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  const silentPromise = unlockedAudio.play();
  if (silentPromise !== undefined) {
    silentPromise.catch(() => {});
  }
  currentAudio = unlockedAudio;

  const session: ActiveSession = {
    playbackId: thisPlaybackId,
    rawText: text,
    personaName,
    gender: genderToUse,
    isBrowserFallback: voiceInfo.scholarsVoicesEnabled === false,
    chunks,
    chunkDurations: initialDurations,
    chunkPromises: new Map(),
    currentChunkIndex: 0,
    isPaused: false,
    isPlaying: true,
    unlockedAudio,
    options
  };

  // Setup periodic progress update ticker
  session.progressInterval = setInterval(() => {
    if (activeSession && activeSession.playbackId === thisPlaybackId && activeSession.isPlaying && !activeSession.isPaused) {
      notifySubscribers(getCurrentProgressState());
    }
  }, 250);

  activeSession = session;
  options?.onStart?.();

  // If user disabled Scholar Voices in settings, use browser synthesis fallback
  if (session.isBrowserFallback) {
    speakWithBrowserFallback(text, personaName, genderToUse, options);
    return;
  }

  // Pre-fetch ONLY the initial chunk to play immediately
  fetchSessionChunk(session, 0);

  playScholarChunk(0, 0);
}

/**
 * Returns the high-fidelity sample audio URL for a given scholar persona
 */
export function getScholarSampleUrl(personaName: string, gender: 'male' | 'female'): string {
  const p = (personaName || '').toLowerCase();
  if (gender === 'male') {
    if (p.includes('osteen')) return '/audio/voices/joel_osteen.mp3';
    if (p.includes('spurgeon')) return '/audio/voices/charles_spurgeon.mp3';
    if (p.includes('lewis')) return '/audio/voices/cs_lewis.mp3';
    if (p.includes('luther')) return '/audio/voices/martin_luther.mp3';
    if (p.includes('keller')) return '/audio/voices/tim_keller.mp3';
    if (p.includes('graham')) return '/audio/voices/billy_graham.mp3';
    return '/audio/voices/custom_male.mp3';
  } else {
    if (p.includes('oprah') || p.includes('winfrey')) return '/audio/voices/oprah_winfrey.mp3';
    if (p.includes('moore')) return '/audio/voices/beth_moore.mp3';
    if (p.includes('meyer')) return '/audio/voices/joyce_meyer.mp3';
    if (p.includes('shirer')) return '/audio/voices/priscilla_shirer.mp3';
    if (p.includes('arthur')) return '/audio/voices/kay_arthur.mp3';
    if (p.includes('ten boom') || p.includes('corrie')) return '/audio/voices/corrie_ten_boom.mp3';
    return '/audio/voices/custom_female.mp3';
  }
}

/**
 * Directly plays the studio audition audio file for any scholar persona
 */
export function playScholarVoiceSample(
  personaName: string,
  gender: 'male' | 'female',
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: any) => void;
  }
) {
  stopScholarSpeech();
  const url = getScholarSampleUrl(personaName, gender);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onplay = () => {
    options?.onStart?.();
  };

  audio.onended = () => {
    currentAudio = null;
    options?.onEnd?.();
  };

  audio.onerror = (e) => {
    console.warn(`Audio sample error for ${personaName}:`, e);
    currentAudio = null;
    options?.onError?.(e);
  };

  audio.play().catch((err) => {
    console.warn(`Could not autoplay sample for ${personaName}:`, err);
    options?.onError?.(err);
  });
}
