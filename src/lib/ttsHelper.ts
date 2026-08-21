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
    profile?: UserProfile | null;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onProgress?: (state: ScholarSpeechState) => void;
  };
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

function splitTextIntoChunks(text: string, firstChunkMax = 120, standardMax = 220): string[] {
  const clean = text
    .replace(/\*+/g, '')
    .replace(/#+/g, '')
    .replace(/`+/g, '')
    .replace(/_+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return [];

  const sentences = clean.match(/[^.!?\n]+[.!?\n]+/g) || [clean];
  const chunks: string[] = [];
  let currentChunk = "";
  let maxLen = firstChunkMax;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLen && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      maxLen = standardMax;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
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

  const voices = window.speechSynthesis.getVoices();
  const lowerName = personaName.toLowerCase();

  // Distinct pitch & rate profiles for each scholar persona in browser fallback
  if (gender === 'male') {
    if (lowerName.includes('osteen')) {
      utterance.pitch = 1.08;
      utterance.rate = 1.02;
    } else if (lowerName.includes('spurgeon')) {
      utterance.pitch = 0.72;
      utterance.rate = 0.88;
    } else if (lowerName.includes('lewis')) {
      utterance.pitch = 0.85;
      utterance.rate = 0.92;
    } else if (lowerName.includes('luther')) {
      utterance.pitch = 0.68;
      utterance.rate = 0.95;
    } else if (lowerName.includes('keller')) {
      utterance.pitch = 0.88;
      utterance.rate = 0.95;
    } else if (lowerName.includes('graham')) {
      utterance.pitch = 0.80;
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
    }

    const maleVoice = voices.find(v => 
      /male|david|george|james|daniel|alex|google us english|en-us/i.test(v.name)
    );
    if (maleVoice) utterance.voice = maleVoice;
  } else {
    if (lowerName.includes('oprah') || lowerName.includes('winfrey')) {
      utterance.pitch = 0.92;
      utterance.rate = 0.92;
    } else if (lowerName.includes('moore')) {
      utterance.pitch = 1.18;
      utterance.rate = 1.05;
    } else if (lowerName.includes('meyer')) {
      utterance.pitch = 1.10;
      utterance.rate = 1.02;
    } else if (lowerName.includes('shirer')) {
      utterance.pitch = 1.12;
      utterance.rate = 1.0;
    } else if (lowerName.includes('arthur')) {
      utterance.pitch = 1.0;
      utterance.rate = 0.88;
    } else if (lowerName.includes('ten boom') || lowerName.includes('corrie')) {
      utterance.pitch = 1.02;
      utterance.rate = 0.85;
    } else {
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
    }

    const femaleVoice = voices.find(v => 
      /female|zira|samantha|karen|victoria|fiona|google us english female/i.test(v.name)
    );
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
    const promise = (async () => {
      try {
        const pcmBase64 = await generateScholarTTS(session.chunks[index], session.personaName, session.gender);
        if (activePlaybackId !== thisPlaybackId) return null;
        const wavBlob = pcmToWav(pcmBase64, 24000);
        const duration = Math.max(0.5, (wavBlob.size - 44) / 48000);
        const audioUrl = URL.createObjectURL(wavBlob);
        session.chunkDurations[index] = duration;
        return { wavBlob, audioUrl, duration };
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

  // Pre-fetch next 2 chunks in parallel
  fetchSessionChunk(session, index + 1);
  fetchSessionChunk(session, index + 2);

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
      if (chunkData?.audioUrl) URL.revokeObjectURL(chunkData.audioUrl);
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
    profile?: UserProfile | null;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onProgress?: (state: ScholarSpeechState) => void;
  }
) {
  stopScholarSpeech();

  if (!text || !text.trim()) return;

  const profile = options?.profile;
  const activeGender = options?.gender || profile?.activeScholarGender || 'male';
  const genderToUse: 'male' | 'female' = activeGender === 'female' ? 'female' : 'male';

  const maleVoiceName = profile?.maleScholarVoice || 'Joel Osteen';
  const femaleVoiceName = profile?.femaleScholarVoice || 'Oprah Winfrey';
  const personaName = genderToUse === 'male' ? maleVoiceName : femaleVoiceName;

  const chunks = splitTextIntoChunks(text, 100, 200);
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
    isBrowserFallback: profile?.scholarsVoicesEnabled === false,
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

  // Pre-fetch initial chunks immediately
  fetchSessionChunk(session, 0);
  fetchSessionChunk(session, 1);
  fetchSessionChunk(session, 2);

  playScholarChunk(0, 0);
}
