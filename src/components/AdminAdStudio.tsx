import { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Megaphone, 
  BookOpen, 
  Search, 
  Compass, 
  Users, 
  History, 
  FileText, 
  GraduationCap, 
  Settings as SettingsIcon, 
  User, 
  Mic, 
  Library, 
  Globe, 
  Square, 
  Monitor, 
  Smartphone, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  Pause,
  Volume2, 
  VolumeX,
  Scroll, 
  Shield, 
  Info, 
  ExternalLink,
  Layers,
  Flame,
  ArrowRight,
  Video,
  Maximize2,
  X,
  Wand2,
  RotateCcw,
  FileCode,
  Sliders,
  Type as TypeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getScriptForTopic, 
  MASTER_ALL_FEATURES_SCRIPT, 
  ScriptFormat, 
  TargetAudience, 
  ScriptTone,
  AdScriptItem 
} from '../data/adScriptsData';
import { generateAdScript } from '../services/geminiService';

export type AdTopicId = 
  | 'landing-page'
  | 'dashboard'
  | 'library'
  | 'seek-word'
  | 'then-vs-now'
  | 'study-groups'
  | 'saved-chats'
  | 'reports-menu'
  | 'lexicon-glossary'
  | 'sanctuary-settings'
  | 'settings-profile'
  | 'settings-voices'
  | 'settings-sources'
  | 'settings-canonical-link';

export type AspectRatio = '1:1' | '16:9' | '9:16';
export type AdTheme = 'modern' | 'parchment' | 'midnight';

interface AdTopicConfig {
  id: AdTopicId;
  name: string;
  category: 'Sanctuary Portal' | 'Exegetical Tools' | 'Community & Dialogue' | 'Scholarship & Analytics' | 'Sanctuary Settings';
  isSubTopic?: boolean;
  parentName?: string;
  headline: string;
  subheadline: string;
  guestModeDataSource: string;
  badge: string;
  actionCallout: string;
  howToSteps: { step: number; title: string; desc: string }[];
  caption: string;
  previewData: {
    title: string;
    verseOrTopic?: string;
    details: string[];
    tag: string;
    keyMetric: string;
  };
}

export const AD_TOPICS: AdTopicConfig[] = [
  {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'Sanctuary Portal',
    headline: 'Enter the Living Exegesis Sanctuary in Seconds',
    subheadline: 'One-Tap Guest Mode Test Drive or Secure Google Sign-In',
    guestModeDataSource: 'Guest Login button, "Test Drive as Guest" authentication state, and Guided Video Tour banner.',
    badge: 'INSTANT SANCTUARY ACCESS',
    actionCallout: 'Experience deep theological exegesis without registration.',
    howToSteps: [
      { step: 1, title: 'Open XeJesUs', desc: 'Visit the web app on any mobile or desktop browser.' },
      { step: 2, title: 'Select Test Drive', desc: 'Click "Test Drive as Guest" to enter immediately with sample seekings.' },
      { step: 3, title: 'Watch Guided Tour', desc: 'Click the animated "Play How To" banner to view the sanctuary orientation.' }
    ],
    caption: `🕊️ Travel through the sacred text to discover Jesus' true intentions for Us today!

With XeJesUs, you don't even need an account to start your spiritual inquiry. Simply click "Test Drive as Guest" on our Landing Page to explore live exegesis scrolls, Greek & Hebrew root words, and our Asher Wilson Ethiopian Bible integration.

✨ Instant Guest Mode Access
✨ Grounded in 6 Scholarly Authorities
✨ Beautiful on Mobile & Desktop

👉 Try it now: https://xejesus.app
#XeJesUs #BiblicalExegesis #BibleStudy #Gospel #Theology #FaithJourney #Scripture`,
    previewData: {
      title: 'XeJesUs Sanctuary Portal',
      verseOrTopic: 'John 11:35 & 1st Century Levant Heritage',
      details: [
        'One-Tap "Test Drive as Guest" Auth',
        'Animated "Play How To" Guided Orientation',
        'Full 6-Source Theological Synthesis Preview'
      ],
      tag: 'Sanctuary Entryway',
      keyMetric: 'Instant Zero-Friction Entry'
    }
  },
  {
    id: 'dashboard',
    name: 'XeJesUs Dashboard',
    category: 'Sanctuary Portal',
    headline: 'Your Pilgrim Exegesis Headquarters',
    subheadline: 'Track Recent Seekings, Historical Context & Scripture Insights',
    guestModeDataSource: 'Guest Pilgrim profile state with pre-populated John 11:35 and John 21:11 (153 Fish) test inquiries.',
    badge: 'HEADQUARTERS DASHBOARD',
    actionCallout: 'Access your recent Biblical interpretations and exegesis scrolls.',
    howToSteps: [
      { step: 1, title: 'Review Active Seekings', desc: 'View test seekings like Lazarus at Bethany or Peter’s 153 fish.' },
      { step: 2, title: 'Inspect Exegesis Scrolls', desc: 'Click any inquiry card to unpack historical context and Greek lemmas.' },
      { step: 3, title: 'Initiate New Seeking', desc: 'Click the "+" button to launch an original theological exploration.' }
    ],
    caption: `📖 Welcome to the XeJesUs Pilgrim Dashboard!

As soon as you enter Guest Mode, your study dashboard comes pre-loaded with rich, foundational seekings like "Why Jesus Wept at Lazarus' Tomb" (John 11:35) and "The Significance of 153 Fish" (John 21:11).

Track your scripture inquiries, explore geographic Levant maps, and dive deep into the Word with pristine scholarly clarity.

🔍 Explore your personal study sanctuary today!
#XeJesUs #BibleStudy #Exegesis #GospelOfJohn #Hermeneutics #ScriptureStudy`,
    previewData: {
      title: 'Pilgrim Headquarters Dashboard',
      verseOrTopic: 'John 11:35 & John 21:11 Exegesis Scrolls',
      details: [
        'Pre-populated with Authentic Guest Inquiries',
        'Direct Access to Greek Grammatical Nuances',
        'Ancient Levant Geographic Mapping Logs'
      ],
      tag: 'Study Headquarters',
      keyMetric: '2 Pre-Loaded Exegesis Scrolls'
    }
  },
  {
    id: 'library',
    name: 'XeJesUs Library',
    category: 'Sanctuary Portal',
    headline: 'Sacred Scroll Archives & 6-Source Synthesis',
    subheadline: 'Canonical Scriptures, Asher Wilson Ethiopian Bible & Church Fathers',
    guestModeDataSource: 'Full John 11:35 exegesis scroll: Greek edakrysen vs eklaisen, Bethany geography, Patristic commentary.',
    badge: 'CANONICAL ARCHIVES',
    actionCallout: 'Synthesize exegesis from historical, linguistic, and canonical authorities.',
    howToSteps: [
      { step: 1, title: 'Open Library Scroll', desc: 'Select any saved study from the Exegesis Library archive.' },
      { step: 2, title: 'Examine 6 Sources', desc: 'Review citations across Canonical Bible, 81-book Ethiopian Canon & Early Fathers.' },
      { step: 3, title: 'Listen & Export', desc: 'Listen with AI Scholar audio personas or export a 2-page PDF scroll.' }
    ],
    caption: `📜 Dive into the sacred archives of the XeJesUs Exegesis Library!

Every biblical passage is analyzed across six foundational authorities:
1. Canonical Scriptures (Genesis to Revelation)
2. Asher Wilson's Complete Ethiopian Bible (81 Books)
3. Original Linguistic Concordance (Greek, Hebrew, Ge'ez)
4. Early Church Fathers & Commentators
5. Archaeological & Historical Records (Josephus, Dead Sea Scrolls)
6. Real-Time Web Grounding for Contemporary Living

Discover profound revelations like the distinction between 'edakrysen' (silent tears) and 'eklaisen' (communal wailing) in John 11:35.

#BiblicalScholarship #ChurchHistory #AncientManuscripts #EthiopianBible #XeJesUs`,
    previewData: {
      title: 'Sacred Scroll Library',
      verseOrTopic: 'Linguistic & Patristic Breakdown of John 11:35',
      details: [
        'Greek Root: edakrysen (quiet tears)',
        'Archaeological Site: Bethany (al-Eizariya)',
        'Six Integrated Citation Pillars'
      ],
      tag: '6-Source Synthesis',
      keyMetric: '81 Biblical Books Covered'
    }
  },
  {
    id: 'seek-word',
    name: 'Seek the Word',
    category: 'Exegetical Tools',
    headline: 'Ask Any Theological Question or Scripture Passage',
    subheadline: 'Multi-Perspective Exegesis Engine with Scholar Audio Narration',
    guestModeDataSource: 'Guest query field with prompt suggestions, exegesis depth selectors, and audio scholar toggles.',
    badge: 'AI EXEGETICAL ENGINE',
    actionCallout: 'Enter any scripture or theological question for scholarly exegesis.',
    howToSteps: [
      { step: 1, title: 'Enter Verse or Inquiry', desc: 'Type a passage like Romans 8:28 or a question like "Why did Jesus speak in parables?".' },
      { step: 2, title: 'Configure Depth', desc: 'Choose between Standard Pastoral and Deep Academic Exegetical analysis.' },
      { step: 3, title: 'Unpack the Truth', desc: 'Generate a grounded interpretation complete with Levant context and moral intent.' }
    ],
    caption: `💡 Have questions about tough scriptures? "Seek the Word" in XeJesUs!

Whether you're exploring Christ's parables, Paul's epistles, or the ancient prophecies of Henok in the Ge'ez tradition, our inquiry engine synthesizes linguistic, historical, and canonical truth in seconds.

Try it right now in Guest Mode with sample questions ready to run with one click!

#SeekTheWord #BibleAnswers #ChristianTheology #ScriptureExegesis #FaithQuestions #XeJesUs`,
    previewData: {
      title: 'Seek the Word Inquiry Engine',
      verseOrTopic: 'Prompt: "Distinction between Grace and Mercy in original Hebrew"',
      details: [
        'Hebrew Roots: Chen (חֵן) vs Rachamim (רַחֲמִים)',
        'Literary Genre & Cultural Setting',
        'Direct Theological Intent of God'
      ],
      tag: 'Hermeneutical Query',
      keyMetric: '< 3s Grounded Exegesis'
    }
  },
  {
    id: 'then-vs-now',
    name: 'Then vs Now',
    category: 'Exegetical Tools',
    headline: 'Bridging Ancient Levant History with 21st Century Living',
    subheadline: 'Golgotha, Jerusalem, Pharisees, and Contemporary World Applications',
    guestModeDataSource: 'Flagship topics: Golgotha & Calvary, Pentecost Upper Room, and Then vs Now Levant comparative timelines.',
    badge: 'HISTORICAL PARALLELS',
    actionCallout: 'Compare biblical era life with modern society and ethics.',
    howToSteps: [
      { step: 1, title: 'Pick a Flagship Topic', desc: 'Select Golgotha, Pharisees & Sadducees, or Mount Sinai from presets.' },
      { step: 2, title: 'Compare Timelines', desc: 'Explore the dual side-by-side view: "Then" (Herodian Levant) vs "Now" (Modern Era).' },
      { step: 3, title: 'Extract Modern Lessons', desc: 'Read actionable moral applications for our culture, ethics, and community.' }
    ],
    caption: `⏳ Ever wondered how biblical events connect to the 21st century? 

With "Then vs Now" on XeJesUs, you can explore historical sites like Golgotha, ancient religious sects like the Pharisees, and momentous events like Pentecost side-by-side with modern culture, archaeology, and ethics.

✨ Discover ancient Levant geography vs modern GPS locations
✨ Understand cultural shifts and timeless moral principles
✨ Download 2-Page Comparative PDF Study Sheets

#ThenVsNow #BiblicalHistory #LevantArchaeology #AncientNearEast #BibleContext #XeJesUs`,
    previewData: {
      title: 'Then vs Now Comparative Chronology',
      verseOrTopic: 'Golgotha (Herodian Era 33 A.D.) vs Modern Holy Sepulchre',
      details: [
        'Then: Roman execution hill outside Gennath Gate',
        'Now: Church of Holy Sepulchre & Garden Tomb',
        'Contemporary Application: Bearing one’s cross today'
      ],
      tag: 'Chronological Bridge',
      keyMetric: '2,000 Years Reconciled'
    }
  },
  {
    id: 'study-groups',
    name: 'My Study Groups',
    category: 'Community & Dialogue',
    headline: 'Form Spiritual Communions & Share Exegesis Scrolls',
    subheadline: 'Collaborative Scripture Discussions with Fellow Pilgrims',
    guestModeDataSource: 'Guest study communion: "Bethany Study Circle", member roster, shared exegesis feed, and invitation flow.',
    badge: 'COMMUNITY COMMUNIONS',
    actionCallout: 'Gather together in study, prayer, and shared biblical discovery.',
    howToSteps: [
      { step: 1, title: 'Create or Join Circle', desc: 'Create a study group or inspect existing communal gatherings.' },
      { step: 2, title: 'Share Inquiries', desc: 'Share your exegesis scrolls into the group with one tap.' },
      { step: 3, title: 'Engage in Fellowship', desc: 'Discuss scripture interpretations with fellow seekers in a sacred environment.' }
    ],
    caption: `🤝 Faith grows in communion! "My Study Groups" in XeJesUs makes group Bible study deeper and more collaborative.

Share exegesis scrolls with your small group, Sunday school class, or study partners. Everyone can examine the same original Hebrew/Greek roots and historical commentary together.

Create your communion in seconds inside XeJesUs!

#BibleStudyGroup #ChristianCommunity #SmallGroup #Fellowship #ScriptureStudy #XeJesUs`,
    previewData: {
      title: 'Study Groups & Communions',
      verseOrTopic: 'Bethany Study Circle - Lazarus & Resurrection Discourse',
      details: [
        'Shared Inquiry Scrolls with Real-Time Exegesis',
        'Role Management & Pilgrim Invitations',
        'Private Sanctuary Discussion Threads'
      ],
      tag: 'Communal Fellowship',
      keyMetric: 'Zero Data Leaks • Sacred Privacy'
    }
  },
  {
    id: 'saved-chats',
    name: 'Saved Chat Sessions',
    category: 'Community & Dialogue',
    headline: 'Your Dedicated Exegetical AI Theologian Dialogue',
    subheadline: 'Searchable Pastoral & Theological Conversations Archived Forever',
    guestModeDataSource: 'Guest sample chat thread: "Greek root Makarios in the Beatitudes" with multi-turn pastoral exegesis.',
    badge: 'AI THEOLOGIAN CHAT',
    actionCallout: 'Resume meaningful theological dialogues whenever you need guidance.',
    howToSteps: [
      { step: 1, title: 'Chat with Scholar AI', desc: 'Open the Chatbot button at the bottom right corner of any page.' },
      { step: 2, title: 'Ask Nuanced Questions', desc: 'Ask about biblical ethics, original translations, or difficult chapters.' },
      { step: 3, title: 'Revisit in Saved Chats', desc: 'Access your conversation history anytime from the "Saved Chat Sessions" menu.' }
    ],
    caption: `💬 Have you ever wished you had a scholarly theologian in your pocket 24/7?

XeJesUs features an AI Theologian dialogue engine that answers your deepest biblical questions with reverence, historical context, and scripture grounding.

Best of all: every session is automatically archived in "Saved Chat Sessions" so you can pick up right where you left off.

#ChristianChat #TheologyAI #BibleStudyHelp #BiblicalGuidance #XeJesUsApp`,
    previewData: {
      title: 'Saved Chat Sessions Archive',
      verseOrTopic: 'Topic: "Beatitudes: Blessed (Makarios) vs Modern Happiness"',
      details: [
        'Original Koine Greek analysis of Matthew 5',
        'Searchable Dialogue Thread History',
        'Pastoral & Academic Synthesis'
      ],
      tag: 'Exegetical Dialogue',
      keyMetric: 'Unlimited Conversation Logs'
    }
  },
  {
    id: 'reports-menu',
    name: 'Reports Menu',
    category: 'Scholarship & Analytics',
    headline: 'Comprehensive Exegetical Audits & Biblical Analytics',
    subheadline: 'Old vs New Testament Coverage, Canonical Balance & Thematic Breakdowns',
    guestModeDataSource: 'Guest mode exegesis analytics: Testament distribution pie chart, top themes (Grace, Covenant, Faith).',
    badge: 'EXEGETICAL ANALYTICS',
    actionCallout: 'Analyze your scripture study distribution and theological balance.',
    howToSteps: [
      { step: 1, title: 'Open Reports Menu', desc: 'Navigate to Reports in the main sidebar.' },
      { step: 2, title: 'Review Coverage Charts', desc: 'Inspect your balance between Torah, Gospels, Prophets, and Epistles.' },
      { step: 3, title: 'Export Audit Summary', desc: 'Generate an executive summary of your inquiries and spiritual focus.' }
    ],
    caption: `📊 Deepen your discipleship with the XeJesUs "Reports Menu"!

See a visual breakdown of your scripture reading:
📈 Gospels vs Epistles vs Old Testament distribution
📈 Thematic clusters (Grace, Redemption, Covenant, Holiness)
📈 Citation integrity score across our 6 scholarly pillars

Gain profound insights into your spiritual journey and biblical balance.

#BibleAnalytics #SpiritualDiscipline #ChristianEducation #BibleStudyTools #XeJesUs`,
    previewData: {
      title: 'Theological Reports & Analytics',
      verseOrTopic: 'Scripture Coverage: 45% Gospels • 30% Epistles • 25% OT',
      details: [
        'Dynamic Thematic Coverage Charts',
        '6-Source Verification Audit Index',
        'Personal Spiritual Inquiry Trajectory'
      ],
      tag: 'Analytics Suite',
      keyMetric: '100% Citation Grounding'
    }
  },
  {
    id: 'lexicon-glossary',
    name: 'Lexicon Glossary',
    category: 'Scholarship & Analytics',
    headline: 'Hebrew, Greek, Ge’ez & Aramaic Concordance',
    subheadline: 'Strong’s Concordance Numbers, Etymological Roots & Theological Definitions',
    guestModeDataSource: 'Lexicon entries for Hesed (חֶסֶד H2617), Agape (ἀγάπη G26), and Ruach (רוּחַ H7307).',
    badge: 'ORIGINAL CONCORDANCE',
    actionCallout: 'Look up biblical vocabulary in original ancient languages.',
    howToSteps: [
      { step: 1, title: 'Search Biblical Term', desc: 'Search for concepts like "Grace", "Love", or "Spirit".' },
      { step: 2, title: 'Unpack Original Roots', desc: 'Read exact Strong’s definitions, transliterations, and morphological nuances.' },
      { step: 3, title: 'Connect to Scripture', desc: 'Click associated verses to see the original word in literary context.' }
    ],
    caption: `🔍 Uncover the depth of God’s Word with the XeJesUs Lexicon Glossary!

Translations only take you so far. Understand the true richness of:
✨ Hesed (חֶסֶד) - God’s unfailing covenant loyal love
✨ Agape (ἀγάπη) - Self-emptying divine love
✨ Ruach (רוּחַ) - The breath and wind of the Holy Spirit

Look up any biblical concept with Strong’s Concordance integration!

#BiblicalGreek #BiblicalHebrew #StrongConcordance #Lexicon #WordStudy #XeJesUs`,
    previewData: {
      title: 'Original Languages Lexicon',
      verseOrTopic: 'Term: Hesed (חֶסֶד) • Strong’s H2617',
      details: [
        'Transliteration: chesed (kheh\'-sed)',
        'Meaning: Steadfast love, covenant faithfulness, mercy',
        'Scripture Occurrences: 248 Old Testament passages'
      ],
      tag: 'Ancient Concordance',
      keyMetric: 'Hebrew • Greek • Ge’ez Roots'
    }
  },
  {
    id: 'sanctuary-settings',
    name: 'Sanctuary Settings',
    category: 'Sanctuary Settings',
    headline: 'Customize Your Sacred Study Atmosphere & Scholar Engine',
    subheadline: 'Personalize Themes, Audio Personas, Canonical Sources & Bible Gateways',
    guestModeDataSource: 'Guest profile preferences: Atmosphere switcher, Voice preset toggles, and 6 Sources overview.',
    badge: 'SANCTUARY CONTROLS',
    actionCallout: 'Tailor XeJesUs to your personal prayer and research workflow.',
    howToSteps: [
      { step: 1, title: 'Open Settings', desc: 'Click Sanctuary Settings in the sidebar.' },
      { step: 2, title: 'Adjust Atmosphere', desc: 'Toggle between Modern Sanctuary, Traditional Parchment, or Midnight Exegesis.' },
      { step: 3, title: 'Fine-Tune Sources', desc: 'Verify your foundational authorities and online Bible reference gateway.' }
    ],
    caption: `⚙️ Tailor your study sanctuary to your heart's desire!

In XeJesUs "Sanctuary Settings", you have total control over:
🎨 Visual Atmosphere (Modern, Traditional Parchment, Midnight)
🎙️ AI Scholar Voice Personas (Male & Female historical voices)
📚 Foundational Sources Framework (including Asher Wilson's Ethiopian Canon)
🔗 Direct Bible Gateway Link (BibleGateway, BibleHub, Blue Letter Bible)

Create an environment where your spirit can focus on the Word.

#BibleApp #SanctuarySettings #CustomBibleStudy #ChristianTech #XeJesUs`,
    previewData: {
      title: 'Sanctuary Configuration Hub',
      verseOrTopic: '4 Core Control Centers in One Place',
      details: [
        'Visual Atmosphere & Dark/Parchment Themes',
        'AI Scholar Speech Synthesis Engine',
        'Canonical Citations & External Links'
      ],
      tag: 'Sanctuary Hub',
      keyMetric: 'Complete User Customization'
    }
  },
  {
    id: 'settings-profile',
    name: "Pilgrim's Profile",
    category: 'Sanctuary Settings',
    isSubTopic: true,
    parentName: 'Sanctuary Settings',
    headline: "Personalize Identity, Avatar & Sanctuary Atmosphere",
    subheadline: 'Modern Sanctuary, Midnight Exegesis & Traditional Parchment',
    guestModeDataSource: 'Guest Pilgrim profile state (Test Pilgrim, guest@xejesus.app, theme toggle).',
    badge: 'PILGRIM IDENTITY',
    actionCallout: 'Select the optimal visual environment for focused study and prayer.',
    howToSteps: [
      { step: 1, title: 'Open Pilgrim Profile', desc: 'Go to Sanctuary Settings > Pilgrim\'s Profile.' },
      { step: 2, title: 'Choose Atmosphere', desc: 'Select Modern (clean), Midnight (serene dark), or Parchment (heritage scroll).' },
      { step: 3, title: 'Save Configuration', desc: 'Theme updates immediately across the entire sanctuary interface.' }
    ],
    caption: `🕊️ Study scripture in the atmosphere that brings you peace.

Inside "Pilgrim's Profile", choose from three meticulously crafted environments:
☀️ Modern Sanctuary - Crisp, contemporary, high-contrast reading
🌙 Midnight Exegesis - Deep obsidian & gold for reverent late-night prayer
📜 Traditional Parchment - Warm antique textures reminiscent of ancient codices

Experience XeJesUs your way today!

#SanctuaryAtmosphere #BibleStudyAtmosphere #DarkTheme #Parchment #XeJesUs`,
    previewData: {
      title: "Pilgrim's Profile & Themes",
      verseOrTopic: 'Visual Atmosphere: Modern • Midnight • Parchment',
      details: [
        'Instant Real-Time Theme Transition',
        'High-Contrast Pitch-Black & Radiant Gold Typography',
        'Pilgrim Tier & Account Status Badge'
      ],
      tag: 'Visual Atmosphere',
      keyMetric: '3 Stunning Visual Themes'
    }
  },
  {
    id: 'settings-voices',
    name: 'Scholars Voices',
    category: 'Sanctuary Settings',
    isSubTopic: true,
    parentName: 'Sanctuary Settings',
    headline: 'High-Fidelity AI Scholar Voice Narration',
    subheadline: 'Male & Female Personas (C.S. Lewis, Spurgeon, Priscilla Shirer & Custom)',
    guestModeDataSource: 'Guest voice controls: Male/Female preset selectors, custom voice prompt, and audio tester button.',
    badge: 'AI SCHOLAR NARRATION',
    actionCallout: 'Listen to exegesis scrolls narrated in renowned theological personas.',
    howToSteps: [
      { step: 1, title: 'Select Scholar Persona', desc: 'Choose a Male Scholar (e.g. C.S. Lewis) and Female Scholar voice.' },
      { step: 2, title: 'Test Audio Sample', desc: 'Click "Sample Voice" to hear expressive speech playback.' },
      { step: 3, title: 'Custom Persona (Optional)', desc: 'Type any custom scholar or preacher name for personalized tone.' }
    ],
    caption: `🎧 Hear the Word come alive through renowned theological voices!

With "Scholars Voices" in XeJesUs, you can listen to deep exegesis scrolls narrated in distinctive scholar personas:
🎩 C.S. Lewis - Eloquent Oxford contemplative
🎩 Charles Spurgeon - Passionate 19th Century orator
👒 Priscilla Shirer - Dynamic, vibrant exposition
✨ Or enter your own favorite custom preacher persona!

Turn your study sessions into an immersive auditory sanctuary.

#AudioBible #ScholarVoice #CSLewis #Spurgeon #ChristianAudio #XeJesUs`,
    previewData: {
      title: 'Scholars AI Voice Engine',
      verseOrTopic: 'Presets: C.S. Lewis, Spurgeon, Priscilla Shirer & Custom',
      details: [
        'Expressive Text-to-Speech Synthesis',
        'One-Tap Voice Sample Testing',
        'Male & Female Dual-Persona Support'
      ],
      tag: 'Audio Personas',
      keyMetric: 'Custom Preacher Personas'
    }
  },
  {
    id: 'settings-sources',
    name: 'Primary Foundational Sources',
    category: 'Sanctuary Settings',
    isSubTopic: true,
    parentName: 'Sanctuary Settings',
    headline: '6 Academic & Spiritual Pillars of XeJesUs Exegesis',
    subheadline: 'Canonical Bible, Asher Wilson 81-Book Ethiopian Canon & Historical Records',
    guestModeDataSource: 'The 6 Core Sources cards displayed in Settings with complete academic descriptions.',
    badge: '6 SCHOLARLY PILLARS',
    actionCallout: 'Inspect the 6 authoritative pillars anchoring every interpretation.',
    howToSteps: [
      { step: 1, title: 'Review Source Pillars', desc: 'Open Sanctuary Settings > Primary Foundational Sources.' },
      { step: 2, title: 'Examine Source II', desc: 'Learn how Asher Wilson’s Complete Ethiopian Bible preserves Enoch and Jubilees.' },
      { step: 3, title: 'Verify Academic Rigor', desc: 'See how linguistic roots, Patristics, and archaeology prevent AI hallucinations.' }
    ],
    caption: `📚 Why is XeJesUs the most trustworthy Biblical Exegesis platform?

Because every answer is anchored in our Six Primary Foundational Sources:
I. Primary Canonical Scriptures (Genesis to Revelation)
II. Asher Wilson's Complete Ethiopian Bible (81 Books preserving 1 Enoch & Jubilees)
III. Original Linguistic Lexicons (Strong’s, BDB, BDAG)
IV. Patristic & Classical Commentaries (Early Church Fathers)
V. Historical & Archaeological Records (Josephus, Dead Sea Scrolls)
VI. Real-Time Web Grounding for Contemporary World Application

Pure truth, reverently synthesized.

#EthiopianBible #BiblicalCanon #Patristics #Hermeneutics #DeadSeaScrolls #XeJesUs`,
    previewData: {
      title: '6 Primary Foundational Sources',
      verseOrTopic: 'Source II: Asher Wilson’s Complete Ethiopian Bible (81 Books)',
      details: [
        'Source I: Primary Canonical Scriptures (Gen-Rev)',
        'Source III: Hebrew, Greek & Ge’ez Root Etymologies',
        'Source IV: Patristic Commentaries (Augustine, Chrysostom)'
      ],
      tag: 'Citation Framework',
      keyMetric: '6 Verified Pillars'
    }
  },
  {
    id: 'settings-canonical-link',
    name: 'Bible Canonical Link',
    category: 'Sanctuary Settings',
    isSubTopic: true,
    parentName: 'Sanctuary Settings',
    headline: 'Connect Exegesis Scrolls Directly to Online Bible Gateways',
    subheadline: 'BibleGateway, Blue Letter Bible, BibleHub & Asher Wilson Research',
    guestModeDataSource: 'Custom URL configuration field with Quick Fill buttons for BibleGateway, Blue Letter Bible, BibleHub.',
    badge: 'CROSS-REFERENCE GATEWAYS',
    actionCallout: 'Link scriptures directly to your favorite external study website.',
    howToSteps: [
      { step: 1, title: 'Open Canonical Link', desc: 'Navigate to Sanctuary Settings > Bible Canonical Link.' },
      { step: 2, title: 'Choose Quick Preset', desc: 'Click BibleGateway, BibleHub, Blue Letter Bible, or Asher Wilson Research.' },
      { step: 3, title: 'Click Scripture Links', desc: 'Verses in your exegesis scrolls will now open directly in your preferred Bible tool.' }
    ],
    caption: `🔗 Study seamlessly across the web with "Bible Canonical Link"!

XeJesUs allows you to designate your favorite online scripture portal:
📖 BibleGateway
📖 Blue Letter Bible (for interlinear studies)
📖 BibleHub (for parallel translations)
📖 Asher Wilson Ethiopian Bible Research

Every verse in your exegesis scrolls automatically links to your preferred tool for effortless cross-referencing.

#BibleGateway #BlueLetterBible #BibleHub #ScriptureStudy #ChristianTech #XeJesUs`,
    previewData: {
      title: 'Bible Canonical Gateway',
      verseOrTopic: 'Presets: BibleGateway • BibleHub • Blue Letter Bible',
      details: [
        'One-Click Quick Fill URL Configuration',
        'Seamless In-Text Verse Hyperlinking',
        'Asher Wilson Ethiopian Canon Support'
      ],
      tag: 'External Gateways',
      keyMetric: 'Instant Cross-Reference'
    }
  }
];

export default function AdminAdStudio() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('landing-page');
  const [viewMode, setViewMode] = useState<'dual' | 'graphic' | 'script'>('dual');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [adTheme, setAdTheme] = useState<AdTheme>('modern');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; isRunning: boolean } | null>(null);
  const [editableCaption, setEditableCaption] = useState<string>(() => {
    return AD_TOPICS[0].caption;
  });

  // Written Script States
  const [scriptFormat, setScriptFormat] = useState<ScriptFormat>('60s-commercial');
  const [customScripts, setCustomScripts] = useState<Record<string, string>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fullscreen Teleprompter States
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [prompterFontSize, setPrompterFontSize] = useState(32);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const prompterContentRef = useRef<HTMLDivElement>(null);

  // Gemini AI Customizer States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiAudience, setAiAudience] = useState<TargetAudience>('general-seekers');
  const [aiTone, setAiTone] = useState<ScriptTone>('inspiring-pastoral');
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  const adCardRef = useRef<HTMLDivElement>(null);

  const isMasterTopic = selectedTopicId === 'master-all-features';
  const selectedTopic = AD_TOPICS.find(t => t.id === selectedTopicId) || AD_TOPICS[0];

  // Resolve current active script item and text
  const defaultScriptItem: AdScriptItem = isMasterTopic
    ? MASTER_ALL_FEATURES_SCRIPT
    : getScriptForTopic(selectedTopicId, scriptFormat);

  const scriptKey = `${selectedTopicId}_${scriptFormat}`;
  const currentScriptText = customScripts[scriptKey] !== undefined
    ? customScripts[scriptKey]
    : defaultScriptItem.fullScript;

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Teleprompter Keyboard Shortcuts
  useEffect(() => {
    if (!showTeleprompter) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsAutoScrolling(prev => !prev);
      } else if (e.code === 'Escape') {
        setShowTeleprompter(false);
        setIsAutoScrolling(false);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setScrollSpeed(prev => Math.min(prev + 1, 6));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setScrollSpeed(prev => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTeleprompter]);

  // Teleprompter Auto-scroll Loop
  useEffect(() => {
    if (!showTeleprompter || !isAutoScrolling) return;
    let animId: number;
    const scrollStep = () => {
      if (prompterContentRef.current) {
        prompterContentRef.current.scrollTop += scrollSpeed * 0.7;
      }
      animId = requestAnimationFrame(scrollStep);
    };
    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [showTeleprompter, isAutoScrolling, scrollSpeed]);

  const handleSelectTopic = (topic: AdTopicConfig) => {
    setSelectedTopicId(topic.id);
    setEditableCaption(topic.caption);
    if (scriptFormat === 'master-commercial') {
      setScriptFormat('60s-commercial');
    }
  };

  const handleSelectMasterTopic = () => {
    setSelectedTopicId('master-all-features');
    setScriptFormat('master-commercial');
    setEditableCaption(`🌟 XeJesUs: The Living Exegesis Sanctuary — Complete Walkthrough!

Discover Jesus' authentic 1st Century voice through original Greek, Hebrew, and Ge'ez roots, synthesized across 6 foundational pillars including Asher Wilson's 81-book Ethiopian Bible canon.

✨ Zero-Friction Guest Mode Access
✨ Pre-loaded with Lazarus (John 11:35) & 153 Fish (John 21:11)
✨ Then vs Now Antiquity-to-Modernity Cross-Referencing
✨ Historical Scholar Voice Narration

👉 Test Drive now at https://xejesus.app
#XeJesUs #BibleStudy #Exegesis #Hermeneutics #GospelOfJohn #ChurchHistory #ChristianTech`);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(editableCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch (err) {
      console.error("Failed to copy caption", err);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(currentScriptText);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch (err) {
      console.error("Failed to copy script", err);
    }
  };

  const handleScriptTextChange = (newText: string) => {
    setCustomScripts(prev => ({
      ...prev,
      [scriptKey]: newText
    }));
  };

  const handleResetScript = () => {
    setCustomScripts(prev => {
      const copy = { ...prev };
      delete copy[scriptKey];
      return copy;
    });
  };

  const handleToggleVoiceover = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Extract spoken narrative text: skip bracketed lines [Visual: ...], [0:00 - 0:10], [Audio: ...]
    // and strip VOICEOVER: / NARRATOR: prefixes
    const lines = currentScriptText.split('\n');
    const spokenLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('[') && line.endsWith(']')) continue;
      if (line.startsWith('[Visual') || line.startsWith('[Audio') || line.startsWith('[Graphic')) continue;

      let clean = line;
      clean = clean.replace(/^(VOICEOVER|NARRATOR|HOST|SPEAKER|PRESENTER):\s*"?/i, '');
      if (clean.endsWith('"')) {
        clean = clean.slice(0, -1);
      }
      clean = clean.replace(/\[.*?\]/g, '').trim();

      if (clean.length > 0) {
        spokenLines.push(clean);
      }
    }

    const fullSpokenText = spokenLines.join(' ');
    if (!fullSpokenText) {
      alert("No spoken lines detected to narrate. Ensure the script contains dialogue lines.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fullSpokenText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadScript = (formatExt: 'txt' | 'md') => {
    const topicTitle = isMasterTopic ? 'XeJesUs Master All-Features Commercial' : selectedTopic.name;
    const cleanFilename = `xejesus-ad-script-${isMasterTopic ? 'master' : selectedTopic.id}-${scriptFormat}.${formatExt}`;

    let content = '';
    const wordCount = currentScriptText.split(/\s+/).filter(Boolean).length;

    if (formatExt === 'md') {
      content = `# XeJesUs Advertising & Narration Script
**Sanctuary Feature:** ${topicTitle}  
**Format:** ${scriptFormat}  
**Estimated Run-Time:** ${defaultScriptItem.durationEstimate}  
**Word Count:** ~${wordCount} words  

---

### Key Features Explained & Highlighted
${defaultScriptItem.keyFeaturesSummary.map((f, i) => `${i + 1}. **${f}**`).join('\n')}

---

### Call To Action
> "${defaultScriptItem.callToAction}"

---

### Production Script (Timestamps, Visual Cues & Spoken Voiceover)
\`\`\`text
${currentScriptText}
\`\`\`

---
*Created with the XeJesUs Admin Marketing & Exegesis Studio*
`;
    } else {
      content = `======================================================================
XEJESUS ADVERTISING & NARRATION SCRIPT
Sanctuary Feature: ${topicTitle}
Format: ${scriptFormat}
Estimated Run-Time: ${defaultScriptItem.durationEstimate}
Word Count: ~${wordCount} words
======================================================================

KEY FEATURES EXPLAINED IN THIS SCRIPT:
${defaultScriptItem.keyFeaturesSummary.map((f, i) => `[${i + 1}] ${f}`).join('\n')}

CALL TO ACTION:
"${defaultScriptItem.callToAction}"

======================================================================
PRODUCTION SCRIPT (TIMESTAMPS, VISUAL CUES & SPOKEN VOICEOVER):
======================================================================
${currentScriptText}

======================================================================
Created with the XeJesUs Admin Marketing & Exegesis Studio
`;
    }

    const blob = new Blob([content], { type: formatExt === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleGenerateAiCustomScript = async () => {
    setIsGeneratingAi(true);
    setAiStatusMessage(null);
    try {
      const topicName = isMasterTopic 
        ? 'Complete XeJesUs Sanctuary (All 14 Features)' 
        : selectedTopic.name;

      const result = await generateAdScript({
        topicName,
        format: scriptFormat,
        targetAudience: aiAudience,
        tone: aiTone,
        customInstructions: aiCustomNotes,
        keyFeatures: defaultScriptItem.keyFeaturesSummary
      });

      if (result && result.fullScript) {
        setCustomScripts(prev => ({
          ...prev,
          [scriptKey]: result.fullScript
        }));
        setAiStatusMessage("Script tailored successfully with Gemini!");
        setTimeout(() => {
          setShowAiModal(false);
          setAiStatusMessage(null);
        }, 1200);
      } else {
        alert("Could not generate script. Please try again.");
      }
    } catch (err) {
      console.error("AI Script generation error:", err);
      alert("Error generating script with AI. Check console or try again.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadSingleImage = async (formatTitle: string) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const canvas = renderAdToCanvas(selectedTopic, aspectRatio, adTheme);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const cleanName = selectedTopic.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `xejesus-ad-${cleanName}-${aspectRatio.replace(':', 'x')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export ad image", error);
      alert("Image export encountered an error.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAllBundle = async () => {
    if (batchProgress?.isRunning) return;
    setBatchProgress({ current: 0, total: AD_TOPICS.length, isRunning: true });

    for (let i = 0; i < AD_TOPICS.length; i++) {
      const topic = AD_TOPICS[i];
      setSelectedTopicId(topic.id);
      setEditableCaption(topic.caption);
      setBatchProgress({ current: i + 1, total: AD_TOPICS.length, isRunning: true });

      try {
        const canvas = renderAdToCanvas(topic, aspectRatio, adTheme);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const cleanName = topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        link.download = `xejesus-ad-${i + 1}-${cleanName}-${aspectRatio.replace(':', 'x')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.warn(`Could not export ${topic.name}:`, e);
      }

      await new Promise(r => setTimeout(r, 100));
    }

    setBatchProgress(null);
  };

  // Dynamic styling variables based on theme
  const getThemeClasses = () => {
    switch (adTheme) {
      case 'parchment':
        return {
          cardBg: 'bg-[#f4ebe1] text-[#1c140d] border-[#cbb396]',
          cardHeader: 'bg-[#eadcc9] border-[#d8c5ad]',
          accentText: 'text-[#8b5a2b]',
          accentBg: 'bg-[#8b5a2b]/15 text-[#8b5a2b]',
          badgeBg: 'bg-[#8b5a2b] text-white',
          innerCard: 'bg-[#fdfaf5] border-[#d8c5ad] shadow-sm',
          footerBg: 'bg-[#e4d4bd] border-[#cbb396]'
        };
      case 'midnight':
        return {
          cardBg: 'bg-[#060b19] text-[#f8fafc] border-[#1e293b]',
          cardHeader: 'bg-[#0f172a] border-[#1e293b]',
          accentText: 'text-[#38bdf8]',
          accentBg: 'bg-[#38bdf8]/15 text-[#38bdf8]',
          badgeBg: 'bg-[#38bdf8] text-[#060b19]',
          innerCard: 'bg-[#0b1329] border-[#1e293b] shadow-sm',
          footerBg: 'bg-[#0a1024] border-[#1e293b]'
        };
      case 'modern':
      default:
        return {
          cardBg: 'bg-[#090d16] text-[#ffffff] border-[#cb9f43]/40',
          cardHeader: 'bg-[#111827] border-[#cb9f43]/30',
          accentText: 'text-[#cb9f43]',
          accentBg: 'bg-[#cb9f43]/15 text-[#cb9f43]',
          badgeBg: 'bg-[#cb9f43] text-[#090d16]',
          innerCard: 'bg-[#131b2e] border-[#cb9f43]/20 shadow-sm',
          footerBg: 'bg-[#0d1424] border-[#cb9f43]/30'
        };
    }
  };

  const themeStyle = getThemeClasses();

  // Aspect ratio sizing
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-[16/9] max-w-4xl';
      case '9:16':
        return 'aspect-[9/16] max-w-sm';
      case '1:1':
      default:
        return 'aspect-square max-w-xl';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Station Header */}
      <div className="bg-ui-card rounded-[2.5rem] p-8 md:p-10 border border-ui-border shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Megaphone className="w-64 h-64 text-accent" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-accent text-bg-primary text-[10px] font-sans font-black uppercase tracking-[0.25em]">
                ADMIN MARKETING & HOW-TO STUDIO
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                14 AD TEMPLATES
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Scroll className="w-3 h-3" />
                WRITTEN SCRIPTS & AUDIO VOICEOVER
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary">
              Advertisement Graphics & Written Script Studio
            </h2>
            <p className="text-sm text-text-primary font-medium max-w-3xl leading-relaxed">
              Generate publication-grade promotional images, step-by-step How-To guides, and complete written advertising & narration scripts (with timestamps, stage directions, audio voiceover preview, and teleprompter) explaining XeJesUs key features.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* View Mode Switcher */}
            <div className="bg-ui-sidebar p-1 rounded-2xl border border-ui-border flex items-center gap-1">
              <button
                onClick={() => setViewMode('dual')}
                className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'dual'
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'text-text-primary hover:text-accent'
                }`}
                title="View Graphic and Written Script simultaneously"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Dual View</span>
              </button>
              <button
                onClick={() => setViewMode('script')}
                className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'script'
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'text-text-primary hover:text-accent'
                }`}
                title="Focus on Written Advertising Script & Voiceover"
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Written Script</span>
              </button>
              <button
                onClick={() => setViewMode('graphic')}
                className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'graphic'
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'text-text-primary hover:text-accent'
                }`}
                title="Focus on Visual Graphic & Canvas export"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Visual Graphic</span>
              </button>
            </div>

            <button
              onClick={() => handleDownloadSingleImage('Single')}
              disabled={isExporting || batchProgress?.isRunning}
              className="px-5 py-3 rounded-2xl bg-accent text-bg-primary font-sans font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/25 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating...' : 'Download PNG'}</span>
            </button>

            <button
              onClick={handleDownloadAllBundle}
              disabled={batchProgress?.isRunning}
              className="px-5 py-3 rounded-2xl bg-ui-sidebar border border-ui-border text-text-primary font-sans font-bold text-xs uppercase tracking-widest hover:bg-accent hover:text-bg-primary transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-accent" />
              <span>{batchProgress?.isRunning ? `(${batchProgress.current}/${batchProgress.total})...` : 'All 14 Ads'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Topic Selector on Left, Interactive Ad Preview & Script on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Master Commercial + 14 Topic Buttons (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-ui-card rounded-[2rem] border border-ui-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-sans font-black text-accent uppercase tracking-[0.3em] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Select Sanctuary Feature
              </h3>
              <span className="text-[10px] text-text-primary font-bold">14 Topics + Master</span>
            </div>

            {/* Master Commercial Highlight Button */}
            <div className="mb-4">
              <button
                onClick={handleSelectMasterTopic}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden group ${
                  isMasterTopic
                    ? 'bg-gradient-to-r from-accent/25 via-accent/15 to-transparent border-accent shadow-md shadow-accent/20'
                    : 'bg-ui-sidebar/80 hover:bg-ui-sidebar border-accent/40 text-text-primary'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-accent text-bg-primary text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    MASTER SHOWCASE
                  </span>
                  <span className="text-[10px] font-mono text-accent font-bold">90-120s</span>
                </div>
                <div className="text-xs font-sans font-bold text-text-primary group-hover:text-accent transition-colors flex items-center justify-between">
                  <span>🌟 Master Sanctuary Commercial</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isMasterTopic ? 'translate-x-1 text-accent' : 'opacity-40'}`} />
                </div>
                <p className="text-[11px] text-text-primary/75 mt-0.5 line-clamp-1">
                  Complete walkthrough covering all 14 sanctuary features
                </p>
              </button>
            </div>

            {/* Topics Grouped by Category */}
            <div className="space-y-6 max-h-[760px] overflow-y-auto pr-1">
              
              {/* Category 1: Sanctuary Portal */}
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary/70 mb-2 px-2">
                  Portal & Headquarters
                </p>
                <div className="space-y-1.5">
                  {AD_TOPICS.filter(t => t.category === 'Sanctuary Portal').map(t => {
                    const active = t.id === selectedTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTopic(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                          active 
                            ? 'bg-accent text-bg-primary font-bold shadow-md shadow-accent/20 translate-x-1' 
                            : 'bg-ui-sidebar/50 hover:bg-ui-sidebar border border-ui-border text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {t.id === 'landing-page' && <HomeIcon className="w-4 h-4 shrink-0" />}
                          {t.id === 'dashboard' && <Monitor className="w-4 h-4 shrink-0" />}
                          {t.id === 'library' && <BookOpen className="w-4 h-4 shrink-0" />}
                          <span className="text-xs font-sans tracking-tight">{t.name}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Exegetical Tools */}
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary/70 mb-2 px-2">
                  Exegetical Query Tools
                </p>
                <div className="space-y-1.5">
                  {AD_TOPICS.filter(t => t.category === 'Exegetical Tools').map(t => {
                    const active = t.id === selectedTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTopic(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                          active 
                            ? 'bg-accent text-bg-primary font-bold shadow-md shadow-accent/20 translate-x-1' 
                            : 'bg-ui-sidebar/50 hover:bg-ui-sidebar border border-ui-border text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {t.id === 'seek-word' && <Search className="w-4 h-4 shrink-0" />}
                          {t.id === 'then-vs-now' && <Compass className="w-4 h-4 shrink-0" />}
                          <span className="text-xs font-sans tracking-tight">{t.name}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: Community & Dialogue */}
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary/70 mb-2 px-2">
                  Community & Dialogue
                </p>
                <div className="space-y-1.5">
                  {AD_TOPICS.filter(t => t.category === 'Community & Dialogue').map(t => {
                    const active = t.id === selectedTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTopic(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                          active 
                            ? 'bg-accent text-bg-primary font-bold shadow-md shadow-accent/20 translate-x-1' 
                            : 'bg-ui-sidebar/50 hover:bg-ui-sidebar border border-ui-border text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {t.id === 'study-groups' && <Users className="w-4 h-4 shrink-0" />}
                          {t.id === 'saved-chats' && <History className="w-4 h-4 shrink-0" />}
                          <span className="text-xs font-sans tracking-tight">{t.name}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 4: Scholarship & Analytics */}
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary/70 mb-2 px-2">
                  Scholarship & Analytics
                </p>
                <div className="space-y-1.5">
                  {AD_TOPICS.filter(t => t.category === 'Scholarship & Analytics').map(t => {
                    const active = t.id === selectedTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTopic(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                          active 
                            ? 'bg-accent text-bg-primary font-bold shadow-md shadow-accent/20 translate-x-1' 
                            : 'bg-ui-sidebar/50 hover:bg-ui-sidebar border border-ui-border text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {t.id === 'reports-menu' && <FileText className="w-4 h-4 shrink-0" />}
                          {t.id === 'lexicon-glossary' && <GraduationCap className="w-4 h-4 shrink-0" />}
                          <span className="text-xs font-sans tracking-tight">{t.name}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 5: Sanctuary Settings & 4 Sub-Sections */}
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary/70 mb-2 px-2">
                  Sanctuary Settings & Pillars
                </p>
                <div className="space-y-1.5">
                  {/* Sanctuary Settings Parent */}
                  {AD_TOPICS.filter(t => t.id === 'sanctuary-settings').map(t => {
                    const active = t.id === selectedTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTopic(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                          active 
                            ? 'bg-accent text-bg-primary font-bold shadow-md shadow-accent/20 translate-x-1' 
                            : 'bg-ui-sidebar/50 hover:bg-ui-sidebar border border-ui-border text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <SettingsIcon className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-sans font-bold">{t.name}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'}`} />
                      </button>
                    );
                  })}

                  {/* 4 Settings Sub-Items */}
                  <div className="pl-4 space-y-1.5 border-l-2 border-accent/20 mt-1">
                    {AD_TOPICS.filter(t => t.isSubTopic).map(t => {
                      const active = t.id === selectedTopicId;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTopic(t)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group text-xs ${
                            active 
                              ? 'bg-accent text-bg-primary font-bold shadow-sm translate-x-1' 
                              : 'bg-ui-card hover:bg-ui-sidebar/80 border border-ui-border/60 text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {t.id === 'settings-profile' && <User className="w-3.5 h-3.5 shrink-0 text-accent" />}
                            {t.id === 'settings-voices' && <Mic className="w-3.5 h-3.5 shrink-0 text-purple-400" />}
                            {t.id === 'settings-sources' && <Library className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
                            {t.id === 'settings-canonical-link' && <Globe className="w-3.5 h-3.5 shrink-0 text-blue-400" />}
                            <span className="truncate">{t.name}</span>
                          </div>
                          <ChevronRight className={`w-3 h-3 shrink-0 ${active ? 'opacity-100' : 'opacity-30'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Graphic Studio and Written Script Studio (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. VISUAL GRAPHIC & HOW-TO GENERATOR */}
          {(viewMode === 'graphic' || viewMode === 'dual') && (
            <div className="space-y-6">
              {/* Controls Bar: Theme & Aspect Ratio */}
              <div className="bg-ui-card rounded-2xl border border-ui-border p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary mr-1">
                Format:
              </span>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all ${
                  aspectRatio === '1:1' 
                    ? 'bg-accent text-bg-primary shadow-sm' 
                    : 'bg-ui-sidebar border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>1:1 Square (Post)</span>
              </button>
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all ${
                  aspectRatio === '16:9' 
                    ? 'bg-accent text-bg-primary shadow-sm' 
                    : 'bg-ui-sidebar border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9 Banner</span>
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all ${
                  aspectRatio === '9:16' 
                    ? 'bg-accent text-bg-primary shadow-sm' 
                    : 'bg-ui-sidebar border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Story</span>
              </button>
            </div>

            {/* Atmosphere Theme Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-black uppercase tracking-wider text-text-primary mr-1">
                Theme:
              </span>
              <button
                onClick={() => setAdTheme('modern')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                  adTheme === 'modern' 
                    ? 'bg-accent text-bg-primary shadow-sm' 
                    : 'bg-ui-sidebar border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                Modern
              </button>
              <button
                onClick={() => setAdTheme('parchment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                  adTheme === 'parchment' 
                    ? 'bg-[#8b5a2b] text-white shadow-sm' 
                    : 'bg-ui-sidebar border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                Parchment
              </button>
              <button
                onClick={() => setAdTheme('midnight')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                  adTheme === 'midnight' 
                    ? 'bg-[#38bdf8] text-[#060b19] shadow-sm' 
                    : 'bg-ui-sidebar border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                Midnight
              </button>
            </div>
          </div>

          {/* Interactive Live Ad Preview Card Container */}
          <div className="flex justify-center bg-bg-primary/60 p-4 md:p-8 rounded-[2.5rem] border border-ui-border overflow-x-auto shadow-inner">
            <div 
              ref={adCardRef}
              className={`w-full ${getAspectClass()} ${themeStyle.cardBg} rounded-[2rem] border-2 shadow-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden select-none transition-all duration-300`}
            >
              {/* Background watermark icon */}
              <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
                <BookOpen className="w-56 h-56" />
              </div>

              {/* Top Ad Header */}
              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-current/15 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-bg-primary font-black shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-black text-lg tracking-tight">XeJesUs</span>
                      <span className="text-[10px] uppercase font-sans tracking-widest font-bold px-2 py-0.5 rounded bg-current/10">
                        SANCTUARY HOW-TO
                      </span>
                    </div>
                    <p className="text-[11px] font-sans font-bold opacity-75">Faith through Understanding</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-sans font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${themeStyle.badgeBg} shadow-sm`}>
                    {selectedTopic.badge}
                  </span>
                </div>
              </div>

              {/* Center Ad Hero Section */}
              <div className="relative z-10 py-4 space-y-4 my-auto">
                <div className="space-y-1">
                  <span className={`text-xs font-sans font-black uppercase tracking-[0.25em] ${themeStyle.accentText}`}>
                    {selectedTopic.name} • {selectedTopic.category}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold leading-tight">
                    {selectedTopic.headline}
                  </h3>
                  <p className="text-xs md:text-sm font-sans font-medium opacity-85 leading-relaxed">
                    {selectedTopic.subheadline}
                  </p>
                </div>

                {/* Real Guest Mode Data Mock Card */}
                <div className={`p-4 rounded-2xl ${themeStyle.innerCard} border space-y-3`}>
                  <div className="flex items-center justify-between pb-2 border-b border-current/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-sans font-black uppercase tracking-wider">
                        Guest Mode Live Data: {selectedTopic.previewData.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-accent/15 text-accent">
                      {selectedTopic.previewData.tag}
                    </span>
                  </div>

                  {selectedTopic.previewData.verseOrTopic && (
                    <div className="text-xs font-serif font-bold italic opacity-95">
                      "{selectedTopic.previewData.verseOrTopic}"
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {selectedTopic.previewData.details.map((detail, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-current/5 border border-current/10 text-[10px] font-sans font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step "How To" 1-2-3 Guide Badges */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-sans font-black uppercase tracking-[0.2em] opacity-80">
                    Step-by-Step How To:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {selectedTopic.howToSteps.map((step) => (
                      <div 
                        key={step.step}
                        className={`p-3 rounded-xl ${themeStyle.innerCard} border flex flex-col justify-between gap-1 shadow-sm`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full ${themeStyle.badgeBg} flex items-center justify-center text-[10px] font-sans font-black`}>
                            {step.step}
                          </span>
                          <span className="text-xs font-sans font-black uppercase tracking-tight">{step.title}</span>
                        </div>
                        <p className="text-[11px] font-sans font-medium opacity-80 leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Callout */}
              <div className="relative z-10 pt-4 border-t border-current/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-sans font-black uppercase tracking-wider opacity-70">
                    Verified Guest Mode Flow
                  </span>
                  <p className="font-sans font-bold">
                    {selectedTopic.actionCallout}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-accent text-bg-primary font-sans font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span>xejesus.app</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Caption & Copy Controls */}
          <div className="bg-ui-card rounded-[2rem] border border-ui-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-sans font-black text-accent uppercase tracking-[0.3em] flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Publication Caption & Hashtags
                </h4>
                <p className="text-xs text-text-primary font-medium">
                  Pre-formatted for X/Twitter, Instagram, LinkedIn, Facebook, and Church Newsletters.
                </p>
              </div>

              <button
                onClick={handleCopyCaption}
                className={`px-4 py-2 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                  copiedCaption 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-accent text-bg-primary hover:scale-105 active:scale-95'
                }`}
              >
                {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Caption & Tags'}</span>
              </button>
            </div>

            {/* Editable Caption Textarea */}
            <div className="relative">
              <textarea
                value={editableCaption}
                onChange={(e) => setEditableCaption(e.target.value)}
                rows={7}
                className="w-full bg-bg-primary/70 border border-ui-border rounded-2xl p-4 text-xs font-sans text-text-primary focus:outline-none focus:border-accent leading-relaxed shadow-inner"
                placeholder="Enter social media caption..."
              />
            </div>

            {/* Quick Guest Data Summary */}
            <div className="p-4 rounded-xl bg-ui-sidebar/60 border border-ui-border flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-sans font-black text-text-primary uppercase tracking-wider text-[10px] block mb-0.5">
                  Guest Mode Data Snapshot Used:
                </span>
                <p className="text-text-primary font-medium text-[11px] leading-relaxed">
                  {selectedTopic.guestModeDataSource}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. WRITTEN ADVERTISING SCRIPT & VOICEOVER GUIDE (Script or Dual) */}
      {/* ========================================================= */}
      {(viewMode === 'script' || viewMode === 'dual') && (
        <div className="bg-ui-card rounded-[2.5rem] border-2 border-accent/40 p-6 md:p-8 shadow-xl space-y-6">
          
          {/* Script Station Header & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ui-border">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-accent text-bg-primary text-[10px] font-sans font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5" />
                  WRITTEN ADVERTISING SCRIPT & VOICEOVER GUIDE
                </span>
                <span className="px-3 py-1 rounded-full bg-ui-sidebar border border-ui-border text-text-primary text-[10px] font-mono font-bold">
                  ⏱️ {defaultScriptItem.durationEstimate}
                </span>
                <span className="px-3 py-1 rounded-full bg-ui-sidebar border border-ui-border text-text-primary text-[10px] font-mono font-bold">
                  📝 ~{currentScriptText.split(/\s+/).filter(Boolean).length} words
                </span>
                {isMasterTopic && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                    🌟 ALL 14 SANCTUARY FEATURES INCLUDED
                  </span>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-text-primary">
                {defaultScriptItem.title}
              </h3>
              <p className="text-xs text-text-primary font-medium">
                Comprehensive production script with stage directions, on-screen visual cues, and narration dialogue explaining XeJesUs key features.
              </p>
            </div>

            {/* Script Format Selector Pills (Hidden when Master topic is selected) */}
            {!isMasterTopic && (
              <div className="flex items-center gap-1 bg-ui-sidebar/80 p-1.5 rounded-2xl border border-ui-border flex-wrap shrink-0">
                <button
                  onClick={() => setScriptFormat('60s-commercial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all ${
                    scriptFormat === '60s-commercial'
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-primary hover:text-accent'
                  }`}
                >
                  🎬 60s Commercial
                </button>
                <button
                  onClick={() => setScriptFormat('30s-reel')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all ${
                    scriptFormat === '30s-reel'
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-primary hover:text-accent'
                  }`}
                >
                  ⚡ 30s Reel
                </button>
                <button
                  onClick={() => setScriptFormat('2m-tutorial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all ${
                    scriptFormat === '2m-tutorial'
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-primary hover:text-accent'
                  }`}
                >
                  📖 2-Min Walkthrough
                </button>
                <button
                  onClick={() => setScriptFormat('podcast-radio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all ${
                    scriptFormat === 'podcast-radio'
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-primary hover:text-accent'
                  }`}
                >
                  🎙️ Radio/Audio
                </button>
              </div>
            )}
          </div>

          {/* Key Features Explained Callout Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-accent/10 via-ui-sidebar/50 to-ui-card border-l-4 border-accent border border-ui-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-sans font-black text-accent uppercase tracking-[0.25em] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Key Features Explained in this Script
              </h4>
              <span className="text-[10px] font-sans font-bold text-text-primary/70">
                Targeted Talking Points
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {defaultScriptItem.keyFeaturesSummary.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-sans text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">{feature}</span>
                </div>
              ))}
            </div>

            {/* Opening Hook and Call to Action */}
            <div className="pt-2 border-t border-ui-border/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono font-black text-accent uppercase tracking-wider block mb-0.5">
                  Opening Hook Line:
                </span>
                <p className="italic text-text-primary font-serif">
                  "{defaultScriptItem.hook}"
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-wider block mb-0.5">
                  Call to Action:
                </span>
                <p className="font-medium text-text-primary">
                  "{defaultScriptItem.callToAction}"
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl bg-ui-sidebar/60 border border-ui-border">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Play/Stop Voiceover button */}
              <button
                onClick={handleToggleVoiceover}
                className={`px-4 py-2.5 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                  isSpeaking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-accent text-bg-primary hover:scale-105 active:scale-95'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? 'Stop Voiceover Narration' : 'Listen to Voiceover'}</span>
              </button>

              {/* Teleprompter button */}
              <button
                onClick={() => {
                  setShowTeleprompter(true);
                  setIsAutoScrolling(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-ui-card border border-ui-border text-text-primary font-sans font-bold text-xs uppercase tracking-wider hover:border-accent hover:text-accent transition-all flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4 text-accent" />
                <span>Launch Teleprompter</span>
              </button>

              {/* Tailor with Gemini AI */}
              <button
                onClick={() => setShowAiModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-sans font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
              >
                <Wand2 className="w-4 h-4" />
                <span>Customize with Gemini AI</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Copy Script */}
              <button
                onClick={handleCopyScript}
                className={`px-3.5 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  copiedScript
                    ? 'bg-emerald-600 text-white'
                    : 'bg-ui-card border border-ui-border text-text-primary hover:border-accent'
                }`}
              >
                {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
              </button>

              {/* Download TXT */}
              <button
                onClick={() => handleDownloadScript('txt')}
                className="px-3 py-2.5 rounded-xl bg-ui-card border border-ui-border text-text-primary hover:border-accent font-sans font-bold text-xs flex items-center gap-1.5"
                title="Download script as clean text file"
              >
                <FileText className="w-4 h-4 text-accent" />
                <span>.TXT</span>
              </button>

              {/* Download Markdown */}
              <button
                onClick={() => handleDownloadScript('md')}
                className="px-3 py-2.5 rounded-xl bg-ui-card border border-ui-border text-text-primary hover:border-accent font-sans font-bold text-xs flex items-center gap-1.5"
                title="Download script as formatted Markdown"
              >
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>.MD</span>
              </button>

              {/* Reset to Default */}
              {customScripts[scriptKey] && (
                <button
                  onClick={handleResetScript}
                  className="px-3 py-2.5 rounded-xl bg-ui-card border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-sans font-bold text-xs flex items-center gap-1"
                  title="Reset to default script"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Formatted Script Editor & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-sans text-text-primary px-1">
              <span className="font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                Production Script (Directly Editable with Timestamps & Stage Directions):
              </span>
              <span className="font-mono text-[11px] text-text-primary/75">
                [Visual: ...] = Visual direction • VOICEOVER: "..." = Spoken dialogue
              </span>
            </div>

            <div className="relative rounded-2xl border-2 border-ui-border bg-ui-sidebar/50 focus-within:border-accent transition-colors shadow-inner overflow-hidden">
              <textarea
                value={currentScriptText}
                onChange={(e) => handleScriptTextChange(e.target.value)}
                rows={14}
                className="w-full bg-transparent p-5 font-mono text-xs md:text-sm text-text-primary leading-relaxed focus:outline-none resize-y selection:bg-accent selection:text-bg-primary"
                placeholder="Enter production script with stage directions and spoken lines..."
              />
            </div>
          </div>
        </div>
      )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FULLSCREEN TELEPROMPTER MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showTeleprompter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#090d16] text-[#ffffff] flex flex-col select-none"
          >
            {/* Top Floating Control Bar */}
            <div className="p-4 md:px-8 border-b border-white/10 bg-[#060a12]/95 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    XeJesUs Teleprompter Studio
                  </h4>
                  <p className="text-[11px] text-white/60 font-mono">
                    {defaultScriptItem.title} • Spacebar toggles scroll • Esc exits
                  </p>
                </div>
              </div>

              {/* Prompter Controls */}
              <div className="flex items-center gap-2">
                {/* Play/Pause Auto-scroll */}
                <button
                  onClick={() => setIsAutoScrolling(prev => !prev)}
                  className={`px-4 py-2 rounded-xl font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                    isAutoScrolling
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-500 text-black hover:scale-105'
                  }`}
                >
                  {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isAutoScrolling ? 'Pause (Space)' : 'Scroll (Space)'}</span>
                </button>

                {/* Speed Controls */}
                <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                  <span className="text-[10px] font-mono uppercase px-2 text-white/70">Speed</span>
                  <button
                    onClick={() => setScrollSpeed(prev => Math.max(prev - 1, 1))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center text-white"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-accent">{scrollSpeed}x</span>
                  <button
                    onClick={() => setScrollSpeed(prev => Math.min(prev + 1, 6))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center text-white"
                  >
                    +
                  </button>
                </div>

                {/* Font Size Controls */}
                <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                  <span className="text-[10px] font-mono uppercase px-2 text-white/70">Font</span>
                  <button
                    onClick={() => setPrompterFontSize(prev => Math.max(prev - 4, 20))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center text-white"
                  >
                    A-
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-accent">{prompterFontSize}px</span>
                  <button
                    onClick={() => setPrompterFontSize(prev => Math.min(prev + 4, 64))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center text-white"
                  >
                    A+
                  </button>
                </div>

                {/* Close Prompter */}
                <button
                  onClick={() => {
                    setShowTeleprompter(false);
                    setIsAutoScrolling(false);
                  }}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prompter Text Scroll Area */}
            <div
              ref={prompterContentRef}
              className="flex-1 overflow-y-auto px-8 md:px-32 py-20 font-serif leading-relaxed text-center scroll-smooth focus:outline-none"
              style={{ fontSize: `${prompterFontSize}px` }}
            >
              <div className="max-w-4xl mx-auto space-y-10 pb-40">
                <div className="text-accent text-sm md:text-base font-sans font-black uppercase tracking-[0.3em] pb-4 border-b border-accent/20">
                  {defaultScriptItem.title}
                </div>
                {currentScriptText.split('\n\n').map((paragraph, idx) => {
                  const isStageDirection = paragraph.trim().startsWith('[');
                  return (
                    <div
                      key={idx}
                      className={`transition-all duration-300 ${
                        isStageDirection
                          ? 'text-accent/60 font-mono text-[65%] tracking-normal'
                          : 'text-white font-serif font-medium tracking-wide'
                      }`}
                    >
                      {paragraph}
                    </div>
                  );
                })}
                <div className="pt-20 text-accent/50 text-sm font-sans uppercase tracking-[0.25em]">
                  — END OF SCRIPT —
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 4. GEMINI AI CUSTOMIZER MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-ui-card border-2 border-accent/40 rounded-[2rem] p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-ui-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-text-primary">
                      Customize with Gemini AI
                    </h3>
                    <p className="text-xs text-text-primary font-medium">
                      Tailor advertising lines, stage directions, and audience tone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="w-8 h-8 rounded-lg bg-ui-sidebar flex items-center justify-center text-text-primary hover:text-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4 text-xs font-sans">
                {/* Target Audience */}
                <div>
                  <label className="font-bold text-text-primary uppercase tracking-wider block mb-1.5">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'general-seekers', label: 'General Seekers' },
                      { id: 'pastors-leaders', label: 'Pastors & Ministry' },
                      { id: 'youth-students', label: 'Youth & Students' },
                      { id: 'scholars-seminary', label: 'Seminary & Scholars' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setAiAudience(opt.id as TargetAudience)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          aiAudience === opt.id
                            ? 'bg-accent text-bg-primary font-bold border-accent shadow-sm'
                            : 'bg-ui-sidebar border-ui-border text-text-primary hover:border-accent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Script Tone */}
                <div>
                  <label className="font-bold text-text-primary uppercase tracking-wider block mb-1.5">
                    Script Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'inspiring-pastoral', label: 'Inspiring & Pastoral' },
                      { id: 'scholarly-deep', label: 'Scholarly & Deep' },
                      { id: 'dynamic-modern', label: 'Dynamic & Fast' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setAiTone(opt.id as ScriptTone)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          aiTone === opt.id
                            ? 'bg-accent text-bg-primary font-bold border-accent shadow-sm'
                            : 'bg-ui-sidebar border-ui-border text-text-primary hover:border-accent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="font-bold text-text-primary uppercase tracking-wider block mb-1.5">
                    Custom Focus / Specific Instructions (Optional)
                  </label>
                  <textarea
                    value={aiCustomNotes}
                    onChange={(e) => setAiCustomNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Emphasize how Guest Mode lets users explore Lazarus in John 11:35 in 10 seconds..."
                    className="w-full bg-ui-sidebar border border-ui-border rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {aiStatusMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                  {aiStatusMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAiModal(false)}
                  disabled={isGeneratingAi}
                  className="px-4 py-2.5 rounded-xl bg-ui-sidebar border border-ui-border text-text-primary text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAiCustomScript}
                  disabled={isGeneratingAi}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-sans font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{isGeneratingAi ? 'Writing with Gemini...' : 'Generate Script'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HomeIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function renderAdToCanvas(
  topic: AdTopicConfig,
  aspectRatio: AspectRatio,
  theme: AdTheme
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let width = 1080;
  let height = 1080;

  if (aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  } else if (aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Exact Hex and RGB colors - 100% immune to oklab/oklch parser issues
  let bgGradStart = '#090d16';
  let bgGradEnd = '#0d1424';
  let cardSurface = 'rgba(19, 27, 46, 0.96)';
  let cardBorder = 'rgba(203, 159, 67, 0.35)';
  let accentColor = '#cb9f43';
  let badgeText = '#090d16';
  let textPrimary = '#ffffff';
  let textSecondary = '#cbd5e1';
  let tagBg = 'rgba(203, 159, 67, 0.15)';
  let chipBg = 'rgba(255, 255, 255, 0.05)';
  let chipBorder = 'rgba(255, 255, 255, 0.12)';
  let chipText = '#ffffff';

  if (theme === 'parchment') {
    bgGradStart = '#f5ede3';
    bgGradEnd = '#e8d7c2';
    cardSurface = 'rgba(253, 250, 245, 0.96)';
    cardBorder = 'rgba(139, 90, 43, 0.35)';
    accentColor = '#8b5a2b';
    badgeText = '#ffffff';
    textPrimary = '#1a120b';
    textSecondary = '#423326';
    tagBg = 'rgba(139, 90, 43, 0.15)';
    chipBg = 'rgba(139, 90, 43, 0.06)';
    chipBorder = 'rgba(139, 90, 43, 0.2)';
    chipText = '#1a120b';
  } else if (theme === 'midnight') {
    bgGradStart = '#060b19';
    bgGradEnd = '#0b1633';
    cardSurface = 'rgba(11, 19, 41, 0.96)';
    cardBorder = 'rgba(56, 189, 248, 0.35)';
    accentColor = '#38bdf8';
    badgeText = '#060b19';
    textPrimary = '#f8fafc';
    textSecondary = '#cbd5e1';
    tagBg = 'rgba(56, 189, 248, 0.15)';
    chipBg = 'rgba(255, 255, 255, 0.05)';
    chipBorder = 'rgba(56, 189, 248, 0.2)';
    chipText = '#f8fafc';
  }

  // Draw background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, bgGradStart);
  bgGrad.addColorStop(1, bgGradEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid lines
  ctx.save();
  ctx.strokeStyle = theme === 'parchment' ? 'rgba(139, 90, 43, 0.04)' : 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // Draw Decorative Outer Frame Card
  const margin = Math.round(width * 0.04);
  const frameW = width - margin * 2;
  const frameH = height - margin * 2;
  const cornerRadius = 36;

  // Outer shadow & fill
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 15;
  drawRoundRect(ctx, margin, margin, frameW, frameH, cornerRadius);
  ctx.fillStyle = cardSurface;
  ctx.fill();
  ctx.restore();

  // Outer border
  ctx.save();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 3;
  drawRoundRect(ctx, margin, margin, frameW, frameH, cornerRadius);
  ctx.stroke();
  ctx.restore();

  // Inner Content Padding
  const padX = margin + 50;
  let currentY = margin + 50;

  // 1. HEADER ROW: Emblem Logo, Title, and Badge Pill
  const logoBoxSize = 64;
  drawRoundRect(ctx, padX, currentY, logoBoxSize, logoBoxSize, 18);
  ctx.fillStyle = accentColor;
  ctx.fill();

  ctx.save();
  ctx.fillStyle = badgeText;
  drawSacredStar(ctx, padX + logoBoxSize / 2, currentY + logoBoxSize / 2, 14, 6);
  ctx.restore();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 34px Cormorant Garamond, Georgia, serif';
  ctx.fillText('XeJesUs', padX + logoBoxSize + 18, currentY + 30);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.fillText('SANCTUARY HOW-TO GUIDE', padX + logoBoxSize + 20, currentY + 52);

  // Top Right Badge Pill
  ctx.save();
  ctx.font = '900 13px Inter, system-ui, sans-serif';
  const badgeTextStr = topic.badge;
  const badgeMetrics = ctx.measureText(badgeTextStr);
  const badgeW = badgeMetrics.width + 36;
  const badgeH = 38;
  const badgeX = margin + frameW - 50 - badgeW;
  const badgeY = currentY + 12;

  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 19);
  ctx.fillStyle = accentColor;
  ctx.fill();

  ctx.fillStyle = badgeText;
  ctx.fillText(badgeTextStr, badgeX + 18, badgeY + 24);
  ctx.restore();

  currentY += logoBoxSize + 30;

  // Thin separator rule
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, currentY);
  ctx.lineTo(margin + frameW - 50, currentY);
  ctx.stroke();

  currentY += 35;

  // 2. HERO FEATURE TITLE & SUBTITLE
  ctx.fillStyle = accentColor;
  ctx.font = '900 15px Inter, system-ui, sans-serif';
  ctx.fillText(`${topic.name.toUpperCase()}  •  ${topic.category.toUpperCase()}`, padX, currentY);

  currentY += 40;

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 44px Cormorant Garamond, Georgia, serif';
  const titleMaxWidth = frameW - 100;
  const titleLines = getWrappedLines(ctx, topic.headline, titleMaxWidth);
  titleLines.slice(0, 2).forEach(line => {
    ctx.fillText(line, padX, currentY);
    currentY += 48;
  });

  currentY += 5;
  ctx.fillStyle = textSecondary;
  ctx.font = '500 18px Inter, system-ui, sans-serif';
  const subLines = getWrappedLines(ctx, topic.subheadline, titleMaxWidth);
  subLines.slice(0, 2).forEach(line => {
    ctx.fillText(line, padX, currentY);
    currentY += 26;
  });

  currentY += 20;

  // 3. LIVE GUEST MODE DATA SHOWCASE CARD
  const guestCardW = frameW - 100;
  const guestCardH = aspectRatio === '9:16' ? 320 : (aspectRatio === '16:9' ? 200 : 240);
  const guestCardY = currentY;

  ctx.save();
  drawRoundRect(ctx, padX, guestCardY, guestCardW, guestCardH, 24);
  ctx.fillStyle = theme === 'parchment' ? 'rgba(240, 230, 218, 0.8)' : 'rgba(9, 13, 22, 0.75)';
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Guest card header
  let cardInnerY = guestCardY + 36;
  ctx.beginPath();
  ctx.arc(padX + 30, cardInnerY - 6, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();

  ctx.fillStyle = textPrimary;
  ctx.font = '900 13px Inter, system-ui, sans-serif';
  ctx.fillText(`GUEST MODE LIVE DATA:  ${topic.previewData.title.toUpperCase()}`, padX + 48, cardInnerY);

  // Tag Pill on right
  ctx.save();
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  const tagText = topic.previewData.tag;
  const tagW = ctx.measureText(tagText).width + 24;
  const tagX = padX + guestCardW - tagW - 25;
  drawRoundRect(ctx, tagX, cardInnerY - 18, tagW, 28, 8);
  ctx.fillStyle = tagBg;
  ctx.fill();
  ctx.fillStyle = accentColor;
  ctx.fillText(tagText, tagX + 12, cardInnerY);
  ctx.restore();

  cardInnerY += 28;

  // Divider inside guest card
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX + 25, cardInnerY);
  ctx.lineTo(padX + guestCardW - 25, cardInnerY);
  ctx.stroke();

  cardInnerY += 32;

  // Verse / Topic line
  if (topic.previewData.verseOrTopic) {
    ctx.fillStyle = textPrimary;
    ctx.font = 'italic bold 22px Cormorant Garamond, Georgia, serif';
    ctx.fillText(`"${topic.previewData.verseOrTopic}"`, padX + 25, cardInnerY);
    cardInnerY += 34;
  }

  // 3 Detail Chips
  const chipCount = topic.previewData.details.length;
  const chipGap = 16;
  const chipW = (guestCardW - 50 - chipGap * (chipCount - 1)) / chipCount;
  const chipH = 50;

  topic.previewData.details.forEach((detail, i) => {
    const cX = padX + 25 + i * (chipW + chipGap);
    drawRoundRect(ctx, cX, cardInnerY, chipW, chipH, 14);
    ctx.fillStyle = chipBg;
    ctx.fill();
    ctx.strokeStyle = chipBorder;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cX + 22, cardInnerY + chipH / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    ctx.fillStyle = badgeText;
    ctx.font = '900 11px Inter, system-ui, sans-serif';
    ctx.fillText('✓', cX + 18, cardInnerY + chipH / 2 + 4);

    ctx.fillStyle = chipText;
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    const maxDetailW = chipW - 48;
    const truncated = truncateText(ctx, detail, maxDetailW);
    ctx.fillText(truncated, cX + 38, cardInnerY + chipH / 2 + 5);
  });

  currentY = guestCardY + guestCardH + 30;

  // 4. STEP-BY-STEP HOW-TO 1-2-3 CARDS
  ctx.fillStyle = textSecondary;
  ctx.font = '900 13px Inter, system-ui, sans-serif';
  ctx.fillText('STEP-BY-STEP HOW TO:', padX, currentY);

  currentY += 20;

  const stepCount = topic.howToSteps.length;
  const stepGap = 18;
  const stepW = (frameW - 100 - stepGap * (stepCount - 1)) / stepCount;
  const stepH = aspectRatio === '9:16' ? 180 : (aspectRatio === '16:9' ? 130 : 155);

  topic.howToSteps.forEach((st, i) => {
    const sX = padX + i * (stepW + stepGap);

    drawRoundRect(ctx, sX, currentY, stepW, stepH, 20);
    ctx.fillStyle = theme === 'parchment' ? 'rgba(253, 250, 245, 0.9)' : 'rgba(19, 27, 46, 0.7)';
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Step number circle
    const badgeR = 14;
    ctx.beginPath();
    ctx.arc(sX + 24, currentY + 28, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    ctx.fillStyle = badgeText;
    ctx.font = '900 13px Inter, system-ui, sans-serif';
    ctx.fillText(String(st.step), sX + 20, currentY + 33);

    // Step title
    ctx.fillStyle = textPrimary;
    ctx.font = '900 15px Inter, system-ui, sans-serif';
    ctx.fillText(st.title, sX + 48, currentY + 33);

    // Step description
    ctx.fillStyle = textSecondary;
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    const sDescMaxWidth = stepW - 36;
    const descLines = getWrappedLines(ctx, st.desc, sDescMaxWidth);
    let descY = currentY + 65;
    descLines.slice(0, 3).forEach(l => {
      ctx.fillText(l, sX + 18, descY);
      descY += 20;
    });
  });

  // 5. BOTTOM FOOTER BAR
  const footerY = margin + frameH - 75;
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, footerY - 20);
  ctx.lineTo(margin + frameW - 50, footerY - 20);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = '900 11px Inter, system-ui, sans-serif';
  ctx.fillText('VERIFIED GUEST MODE WORKFLOW', padX, footerY + 5);

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText(topic.actionCallout, padX, footerY + 26);

  // Right pill: URL
  const urlBoxW = 160;
  const urlBoxH = 44;
  const urlBoxX = margin + frameW - 50 - urlBoxW;
  const urlBoxY = footerY - 5;

  drawRoundRect(ctx, urlBoxX, urlBoxY, urlBoxW, urlBoxH, 16);
  ctx.fillStyle = accentColor;
  ctx.fill();

  ctx.fillStyle = badgeText;
  ctx.font = '900 15px Inter, system-ui, sans-serif';
  ctx.fillText('xejesus.app  →', urlBoxX + 24, urlBoxY + 28);

  return canvas;
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

function drawSacredStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number) {
  const points = 4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

