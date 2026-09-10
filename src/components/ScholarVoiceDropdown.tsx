import { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Mic, 
  X, 
  Play, 
  Square, 
  UserCheck, 
  Edit3, 
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { 
  MALE_VOICE_PRESETS, 
  FEMALE_VOICE_PRESETS, 
  getCurrentScholarVoice, 
  persistScholarVoice,
  ScholarVoicePreset 
} from '../lib/scholarVoices';
import { speakWithScholarVoice, stopScholarSpeech } from '../lib/ttsHelper';

interface ScholarVoiceDropdownProps {
  userProfile: UserProfile | null;
  onVoiceChange?: (updatedProfile: UserProfile, newVoiceName: string, gender: 'male' | 'female') => void;
  // Trigger button styling options
  buttonClassName?: string;
  variant?: 'toolbar' | 'card' | 'banner';
  labelPrefix?: string;
}

export default function ScholarVoiceDropdown({
  userProfile,
  onVoiceChange,
  buttonClassName = '',
  variant = 'toolbar',
  labelPrefix = 'Scholar Voice'
}: ScholarVoiceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customGender, setCustomGender] = useState<'male' | 'female'>('male');
  const [auditioningVoice, setAuditioningVoice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeVoice = getCurrentScholarVoice(userProfile);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (auditioningVoice) {
          stopScholarSpeech();
          setAuditioningVoice(null);
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, auditioningVoice]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (auditioningVoice) {
        stopScholarSpeech();
      }
    };
  }, [auditioningVoice]);

  const handleSelectVoice = async (preset: ScholarVoicePreset) => {
    if (auditioningVoice) {
      stopScholarSpeech();
      setAuditioningVoice(null);
    }

    const updated = await persistScholarVoice(preset.name, preset.gender, userProfile);
    setIsOpen(false);
    onVoiceChange?.(updated, preset.name, preset.gender);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const trimmed = customInput.trim();
    const updated = await persistScholarVoice(trimmed, customGender, userProfile);
    setShowCustomModal(false);
    setIsOpen(false);
    setCustomInput('');
    onVoiceChange?.(updated, trimmed, customGender);
  };

  const handleAudition = (e: React.MouseEvent, voiceName: string, gender: 'male' | 'female') => {
    e.stopPropagation();

    if (auditioningVoice === voiceName) {
      stopScholarSpeech();
      setAuditioningVoice(null);
      return;
    }

    stopScholarSpeech();
    setAuditioningVoice(voiceName);

    const auditionText = `Greetings, pilgrim. I am your Sanctuary Scholar voice, modeled in the spirit of ${voiceName}. May peace, wisdom, and truth guide your seeking.`;

    speakWithScholarVoice(auditionText, {
      gender,
      voiceName,
      profile: {
        ...(userProfile || { uid: '', email: '', displayName: '', photoURL: '' }),
        maleScholarVoice: gender === 'male' ? voiceName : (userProfile?.maleScholarVoice || 'Joel Osteen'),
        femaleScholarVoice: gender === 'female' ? voiceName : (userProfile?.femaleScholarVoice || 'Oprah Winfrey'),
        activeScholarGender: gender,
        scholarsVoicesEnabled: true
      },
      onStart: () => setAuditioningVoice(voiceName),
      onEnd: () => setAuditioningVoice(null),
      onError: () => setAuditioningVoice(null)
    });
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button based on variant */}
      {variant === 'toolbar' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
            isOpen 
              ? 'bg-accent text-bg-primary border-accent' 
              : 'bg-ui-sidebar hover:bg-accent/15 text-text-primary border-ui-border hover:border-accent/40'
          } ${buttonClassName}`}
          title="Change Scholar Voice"
        >
          <Mic className={`w-3.5 h-3.5 ${isOpen ? 'text-bg-primary' : 'text-accent'}`} />
          <span className="font-sans tracking-wide">
            {labelPrefix}: <strong className="font-bold">{activeVoice.name}</strong>
          </span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md uppercase font-mono tracking-wider ${
            activeVoice.gender === 'female' 
              ? (isOpen ? 'bg-bg-primary/20 text-bg-primary' : 'bg-purple-500/10 text-purple-500') 
              : (isOpen ? 'bg-bg-primary/20 text-bg-primary' : 'bg-blue-500/10 text-blue-500')
          }`}>
            {activeVoice.gender}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {variant === 'card' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`py-2 px-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer ${
            isOpen
              ? 'bg-accent text-bg-primary border-accent shadow-sm'
              : 'bg-ui-sidebar hover:bg-accent/15 text-text-primary border-ui-border hover:border-accent/40'
          } ${buttonClassName}`}
          title="Change Scholar Voice for this Session"
        >
          <Mic className="w-3.5 h-3.5 text-accent" />
          <span className="truncate max-w-[110px]">{activeVoice.name}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {variant === 'banner' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-sans font-bold transition-all border shadow-sm cursor-pointer ${
            isOpen
              ? 'bg-accent text-bg-primary border-accent ring-2 ring-accent/30'
              : 'bg-ui-card hover:bg-accent/10 text-text-primary border-ui-border hover:border-accent/50'
          } ${buttonClassName}`}
        >
          <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">Sanctuary Voice</div>
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <span>{activeVoice.name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
                activeVoice.gender === 'female' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'
              }`}>
                {activeVoice.gender}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 ml-1 text-accent transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* DROPDOWN MENU - BRING TO THE FRONT (z-[200]) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent backdrop overlay to ensure it sits on top and catches clicks */}
            <div 
              className="fixed inset-0 z-[190] bg-black/10 backdrop-blur-[1px] md:hidden"
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[340px] sm:w-[380px] max-w-[92vw] bg-ui-card border-2 border-accent/40 rounded-3xl shadow-2xl z-[200] overflow-hidden text-left backdrop-blur-xl"
              style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              {/* Dropdown Header */}
              <div className="p-4 bg-ui-sidebar border-b border-ui-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Sanctuary Scholar Voices
                    </h4>
                    <p className="text-[10px] text-text-secondary italic">
                      Select an AI Scholar voice for audio exegesis
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-ui-card transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Voices Body */}
              <div className="p-3 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                {/* Male Scholar Personas */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1 mb-1.5">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Male Scholar Personas
                    </span>
                    <span className="text-[9px] text-text-secondary font-mono">6 PRESETS</span>
                  </div>

                  <div className="space-y-1.5">
                    {MALE_VOICE_PRESETS.map((preset) => {
                      const isSelected = activeVoice.name.toLowerCase() === preset.name.toLowerCase() && activeVoice.gender === 'male';
                      const isAuditioning = auditioningVoice === preset.name;

                      return (
                        <div
                          key={preset.name}
                          onClick={() => handleSelectVoice(preset)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-accent shadow-sm'
                              : 'bg-ui-sidebar/50 border-ui-border hover:border-accent/40 hover:bg-accent/5'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                                {preset.name}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-accent text-bg-primary font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-text-secondary italic font-serif truncate mt-0.5">
                              {preset.style}
                            </p>
                          </div>

                          {/* Audition Button */}
                          <button
                            type="button"
                            onClick={(e) => handleAudition(e, preset.name, 'male')}
                            className={`p-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                              isAuditioning
                                ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse'
                                : 'bg-ui-card border-ui-border text-text-secondary hover:border-accent hover:text-accent'
                            }`}
                            title={isAuditioning ? "Stop Sample Audition" : "Listen to Sample Audition"}
                          >
                            {isAuditioning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Female Scholar Personas */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1 mb-1.5">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-purple-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Female Scholar Personas
                    </span>
                    <span className="text-[9px] text-text-secondary font-mono">6 PRESETS</span>
                  </div>

                  <div className="space-y-1.5">
                    {FEMALE_VOICE_PRESETS.map((preset) => {
                      const isSelected = activeVoice.name.toLowerCase() === preset.name.toLowerCase() && activeVoice.gender === 'female';
                      const isAuditioning = auditioningVoice === preset.name;

                      return (
                        <div
                          key={preset.name}
                          onClick={() => handleSelectVoice(preset)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-accent shadow-sm'
                              : 'bg-ui-sidebar/50 border-ui-border hover:border-accent/40 hover:bg-accent/5'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                                {preset.name}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-accent text-bg-primary font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-text-secondary italic font-serif truncate mt-0.5">
                              {preset.style}
                            </p>
                          </div>

                          {/* Audition Button */}
                          <button
                            type="button"
                            onClick={(e) => handleAudition(e, preset.name, 'female')}
                            className={`p-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                              isAuditioning
                                ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse'
                                : 'bg-ui-card border-ui-border text-text-secondary hover:border-accent hover:text-accent'
                            }`}
                            title={isAuditioning ? "Stop Sample Audition" : "Listen to Sample Audition"}
                          >
                            {isAuditioning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Scholar Voice */}
                <div className="pt-2 border-t border-ui-border/60">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="w-full p-2.5 bg-ui-sidebar/70 hover:bg-accent/10 border border-dashed border-ui-border hover:border-accent/50 rounded-2xl text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-accent" />
                    <span>Enter Custom Preacher or Scholar Voice...</span>
                  </button>
                </div>
              </div>

              {/* Footer info note */}
              <div className="px-4 py-2.5 bg-ui-sidebar/80 border-t border-ui-border text-[10px] text-text-secondary flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1 font-serif italic">
                  <Sparkles className="w-3 h-3 text-accent" /> Custom Gemini 3.1 Flash Audio
                </span>
                <span className="font-mono text-accent font-bold">Sanctuary Scholar</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CUSTOM SCHOLAR MODAL (Brought to the Front at z-[300]) */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-[300] bg-text-primary/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-ui-card w-full max-w-md rounded-3xl border-2 border-accent/40 shadow-2xl p-6 text-left relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-bold">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-text-primary text-base">Custom Scholar Persona</h3>
                    <p className="text-[10px] text-text-secondary">Name any biblical scholar or preacher to guide the voice model</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="p-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Scholar Gender Voice Model
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomGender('male')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        customGender === 'male'
                          ? 'bg-blue-500/10 border-blue-500 text-blue-600 font-bold'
                          : 'bg-ui-sidebar border-ui-border text-text-secondary'
                      }`}
                    >
                      Male Scholar Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomGender('female')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        customGender === 'female'
                          ? 'bg-purple-500/10 border-purple-500 text-purple-600 font-bold'
                          : 'bg-ui-sidebar border-ui-border text-text-secondary'
                      }`}
                    >
                      Female Scholar Voice
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Scholar or Preacher Name
                  </label>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="e.g. John Piper, A.W. Tozer, Lysa TerKeurst..."
                    className="w-full bg-ui-sidebar border border-ui-border rounded-xl px-4 py-2.5 text-xs font-serif text-text-primary focus:outline-none focus:border-accent"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 bg-ui-sidebar text-text-secondary rounded-xl text-xs font-bold hover:text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customInput.trim()}
                    className="px-5 py-2 bg-accent text-bg-primary rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    Set Voice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
