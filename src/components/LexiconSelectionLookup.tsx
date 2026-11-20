import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Star,
  RefreshCw,
  ArrowRight,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDefinition } from '../lib/gemini';
import {
  getAuthService,
  getDbService,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';

interface LexiconSelectionLookupProps {
  hasLexiconAccess: boolean;
  isGuest: boolean;
  currentPage: string;
  onUpgradeRequest: (feature: string) => void;
  onPromptLogin?: () => void;
  onOpenGlossary?: () => void;
}

interface FloatingPillPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

const CLEAN_EDGE_PUNCTUATION_REGEX = /^[\s"'“”‘’.,;:!?()[\]{}—–-]+|[\s"'“”‘’.,;:!?()[\]{}—–-]+$/g;

function cleanSelectedTerm(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  const stripped = collapsed.replace(CLEAN_EDGE_PUNCTUATION_REGEX, '').trim();
  return stripped || collapsed;
}

function isSelectionInsideIgnoredElement(node: Node | null): boolean {
  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : node?.parentElement || null;

  while (current) {
    const tag = current.tagName;
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      tag === 'OPTION' ||
      current.isContentEditable ||
      current.getAttribute('data-lexicon-ignore') === 'true'
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function extractContextFromNode(node: Node | null, currentPage: string): string {
  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : node?.parentElement || null;

  let explicitContext = '';
  let surroundingText = '';

  if (current && current.textContent) {
    surroundingText = current.textContent.trim().replace(/\s+/g, ' ').slice(0, 260);
  }

  while (current) {
    const ctx = current.getAttribute('data-lexicon-context');
    if (ctx) {
      explicitContext = ctx;
      break;
    }
    current = current.parentElement;
  }

  const parts: string[] = [];
  if (explicitContext) parts.push(explicitContext);
  else parts.push(`XeJesUs sanctuary page: ${currentPage}`);

  if (surroundingText) parts.push(`Surrounding passage: "${surroundingText}"`);
  return parts.join('. ');
}

export default function LexiconSelectionLookup({
  hasLexiconAccess,
  isGuest,
  currentPage,
  onUpgradeRequest,
  onPromptLogin,
  onOpenGlossary
}: LexiconSelectionLookupProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionContext, setSelectionContext] = useState('');
  const [pillPosition, setPillPosition] = useState<FloatingPillPosition | null>(null);

  // Lookup modal states
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupTerm, setLookupTerm] = useState('');
  const [isDefining, setIsDefining] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [definitionResult, setDefinitionResult] = useState<{
    word: string;
    definition: string;
  } | null>(null);

  // Save to Lexicon Glossary states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isDuplicateInLexicon, setIsDuplicateInLexicon] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const selectedTextRef = useRef('');
  const selectionContextRef = useRef('');
  const isLookupOpenRef = useRef(false);
  const pillRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isLookupOpenRef.current = isLookupOpen;
  }, [isLookupOpen]);

  // Dismiss floating pill on page navigation
  useEffect(() => {
    if (!isLookupOpenRef.current) {
      setPillPosition(null);
      setSelectedText('');
      selectedTextRef.current = '';
    }
  }, [currentPage]);

  const updateSelectionFromDOM = useCallback(() => {
    if (isLookupOpenRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setPillPosition(null);
      return;
    }

    const rawText = selection.toString();
    const cleaned = cleanSelectedTerm(rawText);

    if (!cleaned || cleaned.length < 2 || cleaned.length > 160) {
      setPillPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    if (isSelectionInsideIgnoredElement(commonAncestor)) {
      return;
    }

    let rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const clientRects = range.getClientRects();
      if (clientRects.length > 0) {
        rect = clientRects[0];
      } else {
        setPillPosition(null);
        return;
      }
    }

    // Ignore selections scrolled completely out of the visible viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setPillPosition(null);
      return;
    }

    const context = extractContextFromNode(range.startContainer, currentPage);
    selectedTextRef.current = cleaned;
    selectionContextRef.current = context;
    setSelectedText(cleaned);
    setSelectionContext(context);

    const pillWidth = Math.min(268, window.innerWidth - 24);
    const idealLeft = rect.left + rect.width / 2 - pillWidth / 2;
    const clampedLeft = Math.max(12, Math.min(window.innerWidth - pillWidth - 12, idealLeft));

    // Place above selection if there's room, otherwise below
    const placement: 'top' | 'bottom' = rect.top >= 76 ? 'top' : 'bottom';
    const calculatedTop =
      placement === 'top'
        ? Math.max(12, rect.top - 54)
        : Math.min(window.innerHeight - 62, rect.bottom + 12);

    setPillPosition({
      top: calculatedTop,
      left: clampedLeft,
      placement
    });
  }, [currentPage]);

  useEffect(() => {
    const scheduleSelectionCheck = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updateSelectionFromDOM();
      }, 110);
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (isLookupOpenRef.current) return;
      if (pillRef.current && pillRef.current.contains(e.target as Node)) {
        return;
      }
      setPillPosition(null);
    };

    const handleScroll = () => {
      if (!isLookupOpenRef.current && pillRef.current) {
        updateSelectionFromDOM();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLookupOpenRef.current) {
          closeLookupModal();
        } else {
          setPillPosition(null);
        }
      }
    };

    document.addEventListener('selectionchange', scheduleSelectionCheck, { passive: true });
    document.addEventListener('mouseup', scheduleSelectionCheck, { passive: true });
    document.addEventListener('touchend', scheduleSelectionCheck, { passive: true });
    document.addEventListener('keyup', scheduleSelectionCheck, { passive: true });
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      document.removeEventListener('selectionchange', scheduleSelectionCheck);
      document.removeEventListener('mouseup', scheduleSelectionCheck);
      document.removeEventListener('touchend', scheduleSelectionCheck);
      document.removeEventListener('keyup', scheduleSelectionCheck);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateSelectionFromDOM]);

  const closeLookupModal = () => {
    setIsLookupOpen(false);
    setPillPosition(null);
    setLookupError(null);
    setSaveError(null);
    setDefinitionResult(null);
    setAddedSuccess(false);
    setDuplicateWarning(null);
    setIsDuplicateInLexicon(false);
    setIsDefining(false);
    setIsSaving(false);
  };

  const runLookup = async (termToLookup: string, ctx: string) => {
    const cleanTerm = termToLookup.trim().slice(0, 200);
    if (!cleanTerm) return;

    setLookupTerm(cleanTerm);
    setIsLookupOpen(true);
    setPillPosition(null);
    setIsDefining(true);
    setLookupError(null);
    setSaveError(null);
    setDefinitionResult(null);
    setAddedSuccess(false);
    setDuplicateWarning(null);
    setIsDuplicateInLexicon(false);

    try {
      const definition = await fetchDefinition(cleanTerm, ctx);
      if (!definition || !definition.trim()) {
        throw new Error('XeJesUs returned an empty definition. Please try again.');
      }

      setDefinitionResult({
        word: cleanTerm,
        definition: definition.trim()
      });

      // Check if word or phrase already exists in the Pilgrim's Lexicon Glossary
      const auth = getAuthService();
      const db = getDbService();
      if (auth?.currentUser && !auth.currentUser.isAnonymous && db) {
        try {
          const glossaryPath = `users/${auth.currentUser.uid}/glossary`;
          const snapshot = await getDocs(collection(db, glossaryPath));
          const normalizedTarget = cleanTerm.toLowerCase();
          const match = snapshot.docs.find((d) => {
            const w = d.data().word;
            return typeof w === 'string' && w.trim().toLowerCase() === normalizedTarget;
          });
          if (match) {
            setIsDuplicateInLexicon(true);
            setDuplicateWarning(
              `"${cleanTerm}" is already saved in your Lexicon Glossary.`
            );
          }
        } catch (checkErr) {
          console.warn('Could not check existing lexicon entries:', checkErr);
        }
      }
    } catch (err: any) {
      console.error('XeJesUs Lexicon Lookup failed:', err);
      setLookupError(
        err?.message || 'Unable to consult the XeJesUs Lexicon right now. Please try again.'
      );
    } finally {
      setIsDefining(false);
    }
  };

  const handleLookupClick = () => {
    const term = selectedTextRef.current || selectedText;
    const ctx = selectionContextRef.current || selectionContext;
    if (!term) return;

    if (!hasLexiconAccess) {
      setPillPosition(null);
      onUpgradeRequest('Lexicon Glossary & Word Lookup');
      return;
    }

    runLookup(term, ctx);
  };

  const handleAddToGlossary = async () => {
    if (!definitionResult || isSaving || addedSuccess) return;

    const auth = getAuthService();
    const db = getDbService();

    if (!auth?.currentUser || auth.currentUser.isAnonymous || isGuest) {
      setSaveError('Please sign in with your Google account to save words to your personal Lexicon Glossary.');
      return;
    }

    if (!db) {
      setSaveError('Sanctuary database is temporarily unavailable. Please try again.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const path = `users/${auth.currentUser.uid}/glossary`;
    const safeWord = definitionResult.word.trim().slice(0, 200);
    const safeDefinition = definitionResult.definition.trim().slice(0, 5000);

    try {
      // Re-verify against Firestore to prevent duplicate entries
      const snapshot = await getDocs(collection(db, path));
      const normalizedTarget = safeWord.toLowerCase();
      const existing = snapshot.docs.find((d) => {
        const w = d.data().word;
        return typeof w === 'string' && w.trim().toLowerCase() === normalizedTarget;
      });

      if (existing) {
        setIsDuplicateInLexicon(true);
        setDuplicateWarning(`"${safeWord}" already exists in your Lexicon Glossary.`);
        setIsSaving(false);
        return;
      }

      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        word: safeWord,
        definition: safeDefinition,
        createdAt: serverTimestamp()
      });

      setAddedSuccess(true);
      setDuplicateWarning(null);
      setIsDuplicateInLexicon(false);
      // Notify Glossary component if open or mounted
      window.dispatchEvent(new CustomEvent('xejesus-lexicon-updated'));
    } catch (err: any) {
      console.error('Failed to add term to Lexicon Glossary:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch {
        // Avoid crashing the UI; surface friendly message inside modal
      }
      setSaveError(
        'Could not save to your Lexicon Glossary. Please verify your connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Stage 1: Compact Floating Lookup Pill near Highlighted Word/Phrase */}
      <AnimatePresence>
        {pillPosition && !isLookupOpen && selectedText && (
          <motion.div
            ref={pillRef}
            data-lexicon-ignore="true"
            initial={{ opacity: 0, scale: 0.92, y: pillPosition.placement === 'top' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.14 }}
            className="fixed z-[9999] bg-text-primary text-bg-primary p-1.5 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-1 select-none"
            style={{
              left: pillPosition.left,
              top: pillPosition.top
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                // Keep browser text highlight intact until click fires
                e.preventDefault();
              }}
              onClick={handleLookupClick}
              title={`Lookup "${selectedText}" in XeJesUs Lexicon`}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-accent group-hover:rotate-12 transition-transform shrink-0" />
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-accent whitespace-nowrap flex items-center gap-1.5">
                Lookup in XeJesUs
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
              </span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPillPosition(null)}
              aria-label="Dismiss lookup"
              className="p-1.5 text-bg-primary/60 hover:text-bg-primary hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Pointer triangle */}
            {pillPosition.placement === 'top' ? (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-text-primary rotate-45 border-r border-b border-white/20 pointer-events-none" />
            ) : (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-text-primary rotate-45 border-l border-t border-white/20 pointer-events-none" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2: Responsive Centered XeJesUs Lexicon Lookup & Save Modal */}
      <AnimatePresence>
        {isLookupOpen && (
          <div
            data-lexicon-ignore="true"
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLookupModal}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col bg-ui-card text-text-primary rounded-[2rem] shadow-2xl border-2 border-accent/30 overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-accent via-amber-400 to-accent shrink-0" />

              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-ui-border flex items-start justify-between gap-4 shrink-0 bg-ui-sidebar/40">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-sans font-black uppercase tracking-widest mb-1.5">
                    <BookOpen className="w-3 h-3" />
                    <span>XeJesUs Lexicon Lookup</span>
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif italic font-bold text-text-primary break-words leading-snug">
                    &ldquo;{lookupTerm}&rdquo;
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeLookupModal}
                  aria-label="Close Lexicon Lookup"
                  className="p-2 rounded-xl bg-bg-primary/60 text-text-secondary hover:text-text-primary hover:bg-bg-primary border border-ui-border transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {isDefining ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                    <div>
                      <p className="font-serif italic text-lg font-bold text-text-primary">
                        Unveiling Scriptural Meaning...
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Consulting Hebrew, Aramaic, Greek, Ge&apos;ez &amp; Canonical Lexicons
                      </p>
                    </div>
                  </div>
                ) : lookupError ? (
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-4">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        Lookup Interrupted
                      </p>
                      <p className="text-xs text-text-primary leading-relaxed">
                        {lookupError}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runLookup(lookupTerm, selectionContextRef.current)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-xs font-sans font-bold uppercase tracking-wider shadow-sm hover:opacity-95 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                ) : definitionResult ? (
                  <>
                    {isDuplicateInLexicon && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/15 border border-amber-500/35 rounded-2xl text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-700 dark:text-amber-300">
                            Already in Your Lexicon Glossary
                          </p>
                          <p className="text-text-secondary leading-relaxed mt-0.5">
                            {duplicateWarning ||
                              `"${definitionResult.word}" is already saved in your Lexicon Glossary.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {addedSuccess && (
                      <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          &ldquo;{definitionResult.word}&rdquo; has been added to your Lexicon Glossary!
                        </span>
                      </div>
                    )}

                    {saveError && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    <div className="p-5 rounded-2xl bg-bg-primary/60 border border-ui-border">
                      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-accent mb-2">
                        Theological &amp; Linguistic Exposition
                      </p>
                      <div className="font-serif text-base sm:text-lg leading-relaxed text-text-primary whitespace-pre-wrap select-text">
                        {definitionResult.definition}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Footer Actions */}
              {!isDefining && definitionResult && (
                <div className="px-6 py-4 border-t border-ui-border bg-ui-sidebar/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                  {isGuest ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeLookupModal();
                        onPromptLogin?.();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-accent text-bg-primary font-sans font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Save to Lexicon</span>
                    </button>
                  ) : addedSuccess || isDuplicateInLexicon ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeLookupModal();
                        onOpenGlossary?.();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-accent text-bg-primary font-sans font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Open Lexicon Glossary</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddToGlossary}
                      disabled={isSaving}
                      className="flex-1 py-3 px-5 rounded-xl bg-accent text-bg-primary font-sans font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adding to Lexicon...</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-4 h-4" />
                          <span>Add to Lexicon Glossary</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeLookupModal}
                    className="py-3 px-4 rounded-xl bg-ui-card border border-ui-border text-text-secondary hover:text-text-primary font-sans font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
