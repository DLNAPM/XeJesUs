import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  User, 
  Bot, 
  History, 
  Save, 
  Trash2, 
  PlusCircle, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff,
  FileText,
  Download,
  Printer,
  BookOpen,
  ExternalLink,
  Youtube,
  GitBranch,
  Image as ImageIcon
} from 'lucide-react';
import { getAuthService, getDbService, collection, query, where, orderBy, limit, getDocs, setDoc, doc, serverTimestamp, deleteDoc, handleFirestoreError, OperationType } from '../lib/firebase';
import { chatWithSanctuary, generateLiteraryWorkExport, getThematicImagesForTopic } from '../services/geminiService';
import { Inquiry, UserProfile, ChatSession, LiteraryWorkExport } from '../types';
import { cn } from '../lib/utils';
import PremiumOverlay from './PremiumOverlay';
import { exportElementToPdf } from '../utils/pdfExporter';
import { speakWithScholarVoice, stopScholarSpeech, pauseScholarSpeech, resumeScholarSpeech } from '../lib/ttsHelper';


interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  userProfile: UserProfile | null;
  openSignal?: { open: boolean; view: 'chat' | 'sessions'; id: number };
}

export default function Chatbot({ userProfile, openSignal }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Greetings, pilgrim. I am here to help you reflect on your recent seekings and see how they apply to your life today. How can I assist your study?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [view, setView] = useState<'chat' | 'sessions'>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [showSaveNaming, setShowSaveNaming] = useState(false);
  
  // Audio Speech (Text-to-Speech & Speech-to-Text) States
  const [speakingSessionId, setSpeakingSessionId] = useState<string | null>(null);
  const [speakingMessageText, setSpeakingMessageText] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Literary Work Export States
  const [selectedSessionForExport, setSelectedSessionForExport] = useState<ChatSession | null>(null);
  const [literaryWork, setLiteraryWork] = useState<LiteraryWorkExport | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const isPremium = userProfile?.tier === 'premium' || userProfile?.role === 'admin';

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


  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (openSignal && openSignal.id > 0) {
      setIsVisible(true);
      setIsOpen(openSignal.open);
      if (openSignal.view) {
        setView(openSignal.view);
      }
      fetchSessions().catch(err => console.error("Error in fetchSessions:", err));
    }
  }, [openSignal]);

  useEffect(() => {
    if (isOpen) {
      if (recentInquiries.length === 0) {
        fetchRecentInquiries().catch(err => console.error("Error in fetchRecentInquiries:", err));
      }
      fetchSessions().catch(err => console.error("Error in fetchSessions:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  // Text-To-Speech Functions
  const stopSpeech = () => {
    stopScholarSpeech();
    setSpeakingSessionId(null);
    setSpeakingMessageText(null);
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
      onError: (e) => {
        console.error("Speech synthesis error:", e);
        setSpeakingSessionId(null);
        setIsPaused(false);
      }
    });
  };

  const speakText = (text: string) => {
    if (speakingMessageText === text) {
      stopSpeech();
      return;
    }

    stopSpeech();

    speakWithScholarVoice(text, {
      profile: userProfile,
      onStart: () => {
        setSpeakingMessageText(text);
      },
      onEnd: () => {
        setSpeakingMessageText(null);
      },
      onError: () => {
        setSpeakingMessageText(null);
      }
    });
  };

  // Speech-to-Text Function (Voice Dictation)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech-to-text dictation is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const fetchSessions = async () => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) return;

    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'chat_sessions'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const fetchedSessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      setSessions(fetchedSessions);
    } catch (error) {
      console.error("Failed to fetch chat sessions", error);
    }
  };

  const saveCurrentSession = async () => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db || messages.length <= 1) return;

    setIsSaving(true);
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    };
    const sessionId = currentSessionId || generateUUID();
    const path = `users/${auth.currentUser.uid}/chat_sessions/${sessionId}`;

    try {
      const sessionData: Partial<ChatSession> = {
        userId: auth.currentUser.uid,
        name: sessionName || `Study ${new Date().toLocaleDateString()}`,
        messages: messages,
        createdAt: currentSessionId ? undefined : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Filter out undefined for create/update
      const cleanData = Object.fromEntries(Object.entries(sessionData).filter(([_, v]) => v !== undefined));

      await setDoc(doc(db, path), cleanData, { merge: true });
      setCurrentSessionId(sessionId);
      setShowSaveNaming(false);
      setSessionName('');
      fetchSessions();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id || null);
    setView('chat');
  };

  const deleteSession = async (sessionId: string) => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) return;

    const path = `users/${auth.currentUser.uid}/chat_sessions/${sessionId}`;
    try {
      await deleteDoc(doc(db, path));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([
          { role: 'model', text: "Greetings, pilgrim. I am here to help you reflect on your recent seekings and see how they apply to your life today. How can I assist your study?" }
        ]);
      }
      fetchSessions();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      { role: 'model', text: "Greetings, pilgrim. I am here to help you reflect on your recent seekings and see how they apply to your life today. How can I assist your study?" }
    ]);
    setView('chat');
  };

  const fetchRecentInquiries = async () => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) return;

    try {
      const q = query(
        collection(db, 'inquiries'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const inqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
      
      // Client-side sort & limit to avoid requiring composite indexes
      inqs.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          return new Date(val).getTime() || 0;
        };
        return getMs(b.createdAt) - getMs(a.createdAt);
      });
      
      setRecentInquiries(inqs.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent inquiries for chatbot context", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithSanctuary(
        userMessage, 
        messages, 
        recentInquiries
      );
      setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't find an answer. Let's try reflecting on a different verse." }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Forgive me, the connection to the sanctuary was interrupted. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[calc(100vw-3rem)] md:w-[400px] h-[500px] max-h-[70vh] bg-ui-card border border-ui-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-accent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-primary/20 flex items-center justify-center text-bg-primary">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-bg-primary font-serif font-bold italic">Sanctuary Scholar</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-[10px] text-bg-primary/70 uppercase font-black tracking-wider">Premium Service</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {view === 'chat' ? (
                  <button 
                    onClick={() => setView('sessions')}
                    className="p-2 text-bg-primary/60 hover:text-bg-primary hover:bg-bg-primary/10 rounded-xl transition-all"
                    title="Saved Sessions"
                  >
                    <History className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setView('chat')}
                    className="p-2 text-bg-primary/60 hover:text-bg-primary hover:bg-bg-primary/10 rounded-xl transition-all"
                    title="Back to Chat"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-bg-primary/60 hover:text-bg-primary hover:bg-bg-primary/10 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {view === 'chat' ? (
                <>
                  {/* Messages */}
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-ui-border"
                  >
                    {messages.map((m, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                          m.role === 'user' ? "bg-accent/10 text-accent" : "bg-ui-sidebar text-text-secondary"
                        )}>
                          {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                          "p-3 rounded-2xl text-sm leading-relaxed relative group/msg pr-8",
                          m.role === 'user' 
                            ? "bg-accent text-bg-primary rounded-tr-none" 
                            : "bg-ui-sidebar border border-ui-border text-text-primary rounded-tl-none font-serif italic"
                        )}>
                          {m.text}
                          <button
                            type="button"
                            onClick={() => speakText(m.text)}
                            className={cn(
                              "absolute top-2 right-2 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity",
                              m.role === 'user' ? "text-bg-primary hover:bg-black/10" : "text-text-secondary hover:bg-ui-border"
                            )}
                            title={speakingMessageText === m.text ? "Stop Reading" : "Read Audibly"}
                          >
                            {speakingMessageText === m.text ? (
                              <VolumeX className="w-3.5 h-3.5 animate-pulse text-red-400" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 max-w-[85%] mr-auto">
                        <div className="w-8 h-8 rounded-full bg-ui-sidebar text-text-secondary flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-ui-sidebar border border-ui-border p-3 rounded-2xl rounded-tl-none">
                          <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save Naming Overlay */}
                  <AnimatePresence>
                    {showSaveNaming && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 p-4 bg-ui-sidebar border-t border-ui-border z-10 shadow-lg"
                      >
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Save Chat Session</p>
                          <input 
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Study Session Name..."
                            className="bg-ui-card border border-ui-border p-2 rounded-xl text-sm focus:outline-none focus:border-accent"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={saveCurrentSession}
                              disabled={isSaving}
                              className="flex-1 bg-accent text-bg-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Save Session
                            </button>
                            <button 
                              onClick={() => setShowSaveNaming(false)}
                              className="px-3 bg-ui-card border border-ui-border text-text-secondary py-2 rounded-xl text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input and Save Action */}
                  <div className="p-4 border-t border-ui-border bg-ui-sidebar/50">
                    <div className="flex items-center gap-2 mb-3">
                      <button 
                        onClick={() => setShowSaveNaming(true)}
                        disabled={messages.length <= 1 || showSaveNaming}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider hover:bg-accent/20 transition-all disabled:opacity-30"
                      >
                        <Save className="w-3 h-3" />
                        Save Transcript
                      </button>
                      <button 
                        onClick={startNewChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ui-card border border-ui-border text-text-secondary text-[10px] font-bold uppercase tracking-wider hover:bg-ui-border transition-all"
                      >
                        <PlusCircle className="w-3 h-3" />
                        New Chat
                      </button>
                    </div>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="relative flex items-center"
                    >
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening to your voice..." : "Ask the Sanctuary Scholar..."}
                        className={cn(
                          "w-full bg-ui-card border border-ui-border rounded-2xl py-3 pl-4 pr-20 text-sm focus:outline-none focus:border-accent transition-all font-serif",
                          isListening && "border-accent ring-2 ring-accent/30 animate-pulse placeholder:text-accent font-sans"
                        )}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={toggleListening}
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            isListening ? "bg-red-500 text-white animate-bounce" : "bg-ui-sidebar border border-ui-border text-text-secondary hover:text-accent"
                          )}
                          title={isListening ? "Stop Listening" : "Dictate with Speech-to-Text"}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button 
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="w-8 h-8 rounded-xl bg-accent text-bg-primary flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                /* Sessions List */
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Your Saved Seekings</h4>
                    <button 
                      onClick={startNewChat}
                      className="text-[10px] font-bold text-accent uppercase flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> New Chat
                    </button>
                  </div>

                  {/* Active Audio Player Control for Saved Sessions */}
                  {speakingSessionId && (
                    <div className="p-3 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Volume2 className="w-4 h-4 text-accent animate-pulse flex-shrink-0" />
                        <span className="font-serif italic text-text-primary truncate">
                          Reading: <strong className="font-bold">{sessions.find(s => s.id === speakingSessionId)?.name || 'Saved Session'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button 
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                              if (isPaused) {
                                window.speechSynthesis.resume();
                                setIsPaused(false);
                              } else {
                                window.speechSynthesis.pause();
                                setIsPaused(true);
                              }
                            }
                          }}
                          className="px-2 py-1 bg-accent text-bg-primary rounded-lg font-bold text-[10px] uppercase flex items-center gap-1 hover:opacity-90 transition-opacity"
                        >
                          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button 
                          type="button"
                          onClick={stopSpeech}
                          className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                          title="Stop Reading"
                        >
                          <Square className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 opacity-50 space-y-2">
                      <History className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm font-serif italic text-text-primary">No saved sessions yet, pilgrim.</p>
                      <p className="text-[10px] font-bold uppercase">Begin a study to save it.</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div 
                        key={session.id}
                        className={cn(
                          "group p-3 rounded-2xl border border-ui-border bg-ui-card hover:border-accent transition-all cursor-pointer flex items-center justify-between gap-2",
                          currentSessionId === session.id && "border-accent ring-1 ring-accent/20",
                          speakingSessionId === session.id && "border-accent bg-accent/5 ring-1 ring-accent/30"
                        )}
                        onClick={() => loadSession(session)}
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <h5 className="text-sm font-serif font-bold text-text-primary truncate">{session.name}</h5>
                          <p className="text-[10px] text-text-secondary">
                            {session.messages.length} messages • {(() => {
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
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Read Audibly Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakSession(session);
                            }}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all",
                              speakingSessionId === session.id
                                ? "bg-accent text-bg-primary shadow-sm"
                                : "bg-accent/10 text-accent hover:bg-accent/20"
                            )}
                            title={speakingSessionId === session.id ? (isPaused ? "Resume Reading" : "Pause / Stop Reading") : "Read Session Audibly"}
                          >
                            {speakingSessionId === session.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-wider">{isPaused ? 'Paused' : 'Stop'}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-wider">Listen</span>
                              </>
                            )}
                          </button>

                          {/* Export PDF Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportLiteraryWork(session);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-text-primary text-bg-primary hover:opacity-90 transition-all"
                            title="Export Session as Professional Literary Work (PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[10px] uppercase tracking-wider">PDF</span>
                          </button>

                          {/* Delete Session Button */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (speakingSessionId === session.id) {
                                stopSpeech();
                              }
                              if (window.confirm("Remove this session's records from the sanctuary?")) {
                                deleteSession(session.id!);
                              }
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-80 md:opacity-0 group-hover:opacity-100"
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Literary Work PDF Preview Modal */}
      <AnimatePresence>
        {selectedSessionForExport && (
          <div className="fixed inset-0 z-[200] bg-text-primary/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-y-auto">
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


      <div className="flex flex-col md:flex-row items-center gap-4">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              y: [-4, 4, -4],
              scale: [1, 1.05, 1],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              opacity: { repeat: Infinity, duration: 6, times: [0, 0.1, 0.9, 1] },
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              scale: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
            }}
            className="bg-accent text-bg-primary px-4 py-2 rounded-2xl rounded-br-sm font-serif font-bold italic text-sm shadow-xl border border-white/10 order-first md:order-none"
          >
            Chat With Us
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative overflow-hidden group",
            isOpen ? "bg-ui-card text-text-primary rotate-90" : "bg-text-primary text-bg-primary"
          )}
        >
          {isOpen ? <X className="w-8 h-8" /> : (
            <>
              <MessageSquare className="w-8 h-8" />
              <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <div className="absolute top-0 right-0 p-1">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              </div>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
