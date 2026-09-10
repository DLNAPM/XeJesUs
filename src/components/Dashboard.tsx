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
    interpretation: `The brevity of John 11:35—'Jesus wept' (ἐδάκρυσεν ὁ Ἰησοῦς)—belies one of the most profound Christological and theological revelations in all of Holy Scripture. When addressing your direct inquiry ('Why was He crying if He knew He was going to raise Lazarus?'), biblical exegesis across the 5 Primary Foundational Sources unveils three harmonious theological realities:

1. **The Reality of Christ's Authentic Human Emotion and Empathy (Hypostatic Union)**:
Jesus Christ is fully God and fully man. His tears were not theatrical or symbolic; they were the unfeigned overflow of a tender human heart. When Jesus observed Mary and Martha weeping (*klaiousan*), accompanied by the loud wailing of the Jewish mourners, He was deeply moved (*enebrimēsato tō pneumati*) and troubled (*etaraxen heauton*). St. Cyril of Alexandria observed in his *Commentary on John* that Christ permitted His human flesh to weep according to the law of human nature, showing that Christian sorrow over death is neither sinful nor a sign of weak faith.

2. **Holy Indignation Against Sin and the Curse of Death**:
The Greek verb used in verse 33 and 38 for 'deeply moved' (*embrimaomai*) carries the visceral sense of snorting with indignant wrath, akin to a war horse in battle. As B.B. Warfield demonstrated in his classic study *The Emotional Life of Our Lord*, Jesus wept not out of despair, but in holy indignation against Satan, sin, and the horrific ravages of death that had stolen His friend Lazarus and broken the hearts of His loved ones. Christ wept because death is an unnatural intruder into God's good creation—an enemy that He came to destroy at Calvary (1 Corinthians 15:26).

3. **Patristic & Classical Commentary on Divine Empathy**:
• **St. John Chrysostom** (*Homilies on the Gospel of John* 63): 'He wept to confirm His human nature... not to give way to excessive lamentation, but to teach us the limits of sorrow and to sanctify our tears.'
• **St. Augustine** (*Tractates on the Gospel of John* 49): 'Christ wept; let man also weep, but let him weep as a Christian, knowing that Lazarus is not lost forever, but sleeping until the voice of the Master wakes him.'
• **John Calvin** (*Commentary on John*): 'Christ did not come with iron eyes or a stone heart. He voluntarily clothed Himself in human affection so that we might confidently run to Him in all our tribulations.'

4. **Pastoral and Contemporary Discipleship Application**:
Christ's tears teach believers that divine omniscience does not extinguish covenant empathy. You do not serve a distant cosmic architect, but an approachable High Priest who has been tempted in all things as we are, yet without sin (Hebrews 4:15). Even when God is about to turn your mourning into dancing, He honors and shares your tears in the valley.`,
    historicalContext: `Authored by the Apostle John circa AD 85–95, likely from Ephesus, addressing both Jewish believers and Greco-Roman converts navigating early Gnostic heresies that denied Christ's true physical humanity (Docetism).

1. **First-Century Jewish Mourning Customs in Bethany**:
In Second Temple Judea, mourning (*avelut*) was a deeply structured, communal, and highly vocal ritual. Upon death, because of the Levant climate and ritual purity laws, bodies were washed, anointed with spices, wrapped in linen, and entombed on the very same day. This was followed by the *shiva* (seven days of intense communal weeping) where friends and relatives gathered from neighboring Jerusalem (less than two miles away, John 11:18). Hired mourners and flute players (attested by Flavius Josephus, *The Jewish War* 3.9.5, and Mishnah *Ketubot* 4:4) engaged in ritual lamentation (*klauthmos*).

2. **The Significance of the 'Four Days' (John 11:17, 39)**:
Martha's blunt objection in verse 39—'Lord, by this time there is a stench, for he has been dead four days' (*tetartaios gar estin*)—is crucial historical-cultural context. Jewish rabbinic tradition preserved in the Jerusalem Talmud (*Yevamot* 16:3) held the folk belief that a person's soul hovered near the corpse for three days seeking re-entry, but on the fourth day, as the face changed color and corruption set in, the soul departed permanently. By arriving deliberately on the fourth day, Jesus eliminated any possibility of a medical misdiagnosis or resuscitated swoon. The miracle was undeniably supernatural and irrevocable.

3. **Sociopolitical Setting & Sanhedrin Conspiracy**:
Bethany was located just 15 stadia (approximately 1.8 miles) east of Jerusalem on the eastern slopes of the Mount of Olives. This miracle occurred under the shadow of the Jerusalem religious hierarchy. Flavius Josephus (*Antiquities* 18.2.2) and the Gospel accounts record that Caiaphas and the ruling Sadducean elite were hypersensitive to messianic excitement that could provoke Roman military intervention. The raising of Lazarus became the immediate catalyst for the Sanhedrin's formal plot to execute Jesus (John 11:47–53).`,
    grammarAnalysis: `Key Greek terminology via BDAG (Bauer-Danker-Arndt-Gingrich) and Strong's Concordance:
• **ἐδάκρυσεν** (*edakrysen*, Strong's G1145, BDAG p. 210): Aorist active indicative of *dakryō* ('to shed tears, weep quietly'). Distinct from the loud, wailing lamentation of the crowd (*eklaisen*, from *klaiō*, G2799), *edakrysen* denotes dignified, heartfelt, silent weeping.
• **ἐνεβριμήσατο** (*enebrimēsato*, Strong's G1690, BDAG p. 322): Aorist middle indicative of *embrimaomai* (from *en* + *brimē*, 'to snort with rage like a warhorse'). In Hellenistic Greek and the Septuagint, it indicates holy indignation, deep agitation of spirit, and righteous confrontation against evil, suffering, and death.
• **ἐτάραξεν ἑαυτόν** (*etaraxen heauton*, Strong's G5015 / G1438): Aorist active indicative with reflexive pronoun ('He troubled Himself'). Christ was not passively overcome by involuntary grief; He actively, sovereignly yielded His human emotional faculties to enter into the sorrow of His people.
• **τεταρταῖος** (*tetartaios*, Strong's G5066): Ordinal adjective meaning 'four days in the grave', indicating complete biological decomposition according to ancient Near Eastern forensic understanding.`,
    literaryGenre: `Gospel Miracle & Resurrection Narrative (Signs of the Messiah)`,
    godIntent: `God intended this passage to reveal that divine sovereignty and foreknowledge do not negate holy empathy and authentic covenant sorrow. By recording the shortest yet emotionally deepest verse in Scripture, the Holy Spirit demonstrates that God Incarnate entered fully into the tragedy of human mortality. God sovereignly intended to display Christ as the true 'Man of Sorrows' (Isaiah 53:3), revealing the Father's tender heart toward His fallen creation. Furthermore, God intended Christ's tears to stand as an everlasting rebuke to stoic detachment and fatalism: Jesus wept not out of helplessness, but to exhibit holy outrage against death as the ultimate enemy (1 Corinthians 15:26), immediately before demonstrating His sovereign authority as the Resurrection and the Life (John 11:25). For the pilgrim, God intends you to know that in every season of grief, your Savior does not stand aloof in cold judgment, but weeps alongside you with infinite compassion while preparing your eternal resurrection.`,
    crossReferences: [
      "Isaiah 53:3 - He is despised and rejected by men, a Man of sorrows and acquainted with grief.",
      "Hebrews 4:15 - For we do not have a High Priest who cannot sympathize with our weaknesses, but was in all points tempted as we are, yet without sin.",
      "Luke 19:41 - Now as He drew near, He saw the city and wept over it.",
      "1 Corinthians 15:26 - The last enemy that will be destroyed is death.",
      "Revelation 21:4 - And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying."
    ],
    geography: {
      location: "Bethany (al-Eizariya)",
      thenDesc: "A small Judean village situated 15 stadia (1.8 miles) east of Jerusalem on the eastern slope of the Mount of Olives.",
      nowDesc: "Modern-day al-Eizariya in the West Bank, Palestinian territories, site of the ancient rock-cut Tomb of Lazarus.",
    },
    createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 }
  },
  {
    id: 'test-2',
    userId: 'guest',
    query: "The significance of the 153 fish in Peter's net.",
    scripture: "John 21:11",
    interpretation: `In John 21:11, Simon Peter went up and dragged the net to land, full of large fish, one hundred and fifty-three; and although there were so many, the net was not broken. Addressing your inquiry:

1. **Eyewitness Authenticity and the Miraculous Harvest**:
The exact count of 153 large fish (*hekaton pentēkonta triōn*) stands as an undeniable hallmark of authentic eyewitness testimony (Richard Bauckham, *Jesus and the Eyewitnesses*). Professional Galilean fishermen, upon receiving an astonishing catch after a futile night of fishing, naturally sorted and tallied the catch before bringing it to market. This literal historical fact anchors the miracle in tangible reality.

2. **Theological Symbolism in Patristic Exegesis**:
• **St. Jerome**: Observed in ancient natural history that zoologists of the Greco-Roman world counted 153 distinct species of fish in the sea, symbolizing that the Gospel net gathers all peoples, nations, and languages without exception.
• **St. Augustine** (*Tractates on the Gospel of John* 122): Explored the biblical arithmetic where 10 (the Law) + 7 (the Grace/Spirit) = 17; the triangular sum of 1 through 17 equals 153, representing all saints redeemed through law and grace.
• **St. Cyril of Alexandria**: Saw 100 representing the fullness of the Gentiles, 50 representing the remnant of Israel, and 3 representing the Holy Trinity.

3. **The Unbroken Net (*oukeschisthē to diktyon*)**:
Contrasting with Luke 5:6 where their nets were breaking prior to Christ's resurrection, here in John 21:11 the net does not tear despite the massive haul. This highlights the post-resurrection preservation and unity of the apostolic Church: Christ's sovereign power preserves every elect believer.

4. **Contemporary Discipleship Application**:
When believers labor in human self-reliance, the nets remain empty. But when disciples obey the command of the Resurrected Lord ('Cast the net on the right side of the boat'), the harvest is overwhelmingly abundant, proving that God sovereignly provides for all who follow Him.`,
    historicalContext: `Written in the late first century. The Sea of Galilee (Lake of Gennesaret or Sea of Tiberias) was a thriving commercial fishing hub under Roman-Herodian administrative oversight. Caesar Augustus and Herod Antipas heavily taxed fishermen through imperial tax syndicates (*publicani*). Simon Peter, Andrew, James, and John operated a shared fishing partnership (*koinōnoi*, Luke 5:10). Fishing at night with trammel nets was the standard ancient technique. The dawn encounter with Christ over burning coals (*anthrakian*) directly healed Peter's threefold denial (which had occurred over another coal fire in John 18:18).`,
    grammarAnalysis: `Key Greek terminology via BDAG and Strong's:
• **ἑλκύσας** (*helkysas*, Strong's G1670): Aorist active participle of *helkō* ('to draw, drag with physical exertion'). Used also in John 6:44 ('No one can come to Me unless the Father who sent Me draws him').
• **οὐκ ἐσχίσθη** (*ouk eschisthē*, Strong's G4977): Negative particle with aorist passive indicative of *schizō* ('was not torn, rent, or divided'). Root of English 'schism'; theological emblem of the undivided unity of the Church.
• **ἰχθύων μεγάλων** (*ichthyōn megalōn*, Strong's G2486 / G3173): Genitive plural of 'large, prime-quality fish', signifying not small discard bait, but valuable market fish.`,
    literaryGenre: `Post-Resurrection Epilogue & Apostolic Re-Commissioning Narrative`,
    godIntent: `God intended this passage to commission the post-resurrection Church for a worldwide harvest, reassuring His apostles that when they cast the net in obedience to Christ's voice, not a single soul appointed for salvation will be lost, and the covenant unity of the Church will not be broken.`,
    crossReferences: [
      "Luke 5:4-11 - When He had stopped speaking, He said to Simon, 'Launch out into the deep and let down your nets for a catch.'",
      "Matthew 4:19 - Then He said to them, 'Follow Me, and I will make you fishers of men.'",
      "Ezekiel 47:9-10 - Fishermen will stand by it from En Gedi to En Eglaim; they will be places for spreading their nets.",
      "John 6:44 - No one can come to Me unless the Father who sent Me draws him; and I will raise him up at the last day.",
      "John 10:28-29 - And I give them eternal life, and they shall never perish; neither shall anyone snatch them out of My hand."
    ],
    geography: {
      location: "Sea of Galilee (Lake Tiberias)",
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
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
      
      // Client-side sort to avoid requiring composite indexes
      data.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          return new Date(val).getTime() || 0;
        };
        return getMs(b.createdAt) - getMs(a.createdAt);
      });
      
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
        
        const validShareDocs = shareDocs.filter(s => s.data() && s.data().inquiryId);
        const inquiryPromises = validShareDocs.map(s => getDoc(doc(db, 'inquiries', s.data().inquiryId)));
        const inqSnaps = await Promise.all(inquiryPromises);
        
        const shared = inqSnaps
          .map((s, idx) => {
            if (!s.exists()) return null;
            return { 
              id: s.id, 
              ...s.data(), 
              shareId: validShareDocs[idx].id 
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
    fetchInquiries().catch(err => console.error("Error in fetchInquiries:", err));
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
