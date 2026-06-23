import { useState, useEffect } from 'react';
import { getDbService, getAuthService, collection, query, where, orderBy, getDocs, handleFirestoreError, OperationType, getDoc, doc, deleteDoc } from '../lib/firebase';
import { Inquiry } from '../types';
import { BookOpen, Clock, ChevronRight, PlusCircle, Share2, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onSelectInquiry: (id: string) => void;
  onNewInquiry: () => void;
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
    createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 }
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
    createdAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 }
  }
];

export default function Dashboard({ onSelectInquiry, onNewInquiry }: DashboardProps) {
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [sharedInquiries, setSharedInquiries] = useState<(Inquiry & { shareId?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingShareId, setDeletingShareId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) {
      setLoading(false);
      return;
    }
    
    // Guest Mode: Pre-populate with test data
    const isGuest = auth.currentUser.isAnonymous;
    
    const inquiriesPath = 'inquiries';
    try {
      const q = query(
        collection(db, inquiriesPath),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
      
      if (isGuest && data.length === 0) {
        data = TEST_INQUIRIES;
      }
      
      setRecentInquiries(data);

      // Fetch Shared with Me
      if (auth.currentUser.email) {
        const sharesQ = query(
          collection(db, 'direct_shares'),
          where('recipientEmail', '==', auth.currentUser.email.toLowerCase())
        );
        const shareSnap = await getDocs(sharesQ);
        const shareDocs = shareSnap.docs;
        
        const inquiryPromises = shareDocs.map(s => getDoc(doc(db, 'inquiries', s.data().inquiryId)));
        const inqSnaps = await Promise.all(inquiryPromises);
        
        const shared = inqSnaps
          .map((s, idx) => {
            if (!s.exists()) return null;
            return { 
              id: s.id, 
              ...s.data(), 
              shareId: shareDocs[idx].id 
            } as Inquiry & { shareId: string };
          })
          .filter((item): item is Inquiry & { shareId: string } => item !== null);
          
        if (isGuest && shared.length === 0) {
          shared.push({
            ...TEST_INQUIRIES[0],
            id: 'test-shared-1',
            shareId: 'test-share-id-1'
          });
        }
          
        setSharedInquiries(shared);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, inquiriesPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const db = getDbService();
    if (!db) return;
    if (!confirm('Are you sure you wish to remove this seeking from your library? This action cannot be undone.')) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      setRecentInquiries(prev => prev.filter(inq => inq.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inquiries/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteShared = async (e: React.MouseEvent, shareId: string) => {
    e.stopPropagation();
    const db = getDbService();
    if (!db) return;
    if (!confirm('Are you sure you wish to remove this shared seeking from your library?')) return;

    setDeletingShareId(shareId);
    try {
      await deleteDoc(doc(db, 'direct_shares', shareId));
      setSharedInquiries(prev => prev.filter(inq => inq.shareId !== shareId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `direct_shares/${shareId}`);
    } finally {
      setDeletingShareId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-text-primary mb-2">Exegesis Library</h1>
        <p className="text-text-secondary italic">Welcome back. Continue your journey through the Word.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Inquiry Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewInquiry}
          className="h-48 border-2 border-dashed border-ui-border rounded-2xl flex flex-col items-center justify-center gap-4 bg-ui-card/40 hover:bg-ui-card transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <PlusCircle className="w-6 h-6 text-accent" />
          </div>
          <span className="font-sans font-bold text-sm text-text-primary tracking-wide">Begin New Inquiry</span>
        </motion.button>

        {/* Stats or Quotes */}
        <div className="h-48 rounded-3xl bg-text-primary text-bg-primary p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10">
             <BookOpen className="w-32 h-32" />
           </div>
           <BookOpen className="w-8 h-8 text-accent relative z-10" />
           <p className="text-lg font-serif italic leading-relaxed relative z-10 opacity-90">
             "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
           </p>
           <p className="text-xs text-accent/60 uppercase tracking-[0.3em] font-sans font-bold relative z-10">2 Timothy 2:15</p>
        </div>
      </div>

      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Recent Seekings
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-ui-sidebar animate-pulse rounded-xl" />
            ))}
          </div>
        ) : recentInquiries.length === 0 ? (
          <div className="text-center py-20 bg-ui-card/20 rounded-2xl border border-ui-border">
            <p className="text-text-secondary italic">No inquiries found. Your journey begins with a single question.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentInquiries.map((inquiry) => (
              <motion.div
                key={inquiry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative"
              >
                <button
                  onClick={() => onSelectInquiry(inquiry.id!)}
                  className="w-full bg-ui-card p-6 rounded-2xl shadow-sm border border-ui-border flex items-center justify-between group-hover:shadow-md transition-all text-left pr-16"
                >
                  <div className="overflow-hidden">
                    <span className="text-xs font-sans font-bold text-accent uppercase tracking-widest mb-1 block">{inquiry.scripture}</span>
                    <h3 className="font-serif text-lg text-text-primary line-clamp-1 italic">{inquiry.query}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ui-border group-hover:text-accent transition-colors absolute right-6 top-1/2 -translate-y-1/2" />
                </button>
                
                <button
                  onClick={(e) => handleDelete(e, inquiry.id!)}
                  disabled={deletingId === inquiry.id}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-2 text-ui-border hover:text-red-500 transition-colors opacity-40 md:opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                  title="Remove Seeking"
                >
                  {deletingId === inquiry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {sharedInquiries.length > 0 && (
        <section className="mt-16 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-text-primary flex items-center gap-2">
              <Share2 className="w-5 h-5 text-accent" />
              Shared Seekings
            </h2>
          </div>
          <div className="space-y-4">
            {sharedInquiries.map((inquiry) => (
              <motion.div
                key={inquiry.shareId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group relative"
              >
                <button
                  onClick={() => onSelectInquiry(inquiry.id!)}
                  className="w-full bg-ui-card/30 p-6 rounded-2xl border border-ui-border flex items-center justify-between group hover:bg-ui-card transition-all text-left shadow-sm pr-16"
                >
                  <div className="overflow-hidden">
                    <span className="text-xs font-sans font-bold text-accent uppercase tracking-widest mb-1 block">{inquiry.scripture}</span>
                    <h3 className="font-serif text-lg text-text-primary line-clamp-1 italic">{inquiry.query}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ui-border group-hover:text-accent transition-colors absolute right-6 top-1/2 -translate-y-1/2" />
                </button>

                <button
                  onClick={(e) => handleDeleteShared(e, inquiry.shareId!)}
                  disabled={deletingShareId === inquiry.shareId}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-2 text-ui-border hover:text-red-500 transition-colors opacity-40 md:opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                  title="Remove Shared Seeking"
                >
                  {deletingShareId === inquiry.shareId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
