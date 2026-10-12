import { useState, useEffect, useRef, useMemo } from 'react';
import { getDbService, getAuthService, collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { Book, Search, Trash2, Loader2, ChevronRight, Lightbulb, Sparkles, Filter, X, Plus, AlertTriangle, ShieldCheck, CheckCircle2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlossaryEntry {
  id?: string;
  word: string;
  definition: string;
  createdAt: any;
}

export default function Glossary() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // Duplicate check and removal states
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicateActionNotice, setDuplicateActionNotice] = useState<{
    type: 'removed' | 'clean' | 'info';
    message: string;
  } | null>(null);

  // Add Word modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccessNotice, setAddSuccessNotice] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const letterBarRef = useRef<HTMLDivElement>(null);

  // Scan and clean duplicates utility
  const pruneDuplicates = async (data: GlossaryEntry[], auth: any, db: any, isManual = false): Promise<GlossaryEntry[]> => {
    const seenWords = new Map<string, GlossaryEntry>();
    const duplicatesToDelete: GlossaryEntry[] = [];
    const uniqueList: GlossaryEntry[] = [];

    for (const entry of data) {
      const normalized = (entry.word || '').trim().toLowerCase();
      if (!normalized) continue;

      if (seenWords.has(normalized)) {
        const existing = seenWords.get(normalized)!;
        // Keep the entry with richer/longer definition
        if ((entry.definition?.length || 0) > (existing.definition?.length || 0)) {
          duplicatesToDelete.push(existing);
          seenWords.set(normalized, entry);
          const idx = uniqueList.findIndex(e => e.id === existing.id);
          if (idx !== -1) uniqueList[idx] = entry;
        } else {
          duplicatesToDelete.push(entry);
        }
      } else {
        seenWords.set(normalized, entry);
        uniqueList.push(entry);
      }
    }

    // Always remove duplicates from Firestore if found
    if (duplicatesToDelete.length > 0) {
      let removedCount = 0;
      for (const dup of duplicatesToDelete) {
        if (dup.id) {
          try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/glossary`, dup.id));
            removedCount++;
          } catch (delErr) {
            console.error("Error removing duplicate entry from Firestore:", dup.id, delErr);
          }
        }
      }
      setDuplicateActionNotice({
        type: 'removed',
        message: `Removed ${removedCount} duplicate ${removedCount === 1 ? 'entry' : 'entries'} to ensure every term in your Lexicon is unique.`
      });
    } else if (isManual) {
      setDuplicateActionNotice({
        type: 'clean',
        message: 'No duplicate entries found. Your Lexicon Glossary is completely clean!'
      });
    }

    return uniqueList;
  };

  const fetchEntries = async (isManualScan = false) => {
    const auth = getAuthService();
    if (!auth || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const db = getDbService();
    if (!db) {
      setLoading(false);
      return;
    }

    if (isManualScan) setIsScanningDuplicates(true);

    const path = `users/${auth.currentUser.uid}/glossary`;
    try {
      const q = query(
        collection(db, path),
        orderBy('word', 'asc')
      );
      const snapshot = await getDocs(q);
      const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlossaryEntry));
      
      // Always check for duplicate entries and remove them
      const cleanedData = await pruneDuplicates(rawData, auth, db, isManualScan);
      setEntries(cleanedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
      setIsScanningDuplicates(false);
    }
  };

  useEffect(() => {
    fetchEntries().catch(err => console.error("Error in fetchEntries:", err));
  }, []);

  // Real-time check if newWord matches an existing entry (case-insensitive & trimmed)
  const existingDuplicateMatch = useMemo(() => {
    const target = newWord.trim().toLowerCase();
    if (!target) return null;
    return entries.find(e => (e.word || '').trim().toLowerCase() === target) || null;
  }, [newWord, entries]);

  const handleAddWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const wordTrimmed = newWord.trim();
    const defTrimmed = newDefinition.trim();

    if (!wordTrimmed) {
      setAddError("Please enter a theological word or phrase.");
      return;
    }
    if (!defTrimmed) {
      setAddError("Please enter a theological definition or scriptural context.");
      return;
    }

    // Always check for duplicate entries before saving
    const normalizedTarget = wordTrimmed.toLowerCase();
    const duplicate = entries.find(e => (e.word || '').trim().toLowerCase() === normalizedTarget);
    if (duplicate) {
      setAddError(`The word or phrase "${duplicate.word}" already exists in your Lexicon Glossary.`);
      return;
    }

    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) {
      setAddError("You must be signed in to save to the Lexicon.");
      return;
    }

    setIsSubmitting(true);
    const path = `users/${auth.currentUser.uid}/glossary`;

    try {
      // Re-verify against database snapshot as a safeguard
      const snapshot = await getDocs(collection(db, path));
      const dbDuplicate = snapshot.docs.find(d => {
        const w = d.data().word;
        return typeof w === 'string' && w.trim().toLowerCase() === normalizedTarget;
      });

      if (dbDuplicate) {
        setAddError(`The word or phrase "${wordTrimmed}" already exists in your Lexicon Glossary.`);
        setIsSubmitting(false);
        return;
      }

      const docRef = await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        word: wordTrimmed,
        definition: defTrimmed,
        createdAt: serverTimestamp()
      });

      const newEntry: GlossaryEntry = {
        id: docRef.id,
        word: wordTrimmed,
        definition: defTrimmed,
        createdAt: new Date()
      };

      setEntries(prev => [...prev, newEntry].sort((a, b) => a.word.localeCompare(b.word)));
      setNewWord('');
      setNewDefinition('');
      setShowAddModal(false);
      setAddSuccessNotice(`"${wordTrimmed}" successfully added to your Lexicon.`);
      setTimeout(() => setAddSuccessNotice(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      setAddError("Unable to save word to Lexicon. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = 
        String(e.word || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(e.definition || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedLetter) {
        const char = String(e.word || '').trim().charAt(0).toUpperCase();
        const letterKey = /^[A-Z]$/.test(char) ? char : '#';
        return letterKey === selectedLetter;
      }

      return true;
    });
  }, [entries, searchTerm, selectedLetter]);

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: GlossaryEntry[] } = {};
    filteredEntries.forEach(entry => {
      const char = String(entry.word || '').trim().charAt(0).toUpperCase();
      const key = /^[A-Z]$/.test(char) ? char : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  // All letters available in the full dataset for quick indicators
  const availableLettersSet = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(entry => {
      const char = String(entry.word || '').trim().charAt(0).toUpperCase();
      set.add(/^[A-Z]$/.test(char) ? char : '#');
    });
    return set;
  }, [entries]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    
    if (element) {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({ top: Math.max(0, relativeTop - 16), behavior: 'smooth' });
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectLetterFilter = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

  const totalEntriesCount = entries.length;
  const filteredCount = filteredEntries.length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-0 h-auto md:h-[calc(100vh-7rem)] ios-scroll-touch pb-16 md:pb-6">
      {/* Header */}
      <header className="mb-4 sm:mb-6 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-serif text-text-primary italic font-bold">Lexicon of Truth</h1>
              {totalEntriesCount > 0 && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {totalEntriesCount} {totalEntriesCount === 1 ? 'word' : 'words'}
                </span>
              )}
            </div>
            <p className="text-text-secondary italic text-sm sm:text-base mt-1">
              Your personal repository of theological terms, Hebrew roots, and deep scriptural definitions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAddError(null);
                setNewWord('');
                setNewDefinition('');
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 sm:py-2.5 rounded-2xl bg-accent text-bg-primary text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Word</span>
            </button>

            <button
              type="button"
              onClick={() => fetchEntries(true)}
              disabled={isScanningDuplicates}
              title="Scan and remove any duplicate entries"
              aria-label="Scan and remove duplicate entries"
              className="p-2 sm:p-2.5 rounded-2xl bg-ui-card text-text-secondary border border-ui-border hover:border-accent hover:text-text-primary transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              {isScanningDuplicates ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-accent" />
              )}
              <span className="hidden sm:inline">Check Duplicates</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              aria-label="How to use Lexicon"
              className={`p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${showInfo ? 'bg-accent text-bg-primary shadow-md' : 'bg-ui-card text-text-secondary border border-ui-border hover:border-accent'}`}
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Duplicate / Action Notice */}
        <AnimatePresence>
          {duplicateActionNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-3 p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs sm:text-sm ${
                duplicateActionNotice.type === 'removed'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {duplicateActionNotice.type === 'removed' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                )}
                <span>{duplicateActionNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateActionNotice(null)}
                className="text-text-secondary hover:text-text-primary p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {addSuccessNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{addSuccessNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAddSuccessNotice(null)}
                className="text-text-secondary hover:text-text-primary p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Guide Card (Collapsible) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-6 p-5 sm:p-6 bg-accent/5 border border-accent/20 rounded-3xl relative overflow-hidden group shrink-0"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none">
              <Book className="w-32 h-32 text-accent" />
            </div>
            <div className="relative z-10 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-sans font-black text-xs uppercase tracking-[0.25em] text-accent">How to Use Your Lexicon</h3>
              </div>
              <p className="text-text-primary font-serif italic text-base sm:text-lg leading-relaxed">
                The Lexicon of Truth deepens your theological understanding with primary canonical terms and original language roots.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
                <div className="bg-bg-primary/60 p-3.5 rounded-xl border border-ui-border">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-1">1. Highlight in Studies</h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    Highlight any term inside an exegesis result to trigger the <span className="text-text-primary font-semibold">"Ask for Meaning"</span> tooltip.
                  </p>
                </div>
                <div className="bg-bg-primary/60 p-3.5 rounded-xl border border-ui-border">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-1">2. Save to Lexicon</h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    Tap <span className="text-text-primary font-semibold inline-flex items-center gap-0.5">Add to Lexicon <ChevronRight className="w-3 h-3" /></span> to catalog the definition permanently here.
                  </p>
                </div>
                <div className="bg-bg-primary/60 p-3.5 rounded-xl border border-ui-border">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-1">3. Duplicate Prevention</h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    Existing entries are guarded against duplicates automatically, ensuring a pristine scriptural reference library.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alphabet Index Bar (iOS Touch-friendly with scroll indicator and active states) */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <span>Browse by Letter</span>
            {selectedLetter && (
              <span className="text-accent font-bold">({selectedLetter})</span>
            )}
          </span>
          {selectedLetter && (
            <button
              type="button"
              onClick={() => setSelectedLetter(null)}
              className="text-[11px] font-sans font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              Show All Letters
            </button>
          )}
        </div>

        {/* Scrollable Letter Strip for Mobile/iOS + Desktop */}
        <div 
          ref={letterBarRef}
          className="bg-ui-card p-1.5 sm:p-2 rounded-2xl border border-ui-border shadow-sm flex items-center gap-1 overflow-x-auto lexicon-letters-bar ios-scroll-touch"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {alphabet.map(letter => {
            const hasEntries = availableLettersSet.has(letter);
            const isSelected = selectedLetter === letter;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  if (hasEntries) {
                    handleSelectLetterFilter(letter);
                    scrollToLetter(letter);
                  }
                }}
                disabled={!hasEntries}
                aria-label={`Letter ${letter}${hasEntries ? '' : ' (no entries)'}`}
                className={`min-w-8 h-8 sm:min-w-9 sm:h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-bg-primary shadow-sm ring-2 ring-accent/30 scale-105'
                    : hasEntries
                      ? 'text-accent hover:bg-accent/15 active:bg-accent active:text-bg-primary'
                      : 'text-text-secondary/25 opacity-40 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-4 sm:mb-6 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
        <input 
          type="text"
          placeholder="Search your lexicon words or definitions..."
          className="w-full bg-ui-card border border-ui-border rounded-2xl pl-12 pr-10 py-3 sm:py-3.5 font-serif text-base sm:text-lg focus:outline-none focus:border-accent transition-all shadow-sm text-text-primary placeholder:text-text-secondary/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text-primary p-1 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Filter Notice */}
      {(selectedLetter || searchTerm) && (
        <div className="flex items-center justify-between text-xs text-text-secondary mb-3 px-1 shrink-0">
          <span>
            Showing <strong className="text-text-primary">{filteredCount}</strong> of <strong className="text-text-primary">{totalEntriesCount}</strong> terms
            {selectedLetter && <> for letter <strong className="text-accent font-bold">"{selectedLetter}"</strong></>}
            {searchTerm && <> matching <strong className="text-accent font-bold">"{searchTerm}"</strong></>}
          </span>
          <button
            type="button"
            onClick={() => { setSelectedLetter(null); setSearchTerm(''); }}
            className="text-accent hover:underline font-bold cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Lexicon Entries List (Explicitly Visible iOS Scrollbar & Touch Optimized) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-[350px] overflow-y-auto pr-1 sm:pr-3 space-y-8 sm:space-y-10 lexicon-scroll-container ios-scroll-touch"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable',
          touchAction: 'pan-y'
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
            <p className="text-text-secondary italic font-serif text-base">Unrolling the scrolls...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 sm:py-20 px-4 bg-ui-card/40 rounded-3xl border-2 border-dashed border-ui-border">
            <Book className="w-14 h-14 sm:w-16 sm:h-16 text-text-secondary/30 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-text-primary italic mb-2">Your Lexicon is Empty</h3>
            <p className="text-text-secondary italic font-serif text-base max-w-md mx-auto mb-5">
              Highlight words or phrases during any scriptural study to unveil their theological meanings, or add terms manually.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-accent text-bg-primary text-sm font-sans font-bold inline-flex items-center gap-2 shadow-sm hover:opacity-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Word</span>
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-ui-card/30 rounded-2xl border border-ui-border p-6">
            <Filter className="w-10 h-10 text-text-secondary/40 mx-auto mb-3" />
            <p className="text-text-primary font-serif italic text-lg font-bold">No terms matched your filter.</p>
            <p className="text-text-secondary text-xs mt-1">Try selecting another letter or clearing the search bar.</p>
            <button
              type="button"
              onClick={() => { setSelectedLetter(null); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 bg-accent text-bg-primary text-xs font-bold rounded-xl shadow-sm hover:opacity-90 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          Object.keys(groupedEntries).sort().map(letter => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 sticky top-0 bg-bg-primary/95 backdrop-blur-md py-1.5 z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent text-bg-primary flex items-center justify-center font-bold text-base sm:text-lg shadow-sm">
                  {letter}
                </div>
                <span className="text-xs font-mono font-bold text-text-secondary">
                  {groupedEntries[letter].length} {groupedEntries[letter].length === 1 ? 'entry' : 'entries'}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-ui-border via-ui-border/50 to-transparent" />
              </div>

              <div className="space-y-3 sm:space-y-4">
                {groupedEntries[letter].map((entry) => (
                  <motion.div
                    layout
                    key={entry.id}
                    className="p-5 sm:p-6 bg-ui-card border border-ui-border rounded-2xl shadow-sm group hover:shadow-md hover:border-accent/30 transition-all relative"
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent/40 group-hover:bg-accent transition-colors shrink-0" />
                        <h3 className="text-lg sm:text-xl font-serif text-text-primary italic font-bold tracking-tight">
                          {entry.word}
                        </h3>
                      </div>
                      <button 
                        type="button"
                        onClick={() => entry.id && handleDelete(entry.id)}
                        aria-label={`Delete ${entry.word}`}
                        className="opacity-80 sm:opacity-0 group-hover:opacity-100 p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-text-secondary leading-relaxed font-serif text-sm sm:text-base italic pl-4 border-l-2 border-accent/20 select-text">
                      {entry.definition}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Add Word Modal with Instant Duplicate Warning */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-bg-primary border border-ui-border rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-ui-border mb-4">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-accent" />
                  <h3 className="text-xl font-serif italic font-bold text-text-primary">Add Word to Lexicon</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddWordSubmit} className="space-y-4">
                {/* Word / Phrase Input */}
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Word or Phrase
                  </label>
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => {
                      setNewWord(e.target.value);
                      if (addError) setAddError(null);
                    }}
                    placeholder="e.g. Hesed, Shalom, Logos, Ruach..."
                    className="w-full bg-ui-card border border-ui-border rounded-xl px-4 py-2.5 font-serif text-base text-text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/40"
                    autoFocus
                  />
                </div>

                {/* Real-time Duplicate Warning Banner */}
                {existingDuplicateMatch && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-600 dark:text-amber-300">
                        Word Already Exists in Lexicon
                      </p>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        &ldquo;{existingDuplicateMatch.word}&rdquo; is already registered in your Lexicon Glossary. Duplicate entries are not permitted.
                      </p>
                      <p className="text-[11px] italic opacity-80 line-clamp-2 pt-0.5 border-t border-amber-500/20">
                        Current definition: &ldquo;{existingDuplicateMatch.definition}&rdquo;
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Definition Input */}
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Theological Definition & Context
                  </label>
                  <textarea
                    rows={4}
                    value={newDefinition}
                    onChange={(e) => {
                      setNewDefinition(e.target.value);
                      if (addError) setAddError(null);
                    }}
                    placeholder="Enter the original linguistic roots (Hebrew, Greek, Aramaic) and theological exposition..."
                    className="w-full bg-ui-card border border-ui-border rounded-xl px-4 py-2.5 font-serif text-sm text-text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/40 resize-none"
                  />
                </div>

                {/* Error Banner */}
                {addError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-ui-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-sans font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {existingDuplicateMatch ? (
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-500 text-xs font-sans font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Already Exists in Lexicon</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !newWord.trim() || !newDefinition.trim()}
                      className="px-5 py-2.5 rounded-xl bg-accent text-bg-primary text-xs font-sans font-bold uppercase tracking-wider shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add to Lexicon</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
