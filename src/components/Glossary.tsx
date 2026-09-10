import { useState, useEffect, useRef, useMemo } from 'react';
import { getDbService, getAuthService, collection, query, orderBy, getDocs, deleteDoc, doc, handleFirestoreError, OperationType } from '../lib/firebase';
import { Book, Search, Trash2, Loader2, ChevronRight, Hash, Info, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlossaryEntry {
  id?: string;
  word: string;
  definition: string;
  createdAt: any;
  isFoundational?: boolean;
}

const FOUNDATIONAL_TERMS: GlossaryEntry[] = [
  {
    id: 'core-xejesus',
    word: 'XeJesUs',
    definition: 'The divine synthesis of Exegesis ("leading out" the original intended meaning of a passage—specifically focusing on the role and person of Jesus—rather than inserting one\'s own biases (eisegesis)) and the name of Our Savior, Jesus Christ. Our purpose is to travel through the text to discover Jesus\' true intentions for Us today.',
    createdAt: null,
    isFoundational: true
  },
  {
    id: 'core-exegesis',
    word: 'Exegesis (ἐξήγησις)',
    definition: 'Literally "leading out." The objective, scholarly, and grammatical-historical extraction of the original author\'s intended meaning from the biblical text, specifically prioritizing the role and person of Jesus Christ.',
    createdAt: null,
    isFoundational: true
  },
  {
    id: 'core-eisegesis',
    word: 'Eisegesis (εἰσήγησις)',
    definition: 'Literally "reading into." The erroneous, biased imposition of one\'s modern assumptions, cultural prejudices, or subjective presuppositions onto the biblical text. Strictly prohibited in biblical scholarship.',
    createdAt: null,
    isFoundational: true
  }
];

export default function Glossary() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      const auth = getAuthService();
      if (!auth || !auth.currentUser) return;

      const db = getDbService();
      if (!db) {
        setLoading(false);
        return;
      }

      const path = `users/${auth.currentUser.uid}/glossary`;
      try {
        const q = query(
          collection(db, path),
          orderBy('word', 'asc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlossaryEntry));
        setEntries(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries().catch(err => console.error("Error in fetchEntries:", err));
  }, []);

  const combinedEntries = useMemo(() => {
    // Merge foundational entries and user entries, deduplicating by lowercased word
    const map = new Map<string, GlossaryEntry>();
    FOUNDATIONAL_TERMS.forEach(term => {
      map.set(term.word.toLowerCase(), term);
    });
    entries.forEach(entry => {
      map.set((entry.word || '').toLowerCase(), entry);
    });
    return Array.from(map.values());
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return combinedEntries.filter(e => 
      String(e.word || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.definition || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedEntries, searchTerm]);

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: GlossaryEntry[] } = {};
    filteredEntries.forEach(entry => {
      const char = String(entry.word || '').charAt(0).toUpperCase();
      const key = /^[A-Z]$/.test(char) ? char : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (id: string) => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) return;

    const path = `users/${auth.currentUser.uid}/glossary/${id}`;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/glossary`, id));
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <header className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-4xl font-serif text-text-primary italic font-bold">Lexicon of Truth</h1>
            <p className="text-text-secondary italic">Your personal repository of theological terms and deep meanings.</p>
          </div>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`p-3 rounded-2xl transition-all ${showInfo ? 'bg-accent text-bg-primary' : 'bg-ui-card text-text-secondary border border-ui-border hover:border-accent'}`}
          >
            <Lightbulb className="w-5 h-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 bg-accent/5 border border-accent/20 rounded-[2rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12">
              <Book className="w-32 h-32 text-accent" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="font-sans font-black text-xs uppercase tracking-[0.3em] text-accent">How to Use Your Lexicon</h3>
              </div>
              <p className="text-text-primary font-serif italic text-lg leading-relaxed">
                The Lexicon of Truth is designed to deepen your theological vocabulary and clarify complex biblical terms encountered during your Seekings.
              </p>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="bg-bg-primary/50 p-4 rounded-xl border border-ui-border">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-2">Capturing Truth</h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    Simply <span className="text-text-primary font-bold">highlight any word or phrase</span> within a Result's text to trigger the "Ask for Meaning" tooltip.
                  </p>
                </div>
                <div className="bg-bg-primary/50 p-4 rounded-xl border border-ui-border">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-2">Defining Truth</h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    Once defined by the Divine Intelligence, tap <span className="text-text-primary font-bold inline-flex items-center gap-1">Add to Lexicon <ChevronRight className="w-3 h-3" /></span> to save it here permanently.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alphabet Navigation */}
      <div className="flex flex-wrap gap-1 mb-6 bg-ui-card p-2 rounded-xl border border-ui-border sticky top-0 z-10 shadow-sm">
        {alphabet.map(letter => {
          const hasEntries = groupedEntries[letter] && groupedEntries[letter].length > 0;
          return (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              disabled={!hasEntries}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                hasEntries 
                  ? 'text-accent hover:bg-accent hover:text-bg-primary' 
                  : 'text-text-secondary/20 cursor-default'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/40" />
        <input 
          type="text"
          placeholder="Search your lexicon..."
          className="w-full bg-ui-card border border-ui-border rounded-2xl pl-12 pr-6 py-4 font-serif text-lg focus:outline-none focus:border-accent transition-all shadow-sm text-text-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Glossary List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-4 space-y-12 scrollbar-thin scrollbar-thumb-ui-border"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
            <p className="text-text-secondary italic font-serif">Unrolling the scrolls...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-ui-card/20 rounded-3xl border-2 border-dashed border-ui-border">
            <Book className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
            <p className="text-text-secondary italic font-serif text-lg">Your lexicon is empty. Highlight words in your studies to define their truth.</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary italic">No terms matched your search.</p>
          </div>
        ) : (
          Object.keys(groupedEntries).sort().map(letter => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent text-bg-primary flex items-center justify-center font-bold text-lg shadow-md">
                  {letter}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-ui-border to-transparent" />
              </div>
              <div className="space-y-4">
                {groupedEntries[letter].map((entry) => (
                  <motion.div
                    layout
                    key={entry.id}
                    className="p-6 bg-ui-card border border-ui-border rounded-2xl shadow-sm group hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-serif text-text-primary italic font-bold">{entry.word}</h3>
                        {entry.isFoundational && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                            <Sparkles className="w-3 h-3" />
                            Foundational
                          </span>
                        )}
                      </div>
                      {!entry.isFoundational && (
                        <button 
                          onClick={() => entry.id && handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete term"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-text-secondary leading-relaxed font-serif text-base italic leading-relaxed">
                      {entry.definition}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
