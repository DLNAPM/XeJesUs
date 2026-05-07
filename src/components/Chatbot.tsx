import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import { getAuthService, getDbService, collection, query, where, orderBy, limit, getDocs } from '../lib/firebase';
import { chatWithSanctuary } from '../services/geminiService';
import { Inquiry, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  userProfile: UserProfile | null;
}

export default function Chatbot({ userProfile }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Greetings, pilgrim. I am here to help you reflect on your recent seekings and see how they apply to your life today. How can I assist your study?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPremium = userProfile?.tier === 'premium' || userProfile?.role === 'admin';

  useEffect(() => {
    if (!isPremium) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000); // 30 second delay

    return () => clearTimeout(timer);
  }, [isPremium]);

  useEffect(() => {
    if (isOpen && recentInquiries.length === 0) {
      fetchRecentInquiries();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchRecentInquiries = async () => {
    const auth = getAuthService();
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(getDbService(), 'inquiries'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const inqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
      setRecentInquiries(inqs);
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

  if (!isPremium || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-ui-card border border-ui-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
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
              <button 
                onClick={() => setIsOpen(false)}
                className="text-bg-primary/60 hover:text-bg-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

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
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    m.role === 'user' 
                      ? "bg-accent text-bg-primary rounded-tr-none" 
                      : "bg-ui-sidebar border border-ui-border text-text-primary rounded-tl-none font-serif italic"
                  )}>
                    {m.text}
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

            {/* Input */}
            <div className="p-4 border-t border-ui-border bg-ui-sidebar/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative"
              >
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the Sanctuary Scholar..."
                  className="w-full bg-ui-card border border-ui-border rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-accent transition-all font-serif"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-accent text-bg-primary flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [-2, 2, -2, 2],
              scale: [1, 1.05, 1, 1.05],
              x: 0
            }}
            transition={{ 
              opacity: { repeat: Infinity, duration: 5 },
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              scale: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
            }}
            className="bg-accent text-bg-primary px-4 py-2 rounded-full font-serif font-bold italic text-sm shadow-lg border border-white/10"
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
