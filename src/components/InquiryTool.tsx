import { useState, useEffect } from 'react';
import { getDbService, getAuthService, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp, getDoc, doc } from '../lib/firebase';
import { generateExegesis, searchScriptureBySubject } from '../lib/gemini';
import { Search, Loader2, Sparkles, BookOpen, Fingerprint, Star, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PremiumOverlay from './PremiumOverlay';
import { UserProfile } from '../types';

interface InquiryToolProps {
  onComplete: (id: string) => void;
  isPremium: boolean;
  isGuest?: boolean;
  onPromptLogin?: () => void;
}

export default function InquiryTool({ onComplete, isPremium, isGuest: propIsGuest, onPromptLogin }: InquiryToolProps) {
  const auth = getAuthService();
  const isGuest = propIsGuest ?? Boolean(auth?.currentUser?.isAnonymous);
  const [scripture, setScripture] = useState('');
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubjectSearch, setShowSubjectSearch] = useState(false);
  const [subject, setSubject] = useState('');
  const [searchingSubject, setSearchingSubject] = useState(false);
  const [suggestions, setSuggestions] = useState<{reference: string, reason: string}[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleSubjectToggle = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowSubjectSearch(!showSubjectSearch);
  };

  const handleSubjectSearch = async () => {
    if (!subject.trim()) return;
    setSearchingSubject(true);
    setSuggestions([]);
    try {
      const results = await searchScriptureBySubject(subject);
      setSuggestions(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingSubject(false);
    }
  };

  const selectSuggestion = (ref: string) => {
    setScripture(ref);
    setShowSubjectSearch(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onPromptLogin?.();
      return;
    }

    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db || !scripture || !queryText) return;

    setLoading(true);
    setError(null);

    try {
      const exegesis = await generateExegesis(scripture, queryText);
      
      const inquiriesPath = 'inquiries';
      const docRef = await addDoc(collection(db, inquiriesPath), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        scripture,
        query: queryText,
        ...exegesis,
        createdAt: serverTimestamp()
      });

      onComplete(docRef.id);
    } catch (err: any) {
      console.error(err);
      setError("The Spirit was willing, but the connection was weak. Please try your inquiry again.");
      if (err.message && err.message.startsWith('{')) {
        // Already handled by firestore error handler? Maybe not gemini errors.
      } else {
        setError("An error occurred during interpretation. Please check your query or try later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-4xl font-serif text-text-primary mb-4">Seek the Word</h1>
        <p className="text-text-secondary italic max-w-lg mx-auto font-medium">
          "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you."
        </p>
      </header>

      {/* Guest Mode Read-Only Banner */}
      {isGuest && (
        <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-ui-card to-ui-card border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md text-left">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-bg-primary text-[10px] font-sans font-black uppercase tracking-widest">
                  Test Drive • Read-Only
                </span>
              </div>
              <p className="text-xs text-text-primary leading-relaxed font-medium">
                The ability to <strong className="text-text-primary font-bold">Seek the Word</strong> is turned off in the Guest Test Drive. Please login and Enter the Sanctuary in order to Seek the meanings of God's Word.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onPromptLogin}
            className="px-5 py-2.5 rounded-xl bg-text-primary text-bg-primary hover:bg-accent hover:text-bg-primary transition-all font-sans font-bold text-xs uppercase tracking-wider shrink-0 shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>Enter the Sanctuary</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-ui-card p-8 md:p-12 rounded-3xl shadow-xl border border-ui-border relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Search className="w-48 h-48 text-accent" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent">Scripture Reference</label>
              <button
                type="button"
                onClick={handleSubjectToggle}
                className="text-xs font-sans font-black uppercase tracking-widest text-text-secondary hover:text-accent flex items-center gap-1.5 transition-colors border-b border-transparent hover:border-accent"
                title="Search Scripture by Subject (Requires Premium Access)"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>{showSubjectSearch ? "Hide Subject Search" : "Don't know the scripture?"}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.8)] shrink-0" />
              </button>
            </div>

            <AnimatePresence>
              {showSubjectSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-ui-sidebar/30 p-6 rounded-2xl border border-ui-border space-y-4">
                    <p className="text-xs text-text-secondary italic font-serif">Enter a subject or theme, and the AI registry will find relevant canonical references for you.</p>
                    <div className="flex gap-2">
                       <input
                         type="text"
                         placeholder="e.g., Anxiety, Redemption, Stewardship..."
                         className="flex-1 bg-bg-primary/50 border border-ui-border rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-accent transition-all text-text-primary"
                         value={subject}
                         onChange={(e) => setSubject(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSubjectSearch())}
                       />
                       <button
                         type="button"
                         onClick={handleSubjectSearch}
                         disabled={searchingSubject}
                         className="bg-accent text-bg-primary px-6 rounded-xl font-sans font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[120px]"
                       >
                         {searchingSubject ? <Loader2 className="w-4 h-4 animate-spin text-bg-primary" /> : "Search"}
                       </button>
                    </div>

                    <div className="space-y-2">
                      {suggestions.map((s, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          type="button"
                          onClick={() => selectSuggestion(s.reference)}
                          className="w-full text-left p-3 rounded-lg border border-ui-border hover:border-accent bg-ui-card group transition-all"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-accent italic">{s.reference}</span>
                            <BookOpen className="w-3 h-3 text-ui-border group-hover:text-accent transition-colors" />
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-1 italic">{s.reason}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/40" />
              <input
                type="text"
                placeholder={isGuest ? "Read-Only: Login and Enter Sanctuary to Seek Scripture" : "e.g., John 3:16, Revelation 1:14-15"}
                className="w-full bg-bg-primary/50 border border-ui-border rounded-xl pl-12 pr-6 py-4 font-serif text-lg focus:outline-none focus:border-accent focus:bg-ui-card transition-all shadow-inner text-text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                disabled={isGuest || loading}
                required={!isGuest}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent mb-3">Your Seeking</label>
            <textarea
              placeholder={isGuest ? "Read-Only: Login and Enter Sanctuary to Seek the meanings of God's Word" : "What do you seek to understand about this passage?"}
              className="w-full bg-bg-primary/50 border border-ui-border rounded-xl px-6 py-4 font-serif text-lg focus:outline-none focus:border-accent focus:bg-ui-card transition-all shadow-inner min-h-[150px] text-text-primary disabled:opacity-60 disabled:cursor-not-allowed"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              disabled={isGuest || loading}
              required={!isGuest}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border-l-4 border-red-500 text-red-500 text-sm italic font-serif"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold">Interpretation Error:</span>
              </div>
              {error}
            </motion.div>
          )}

          {isGuest ? (
            <button
              type="button"
              onClick={onPromptLogin}
              className="w-full bg-ui-sidebar border-2 border-amber-500/40 text-text-primary py-5 rounded-2xl font-sans font-bold text-sm hover:border-accent hover:bg-accent/10 transition-all shadow-md flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <Lock className="w-5 h-5 text-amber-500 group-hover:text-accent transition-colors" />
              <span>Read-Only in Test Drive — Click to Login & Enter Sanctuary</span>
              <ChevronRight className="w-4 h-4 text-accent" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-text-primary text-bg-primary py-5 rounded-2xl font-sans font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <span className="italic">Interpretation in Progress...</span>
                </>
              ) : (
                <>
                  <span>Perform Exegesis</span>
                  <Sparkles className="w-5 h-5 text-accent group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          )}
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-text-secondary font-serif italic max-w-lg mx-auto">
        Exegesis grounded in our Academic & Spiritual Citation Framework (Canonical Scriptures, Asher Wilson's Ethiopian Bible Canon, Original Lexicons & Patristic Exegesis).
      </p>

      <PremiumOverlay 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        featureName="Don't Know the Scripture?" 
      />
    </div>
  );
}
