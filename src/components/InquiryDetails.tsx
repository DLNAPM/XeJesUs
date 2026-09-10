import { useState, useEffect, useRef, useCallback } from 'react';
import { getDbService, doc, getDoc, handleFirestoreError, OperationType, collection, getDocs, query, where, addDoc, serverTimestamp, getAuthService, deleteDoc } from '../lib/firebase';
import { Inquiry, BibleGroup } from '../types';
import { ChevronLeft, ChevronRight, Map, Video, BookOpen, Sparkles, MessageSquare, ExternalLink, Share2, Users, Loader2, Check, X, GraduationCap, Globe, Trash2 } from 'lucide-react';
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
    createdAt: { toDate: () => new Date(Date.now() - 3600000) }
  },
  {
    id: 'test-shared-1',
    userId: 'other',
    userEmail: 'scholar@sanctuary.org',
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
    createdAt: { toDate: () => new Date(Date.now() - 3600000) }
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
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }
  }
];

export default function InquiryDetails({ inquiryId, onBack, isPremium }: InquiryDetailsProps) {
  const auth = getAuthService();
  const db = getDbService();
  const currentUserId = auth?.currentUser?.uid;

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
  
  // Glossary Selection State (Multi-Platform: iOS / iPadOS / macOS / Windows / Android)
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const [isDefining, setIsDefining] = useState(false);
  const [definitionResult, setDefinitionResult] = useState<{ word: string, definition: string } | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState<{ isOpen: boolean, feature: string }>({ isOpen: false, feature: '' });
  const [deleting, setDeleting] = useState(false);

  const selectedTextRef = useRef('');
  const isInteractingWithMenuRef = useRef(false);
  const selectionTimeoutRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const studyContainerRef = useRef<HTMLDivElement>(null);

  const handleDeleteClick = async () => {
    if (!confirm('Are you sure you wish to remove this seeking from your library? This action cannot be undone.')) return;
    if (!db) return;
    setDeleting(true);
    const docPath = `inquiries/${inquiryId}`;
    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    } finally {
      setDeleting(false);
    }
  };

  const updateSelectionFromDOM = useCallback(() => {
    if (isInteractingWithMenuRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (!isDefining && !definitionResult && !addedSuccess) {
        setSelectionPosition(null);
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2 || text.length > 80) {
      if (!isDefining && !definitionResult && !addedSuccess) {
        setSelectionPosition(null);
      }
      return;
    }

    // Ensure the selection is within our study content area
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    if (studyContainerRef.current && !studyContainerRef.current.contains(commonAncestor)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      return;
    }

    selectedTextRef.current = text;
    setSelectedText(text);

    // Viewport-relative coordinate calculation (since menu uses fixed positioning)
    const menuWidth = definitionResult ? 320 : 180;
    const clampedX = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, rect.left + rect.width / 2 - menuWidth / 2));
    
    // Check if there is enough room above the selection (at least 75px from top of viewport)
    const placement: 'top' | 'bottom' = rect.top >= 75 ? 'top' : 'bottom';
    const calculatedTop = placement === 'top'
      ? Math.max(12, rect.top - 52)
      : Math.min(window.innerHeight - 80, rect.bottom + 12);

    setSelectionPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
      top: calculatedTop,
      left: clampedX,
      placement
    });
  }, [isDefining, definitionResult, addedSuccess]);

  // Global listeners for Apple devices (iOS Safari touch selection, iPadOS, macOS Safari/Chrome)
  useEffect(() => {
    const handleSelectionEvent = () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      // Debounce slightly to allow iOS/iPadOS selection handles to settle
      selectionTimeoutRef.current = setTimeout(() => {
        updateSelectionFromDOM();
      }, 120);
    };

    const handleGlobalPointerDown = (e: MouseEvent | TouchEvent) => {
      // If user interacts with our menu, do not clear
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        isInteractingWithMenuRef.current = true;
        return;
      }
      // If user clicks outside and not defining or displaying a result, dismiss
      if (!isDefining && !definitionResult && !addedSuccess) {
        isInteractingWithMenuRef.current = false;
        setSelectionPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionEvent, { passive: true });
    document.addEventListener('touchend', handleSelectionEvent, { passive: true });
    document.addEventListener('mouseup', handleSelectionEvent, { passive: true });
    document.addEventListener('keyup', handleSelectionEvent, { passive: true });
    document.addEventListener('mousedown', handleGlobalPointerDown);
    document.addEventListener('touchstart', handleGlobalPointerDown, { passive: true });

    return () => {
      if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
      document.removeEventListener('selectionchange', handleSelectionEvent);
      document.removeEventListener('touchend', handleSelectionEvent);
      document.removeEventListener('mouseup', handleSelectionEvent);
      document.removeEventListener('keyup', handleSelectionEvent);
      document.removeEventListener('mousedown', handleGlobalPointerDown);
      document.removeEventListener('touchstart', handleGlobalPointerDown);
    };
  }, [updateSelectionFromDOM, isDefining, definitionResult, addedSuccess]);

  const askForMeaning = async () => {
    const targetText = selectedTextRef.current || selectedText;
    if (!targetText) return;

    if (!isPremium) {
      setShowPremiumModal({ isOpen: true, feature: 'Lexicon Glossary' });
      return;
    }
    isInteractingWithMenuRef.current = true;
    setIsDefining(true);
    try {
      const context = `Biblical study of ${inquiry?.scripture}. Query: ${inquiry?.query}`;
      const definition = await fetchDefinition(targetText, context);
      setDefinitionResult({ word: targetText, definition });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDefining(false);
    }
  };

  const addToGlossary = async () => {
    if (!definitionResult) return;
    if (!auth || !auth.currentUser || !db) return;

    isInteractingWithMenuRef.current = true;
    const path = `users/${auth.currentUser.uid}/glossary`;
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        word: definitionResult.word,
        definition: definitionResult.definition,
        createdAt: serverTimestamp()
      });
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
        setDefinitionResult(null);
        setSelectionPosition(null);
        setSelectedText('');
        selectedTextRef.current = '';
        isInteractingWithMenuRef.current = false;
      }, 1200);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      isInteractingWithMenuRef.current = false;
    }
  };

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!auth || !auth.currentUser || !db) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setBibleWebsite(data.bibleWebsite || null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserPreferences().catch(err => console.error("Error in fetchUserPreferences:", err));
  }, [auth]);

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

      if (!db) {
        setLoading(false);
        return;
      }

      const docPath = `inquiries/${inquiryId}`;
      try {
        const snapshot = await getDoc(doc(db, docPath));
        if (snapshot.exists()) {
          const data = snapshot.data();
          setInquiry({ id: snapshot.id, ...data } as Inquiry);
          
          if (data.userEmail) {
            setSenderEmail(data.userEmail);
          } else if (data.userId) {
            // Fetch profile for earlier inquiries that don't have userEmail saved
            try {
              const userProfileDoc = await getDoc(doc(db, 'users', data.userId));
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

    fetchInquiry().catch(err => console.error("Error in fetchInquiry:", err));
  }, [inquiryId]);

  const handleShareClick = async () => {
    setShowShareModal(true);
    if (!auth || !auth.currentUser || !db) return;
    
    // In a real app we'd query groups/members, but for now we'll just query all groups
    const groupsPath = 'groups';
    try {
      const q = query(collection(db, groupsPath));
      const snapshot = await getDocs(q);
      setMyGroups(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BibleGroup)));
    } catch (e) {
      console.error(e);
    }
  };

  const shareToGroup = async (groupId: string) => {
    if (!auth || !auth.currentUser || !db) return;
    setSharing(groupId);
    try {
      const discussionsPath = `groups/${groupId}/discussions`;
      
      // Check for existing share to prevent duplicates
      const q = query(
        collection(db, discussionsPath), 
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

      await addDoc(collection(db, discussionsPath), {
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
    if (!auth || !auth.currentUser || !db || !recipientEmail) return;
    
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

      // Check for existing share to prevent duplicates
      const q = query(
        collection(db, sharesPath),
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

      await addDoc(collection(db, sharesPath), {
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
    <div ref={studyContainerRef} className="max-w-5xl mx-auto select-text selection:bg-accent/20 selection:text-text-primary">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-accent mb-8 group transition-colors"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-sans font-bold text-sm tracking-wide uppercase">Back to Library</span>
      </button>

      {/* Mobile & Notebook Ribbon of consolidated buttons at the top of the page */}
      <div className="xl:hidden grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
        {[
          { id: 'faith', label: "God's Intent", icon: Sparkles, emoji: '✨' },
          { id: 'academic', label: 'Exegesis & Context', icon: BookOpen, emoji: '📜' },
          { id: 'geo', label: 'Geographical Journey', icon: Map, emoji: '🗺️' },
          { id: 'video', label: 'Living Word Media', icon: Video, emoji: '🎥' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.label)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-all text-center sm:text-left font-sans text-xs sm:text-sm font-semibold border cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-text-primary text-bg-primary shadow-lg border-text-primary' 
                : 'bg-ui-card hover:bg-ui-sidebar text-text-secondary border-ui-border'
            }`}
          >
            <span className="text-base sm:text-lg">{tab.emoji}</span>
            <span className="tracking-wide leading-tight">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={handleShareClick}
          className="col-span-2 sm:col-span-1 flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-all text-center sm:text-left font-sans text-xs sm:text-sm font-semibold border bg-ui-card hover:bg-accent hover:text-white text-text-secondary border-ui-border cursor-pointer shadow-sm"
        >
          <span className="text-base sm:text-lg">👥</span>
          <span className="tracking-wide leading-tight">Community Study</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Left Column: Headers and Navigation */}
        <div className="xl:col-span-1 space-y-8">
          <div>
            {senderEmail && inquiry.userId !== currentUserId && (
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
            <div className="text-xs text-text-secondary font-sans uppercase tracking-widest opacity-60">Seeked on {(() => {
              if (!inquiry?.createdAt) return 'N/A';
              try {
                if (typeof inquiry.createdAt.toDate === 'function') {
                  return new Date(inquiry.createdAt.toDate()).toLocaleDateString();
                }
                if (typeof inquiry.createdAt === 'string') {
                  return new Date(inquiry.createdAt).toLocaleDateString();
                }
                if (inquiry.createdAt.seconds !== undefined) {
                  return new Date(inquiry.createdAt.seconds * 1000).toLocaleDateString();
                }
              } catch (e) {
                console.error("Error formatting date", e);
              }
              return 'N/A';
            })()}</div>
          </div>

          <div className="hidden xl:flex flex-col gap-2">
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

          <div className="hidden xl:block p-8 bg-ui-card rounded-[2rem] border border-ui-border shadow-sm">
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

          {inquiry.userId === currentUserId && (
            <div className="hidden xl:block p-8 bg-ui-card rounded-[2rem] border border-ui-border shadow-sm border-red-500/10">
              <h3 className="text-xs font-sans font-bold text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                Library Controls
              </h3>
              <p className="text-xs text-text-secondary mb-4 italic leading-relaxed">
                Remove this seeking permanently from your Exegesis Library. This action is irreversible.
              </p>
              <button 
                onClick={handleDeleteClick}
                disabled={deleting}
                className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-sans font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Seeking
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Content Area */}
        <div className="xl:col-span-2">
          <div className="bg-ui-card rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-ui-border min-h-[600px] relative overflow-hidden">
             {activeTab === 'faith' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-sans font-bold text-accent uppercase tracking-[0.3em]">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>How God Intended (Divine Covenant Purpose)</span>
                    </div>
                    <div className="p-10 bg-bg-primary/50 rounded-3xl border-l-4 border-accent italic font-serif text-2xl md:text-3xl leading-relaxed text-text-primary shadow-inner">
                      "{inquiry.godIntent}"
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <h3 className="font-serif text-2xl text-text-primary italic mb-6 font-bold">Exegetical Deep-Dive & Detailed Interpretation</h3>
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
                    <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span>The Meaning of the Scriptures at the Time When They Were Written (Historical Context)</span>
                    </h3>
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

          {/* Mobile & Notebook Library Controls at the bottom */}
          {inquiry.userId === currentUserId && (
            <div className="xl:hidden mt-8 p-8 bg-ui-card rounded-[2.5rem] border border-ui-border shadow-sm border-red-500/10">
              <h3 className="text-xs font-sans font-bold text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                Library Controls
              </h3>
              <p className="text-xs text-text-secondary mb-4 italic leading-relaxed">
                Remove this seeking permanently from your Exegesis Library. This action is irreversible.
              </p>
              <button 
                onClick={handleDeleteClick}
                disabled={deleting}
                className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-sans font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Seeking
                  </>
                )}
              </button>
            </div>
          )}

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

      {/* Selection Floating Menu (Multi-Platform: iPhone / iPad / Mac / PC) */}
      <AnimatePresence>
        {selectionPosition && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92, y: selectionPosition.placement === 'top' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isInteractingWithMenuRef.current = true;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isInteractingWithMenuRef.current = true;
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              isInteractingWithMenuRef.current = true;
            }}
            className="fixed z-[9999] bg-text-primary text-bg-primary p-2 rounded-2xl shadow-2xl border border-white/20 select-none backdrop-blur-md"
            style={{ 
              left: selectionPosition.left,
              top: selectionPosition.top
            }}
          >
            {isDefining ? (
              <div className="flex items-center gap-2.5 px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-xs font-serif italic text-accent font-bold">Unveiling meaning...</span>
              </div>
            ) : addedSuccess ? (
              <div className="flex items-center gap-2 px-4 py-2 text-emerald-400">
                <Check className="w-4 h-4" />
                <span className="text-xs font-sans font-bold uppercase tracking-wider">Added to Lexicon</span>
              </div>
            ) : definitionResult ? (
              <div className="flex flex-col gap-3 p-3.5 w-72 sm:w-80 max-w-[90vw]">
                <div className="flex justify-between items-start border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-serif italic font-bold text-accent capitalize">{definitionResult.word}</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => { 
                      setDefinitionResult(null); 
                      setSelectionPosition(null);
                      isInteractingWithMenuRef.current = false;
                    }} 
                    className="text-bg-primary/50 hover:text-bg-primary p-1 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-44 overflow-y-auto pr-1.5 [scrollbar-width:thin] text-xs font-serif leading-relaxed opacity-90 whitespace-pre-wrap">
                  {definitionResult.definition}
                </div>
                <button 
                  type="button"
                  onClick={addToGlossary}
                  className="w-full bg-accent text-bg-primary hover:opacity-95 active:scale-[0.98] py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Add to Lexicon
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={askForMeaning}
                className="flex items-center gap-2 px-3.5 py-1.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all group cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-accent group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-accent">Ask for Meaning</span>
              </button>
            )}
            
            {/* Arrow pointing to selection */}
            {selectionPosition.placement === 'top' ? (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-text-primary rotate-45 border-r border-b border-white/20" />
            ) : (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-text-primary rotate-45 border-l border-t border-white/20" />
            )}
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
