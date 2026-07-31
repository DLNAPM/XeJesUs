import { UserProfile } from '../types';
import { generateScholarTTS } from '../services/geminiService';

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let activePlaybackId = 0;

export function getBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function stopScholarSpeech() {
  activePlaybackId++;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
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
}

export function pauseScholarSpeech() {
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
}

export function resumeScholarSpeech() {
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

function splitTextIntoChunks(text: string, maxChunkLength = 280): string[] {
  const clean = text
    .replace(/\*+/g, '')
    .replace(/#+/g, '')
    .replace(/`+/g, '')
    .replace(/_+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return [];

  if (clean.length <= maxChunkLength) {
    return [clean];
  }

  // Split by sentence boundary
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+/g) || [clean];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
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
    options?.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error(`Browser speech synthesis error (${personaName}):`, e);
    currentUtterance = null;
    options?.onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function speakWithScholarVoice(
  text: string,
  options?: {
    gender?: 'male' | 'female' | 'auto';
    profile?: UserProfile | null;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  stopScholarSpeech();

  if (!text || !text.trim()) return;

  const thisPlaybackId = activePlaybackId;

  const profile = options?.profile;
  const activeGender = options?.gender || profile?.activeScholarGender || 'male';
  
  const genderToUse: 'male' | 'female' = activeGender === 'female' ? 'female' : 'male';

  const maleVoiceName = profile?.maleScholarVoice || 'Joel Osteen';
  const femaleVoiceName = profile?.femaleScholarVoice || 'Oprah Winfrey';
  const personaName = genderToUse === 'male' ? maleVoiceName : femaleVoiceName;

  const chunks = splitTextIntoChunks(text, 280);
  if (chunks.length === 0) return;

  let currentChunkIndex = 0;
  let hasCalledStart = false;

  // Pre-fetch cache for next chunk audio
  let prefetchedNextAudio: { wavBlob: Blob; audioUrl: string } | null = null;
  let prefetchingIndex = -1;

  async function prefetchChunk(index: number) {
    if (index >= chunks.length || prefetchingIndex === index) return;
    prefetchingIndex = index;
    try {
      const pcmBase64 = await generateScholarTTS(chunks[index], personaName, genderToUse);
      if (activePlaybackId !== thisPlaybackId) return;
      const wavBlob = pcmToWav(pcmBase64, 24000);
      const audioUrl = URL.createObjectURL(wavBlob);
      prefetchedNextAudio = { wavBlob, audioUrl };
    } catch (e) {
      console.warn("Prefetch chunk error:", e);
    }
  }

  async function playNextChunk() {
    if (activePlaybackId !== thisPlaybackId) return;

    if (currentChunkIndex >= chunks.length) {
      options?.onEnd?.();
      return;
    }

    const chunkText = chunks[currentChunkIndex];

    try {
      let wavBlob: Blob;
      let audioUrl: string;

      if (prefetchedNextAudio && prefetchingIndex === currentChunkIndex) {
        wavBlob = prefetchedNextAudio.wavBlob;
        audioUrl = prefetchedNextAudio.audioUrl;
        prefetchedNextAudio = null;
      } else {
        const pcmBase64 = await generateScholarTTS(chunkText, personaName, genderToUse);
        if (activePlaybackId !== thisPlaybackId) return;
        wavBlob = pcmToWav(pcmBase64, 24000);
        audioUrl = URL.createObjectURL(wavBlob);
      }

      if (activePlaybackId !== thisPlaybackId) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        return;
      }

      const audio = new Audio(audioUrl);
      currentAudio = audio;

      if (!hasCalledStart) {
        hasCalledStart = true;
        options?.onStart?.();
      }

      // Start prefetching the NEXT chunk immediately while current chunk plays!
      prefetchChunk(currentChunkIndex + 1);

      audio.onended = () => {
        if (activePlaybackId !== thisPlaybackId) return;
        currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        currentChunkIndex++;
        playNextChunk();
      };

      audio.onerror = (e) => {
        console.warn(`Audio playback error on chunk ${currentChunkIndex}, falling back to browser TTS:`, e);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        const remainingText = chunks.slice(currentChunkIndex).join(" ");
        speakWithBrowserFallback(remainingText, personaName, genderToUse, options);
      };

      await audio.play();

    } catch (err) {
      console.warn(`Gemini TTS API error on chunk ${currentChunkIndex}, using browser fallback:`, err);
      if (activePlaybackId !== thisPlaybackId) return;
      const remainingText = chunks.slice(currentChunkIndex).join(" ");
      speakWithBrowserFallback(remainingText, personaName, genderToUse, options);
    }
  }

  playNextChunk();
}

