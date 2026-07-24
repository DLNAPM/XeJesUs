import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Sparkles, User, Bot, History, Save, Trash2, PlusCircle, ArrowLeft, Volume2, VolumeX, Play, Pause, Square, Mic, MicOff } from 'lucide-react';
import { getAuthService, getDbService, collection, query, where, orderBy, limit, getDocs, setDoc, doc, serverTimestamp, deleteDoc, handleFirestoreError, OperationType } from '../lib/firebase';
import { chatWithSanctuary } from '../services/geminiService';
import { Inquiry, UserProfile, ChatSession } from '../types';
import { cn } from '../lib/utils';

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

  const scrollRef = useRef<HTMLDivElement>(null);

  const isPremium = userProfile?.tier === 'premium' || userProfile?.role === 'admin';

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingSessionId(null);
    setSpeakingMessageText(null);
    setIsPaused(false);
  };

  const speakSession = (session: ChatSession) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Audible speech synthesis is not supported in your browser.");
      return;
    }

    if (speakingSessionId === session.id) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
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

    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingSessionId(session.id || null);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setSpeakingSessionId(null);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setSpeakingSessionId(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Audible speech synthesis is not supported in your browser.");
      return;
    }

    if (speakingMessageText === text) {
      stopSpeech();
      return;
    }

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setSpeakingMessageText(text);
    };

    utterance.onend = () => {
      setSpeakingMessageText(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageText(null);
    };

    window.speechSynthesis.speak(utterance);
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
