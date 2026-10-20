import { useState, useRef } from 'react';
import { 
  Landmark, 
  Search, 
  MapPin, 
  Users, 
  Sparkles, 
  Printer, 
  Download, 
  Volume2, 
  VolumeX, 
  Crown, 
  ChevronRight, 
  Calendar, 
  BookOpen, 
  ShieldAlert, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Compass,
  Maximize2,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { ThenVsNowData, UserProfile } from '../types';
import { generateThenVsNowStudy } from '../services/geminiService';
import { exportElementToPdf, exportTwoPagePdf } from '../utils/pdfExporter';
import { speakWithScholarVoice, stopScholarSpeech } from '../lib/ttsHelper';

interface ThenVsNowProps {
  isPremium: boolean;
  onUpgradeRequest: () => void;
  userProfile?: UserProfile | null;
}

const PRESET_TOPICS = [
  { name: 'Jerusalem', category: 'place' as const, label: 'Holy City of Zion', era: 'First Temple to 21st Century' },
  { name: 'Babylon & Euphrates', category: 'place' as const, label: 'Empire of Captivity', era: 'Neo-Babylonian to Modern Iraq' },
  { name: 'Mount Sinai & Wilderness', category: 'place' as const, label: 'Mountain of the Covenant', era: 'Exodus to Egyptian Desert' },
  { name: 'Pharisees & Sadducees', category: 'people' as const, label: 'Temple Era Sects', era: 'Second Temple to Modern Rabbinic' },
  { name: 'Samaria & The Samaritans', category: 'people' as const, label: 'The Divided Tribes', era: 'Old Testament to Mount Gerizim Remnant' },
  { name: 'The Exodus', category: 'event' as const, label: 'Deliverance from Bondage', era: '1446 B.C. to Global Faith Pillar' },
  { name: 'Pentecost & Upper Room', category: 'event' as const, label: 'Birth of the Church', era: 'Acts 2 to Contemporary Global Body' },
  { name: 'Body of Christ', category: 'phrase' as const, label: 'Sacred Covenant Mystery', era: 'Pauline Epistles to Modern Church' },
  { name: 'Ephesus & Asia Minor', category: 'place' as const, label: 'Seven Churches Epicenter', era: 'Apostolic Era to Turkish Heritage' },
];

export default function ThenVsNow({ isPremium, onUpgradeRequest, userProfile }: ThenVsNowProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'place' | 'people' | 'event' | 'phrase'>('place');
  const [study, setStudy] = useState<ThenVsNowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<{ url: string; title: string; era: string } | null>(null);
  const [viewMode, setViewMode] = useState<'study' | 'two-pager'>('study');
  const [docPage, setDocPage] = useState<'both' | 'front' | 'back'>('both');

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const studyTopRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (targetQuery?: string, targetCategory?: 'place' | 'people' | 'event' | 'phrase') => {
    const q = (targetQuery || query).trim();
    const cat = targetCategory || category;
    if (!q) return;

    // Premium Check: If not premium and trying to search non-demo query, prompt upgrade
    if (!isPremium && q.toLowerCase() !== 'jerusalem') {
      onUpgradeRequest();
      return;
    }

    setLoading(true);
    stopScholarSpeech();
    setIsSpeaking(false);

    try {
      const data = await generateThenVsNowStudy(q, cat);
      setStudy(data);
      setTimeout(() => {
        studyTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.error('Failed to generate study:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!study) return;
    setIsExportingPdf(true);
    try {
      const filename = `XeJesUs-ThenVsNow-2Pager-${study.query.replace(/\s+/g, '-')}`;
      if (page1Ref.current && page2Ref.current) {
        await exportTwoPagePdf(page1Ref.current, page2Ref.current, filename);
      } else if (page1Ref.current) {
        await exportElementToPdf(page1Ref.current, filename);
      }
    } catch (err) {
      console.error('2-Page PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const toggleScholarSpeech = () => {
    if (isSpeaking) {
      stopScholarSpeech();
      setIsSpeaking(false);
      return;
    }

    if (!study) return;

    const speechScript = [
      `Then versus Now theological study: ${study.title}.`,
      `Original linguistic root: ${study.originalName}.`,
      `Historical meaning: ${study.historicalMeaning}.`,
      `God's intent for the Body of Christ: ${study.godsIntentForBodyOfChrist}.`,
      `Antiquity perspective: ${study.antiquityPerspective}.`,
      `Modern perspective: ${study.modernWorldPerspective}.`,
      `Prophetic destiny in the end times: ${study.endTimesProphecy.divineDestinySummary}.`,
      `Pilgrim encouragement: ${study.pilgrimTakeaway}`
    ].join(' ');

    speakWithScholarVoice(speechScript, {
      profile: userProfile,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Demographic Chart Data Preparation
  const chartData = study?.demographicComparison?.sects?.map(s => ({
    name: s.name.length > 20 ? s.name.slice(0, 18) + '...' : s.name,
    fullName: s.name,
    Then: s.percentageThen,
    Now: s.percentageNow,
    color: s.color || '#d97706'
  })) || [];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 max-w-7xl mx-auto space-y-10">
      
      {/* Sanctuary Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-sans font-black uppercase tracking-[0.2em] shadow-sm">
          <Crown className="w-3.5 h-3.5" />
          <span>Premium Pilgrim Exegesis</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-text-primary italic tracking-tight">
          Then vs Now
        </h1>
        <p className="text-text-secondary font-serif italic text-base md:text-lg leading-relaxed">
          Traverse biblical antiquity and 21st-century reality. Investigate sacred places, generations of people, monumental events, and divine origins alongside their contemporary representation and prophetic destiny.
        </p>
      </div>

      {/* Premium Lock Banner for Basic Pilgrims */}
      {!isPremium && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-accent/15 via-accent/5 to-accent/15 border border-accent/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg"
        >
          <div className="flex items-center gap-5 text-left">
            <div className="w-14 h-14 rounded-2xl bg-accent text-bg-primary flex items-center justify-center shrink-0 shadow-md">
              <Crown className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-text-primary italic">
                Exclusive Sanctuary Privilege
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed font-serif">
                Full Then vs Now investigative exegesis, side-by-side satellite & archaeological imagery, demographic sect charts, and 1-Pager printable PDF documents are unlocked for Premium Pilgrims.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => handleSearch('Jerusalem', 'place')}
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-ui-card border border-ui-border hover:bg-accent/10 text-text-primary text-xs font-sans font-bold uppercase tracking-wider transition-all"
            >
              Test Drive Demo (Jerusalem)
            </button>
            <button
              onClick={onUpgradeRequest}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-accent text-bg-primary text-xs font-sans font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Seek Premium
            </button>
          </div>
        </motion.div>
      )}

      {/* Inquiry Input Form */}
      <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        
        {/* Category Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { id: 'place', label: 'Biblical Place', icon: MapPin },
            { id: 'people', label: 'Generation / People', icon: Users },
            { id: 'event', label: 'Biblical Event', icon: Calendar },
            { id: 'phrase', label: 'Sacred Word / Phrase', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as any)}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-sans text-xs font-bold uppercase tracking-wider transition-all border ${
                  active 
                    ? 'bg-accent text-bg-primary border-accent shadow-md' 
                    : 'bg-ui-sidebar/50 text-text-secondary border-ui-border hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                category === 'place' ? "Enter a sacred city, mountain, or territory (e.g. Jerusalem, Babylon, Mount Sinai, Antioch)..." :
                category === 'people' ? "Enter a biblical sect, tribe, or people group (e.g. Pharisees, Samaritans, Philistines, Levites)..." :
                category === 'event' ? "Enter a pivotal biblical event (e.g. The Exodus, Pentecost, Babylonian Exile, Council of Jerusalem)..." :
                "Enter a biblical phrase or origin (e.g. Body of Christ, New Covenant, Holy of Holies, Maranatha)..."
              }
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-bg-primary border border-ui-border text-text-primary text-sm font-serif italic focus:outline-none focus:border-accent shadow-inner transition-colors"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-accent text-bg-primary rounded-2xl font-sans font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                <span>Excavating...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Examine Then vs Now</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2 pt-2 border-t border-ui-border/50">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-text-secondary/70">
            Curated Excavations:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map(preset => (
              <button
                key={preset.name}
                onClick={() => {
                  setQuery(preset.name);
                  setCategory(preset.category);
                  handleSearch(preset.name, preset.category);
                }}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-ui-sidebar/60 hover:bg-accent/15 hover:border-accent/40 border border-ui-border text-text-primary transition-all flex items-center gap-1.5 group"
              >
                <span className="font-serif italic font-medium">{preset.name}</span>
                <span className="text-[9px] font-sans uppercase tracking-wider text-accent opacity-80 group-hover:opacity-100">
                  ({preset.category})
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-ui-card border border-ui-border rounded-3xl p-12 text-center space-y-6 animate-pulse">
          <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
            <Compass className="w-10 h-10 animate-spin" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-serif italic text-text-primary font-bold">Unveiling Sacred Antiquity & Modern Reality</h3>
            <p className="text-xs text-text-secondary font-serif italic">
              Gathering primary scriptures, archaeological records, Second Temple and Aksumite historical context, regional demographic sects, and end-times prophetic destinies...
            </p>
          </div>
        </div>
      )}

      {/* Interactive Study Results View */}
      {study && !loading && (
        <div ref={studyTopRef} className="space-y-8">
          
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-ui-sidebar p-4 rounded-2xl border border-ui-border">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-accent/20 border border-accent/40 text-accent text-[11px] font-sans font-bold uppercase tracking-wider">
                {study.category.toUpperCase()}
              </span>
              <span className="text-xs text-text-secondary font-serif italic">
                Subject: <strong className="text-text-primary not-italic">{study.query}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Scholar Audio Read-Aloud */}
              <button
                onClick={toggleScholarSpeech}
                className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                  isSpeaking 
                    ? 'bg-accent text-bg-primary border-accent animate-pulse shadow-md' 
                    : 'bg-ui-card text-text-primary border-ui-border hover:bg-accent/10'
                }`}
                title="Listen with Scholar's Voice"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-accent" />}
                <span>{isSpeaking ? 'Halt Voice' : 'Scholar Narration'}</span>
              </button>

              {/* View 2-Pager Document Toggle */}
              <button
                onClick={() => setViewMode(prev => prev === 'study' ? 'two-pager' : 'study')}
                className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                  viewMode === 'two-pager'
                    ? 'bg-accent text-bg-primary border-accent shadow-md'
                    : 'bg-ui-card text-text-primary border-ui-border hover:bg-accent/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{viewMode === 'two-pager' ? 'Study Exegesis' : '2-Pager Document (Front & Back)'}</span>
              </button>

              {/* Print Document */}
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-ui-card border border-ui-border text-text-primary text-xs font-sans font-bold uppercase tracking-wider hover:bg-accent/10 transition-all flex items-center gap-2"
                title="Print 2-Pager Document (Front & Back)"
              >
                <Printer className="w-4 h-4 text-accent" />
                <span>Print 2-Pager</span>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-4 py-2 rounded-xl bg-accent text-bg-primary text-xs font-sans font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
              >
                {isExportingPdf ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MODE A: FULL INTERACTIVE EXEGESIS VIEW */}
          {viewMode === 'study' && (
            <div className="space-y-8">
              
              {/* SECTION 1: HISTORICAL MEANING & GOD'S INTENT TO THE BODY OF CHRIST */}
              <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-10 shadow-xl space-y-8">
                
                {/* Title & Etymology Banner */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary italic">
                      {study.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="px-4 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent font-serif font-bold text-base tracking-wide flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{study.originalName}</span>
                    </div>
                    <span className="text-xs text-text-secondary font-serif italic">
                      {study.etymology}
                    </span>
                  </div>
                </div>

                {/* Historical Meaning */}
                <div className="p-6 rounded-2xl bg-bg-primary/50 border border-ui-border space-y-2">
                  <h4 className="text-xs font-sans font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Historical Meaning in Biblical Antiquity
                  </h4>
                  <p className="text-text-primary font-serif italic text-base leading-relaxed">
                    {study.historicalMeaning}
                  </p>
                </div>

                {/* GOD'S INTENT TO THE BODY OF CHRIST (Prominent Gilded Covenant Card) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/20 via-accent/10 to-bg-primary border-2 border-accent/40 p-6 md:p-8 shadow-2xl">
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent text-bg-primary flex items-center justify-center shadow-md">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-sans font-black uppercase tracking-[0.25em] text-accent">
                          Divine Covenant Application
                        </span>
                        <h3 className="text-2xl font-serif font-bold text-text-primary italic">
                          God's Intent to the Body of Christ
                        </h3>
                      </div>
                    </div>

                    <p className="text-text-primary font-serif text-lg md:text-xl leading-relaxed italic border-l-4 border-accent pl-5 py-1">
                      "{study.godsIntentForBodyOfChrist}"
                    </p>

                    {/* Key Scriptures */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      {study.keyScriptures?.map((item, idx) => (
                        <div key={idx} className="bg-bg-primary/80 border border-accent/20 rounded-2xl p-4 space-y-1.5 shadow-sm">
                          <p className="text-xs font-sans font-bold text-accent uppercase tracking-wider">
                            {item.ref}
                          </p>
                          <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                            "{item.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 2: SIDE-BY-SIDE VISUAL REPRESENTATION (THEN VS NOW) */}
              <div className="space-y-4">
                <div className="text-center md:text-left space-y-1">
                  <h3 className="text-2xl font-serif font-bold text-text-primary italic flex items-center gap-2.5">
                    <Globe2 className="w-6 h-6 text-accent" />
                    Side-by-Side Visual Antiquity vs. Modern Day
                  </h3>
                  <p className="text-xs text-text-secondary font-serif italic">
                    How it stood during the biblical narratives versus how it appears and functions in the 21st century.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* THEN: BIBLICAL ANTIQUITY */}
                  <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:border-accent/40 transition-all">
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      <img 
                        src={study.thenVisual.imageUrl} 
                        alt={study.thenVisual.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-accent text-bg-primary text-[10px] font-sans font-black uppercase tracking-widest shadow-md">
                          Then: Biblical Antiquity
                        </span>
                      </div>

                      <button 
                        onClick={() => setSelectedImageModal({ url: study.thenVisual.imageUrl, title: study.thenVisual.title, era: study.thenVisual.era })}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white/80 hover:text-white transition-colors"
                        title="Zoom Image"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-lg font-serif font-bold text-white italic drop-shadow-md">
                          {study.thenVisual.title}
                        </h4>
                        <p className="text-xs font-sans text-accent uppercase tracking-wider">
                          {study.thenVisual.era}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                      <p className="text-text-secondary font-serif italic text-sm leading-relaxed">
                        {study.thenVisual.description}
                      </p>

                      <div className="space-y-2 pt-3 border-t border-ui-border">
                        <p className="text-[10px] font-sans font-black uppercase tracking-wider text-accent">
                          Antiquity Architectural & Topographical Features:
                        </p>
                        <ul className="space-y-1.5">
                          {study.thenVisual.architecturalHighlights?.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-text-primary font-serif">
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* NOW: 21ST CENTURY MODERN REALITY */}
                  <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:border-accent/40 transition-all">
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      <img 
                        src={study.nowVisual.imageUrl} 
                        alt={study.nowVisual.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-sans font-black uppercase tracking-widest shadow-md">
                          Now: 21st Century Reality
                        </span>
                      </div>

                      <button 
                        onClick={() => setSelectedImageModal({ url: study.nowVisual.imageUrl, title: study.nowVisual.title, era: study.nowVisual.era })}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white/80 hover:text-white transition-colors"
                        title="Zoom Image"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-lg font-serif font-bold text-white italic drop-shadow-md">
                          {study.nowVisual.title}
                        </h4>
                        <p className="text-xs font-sans text-blue-300 uppercase tracking-wider">
                          {study.nowVisual.era}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                      <p className="text-text-secondary font-serif italic text-sm leading-relaxed">
                        {study.nowVisual.description}
                      </p>

                      <div className="space-y-2 pt-3 border-t border-ui-border">
                        <p className="text-[10px] font-sans font-black uppercase tracking-wider text-blue-500 dark:text-blue-400">
                          Contemporary Infrastructure & Archaeological Reality:
                        </p>
                        <ul className="space-y-1.5">
                          {study.nowVisual.modernHighlights?.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-text-primary font-serif">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 3: DEEP HISTORICAL PERSPECTIVE & MODERN VIEWS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-8 space-y-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-text-primary italic">
                    Antiquity Worldview
                  </h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    {study.antiquityPerspective}
                  </p>
                </div>

                <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-8 space-y-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-text-primary italic">
                    Modern World Perception
                  </h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    {study.modernWorldPerspective}
                  </p>
                </div>

                <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-8 space-y-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-text-primary italic">
                    Theological Evolution
                  </h4>
                  <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                    {study.theologicalEvolution}
                  </p>
                </div>

              </div>

              {/* SECTION 4: ILLUSTRATED CHARTS - SECTS & PEOPLE GROUPS (THEN VS TODAY) */}
              <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-10 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ui-border pb-6">
                  <div>
                    <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-accent">
                      Demographic Transformation
                    </span>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary italic">
                      Regional Sects & People Groups: Then vs. Now
                    </h3>
                    <p className="text-xs text-text-secondary font-serif italic mt-1">
                      {study.demographicComparison?.regionName}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-sans font-bold uppercase tracking-wider shrink-0">
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      Biblical Era (%)
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-500">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      Present Day (%)
                    </span>
                  </div>
                </div>

                {/* Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-text-secondary font-serif italic leading-relaxed">
                    <strong className="text-amber-500 font-sans uppercase font-bold block mb-1">Antiquity Demographics:</strong>
                    {study.demographicComparison?.summaryThen}
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-text-secondary font-serif italic leading-relaxed">
                    <strong className="text-blue-500 font-sans uppercase font-bold block mb-1">Modern Demographics:</strong>
                    {study.demographicComparison?.summaryNow}
                  </div>
                </div>

                {/* Recharts Bar Chart */}
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={11} 
                        tickLine={false} 
                        unit="%" 
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-ui-sidebar border border-ui-border p-3 rounded-xl shadow-xl space-y-1 text-xs">
                                <p className="font-serif font-bold text-text-primary">{data.fullName}</p>
                                <p className="text-amber-500 font-sans font-bold">Biblical Era: {data.Then}%</p>
                                <p className="text-blue-500 font-sans font-bold">Present Day: {data.Now}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Then" fill="#d97706" radius={[6, 6, 0, 0]} name="Then (Antiquity %)" />
                      <Bar dataKey="Now" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Now (Modern %)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Sect Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {study.demographicComparison?.sects?.map((sect, idx) => (
                    <div key={idx} className="bg-bg-primary/50 border border-ui-border rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-serif font-bold text-text-primary italic">
                          {sect.name}
                        </h5>
                        <div className="flex items-center gap-2 text-xs font-sans font-black">
                          <span className="text-amber-500">{sect.percentageThen}%</span>
                          <span className="text-text-secondary">→</span>
                          <span className="text-blue-500">{sect.percentageNow}%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-serif italic text-text-secondary">
                        <p><strong className="not-italic text-accent font-sans text-[10px] uppercase">Antiquity:</strong> {sect.descriptionThen}</p>
                        <p><strong className="not-italic text-blue-400 font-sans text-[10px] uppercase">Modern:</strong> {sect.descriptionNow}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* SECTION 5: REGIONAL CHALLENGES & GOD'S END-TIMES DEALINGS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Modern Regional Challenges */}
                <div className="bg-ui-card border border-ui-border rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-red-500">
                        Present Friction
                      </span>
                      <h4 className="text-xl font-serif font-bold text-text-primary italic">
                        Contemporary Regional Challenges
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {study.modernRegionalChallenges?.map((ch, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-bg-primary/50 border border-ui-border space-y-1.5">
                        <h6 className="text-xs font-sans font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {ch.title}
                        </h6>
                        <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                          {ch.challenge}
                        </p>
                        <p className="text-[11px] text-accent/90 font-serif italic pt-1 border-t border-ui-border/50">
                          <strong>Spiritual Dimension:</strong> {ch.spiritualSignificance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* God's End Times Prophetic Dealings */}
                <div className="bg-ui-card border-2 border-accent/30 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent text-bg-primary flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-accent">
                        Eschatological Consummation
                      </span>
                      <h4 className="text-xl font-serif font-bold text-text-primary italic">
                        How God Deals With This Region in End Times
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Scriptural Prophecies Pills */}
                    <div className="flex flex-wrap gap-2">
                      {study.endTimesProphecy?.scripturalProphecies?.map((prophecy, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-sans font-bold text-xs uppercase tracking-wider">
                          {prophecy}
                        </span>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-bg-primary/70 border border-accent/20 space-y-2">
                      <h6 className="text-[10px] font-sans font-black uppercase tracking-widest text-accent">
                        Divine Destiny Exegesis
                      </h6>
                      <p className="text-xs text-text-primary font-serif italic leading-relaxed">
                        {study.endTimesProphecy?.divineDestinySummary}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-bg-primary/70 border border-accent/20 space-y-2">
                      <h6 className="text-[10px] font-sans font-black uppercase tracking-widest text-accent">
                        God's Redemptive Plan in Christ
                      </h6>
                      <p className="text-xs text-text-primary font-serif italic leading-relaxed">
                        {study.endTimesProphecy?.godsRedemptivePlan}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 6: PILGRIM MEDITATION & PASTORAL TAKEAWAY */}
              <div className="bg-gradient-to-r from-ui-card via-ui-sidebar to-ui-card border border-accent/30 rounded-3xl p-8 text-center space-y-3 shadow-lg">
                <span className="text-[10px] font-sans font-black uppercase tracking-[0.25em] text-accent">
                  Sanctuary Pilgrim Encouragement
                </span>
                <p className="text-lg md:text-xl font-serif italic text-text-primary max-w-3xl mx-auto leading-relaxed">
                  "{study.pilgrimTakeaway}"
                </p>
              </div>

            </div>
          )}

          {/* MODE B: 2-PAGER COLORFUL ILLUSTRATED DOCUMENT VIEW (FRONT & BACK) */}
          <div className={`${viewMode === 'two-pager' ? 'block' : 'hidden'} print:block space-y-6`}>
            
            {/* Top Toolbar for 2-Pager Document */}
            <div className="bg-ui-card border border-ui-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-text-secondary print:hidden shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold uppercase tracking-wider text-text-primary text-[11px] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-accent" />
                  2-Pager Document Layout:
                </span>
                <div className="inline-flex rounded-xl bg-ui-sidebar p-1 border border-ui-border">
                  {[
                    { id: 'both', label: 'Both Pages (Front & Back)' },
                    { id: 'front', label: 'Page 1 (Front)' },
                    { id: 'back', label: 'Page 2 (Back)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDocPage(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                        docPage === tab.id
                          ? 'bg-accent text-bg-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-ui-sidebar border border-ui-border text-text-primary font-sans font-bold text-xs uppercase tracking-wider hover:bg-accent/10 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-accent" />
                  <span>Print 2-Pager</span>
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-5 py-2 rounded-xl bg-accent text-bg-primary font-sans font-bold uppercase tracking-wider text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5"
                >
                  {isExportingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                      <span>Exporting 2-Pager...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Save 2-Page PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Print Styles for Duplex (Front & Back) Printing */}
            <style>{`
              @media print {
                body { background: #ffffff !important; color: #18181b !important; }
                .print\\:hidden { display: none !important; }
                .print-page-1 {
                  page-break-after: always !important;
                  break-after: page !important;
                  margin: 0 !important;
                  border: 2px solid #b45309 !important;
                  box-shadow: none !important;
                  min-height: 100vh !important;
                }
                .print-page-2 {
                  page-break-before: always !important;
                  break-before: page !important;
                  margin: 0 !important;
                  border: 2px solid #b45309 !important;
                  box-shadow: none !important;
                  min-height: 100vh !important;
                }
              }
            `}</style>

            {/* ============================================================== */}
            {/* PAGE 1: FRONT (Sacred Antiquity, Etymology & Divine Intent)   */}
            {/* ============================================================== */}
            <div className={`${docPage === 'both' || docPage === 'front' ? 'block' : 'hidden'} print:block`}>
              <div 
                ref={page1Ref}
                id="two-pager-front"
                className="print-page-1 bg-white text-zinc-900 border-4 border-amber-600/30 p-8 md:p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto space-y-6 font-serif relative"
                style={{ backgroundColor: '#ffffff', color: '#18181b' }}
              >
                {/* Page 1 Badge */}
                <div className="absolute top-4 right-4 print:hidden">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-sans font-bold uppercase tracking-wider border border-amber-300">
                    Page 1 of 2 (Front)
                  </span>
                </div>

                {/* Page 1 Header */}
                <div className="border-b-2 border-amber-700/30 pb-4 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] text-amber-800">XeJesUs Sanctuary Exegesis</p>
                      <p className="text-xs text-zinc-500 font-sans">Part I: Sacred Antiquity & Divine Intent</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-amber-700/40 flex items-center justify-center font-bold text-amber-800 text-sm italic font-serif shadow-sm">
                      XJ
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] text-amber-800">Category: {study.category}</p>
                      <p className="text-xs text-zinc-500 font-sans">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <h1 className="text-3xl font-serif font-black italic text-amber-950 pt-2 tracking-tight">
                    {study.title}
                  </h1>
                  <p className="text-xs font-sans text-amber-800 font-bold uppercase tracking-widest">
                    Original Root: {study.originalName} • {study.etymology}
                  </p>
                </div>

                {/* Historical Meaning in Biblical Antiquity */}
                <div className="space-y-1.5 bg-amber-50/40 p-4 rounded-xl border border-amber-800/15">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-900">
                    Historical Meaning in Biblical Antiquity:
                  </p>
                  <p className="text-xs font-serif italic text-zinc-800 leading-relaxed">
                    {study.historicalMeaning}
                  </p>
                </div>

                {/* God's Intent to the Body of Christ Callout */}
                <div className="border-l-4 border-amber-600 bg-amber-100/60 p-5 rounded-r-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-800" />
                    <p className="text-[10px] font-sans font-black uppercase tracking-widest text-amber-900">
                      God's Covenant Intent to the Body of Christ:
                    </p>
                  </div>
                  <p className="text-sm font-serif italic text-zinc-900 leading-relaxed">
                    "{study.godsIntentForBodyOfChrist}"
                  </p>
                </div>

                {/* Side-by-Side Images (Then vs Now) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Then Image */}
                  <div className="border border-amber-800/20 rounded-xl overflow-hidden bg-amber-50/50 p-2.5 text-center space-y-2">
                    <div className="aspect-[16/10] overflow-hidden rounded-lg bg-zinc-200">
                      <img 
                        src={study.thenVisual.imageUrl} 
                        alt="Then" 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous" 
                      />
                    </div>
                    <div className="text-left px-1 space-y-1">
                      <span className="text-[9px] font-sans font-black uppercase tracking-wider text-amber-800 block">
                        Then: {study.thenVisual.era}
                      </span>
                      <p className="text-xs font-serif italic text-zinc-800 line-clamp-3">
                        {study.thenVisual.description}
                      </p>
                      <div className="pt-1 border-t border-amber-800/10">
                        <p className="text-[8px] font-sans font-bold uppercase text-amber-900">Antiquity Highlights:</p>
                        <p className="text-[10px] text-zinc-700 italic">
                          {study.thenVisual.architecturalHighlights?.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Now Image */}
                  <div className="border border-blue-800/20 rounded-xl overflow-hidden bg-blue-50/50 p-2.5 text-center space-y-2">
                    <div className="aspect-[16/10] overflow-hidden rounded-lg bg-zinc-200">
                      <img 
                        src={study.nowVisual.imageUrl} 
                        alt="Now" 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous" 
                      />
                    </div>
                    <div className="text-left px-1 space-y-1">
                      <span className="text-[9px] font-sans font-black uppercase tracking-wider text-blue-800 block">
                        Now: {study.nowVisual.era}
                      </span>
                      <p className="text-xs font-serif italic text-zinc-800 line-clamp-3">
                        {study.nowVisual.description}
                      </p>
                      <div className="pt-1 border-t border-blue-800/10">
                        <p className="text-[8px] font-sans font-bold uppercase text-blue-900">Modern Highlights:</p>
                        <p className="text-[10px] text-zinc-700 italic">
                          {study.nowVisual.modernHighlights?.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Primary Scriptures */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-900">
                    Primary Scriptural Anchors:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {study.keyScriptures?.map((s, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-50 border border-amber-800/15 rounded-lg space-y-0.5">
                        <p className="font-sans font-bold text-amber-800 text-[11px]">{s.ref}</p>
                        <p className="text-zinc-700 italic text-[11px] leading-relaxed">"{s.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page 1 Footer */}
                <div className="pt-4 border-t border-amber-800/20 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
                  <span>Page 1 of 2 (Front) • XeJesUs Sanctuary Publication</span>
                  <span className="uppercase tracking-widest text-amber-800 font-bold">Turn to Back Page for Demographics & End Times</span>
                </div>
              </div>
            </div>

            {/* Visual Divider Between Pages in Screen View */}
            {docPage === 'both' && (
              <div className="py-4 text-center print:hidden flex items-center justify-center gap-4">
                <div className="h-[1px] bg-ui-border flex-1 max-w-xs" />
                <span className="px-4 py-1.5 rounded-full bg-ui-card border border-ui-border text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Flip to Back Page (Part II)
                </span>
                <div className="h-[1px] bg-ui-border flex-1 max-w-xs" />
              </div>
            )}

            {/* ============================================================== */}
            {/* PAGE 2: BACK (Demographics, Regional Friction & Prophecy)     */}
            {/* ============================================================== */}
            <div className={`${docPage === 'both' || docPage === 'back' ? 'block' : 'hidden'} print:block`}>
              <div 
                ref={page2Ref}
                id="two-pager-back"
                className="print-page-2 bg-white text-zinc-900 border-4 border-amber-600/30 p-8 md:p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto space-y-6 font-serif relative"
                style={{ backgroundColor: '#ffffff', color: '#18181b' }}
              >
                {/* Page 2 Badge */}
                <div className="absolute top-4 right-4 print:hidden">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[10px] font-sans font-bold uppercase tracking-wider border border-blue-300">
                    Page 2 of 2 (Back)
                  </span>
                </div>

                {/* Page 2 Header */}
                <div className="border-b-2 border-amber-700/30 pb-4 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] text-amber-800">XeJesUs Sanctuary Exegesis</p>
                      <p className="text-xs text-zinc-500 font-sans">Part II: Demographics & Consummation</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-amber-700/40 flex items-center justify-center font-bold text-amber-800 text-sm italic font-serif shadow-sm">
                      XJ
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] text-amber-800">Region: {study.demographicComparison?.regionName}</p>
                      <p className="text-xs text-zinc-500 font-sans">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-serif font-black italic text-amber-950 pt-2 tracking-tight">
                    {study.title} (Part II)
                  </h2>
                  <p className="text-xs font-sans text-amber-800 font-bold uppercase tracking-widest">
                    Demographic Transformation • Regional Challenges • End-Times Prophetic Destiny
                  </p>
                </div>

                {/* Perspectives & Theological Evolution (3 Columns) */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-800/15 space-y-1">
                    <p className="font-sans font-bold text-amber-900 uppercase text-[9px]">Antiquity Worldview:</p>
                    <p className="text-zinc-700 italic text-[11px] leading-relaxed line-clamp-5">
                      {study.antiquityPerspective}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-800/15 space-y-1">
                    <p className="font-sans font-bold text-blue-900 uppercase text-[9px]">Modern World Perception:</p>
                    <p className="text-zinc-700 italic text-[11px] leading-relaxed line-clamp-5">
                      {study.modernWorldPerspective}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-800/15 space-y-1">
                    <p className="font-sans font-bold text-purple-900 uppercase text-[9px]">Theological Evolution:</p>
                    <p className="text-zinc-700 italic text-[11px] leading-relaxed line-clamp-5">
                      {study.theologicalEvolution}
                    </p>
                  </div>
                </div>

                {/* Regional Sects Demographic Shift Table & Progress Bars */}
                <div className="space-y-2 border-t border-b border-amber-800/20 py-3">
                  <div className="flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-wider text-amber-900">
                    <span>Regional Sects Demographic Shift ({study.demographicComparison?.regionName})</span>
                    <span>Biblical Era vs. Present Day</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {study.demographicComparison?.sects?.slice(0, 4).map((sect, i) => (
                      <div key={i} className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-zinc-900 italic truncate mr-2">{sect.name}</span>
                          <span className="font-sans font-black text-xs text-amber-800 shrink-0">
                            {sect.percentageThen}% → {sect.percentageNow}%
                          </span>
                        </div>
                        {/* Dual Progress Meter */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[8px] font-sans text-zinc-500">
                            <span className="w-8">Then:</span>
                            <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-600 rounded-full" style={{ width: `${Math.min(100, sect.percentageThen)}%` }} />
                            </div>
                            <span className="w-6 text-right font-bold text-amber-700">{sect.percentageThen}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] font-sans text-zinc-500">
                            <span className="w-8">Now:</span>
                            <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, sect.percentageNow)}%` }} />
                            </div>
                            <span className="w-6 text-right font-bold text-blue-700">{sect.percentageNow}%</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-600 italic line-clamp-1 pt-0.5">
                          Antiquity: {sect.descriptionThen}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges & End Times Prophetic Dealings */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Challenges */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-red-800">
                      Contemporary Regional Challenges:
                    </p>
                    <div className="space-y-2">
                      {study.modernRegionalChallenges?.map((ch, i) => (
                        <div key={i} className="p-2 bg-red-50/40 border border-red-200 rounded-lg space-y-0.5">
                          <p className="font-sans font-bold text-red-900 text-[10px] uppercase">{ch.title}</p>
                          <p className="text-zinc-700 italic text-[11px] leading-tight">{ch.challenge}</p>
                          <p className="text-[9px] text-amber-900 font-sans italic pt-0.5">
                            Spiritual: {ch.spiritualSignificance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* End Times Prophecy */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-900">
                      God's Dealings in End Times:
                    </p>
                    <div className="p-2.5 bg-amber-50/50 border border-amber-800/20 rounded-lg space-y-1.5">
                      <p className="font-sans font-bold text-amber-900 text-[10px]">
                        Prophetic Scriptures: {study.endTimesProphecy?.scripturalProphecies?.join(', ')}
                      </p>
                      <p className="text-zinc-800 italic text-[11px] leading-relaxed">
                        {study.endTimesProphecy?.divineDestinySummary}
                      </p>
                      <div className="pt-1 border-t border-amber-800/10">
                        <p className="text-[9px] font-sans font-bold uppercase text-amber-800">Redemptive Plan in Christ:</p>
                        <p className="text-zinc-700 italic text-[11px]">
                          {study.endTimesProphecy?.godsRedemptivePlan}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pilgrim Encouragement Footer */}
                <div className="p-3 bg-amber-100/40 rounded-xl border border-amber-800/20 text-center space-y-1">
                  <p className="text-[9px] font-sans font-black uppercase tracking-widest text-amber-900">
                    Sanctuary Pilgrim Benediction:
                  </p>
                  <p className="text-xs font-serif italic text-zinc-900 max-w-2xl mx-auto leading-relaxed">
                    "{study.pilgrimTakeaway}"
                  </p>
                </div>

                {/* Page 2 Footer */}
                <div className="pt-3 border-t border-amber-800/20 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
                  <span>Page 2 of 2 (Back) • XeJesUs Sanctuary Publication</span>
                  <span className="uppercase tracking-widest text-amber-800 font-bold">Faith Through Understanding • End of Exegesis</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Image Modal Preview */}
      <AnimatePresence>
        {selectedImageModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-video bg-black flex items-center justify-center">
                <img 
                  src={selectedImageModal.url} 
                  alt={selectedImageModal.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-6 bg-ui-sidebar border-t border-ui-border">
                <span className="text-xs font-sans uppercase font-bold text-accent tracking-widest block">
                  {selectedImageModal.era}
                </span>
                <h3 className="text-xl font-serif font-bold text-text-primary italic">
                  {selectedImageModal.title}
                </h3>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
