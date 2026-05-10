import { useState, useEffect } from 'react';
import { getDbService, doc, getDoc, handleFirestoreError, OperationType, collection, getDocs, query, where, addDoc, serverTimestamp, getAuthService } from '../lib/firebase';
import { Inquiry, BibleGroup } from '../types';
import { ChevronLeft, ChevronRight, Map, Video, BookOpen, Sparkles, MessageSquare, ExternalLink, Share2, Users, Loader2, Check, X, GraduationCap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { fetchDefinition } from '../lib/gemini';
import PremiumOverlay from './PremiumOverlay';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface InquiryDetailsProps {
  inquiryId: string;
  onBack: () => void;
  isPremium: boolean;
}

const TEST_INQUIRIES: Inquiry[] = [
  {
    id: 'test-1',
    userId: 'guest',
    query: "Jesus wept.  Why was He crying? He knew He was going to Raise Lazarus.",
    scripture: "John 11:35",
    interpretation: "Jesus' tears were not from despair over Lazarus' death, but a profound demonstration of His fully human nature and empathy. Even though He knew the victory was imminent, He shared in the grief of Martha, Mary, and the community. It highlights that divinity does not detach God from human sorrow.",
    historicalContext: "In 1st century Jewish culture, mourning was a communal and vocal event. Jesus entering this space and weeping identified Him as the 'Man of Sorrows' (Isaiah 53).",
    grammarAnalysis: "The Greek word used is 'edakrysen', which implies a quiet shedding of tears, different from the 'eklaisen' (loud wailing) used to describe the crowd.",
    literaryGenre: "Gospel Narrative - Historical Account with deep theological underpinnings.",
    godIntent: "To manifest the compassion of the Father. Even when God knows the end from the beginning, He is deeply moved by our present pain.",
    crossReferences: ["Isaiah 53:3", "Hebrews 4:15", "Luke 19:41"],
    geography: {
      location: "Bethany",
      thenDesc: "A small village on the eastern slope of the Mount of Olives, near Jerusalem.",
      nowDesc: "Known as al-Eizariya in the West Bank, home to the Tomb of Lazarus.",
    },
    createdAt: { toDate: () => new Date(Date.now() - 3600000) }
  },
  {
    id: 'test-shared-1',
    userId: 'other',
    userEmail: 'scholar@sanctuary.org',
    query: "Jesus wept.  Why was He crying? He knew He was going to Raise Lazarus.",
    scripture: "John 11:35",
    interpretation: "Jesus' tears were not from despair over Lazarus' death, but a profound demonstration of His fully human nature and empathy. Even though He knew the victory was imminent, He shared in the grief of Martha, Mary, and the community. It highlights that divinity does not detach God from human sorrow.",
    historicalContext: "In 1st century Jewish culture, mourning was a communal and vocal event. Jesus entering this space and weeping identified Him as the 'Man of Sorrows' (Isaiah 53).",
    grammarAnalysis: "The Greek word used is 'edakrysen', which implies a quiet shedding of tears, different from the 'eklaisen' (loud wailing) used to describe the crowd.",
    literaryGenre: "Gospel Narrative - Historical Account with deep theological underpinnings.",
    godIntent: "To manifest the compassion of the Father. Even when God knows the end from the beginning, He is deeply moved by our present pain.",
    crossReferences: ["Isaiah 53:3", "Hebrews 4:15", "Luke 19:41"],
    geography: {
      location: "Bethany",
      thenDesc: "A small village on the eastern slope of the Mount of Olives, near Jerusalem.",
      nowDesc: "Known as al-Eizariya in the West Bank, home to the Tomb of Lazarus.",
    },
    createdAt: { toDate: () => new Date(Date.now() - 3600000) }
  },
  {
    id: 'test-2',
    userId: 'guest',
    query: "The significance of the 153 fish in Peter's net.",
    scripture: "John 21:11",
    interpretation: "While many symbolic interpretations exist (representing all known nations or tribes), the primary meaning is the abundance found in obedience to Christ. It marks the transition from 'fishermen' to 'fishers of men'.",
    historicalContext: "Fishing on the Sea of Galilee was a major industry. Such a specific count suggests an eyewitness account of a literal miracle.",
    grammarAnalysis: "The specificity of the number 'hekaton pentēkonta triōn' emphasizes the overwhelming nature of the haul.",
    literaryGenre: "Post-Resurrection Appearance Narrative.",
    godIntent: "To show that following Jesus' command leads to a harvest beyond human calculation.",
    crossReferences: ["Luke 5:4-11", "Matthew 4:19", "Ezekiel 47:10"],
    geography: {
      location: "Sea of Galilee",
      thenDesc: "The primary freshwater source in Roman Palestine, surrounded by fishing villages like Capernaum.",
      nowDesc: "Also known as Lake Tiberias, it remains Israel's largest freshwater lake.",
    },
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }
  }
];

export default function InquiryDetails({ inquiryId, onBack, isPremium }: InquiryDetailsProps) {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettingsGuidance, setShowSettingsGuidance] = useState(false);
  const [activeTab, setActiveTab] = useState<'faith' | 'academic' | 'geo' | 'video'>('faith');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState<'groups' | 'individual'>('groups');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [myGroups, setMyGroups] = useState<BibleGroup[]>([]);
  const [sharing, setSharing] = useState<string | null>(null); // groupId or 'individual'
  const [shareSuccess, setShareSuccess] = useState(false);
  const [bibleWebsite, setBibleWebsite] = useState<string | null>(null);
  const [showGmailWarning, setShowGmailWarning] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Image Magnification State
  const [magnifiedImage, setMagnifiedImage] = useState<{ url: string, title: string, description: string } | null>(null);
  
  // Glossary Selection State
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number, y: number } | null>(null);
  const [isDefining, setIsDefining] = useState(false);
  const [definitionResult, setDefinitionResult] = useState<{ word: string, definition: string } | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState<{ isOpen: boolean, feature: string }>({ isOpen: false, feature: '' });

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 1 && text.length < 50) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY
        });
      }
    } else {
      if (!isDefining && !definitionResult) {
        setSelectionPosition(null);
      }
    }
  };

  const askForMeaning = async () => {
    if (!isPremium) {
      setShowPremiumModal({ isOpen: true, feature: 'Lexicon Glossary' });
      return;
    }
    if (!selectedText) return;
    setIsDefining(true);
    try {
      const context = `Biblical study of ${inquiry?.scripture}. Query: ${inquiry?.query}`;
      const definition = await fetchDefinition(selectedText, context);
      setDefinitionResult({ word: selectedText, definition });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDefining(false);
    }
  };

  const addToGlossary = async () => {
    if (!definitionResult) return;
    const auth = getAuthService();
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/glossary`;
    try {
      await addDoc(collection(getDbService(), path), {
        userId: auth.currentUser.uid,
        word: definitionResult.word,
        definition: definitionResult.definition,
        createdAt: serverTimestamp()
      });
      setDefinitionResult(null);
      setSelectionPosition(null);
      setSelectedText('');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const auth = getAuthService();
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(getDbService(), 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setBibleWebsite(data.bibleWebsite || null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserPreferences();
  }, []);

  const getBibleLink = (ref: string) => {
    if (!bibleWebsite) return null;
    const cleanRef = encodeURIComponent(ref.trim());
    
    // Handle BibleGateway specifically if they just put the domain
    if (bibleWebsite.toLowerCase().includes('biblegateway.com') && !bibleWebsite.includes('search=')) {
      return `https://www.biblegateway.com/passage/?search=${cleanRef}`;
    }
    
    // Handle Blue Letter Bible
    if (bibleWebsite.toLowerCase().includes('blueletterbible.org') && !bibleWebsite.includes('Criteria=')) {
      return `https://www.blueletterbible.org/search/preSearch.cfm?Criteria=${cleanRef}`;
    }

    // Generic fallback
    if (bibleWebsite.endsWith('=') || bibleWebsite.endsWith('/')) {
      return `${bibleWebsite}${cleanRef}`;
    }
    return `${bibleWebsite}${bibleWebsite.includes('?') ? '&' : '?'}search=${cleanRef}`;
  };

  useEffect(() => {
    const fetchInquiry = async () => {
      // Handle test IDs first
      const testInq = TEST_INQUIRIES.find(t => t.id === inquiryId);
      if (testInq) {
        setInquiry(testInq);
        setSenderEmail(testInq.userEmail || null);
        setLoading(false);
        return;
      }

      const docPath = `inquiries/${inquiryId}`;
      try {
        const snapshot = await getDoc(doc(getDbService(), docPath));
        if (snapshot.exists()) {
          const data = snapshot.data();
          setInquiry({ id: snapshot.id, ...data } as Inquiry);
          
          if (data.userEmail) {
            setSenderEmail(data.userEmail);
          } else if (data.userId) {
            // Fetch profile for earlier inquiries that don't have userEmail saved
            try {
              const userProfileDoc = await getDoc(doc(getDbService(), 'users', data.userId));
              if (userProfileDoc.exists()) {
                setSenderEmail(userProfileDoc.data().email);
              }
            } catch (e) {
              console.warn("Could not fetch sender email profile", e);
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, docPath);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiry();
  }, [inquiryId]);

  const handleShareClick = async () => {
    setShowShareModal(true);
    if (!getAuthService().currentUser) return;
    
    // In a real app we'd query groups/members, but for now we'll just query all groups
    const groupsPath = 'groups';
    try {
      const q = query(collection(getDbService(), groupsPath));
      const snapshot = await getDocs(q);
      setMyGroups(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BibleGroup)));
    } catch (e) {
      console.error(e);
    }
  };

  const shareToGroup = async (groupId: string) => {
    setSharing(groupId);
    try {
      const discussionsPath = `groups/${groupId}/discussions`;
      
      // Check for existing share to prevent duplicates
      const currentUserId = getAuthService().currentUser?.uid;
      const q = query(
        collection(getDbService(), discussionsPath), 
        where('inquiryId', '==', inquiryId),
        where('sharedBy', '==', currentUserId)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        setShareSuccess(true);
        setTimeout(() => {
          setShareSuccess(false);
          setShowShareModal(false);
        }, 1500);
        return;
      }

      await addDoc(collection(getDbService(), discussionsPath), {
        groupId,
        inquiryId,
        sharedBy: currentUserId,
        createdAt: serverTimestamp()
      });
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setShowShareModal(false);
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(null);
    }
  };

  const shareToIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getAuthService().currentUser || !recipientEmail) return;
    
    const email = recipientEmail.toLowerCase().trim();
    // Basic email validation instead of strict @gmail.com check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    
    setEmailError(null);
    setSharing('individual');
    try {
      const sharesPath = 'direct_shares';
      const emailLower = email.toLowerCase().trim();
      const currentUserId = getAuthService().currentUser?.uid;

      // Check for existing share to prevent duplicates
      const q = query(
        collection(getDbService(), sharesPath),
        where('inquiryId', '==', inquiryId),
        where('recipientEmail', '==', emailLower),
        where('senderId', '==', currentUserId)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        setEmailError('This seeking has already been shared with this individual.');
        setSharing(null);
        return;
      }

      await addDoc(collection(getDbService(), sharesPath), {
        senderId: currentUserId,
        recipientEmail: emailLower,
        inquiryId,
        createdAt: serverTimestamp()
      });
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setShowShareModal(false);
        setRecipientEmail('');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(null);
    }
  };

  const handleMagnify = (img: { url: string, title: string, description: string }) => {
    if (!isPremium) {
      setShowPremiumModal({ isOpen: true, feature: 'Image Magnification' });
      return;
    }
    setMagnifiedImage(img);
  };

  const handleTabClick = (tabId: string, label: string) => {
    if (tabId === 'video' && !isPremium) {
      setShowPremiumModal({ isOpen: true, feature: 'Living Word Media' });
      return;
    }
    setActiveTab(tabId as any);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Sparkles className="w-8 h-8 text-gold animate-pulse" />
        <p className="font-serif italic text-divine-blue">Opening the scroll...</p>
      </div>
    );
  }

  if (!inquiry) return <div>Inquiry not found.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-accent mb-8 group transition-colors"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-sans font-bold text-sm tracking-wide uppercase">Back to Library</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Headers and Navigation */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            {senderEmail && inquiry.userId !== getAuthService().currentUser?.uid && (
              <div className="text-[10px] font-sans font-black text-text-secondary uppercase tracking-[0.3em] mb-1 opacity-60">
                Shared by: {senderEmail}
              </div>
            )}
            {getBibleLink(inquiry.scripture) ? (
              <a 
                href={getBibleLink(inquiry.scripture)!} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] block mb-2 hover:underline inline-flex items-center gap-1"
              >
                {inquiry.scripture}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <button 
                onClick={() => setShowSettingsGuidance(true)}
                className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] block mb-2 hover:opacity-70 transition-opacity text-left cursor-help"
                title="Configure Bible Link in Settings"
              >
                {inquiry.scripture}
              </button>
            )}
            <h1 className="text-4xl font-serif text-text-primary leading-tight mb-4 italic font-bold">{inquiry.query}</h1>
            <div className="text-xs text-text-secondary font-sans uppercase tracking-widest opacity-60">Seeked on {new Date(inquiry.createdAt?.toDate()).toLocaleDateString()}</div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { id: 'faith', label: 'God\'s Intent', icon: Sparkles, emoji: '✨' },
              { id: 'academic', label: 'Exegesis & Context', icon: BookOpen, emoji: '📜' },
              { id: 'geo', label: 'Geographical Journey', icon: Map, emoji: '🗺️' },
              { id: 'video', label: 'Living Word Media', icon: Video, emoji: '🎥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.label)}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-left font-sans text-sm font-semibold border ${
                  activeTab === tab.id 
                    ? 'bg-text-primary text-bg-primary shadow-lg border-text-primary' 
                    : 'bg-ui-card hover:bg-ui-sidebar text-text-secondary border-ui-border'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                <span className="tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-8 bg-ui-card rounded-[2rem] border border-ui-border shadow-sm">
            <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Community Study
            </h3>
            <button 
              onClick={handleShareClick}
              className="w-full py-4 bg-bg-primary border border-ui-border text-text-primary rounded-xl text-xs font-sans font-bold shadow-sm hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Share with Group and/or Individual
            </button>
          </div>
        </div>

        {/* Right Column: Content Area */}
        <div className="lg:col-span-2" onMouseUp={handleMouseUp}>
          <div className="bg-ui-card rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-ui-border min-h-[600px] relative overflow-hidden">
             {activeTab === 'faith' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                  <div className="p-10 bg-bg-primary/50 rounded-3xl border-l-4 border-accent italic font-serif text-3xl leading-relaxed text-text-primary shadow-inner">
                    "{inquiry.godIntent}"
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <h3 className="font-serif text-2xl text-text-primary italic mb-6 font-bold">Detailed Interpretation</h3>
                    <div className="markdown-body font-serif text-xl leading-relaxed space-y-6 text-text-secondary">
                      <Markdown>{inquiry.interpretation}</Markdown>
                    </div>
                  </div>
                  
                  {inquiry.crossReferences && inquiry.crossReferences.length > 0 && (
                    <div className="pt-10 border-t border-ui-border">
                      <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-6">Cross References</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {inquiry.crossReferences.map((ref, idx) => {
                          const link = getBibleLink(ref);
                          return (
                            <div key={idx} className="p-6 bg-ui-sidebar/30 rounded-2xl flex items-start gap-4 border border-ui-border group/ref">
                              <BookOpen className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                              <div className="flex flex-col gap-1">
                                {link ? (
                                  <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm italic font-serif leading-relaxed text-accent hover:underline flex items-center gap-2"
                                  >
                                    {ref}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/ref:opacity-100 transition-opacity" />
                                  </a>
                                ) : (
                                  <button 
                                    onClick={() => setShowSettingsGuidance(true)}
                                    className="text-sm italic font-serif leading-relaxed text-text-secondary hover:text-accent transition-colors text-left cursor-help"
                                    title="Configure Bible Link in Settings"
                                  >
                                    {ref}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
               </motion.div>
             )}

             {activeTab === 'academic' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                  <section>
                    <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-6">Exegesis & Historical Context</h3>
                    <div className="text-xl leading-relaxed text-text-secondary font-serif space-y-4">
                       <Markdown>{inquiry.historicalContext}</Markdown>
                    </div>
                  </section>

                  <div className="grid md:grid-cols-2 gap-12">
                    <section>
                      <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-6">Literary Genre</h3>
                      <div className="p-8 bg-bg-primary/50 rounded-3xl border border-ui-border italic text-text-secondary/80 text-lg shadow-sm">
                         {inquiry.literaryGenre}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-6">Grammatical Analysis</h3>
                      <div className="text-lg leading-relaxed text-text-secondary italic border-l-2 border-accent/20 pl-6">
                         <Markdown>{inquiry.grammarAnalysis}</Markdown>
                      </div>
                    </section>
                  </div>
               </motion.div>
             )}

             {activeTab === 'geo' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                  <header className="flex justify-between items-end border-b border-ui-border pb-6">
                    <div>
                      <h3 className="text-4xl font-serif text-text-primary italic font-bold">{inquiry.geography.location}</h3>
                      <p className="text-text-secondary opacity-60 italic font-serif mt-2 text-lg">Connecting the Holy Land across the ages</p>
                    </div>
                    <Map className="w-12 h-12 text-accent/20" />
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <button 
                        onClick={() => handleMagnify({
                          url: inquiry.geography.thenImageUrl || `https://images.unsplash.com/photo-1548625361-91e84fc11993?auto=format&fit=crop&q=80&w=1200`,
                          title: "In Biblical Times",
                          description: inquiry.geography.thenDesc
                        })}
                        className="w-full text-left aspect-[4/3] bg-ui-sidebar rounded-[2rem] overflow-hidden relative group shadow-sm border border-ui-border transition-all hover:shadow-xl cursor-zoom-in"
                      >
                        <img 
                          src={inquiry.geography.thenImageUrl || `https://images.unsplash.com/photo-1548625361-91e84fc11993?auto=format&fit=crop&q=80&w=800`} 
                          alt="Historical Region"
                          className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-8 flex items-end">
                          <span className="text-white font-serif italic text-xl">In Biblical Times</span>
                        </div>
                      </button>
                      <div className="p-8 bg-bg-primary/50 rounded-3xl border border-ui-border italic text-lg leading-relaxed text-text-secondary shadow-inner">
                        {inquiry.geography.thenDesc}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <button 
                         onClick={() => handleMagnify({
                           url: inquiry.geography.nowImageUrl || `https://images.unsplash.com/photo-1544971510-91a787a7187e?auto=format&fit=crop&q=80&w=1200`,
                           title: "Region Today",
                           description: inquiry.geography.nowDesc
                         })}
                         className="w-full text-left aspect-[4/3] bg-ui-sidebar rounded-[2rem] overflow-hidden relative group shadow-sm border border-ui-border transition-all hover:shadow-xl cursor-zoom-in"
                      >
                        <img 
                          src={inquiry.geography.nowImageUrl || `https://images.unsplash.com/photo-1544971510-91a787a7187e?auto=format&fit=crop&q=80&w=800`} 
                          alt="Modern Region"
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-8 flex items-end">
                          <span className="text-white font-serif italic text-xl">Region Today</span>
                        </div>
                      </button>
                      <div className="p-8 bg-bg-primary/50 rounded-3xl border border-ui-border italic text-lg leading-relaxed text-text-secondary shadow-inner">
                        {inquiry.geography.nowDesc}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-bg-primary/30 rounded-2xl text-center text-xs text-text-secondary/40 uppercase tracking-[0.4em] font-sans">
                    Images are illustrative of the historical region and its modern atmosphere
                  </div>
               </motion.div>
             )}

             {activeTab === 'video' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                  <div className="text-center p-16 bg-text-primary text-bg-primary rounded-[3rem] shadow-2xl relative overflow-hidden border border-ui-border/10">
                    <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                      <Video className="w-64 h-64" />
                    </div>
                    <Video className="w-20 h-20 text-accent mx-auto mb-8 relative z-10" />
                    <h3 className="text-4xl font-serif mb-6 relative z-10 italic font-bold">Living Word Media</h3>
                    <p className="opacity-70 mb-10 max-w-sm mx-auto font-sans text-sm tracking-wide relative z-10 leading-relaxed italic">Explore academic TEACHINGS and geographical archaeological series curated for this passage.</p>
                    
                    <a 
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(inquiry.videoClipQuery || inquiry.scripture + ' exegesis')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-10 py-5 bg-bg-primary text-text-primary rounded-2xl font-sans font-bold flex items-center justify-center gap-3 mx-auto w-fit hover:opacity-90 transition-all shadow-xl relative z-10 group border border-ui-border/20"
                    >
                      <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Depart to YouTube</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60">
                     <div className="p-8 bg-ui-sidebar/50 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-ui-border">
                        <div className="w-12 h-12 rounded-full border border-accent/30 flex items-center justify-center font-bold text-accent">BP</div>
                        <p className="italic text-sm font-serif text-text-secondary">Curated: The Bible Project</p>
                     </div>
                     <div className="p-8 bg-ui-sidebar/50 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-ui-border">
                        <div className="w-12 h-12 rounded-full border border-accent/30 flex items-center justify-center font-bold text-accent">MW</div>
                        <p className="italic text-sm font-serif text-text-secondary">Deep Dive: Mike Winger</p>
                     </div>
                  </div>
               </motion.div>
             )}
          </div>
        </div>
      </div>

      {/* Scripture Link Guidance Modal */}
      <AnimatePresence>
        {showSettingsGuidance && (
          <div className="fixed inset-0 z-[120] bg-text-primary/10 backdrop-blur-sm flex items-end justify-center p-6 md:pb-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-text-primary text-bg-primary p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6 max-w-xl w-full pointer-events-auto"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                <Globe className="w-7 h-7" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-sm font-sans font-black uppercase tracking-[0.2em] text-accent mb-2">Canonical Link Required</h4>
                <p className="text-sm font-serif italic leading-relaxed opacity-80">
                  To open this scripture, please visit your <span className="text-white font-bold font-sans">Sanctuary Settings</span> and configure your <span className="text-white font-bold font-sans">Preferred Bible Website Link</span> in the <span className="text-accent underline font-sans font-bold">Bible Canonical Link</span> section.
                </p>
              </div>
              <button 
                onClick={() => setShowSettingsGuidance(false)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-primary w-full max-w-md rounded-[2.5rem] p-10 relative overflow-hidden border border-ui-border shadow-2xl"
            >
              {shareSuccess && (
                 <div className="absolute inset-0 bg-accent/95 z-20 flex flex-col items-center justify-center text-white p-8 text-center">
                   <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                     <Check className="w-10 h-10" />
                   </div>
                   <h3 className="text-3xl font-serif italic mb-2 font-bold">Covenant Shared</h3>
                   <p className="font-serif opacity-80 text-lg">Your seeking has been shared with the community.</p>
                 </div>
              )}
            
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-8 right-8 text-text-secondary hover:text-text-primary z-30"
              >
                ✕
              </button>
              
              <h2 className="text-3xl font-serif text-text-primary mb-2 text-center italic font-bold">Share Communion</h2>
              <p className="text-sm text-text-secondary text-center mb-8 italic opacity-60">Spread the light of your findings.</p>

              <div className="flex bg-ui-sidebar/30 p-1 rounded-xl mb-8 border border-ui-border">
                <button 
                  onClick={() => setShareMode('groups')}
                  className={`flex-1 py-2 text-[10px] font-sans font-bold uppercase tracking-widest rounded-lg transition-all ${
                    shareMode === 'groups' ? 'bg-bg-primary text-accent shadow-sm' : 'text-text-secondary/40'
                  }`}
                >
                  Small Groups
                </button>
                <button 
                  onClick={() => setShowGmailWarning(true)}
                  className={`flex-1 py-2 text-[10px] font-sans font-bold uppercase tracking-widest rounded-lg transition-all ${
                    shareMode === 'individual' ? 'bg-bg-primary text-accent shadow-sm' : 'text-text-secondary/40'
                  }`}
                >
                  Direct Reveal
                </button>
              </div>

              {/* Gmail Warning Pop-up */}
              <AnimatePresence>
                {showGmailWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-x-10 top-1/2 -translate-y-1/2 bg-text-primary text-bg-primary p-8 rounded-3xl z-40 shadow-2xl border border-white/10"
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="text-xl font-serif italic font-bold text-accent">Verify Google Account</h3>
                      <p className="text-xs font-serif leading-relaxed opacity-80">
                        Before sharing, please verify with the recipient that they are using a valid <span className="font-bold text-white">Google account</span>. Direct sharing requires the recipient to sign in with this exact email.
                      </p>
                      <button 
                        onClick={() => {
                          setShareMode('individual');
                          setShowGmailWarning(false);
                        }}
                        className="w-full py-3 bg-accent text-bg-primary rounded-xl font-sans font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                      >
                        I have verified
                      </button>
                      <button 
                        onClick={() => setShowGmailWarning(false)}
                        className="text-[10px] font-sans font-bold uppercase tracking-widest opacity-40 hover:opacity-100"
                      >
                        Go Back
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {shareMode === 'groups' ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto mb-2 pr-2 scrollbar-thin scrollbar-thumb-ui-border">
                  {myGroups.length === 0 ? (
                    <div className="text-center py-10 bg-ui-card rounded-2xl border border-dashed border-ui-border">
                      <p className="text-xs text-text-secondary/40 italic font-serif">No study groups found. Join a communion first.</p>
                    </div>
                  ) : (
                    myGroups.map(group => (
                      <button
                        key={group.id}
                        disabled={sharing !== null}
                        onClick={() => shareToGroup(group.id!)}
                        className="w-full flex items-center justify-between p-5 bg-ui-card hover:bg-ui-sidebar border border-ui-border rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-ui-sidebar flex items-center justify-center text-text-primary font-bold font-sans text-xs">
                             {group.name.charAt(0)}
                           </div>
                           <span className="font-bold text-text-primary font-sans text-sm tracking-tight">{group.name}</span>
                        </div>
                        {sharing === group.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-accent opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={shareToIndividual} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-3">Google Account Email</label>
                    <input 
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => {
                        setRecipientEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="believer@gmail.com"
                      className={cn(
                        "w-full px-5 py-4 bg-ui-card border rounded-2xl font-serif text-text-primary focus:outline-none transition-all",
                        emailError ? "border-red-500/50" : "border-ui-border focus:border-accent"
                      )}
                    />
                    {emailError && (
                      <p className="text-[10px] text-red-500 font-bold mt-2 font-sans uppercase tracking-tighter">
                        {emailError}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={sharing === 'individual'}
                    className="w-full py-4 bg-text-primary text-bg-primary rounded-2xl font-sans font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-3"
                  >
                    {sharing === 'individual' ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Share2 className="w-4 h-4 text-accent" />}
                    Reveal Individual
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Magnification Modal */}
      <AnimatePresence>
        {magnifiedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-text-primary/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto"
            onClick={() => setMagnifiedImage(null)}
          >
            <motion.button
              className="absolute top-8 right-8 text-bg-primary hover:scale-110 transition-transform"
              onClick={() => setMagnifiedImage(null)}
            >
              <X className="w-10 h-10" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-6xl w-full space-y-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 max-h-[70vh] flex items-center justify-center bg-black/20">
                <img 
                  src={magnifiedImage.url} 
                  alt={magnifiedImage.title}
                  className="max-w-full max-h-[70vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center space-y-4 px-4 pb-12">
                <h4 className="text-accent font-serif italic text-3xl font-bold">{magnifiedImage.title}</h4>
                <p className="text-bg-primary text-xl font-serif leading-relaxed italic opacity-80 max-w-3xl mx-auto">
                  {magnifiedImage.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Floating Menu */}
      <AnimatePresence>
        {selectionPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-[100] bg-text-primary text-bg-primary p-2 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2"
            style={{ 
              left: Math.min(window.innerWidth - 200, Math.max(20, selectionPosition.x - 100)),
              top: selectionPosition.y - 60 
            }}
          >
            {isDefining ? (
              <div className="flex items-center gap-2 px-3 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">Defining...</span>
              </div>
            ) : definitionResult ? (
              <div className="flex flex-col gap-3 p-4 w-72 max-w-[90vw]">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-serif italic font-bold text-accent">{definitionResult.word}</h4>
                  <button onClick={() => { setDefinitionResult(null); setSelectionPosition(null); }} className="text-bg-primary/40 hover:text-bg-primary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-serif leading-relaxed opacity-80">{definitionResult.definition}</p>
                <button 
                  onClick={addToGlossary}
                  className="w-full bg-accent text-bg-primary py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <GraduationCap className="w-3 h-3" />
                  Add to Lexicon
                </button>
              </div>
            ) : (
              <button 
                onClick={askForMeaning}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-accent group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Ask for Meaning</span>
              </button>
            )}
            
            {/* Arrow pointing down */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-text-primary rotate-45 border-r border-b border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>

      <PremiumOverlay 
        isOpen={showPremiumModal.isOpen} 
        onClose={() => setShowPremiumModal({ ...showPremiumModal, isOpen: false })} 
        featureName={showPremiumModal.feature} 
      />
    </div>
  );
}
