import { UserProfile } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function getBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function stopScholarSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
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
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert("Audible speech synthesis is not supported in this browser environment.");
    return;
  }

  stopScholarSpeech();

  if (!text || !text.trim()) return;

  const profile = options?.profile;
  const activeGender = options?.gender || profile?.activeScholarGender || 'male';
  
  // Determine effective gender (if 'auto', default to male unless text indicates female speaker)
  const genderToUse: 'male' | 'female' = activeGender === 'female' ? 'female' : 'male';

  const maleVoiceName = profile?.maleScholarVoice || 'Joel Osteen';
  const femaleVoiceName = profile?.femaleScholarVoice || 'Oprah Winfrey';
  const personaName = genderToUse === 'male' ? maleVoiceName : femaleVoiceName;

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  const voices = window.speechSynthesis.getVoices();
  
  if (genderToUse === 'male') {
    utterance.pitch = 0.90;
    utterance.rate = 0.95;

    // Try finding a male voice in browser
    const maleVoice = voices.find(v => 
      /male|david|george|james|daniel|alex|google us english/i.test(v.name) ||
      /male|david|george|james|daniel/i.test(v.lang)
    );
    if (maleVoice) {
      utterance.voice = maleVoice;
    }
  } else {
    utterance.pitch = 1.12;
    utterance.rate = 0.95;

    // Try finding a female voice in browser
    const femaleVoice = voices.find(v => 
      /female|zira|samantha|karen|victoria|fiona|google us english female/i.test(v.name) ||
      /female|zira|samantha|karen/i.test(v.lang)
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
  }

  utterance.onstart = () => {
    if (options?.onStart) options.onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (options?.onEnd) options.onEnd();
  };

  utterance.onerror = (e) => {
    console.error(`Speech synthesis error (${personaName}):`, e);
    currentUtterance = null;
    if (options?.onError) options.onError(e);
  };

  window.speechSynthesis.speak(utterance);
}
