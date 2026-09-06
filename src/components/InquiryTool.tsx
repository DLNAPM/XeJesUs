import { useState, useEffect } from 'react';
import { getDbService, getAuthService, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp, getDoc, doc } from '../lib/firebase';
import { generateExegesis, searchScriptureBySubject } from '../lib/gemini';
import { Search, Loader2, Sparkles, BookOpen, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PremiumOverlay from './PremiumOverlay';
import { UserProfile } from '../types';

interface InquiryToolProps {
  onComplete: (id: string) => void;
  isPremium: boolean;
}

export default function InquiryTool({ onComplete, isPremium }: InquiryToolProps) {
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
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db || !scripture || !queryText) return;

    setLoading(true);
    setError(null);

    try {
      const exegesis = await generateExegesis(scripture.trim(), queryText.trim());
      
      const inquiriesPath = 'inquiries';
      const docRef = await addDoc(collection(db, inquiriesPath), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || "",
        scripture: scripture.trim(),
        query: queryText.trim(),
        interpretation: String(exegesis?.interpretation || "No interpretation text returned."),
        historicalContext: String(exegesis?.historicalContext || ""),
        grammarAnalysis: String(exegesis?.grammarAnalysis || ""),
        literaryGenre: String(exegesis?.literaryGenre || "Scriptural Exegesis"),
        godIntent: String(exegesis?.godIntent || ""),
        crossReferences: Array.isArray(exegesis?.crossReferences) ? exegesis.crossReferences : [],
        geography: {
          location: String(exegesis?.geography?.location || "Jerusalem"),
          thenDesc: String(exegesis?.geography?.thenDesc || ""),
          nowDesc: String(exegesis?.geography?.nowDesc || ""),
          thenImageUrl: String(exegesis?.geography?.thenImageUrl || ""),
          nowImageUrl: String(exegesis?.geography?.nowImageUrl || ""),
        },
        videoClipQuery: String(exegesis?.videoClipQuery || `${scripture.trim()} biblical exegesis`),
        createdAt: serverTimestamp()
      });

      onComplete(docRef.id);
    } catch (err: any) {
      console.error("Exegesis submission error:", err);
      const msg = err?.message || "";
      if (msg.includes("503") || msg.includes("demand") || msg.includes("unavailable")) {
        setError("The sanctuary scholarship service is experiencing high demand. Please press Retry to try again.");
      } else if (msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
        setError("Unable to save your inquiry to the sanctuary. Please verify your connection or sign-in state.");
      } else {
        setError(msg || "An error occurred during interpretation. Please check your query or try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-serif text-text-primary mb-4">Seek the Word</h1>
        <p className="text-text-secondary italic max-w-lg mx-auto">
          "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you."
        </p>
      </header>

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
                className="text-xs font-sans font-black uppercase tracking-widest text-text-secondary hover:text-accent flex items-center gap-2 transition-colors border-b border-transparent hover:border-accent"
              >
                <Fingerprint className="w-3 h-3" />
                {showSubjectSearch ? "Hide Subject Search" : "Don't know the scripture?"}
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
                placeholder="e.g., John 3:16, Revelation 1:14-15"
                className="w-full bg-bg-primary/50 border border-ui-border rounded-xl pl-12 pr-6 py-4 font-serif text-lg focus:outline-none focus:border-accent focus:bg-ui-card transition-all shadow-inner text-text-primary"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent mb-3">Your Seeking</label>
            <textarea
              placeholder="What do you seek to understand about this passage?"
              className="w-full bg-bg-primary/50 border border-ui-border rounded-xl px-6 py-4 font-serif text-lg focus:outline-none focus:border-accent focus:bg-ui-card transition-all shadow-inner min-h-[150px] text-text-primary"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl text-red-500 text-sm font-serif flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">Interpretation Notice:</span>
                </div>
                <p className="italic">{error}</p>
              </div>
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                className="self-start sm:self-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-sans text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
              >
                Retry Exegesis
              </button>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-text-primary text-bg-primary py-5 rounded-2xl font-sans font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group"
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
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-text-secondary font-serif italic max-w-md mx-auto">
        Exegesis results are generated using AI-powered scholarship and cross-referenced with historic biblical contexts.
      </p>

      <PremiumOverlay 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        featureName="Don't Know the Scripture?" 
      />
    </div>
  );
}
