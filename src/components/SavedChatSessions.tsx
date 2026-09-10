import { useState, useEffect, useRef } from 'react';
import { getAuthService, getDbService, collection, query, where, getDocs, deleteDoc, doc, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatSession, UserProfile, LiteraryWorkExport } from '../types';
import { generateLiteraryWorkExport, getThematicImagesForTopic } from '../services/geminiService';
import { 
  speakWithScholarVoice, 
  stopScholarSpeech, 
  pauseScholarSpeech, 
  resumeScholarSpeech, 
  rewindScholarSpeech, 
  fastForwardScholarSpeech, 
  seekScholarSpeech, 
  subscribeScholarSpeechProgress, 
  ScholarSpeechState 
} from '../lib/ttsHelper';
import { 
  History, 
  FileText, 
  Download, 
  Printer, 
  Trash2, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Sparkles, 
  Search, 
  Loader2, 
  Calendar, 
  BookOpen, 
  ExternalLink, 
  Youtube, 
  GitBranch, 
  Image as ImageIcon, 
  X,
  Play,
  Pause,
  Square,
  Crown,
  ChevronRight,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PremiumOverlay from './PremiumOverlay';
import { exportElementToPdf } from '../utils/pdfExporter';

interface SavedChatSessionsProps {
  userProfile: UserProfile | null;
  onSelectSession?: (session: ChatSession) => void;
}

export default function SavedChatSessions({ userProfile, onSelectSession }: SavedChatSessionsProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Audio Speech States
  const [speakingSessionId, setSpeakingSessionId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [speechState, setSpeechState] = useState<ScholarSpeechState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    percent: 0,
    text: '',
    currentChunkIndex: 0,
    totalChunks: 0
  });

  // Literary Work Export States
  const [selectedSessionForExport, setSelectedSessionForExport] = useState<ChatSession | null>(null);
  const [literaryWork, setLiteraryWork] = useState<LiteraryWorkExport | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Premium Modal
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  const isPremium = userProfile?.tier === 'premium' || userProfile?.role === 'admin';

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeScholarSpeechProgress((state) => {
      setSpeechState(state);
      setIsPaused(state.isPaused);
      if (!state.isPlaying && !state.isPaused) {
        // Stopped or completed
        setSpeakingSessionId((prev) => (state.percent >= 99 || (!state.isPlaying && !state.isPaused) ? null : prev));
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchSessions = async () => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) {
      setLoading(false);
      return;
    }

    try {
      const fetchedSessions: ChatSession[] = [];

      // 1. Fetch from user subcollection users/{uid}/chat_sessions
      try {
        const qSub = query(collection(db, 'users', auth.currentUser.uid, 'chat_sessions'));
        const snapSub = await getDocs(qSub);
        const subSessions = snapSub.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
        fetchedSessions.push(...subSessions);
      } catch (errSub) {
        console.warn("Could not fetch user subcollection chat sessions:", errSub);
      }

      // 2. Fetch from root collection chat_sessions
      try {
        const qRoot = query(
          collection(db, 'chat_sessions'),
          where('userId', '==', auth.currentUser.uid)
        );
        const snapRoot = await getDocs(qRoot);
        const rootSessions = snapRoot.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
        
        // Merge unique ones
        const existingIds = new Set(fetchedSessions.map(s => s.id));
        for (const r of rootSessions) {
          if (!existingIds.has(r.id)) {
            fetchedSessions.push(r);
          }
        }
      } catch (errRoot) {
        console.warn("Could not fetch root collection chat sessions:", errRoot);
      }
      
      // Sort newest first
      fetchedSessions.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime() || 0;
        };
        return getMs(b.createdAt) - getMs(a.createdAt);
      });

      setSessions(fetchedSessions);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'chat_sessions');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    const auth = getAuthService();
    const db = getDbService();
    if (!db || !auth || !auth.currentUser) return;
    try {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'chat_sessions', sessionId));
      } catch (_) {}
      try {
        await deleteDoc(doc(db, 'chat_sessions', sessionId));
      } catch (_) {}
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'chat_sessions');
    }
  };

  // Text-To-Speech Functions
  const stopSpeech = () => {
    stopScholarSpeech();
    setSpeakingSessionId(null);
    setIsPaused(false);
  };

  const speakSession = (session: ChatSession) => {
    if (speakingSessionId === session.id) {
      if (isPaused) {
        resumeScholarSpeech();
        setIsPaused(false);
      } else {
        pauseScholarSpeech();
        setIsPaused(true);
      }
      return;
    }

    stopSpeech();

    const fullScript = [
      `Saved session titled ${session.name}.`,
      ...session.messages.map(m => `${m.role === 'model' ? 'Sanctuary Scholar says: ' : 'Pilgrim asked: '} ${m.text}`)
    ].join('. ');

    if (!fullScript.trim()) return;

    speakWithScholarVoice(fullScript, {
      profile: userProfile,
      onStart: () => {
        setSpeakingSessionId(session.id || null);
        setIsPaused(false);
      },
      onEnd: () => {
        setSpeakingSessionId(null);
        setIsPaused(false);
      },
      onError: () => {
        setSpeakingSessionId(null);
        setIsPaused(false);
      }
    });
  };

  // Trigger Literary Work PDF Export
  const handleExportLiteraryWork = async (session: ChatSession) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setSelectedSessionForExport(session);
    setIsSynthesizing(true);
    setLiteraryWork(null);

    try {
      const data = await generateLiteraryWorkExport(session.name, session.messages);
      setLiteraryWork(data);
    } catch (err) {
      console.error("Error synthesizing literary work:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const downloadPdf = async () => {
    if (!pdfRef.current || !selectedSessionForExport) return;
    setIsGeneratingPdf(true);

    try {
      const cleanFileName = selectedSessionForExport.name.replace(/[^a-zA-Z0-9]/g, '_');
      await exportElementToPdf(pdfRef.current, `XeJesUs-Literary-Work-${cleanFileName}`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent mb-2">
            <History className="w-5 h-5" />
            <span className="font-sans font-bold text-xs uppercase tracking-[0.3em]">Sanctuary Archives</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-text-primary italic font-bold">Saved Chat Sessions</h1>
          <p className="text-text-secondary italic text-sm mt-1">
            Revisit your dialogue with the Sanctuary Scholar or export any session into a published Professional Literary Work PDF.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved sessions..."
            className="w-full bg-ui-card border border-ui-border rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-accent transition-all"
          />
        </div>
      </header>

      {/* Audio Player Toolbar (if active) */}
      {speakingSessionId && (
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 bg-ui-card border-2 border-accent/40 rounded-3xl shadow-xl mb-8 backdrop-blur-md relative overflow-hidden"
        >
          {/* Accent top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/80 to-accent" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30 shadow-inner">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sanctuary Audio Playback
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    • {userProfile?.activeScholarGender === 'female' ? (userProfile?.femaleScholarVoice || 'Female Scholar') : (userProfile?.maleScholarVoice || 'Male Scholar')}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-text-primary text-base truncate">
                  {sessions.find(s => s.id === speakingSessionId)?.name || 'Saved Session'}
                </h4>
              </div>
            </div>

            {/* Center/Right: Controls (Rewind 10s, Play/Pause, Fast-Forward 10s, Stop) */}
            <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap sm:flex-nowrap">
              {/* 10s Rewind Button */}
              <button 
                type="button"
                onClick={() => rewindScholarSpeech(10)}
                className="px-3 py-2 bg-ui-sidebar hover:bg-accent/20 active:scale-95 text-text-primary hover:text-accent border border-ui-border rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4 text-accent" />
                <span className="font-sans font-bold text-[11px] tracking-tight">10s</span>
              </button>

              {/* Play / Pause Button */}
              <button 
                type="button"
                onClick={() => {
                  if (isPaused) {
                    resumeScholarSpeech();
                    setIsPaused(false);
                  } else {
                    pauseScholarSpeech();
                    setIsPaused(true);
                  }
                }}
                className="px-4 py-2 bg-accent text-bg-primary rounded-xl font-bold text-xs uppercase flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
                title={isPaused ? "Resume Playback" : "Pause Playback"}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              {/* 10s Fast-Forward Button */}
              <button 
                type="button"
                onClick={() => fastForwardScholarSpeech(10)}
                className="px-3 py-2 bg-ui-sidebar hover:bg-accent/20 active:scale-95 text-text-primary hover:text-accent border border-ui-border rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Fast-forward 10 seconds"
              >
                <span className="font-sans font-bold text-[11px] tracking-tight">10s</span>
                <RotateCw className="w-4 h-4 text-accent" />
              </button>

              {/* Stop Button */}
              <button 
                type="button"
                onClick={stopSpeech}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all active:scale-95 border border-red-500/20 cursor-pointer"
                title="Stop Audio Playback"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Timeline Scrubber & Time */}
          <div className="mt-4 pt-3 border-t border-ui-border/60 flex items-center gap-3">
            <span className="text-[11px] font-mono font-medium text-text-secondary w-10 text-right shrink-0">
              {formatAudioTime(speechState.currentTime)}
            </span>

            {/* Clickable Progress Slider / Scrubber */}
            <div 
              className="flex-1 h-2.5 bg-ui-sidebar hover:h-3 rounded-full overflow-hidden cursor-pointer relative transition-all border border-ui-border"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const targetTime = ratio * (speechState.duration || 1);
                seekScholarSpeech(targetTime);
              }}
              title="Click or drag to jump to any part of the session"
            >
              <div 
                className="h-full bg-accent transition-[width] duration-150 rounded-full relative"
                style={{ width: `${Math.min(100, Math.max(0, speechState.percent))}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-bg-primary rounded-full shadow-sm" />
              </div>
            </div>

            <span className="text-[11px] font-mono font-medium text-text-secondary w-10 shrink-0">
              {formatAudioTime(speechState.duration)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Sessions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-ui-card animate-pulse rounded-3xl border border-ui-border" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-ui-card border border-ui-border rounded-[2.5rem] p-12 text-center text-text-secondary">
          <History className="w-12 h-12 mx-auto mb-4 opacity-20 text-accent" />
          <h3 className="text-xl font-serif italic text-text-primary mb-1">No Saved Sessions Found</h3>
          <p className="text-xs font-serif italic max-w-sm mx-auto">
            {searchQuery ? "No chat sessions matched your search terms." : "You haven't saved any chat sessions yet. Interact with the Sanctuary Scholar and click 'Save Session' to archive your dialogues here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map((session) => (
            <div 
              key={session.id}
              className={`bg-ui-card border rounded-[2rem] p-6 shadow-sm flex flex-col justify-between transition-all group ${
                speakingSessionId === session.id ? 'border-accent ring-2 ring-accent/20 bg-accent/5' : 'border-ui-border hover:border-accent/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-text-primary text-base leading-snug line-clamp-1">{session.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-accent" />
                          {session.messages.length} exchanges
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-accent" />
                          {(() => {
                            try {
                              const parseTime = (val: any) => {
                                if (!val) return null;
                                if (typeof val.toDate === 'function') return val.toDate();
                                if (val.seconds !== undefined) return new Date(val.seconds * 1000);
                                const d = new Date(val);
                                return isNaN(d.getTime()) ? null : d;
                              };
                              const d = parseTime(session.updatedAt) || parseTime(session.createdAt) || new Date();
                              return d.toLocaleDateString();
                            } catch (err) {
                              return new Date().toLocaleDateString();
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (window.confirm("Remove this session's records from the sanctuary?")) {
                        if (speakingSessionId === session.id) stopSpeech();
                        deleteSession(session.id!);
                      }
                    }}
                    className="p-1.5 text-text-secondary/40 hover:text-red-500 transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Excerpt */}
                <p className="text-xs text-text-secondary italic line-clamp-2 font-serif bg-ui-sidebar/50 p-3 rounded-xl border border-ui-border/50 mb-4">
                  "{session.messages[session.messages.length - 1]?.text || 'No messages'}"
                </p>
              </div>

              {/* Action Ribbon */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-ui-border">
                {/* Resume Session Button */}
                {onSelectSession && (
                  <button 
                    onClick={() => onSelectSession(session)}
                    className="flex-1 py-2 px-3 bg-ui-sidebar hover:bg-accent hover:text-bg-primary text-text-primary rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open Chat
                  </button>
                )}

                {/* Read Audibly Button */}
                <button 
                  onClick={() => speakSession(session)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    speakingSessionId === session.id 
                      ? 'bg-accent text-bg-primary shadow-sm' 
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                  }`}
                  title={speakingSessionId === session.id ? (isPaused ? "Resume Reading" : "Pause / Stop Reading") : "Read Session Audibly"}
                >
                  {speakingSessionId === session.id ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                      <span>{isPaused ? 'Paused' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>

                {/* Export as Literary Work PDF Button */}
                <button 
                  onClick={() => handleExportLiteraryWork(session)}
                  className="py-2 px-3 bg-text-primary text-bg-primary hover:opacity-90 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  title="Export Session as Professional Literary Work (PDF)"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Literary Work PDF Preview Modal */}
      <AnimatePresence>
        {selectedSessionForExport && (
          <div className="fixed inset-0 z-[150] bg-text-primary/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-primary w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-ui-border shadow-2xl flex flex-col overflow-hidden relative"
            >
              {/* Modal Top Toolbar */}
              <div className="p-6 bg-ui-card border-b border-ui-border flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent text-bg-primary flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-text-primary text-lg">Professional Literary Work</h3>
                    <p className="text-xs text-text-secondary font-sans uppercase tracking-wider">
                      {selectedSessionForExport.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {literaryWork && (
                    <>
                      <button 
                        onClick={downloadPdf}
                        disabled={isGeneratingPdf}
                        className="px-4 py-2.5 bg-accent text-bg-primary rounded-xl text-xs font-bold font-sans uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                      >
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Save PDF
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="px-4 py-2.5 bg-ui-sidebar border border-ui-border text-text-primary rounded-xl text-xs font-bold font-sans uppercase tracking-widest flex items-center gap-2 hover:bg-ui-border transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedSessionForExport(null);
                      setLiteraryWork(null);
                    }}
                    className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-ui-sidebar transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 bg-ui-sidebar/20">
                {isSynthesizing ? (
                  <div className="py-24 text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
                    <h4 className="text-xl font-serif italic text-text-primary font-bold">Synthesizing Literary Work & Historical Archives...</h4>
                    <p className="text-xs font-sans text-text-secondary uppercase tracking-widest max-w-md mx-auto">
                      Compiling biblical family trees, scholarly literature examples, imagery, and curated educational video archives.
                    </p>
                  </div>
                ) : literaryWork ? (
                  <div 
                    ref={pdfRef}
                    className="bg-white p-8 md:p-14 rounded-[2rem] shadow-xl border border-ui-border text-[#0f172a] font-serif space-y-10 relative overflow-hidden"
                  >
                    {/* Header Seal */}
                    <header className="pb-8 border-b-2 border-accent/20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-[#3b82f6]">
                          <div className="w-7 h-7 rounded-lg bg-[#3b82f6] text-white font-bold flex items-center justify-center text-xs">XJ</div>
                          <span className="font-sans font-black uppercase tracking-[0.3em] text-[11px]">XeJesUs Sanctuary Publication</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black italic tracking-tight text-[#0f172a] leading-tight mb-2">
                          {literaryWork.themeTitle}
                        </h1>
                        <p className="text-xs font-sans font-bold text-[#64748b] uppercase tracking-[0.2em]">
                          {literaryWork.subtitle}
                        </p>
                      </div>

                      <div className="text-left md:text-right text-xs font-sans text-[#64748b]">
                        <span className="font-bold text-[#3b82f6] uppercase tracking-wider block">Archive Document</span>
                        <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </header>

                    {/* Executive Summary */}
                    <section className="bg-[#f8fafc] p-6 rounded-2xl border border-[#e2e8f0]">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#3b82f6] mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Executive Summary
                      </h2>
                      <p className="text-sm leading-relaxed text-[#334155] italic">
                        {literaryWork.executiveSummary}
                      </p>
                    </section>

                    {/* Thematic Analysis */}
                    <section>
                      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#3b82f6] mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Thematic Exegesis & Theological Synthesis
                      </h2>
                      <div className="text-sm leading-relaxed text-[#334155] space-y-3 font-serif">
                        {literaryWork.thematicAnalysis}
                      </div>
                    </section>



                    {/* SECTION B: Family Tree */}
                    {literaryWork.familyTree && literaryWork.familyTree.length > 0 && (
                      <section className="space-y-4">
                        <h2 className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          b. Biblical Family Tree & Genealogical Lineage
                        </h2>
                        <div className="bg-[#f8fafc] p-6 rounded-2xl border border-[#e2e8f0] space-y-4">
                          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#3b82f6]/30">
                            {literaryWork.familyTree.map((node, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#3b82f6] ring-4 ring-[#f8fafc]" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[#0f172a]">{node.person}</span>
                                    <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-md">
                                      {node.biblicalTitle}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-sans text-[#64748b] uppercase tracking-wider font-semibold">
                                    {node.generation} {node.keyScripture && `• ${node.keyScripture}`}
                                  </span>
                                </div>
                                <p className="text-xs text-[#475569] italic leading-relaxed">{node.significance}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* SECTION C: Examples of Literary Work Researched by Scholars */}
                    {literaryWork.scholarlyWorks && literaryWork.scholarlyWorks.length > 0 && (
                      <section className="space-y-4">
                        <h2 className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          c. Scholarly Researched Literary Works & Treatises
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {literaryWork.scholarlyWorks.map((work, idx) => (
                            <div key={idx} className="bg-[#f8fafc] p-4 rounded-2xl border border-[#e2e8f0] flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-sans font-bold uppercase text-[#3b82f6] tracking-wider block mb-1">
                                  {work.era}
                                </span>
                                <h3 className="font-bold text-sm text-[#0f172a] mb-0.5">{work.title}</h3>
                                <p className="text-xs text-[#64748b] italic font-semibold mb-2">By {work.author}</p>
                                <p className="text-xs text-[#334155] leading-relaxed mb-3">{work.summary}</p>
                              </div>
                              <div className="pt-2 border-t border-[#e2e8f0] text-[11px] text-[#475569] italic">
                                <strong>Relevance:</strong> {work.relevance}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* SECTION D: YouTube Videos Related to Chat Theme */}
                    {literaryWork.youtubeVideos && literaryWork.youtubeVideos.length > 0 && (
                      <section className="space-y-4">
                        <h2 className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          d. Recommended Educational & Scholarly Media (YouTube)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {literaryWork.youtubeVideos.map((video, idx) => (
                            <a
                              key={idx}
                              href={video.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery || video.title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#f8fafc] p-4 rounded-2xl border border-[#e2e8f0] hover:border-[#3b82f6] transition-all group block"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-sans font-bold uppercase text-red-600 flex items-center gap-1">
                                  <Youtube className="w-3.5 h-3.5" />
                                  {video.channel}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#3b82f6] transition-colors" />
                              </div>
                              <h3 className="font-bold text-xs text-[#0f172a] mb-1 group-hover:text-[#3b82f6] transition-colors line-clamp-2">
                                {video.title}
                              </h3>
                              <p className="text-xs text-[#64748b] leading-relaxed italic line-clamp-3">
                                {video.description}
                              </p>
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Conversation Transcript Section - BibleGateway Literary Study Style */}
                    <section className="space-y-6 pt-8 border-t-2 border-[#0f172a]/10">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-[#0f172a] pb-3 gap-2">
                        <div>
                          <span className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-[#3b82f6] block mb-1">
                            BIBLICAL EXEGESIS ARCHIVE
                          </span>
                          <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight text-[#0f172a]">
                            Annotated Dialogue & Commentary
                          </h2>
                        </div>
                        <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#64748b] bg-[#f1f5f9] px-3 py-1 rounded-full w-fit">
                          Transcript • {selectedSessionForExport.messages.length} Exchanges
                        </span>
                      </div>

                      <p className="text-xs font-serif italic text-[#475569] leading-relaxed border-l-2 border-[#3b82f6] pl-3 py-0.5">
                        A formal scholarly transcript documenting the pilgrimage inquiry and exegetical study between the Pilgrim and the Sanctuary Scholar in the tradition of classical commentary archives.
                      </p>

                      <div className="space-y-8 font-serif text-sm leading-relaxed text-[#1e293b]">
                        {selectedSessionForExport.messages.map((m, idx) => {
                          const isUser = m.role === 'user';
                          const paragraphs = m.text.split(/\n+/).filter(p => p.trim().length > 0);

                          return (
                            <article 
                              key={idx} 
                              className={`relative pb-8 border-b border-[#e2e8f0] last:border-b-0 last:pb-0 ${
                                isUser 
                                  ? 'pl-5 border-l-3 border-[#3b82f6] my-6 bg-[#f8fafc] p-5 rounded-r-xl shadow-xs' 
                                  : 'pt-2 pl-2'
                              }`}
                            >
                              {/* Speaker Header Tag with explicit bullet gap */}
                              <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[10px] font-sans font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded shadow-xs ${
                                  isUser 
                                    ? 'bg-[#3b82f6] text-white' 
                                    : 'bg-[#0f172a] text-white'
                                }`}>
                                  {isUser ? 'PILGRIM' : 'SANCTUARY SCHOLAR'}
                                </span>
                                <span className="text-xs font-serif italic text-[#64748b] font-medium tracking-wide">
                                  {isUser ? '• Pilgrim Inquiry' : '• Exegetical Response'}
                                </span>
                              </div>

                              {/* Editorial Content with BibleGateway Double-Line Spacing (leading-[2.2]) */}
                              <div className={`text-[15px] ${
                                isUser 
                                  ? 'font-serif font-semibold text-[#0f172a] italic leading-[2.1]' 
                                  : 'font-serif text-[#1e293b] leading-[2.25] tracking-wide space-y-5'
                              }`}>
                                {paragraphs.map((para, pIdx) => {
                                  const isFirstParagraph = !isUser && pIdx === 0 && para.length > 30;

                                  if (isFirstParagraph) {
                                    return (
                                      <p key={pIdx} className="leading-[2.25] mb-4 text-justify">
                                        <span className="float-left text-4xl font-black font-serif leading-none pr-2 pt-1 text-[#3b82f6]">
                                          {para.charAt(0)}
                                        </span>
                                        {para.slice(1)}
                                      </p>
                                    );
                                  }

                                  return (
                                    <p key={pIdx} className="leading-[2.25] mb-4 text-justify">
                                      {para}
                                    </p>
                                  );
                                })}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>

                    {/* Footer Seal */}
                    <footer className="pt-8 border-t border-[#e2e8f0] flex justify-between items-center text-[10px] text-[#94a3b8] uppercase font-sans tracking-widest">
                      <span>Official Literary Publication • XeJesUs Sanctuary</span>
                      <span>Verified Exegesis</span>
                    </footer>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade to Premium Modal */}
      <PremiumOverlay 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="Professional Literary Work PDF Exporter"
      />
    </div>
  );
}
