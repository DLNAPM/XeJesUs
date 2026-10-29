export type ScriptFormat = '60s-commercial' | '30s-reel' | '2m-tutorial' | 'podcast-radio' | 'master-commercial';
export type TargetAudience = 'general-seekers' | 'pastors-leaders' | 'youth-students' | 'scholars-seminary';
export type ScriptTone = 'inspiring-pastoral' | 'scholarly-deep' | 'dynamic-modern';

export interface ScriptSection {
  timestamp: string;
  stageDirection: string;
  spokenText: string;
}

export interface AdScriptItem {
  topicId: string;
  topicName: string;
  title: string;
  format: ScriptFormat;
  durationEstimate: string;
  wordCount: number;
  hook: string;
  keyFeaturesSummary: string[];
  fullScript: string;
  callToAction: string;
}

export const MASTER_ALL_FEATURES_SCRIPT: AdScriptItem = {
  topicId: 'master-all-features',
  topicName: 'Complete XeJesUs Sanctuary (All 14 Features)',
  title: 'Master Commercial: The Complete Living Exegesis Sanctuary',
  format: 'master-commercial',
  durationEstimate: '90 - 120 Seconds',
  wordCount: 260,
  hook: 'What if you could study the Bible not through speculation, but through 2,000 years of verified history, original Hebrew and Greek roots, and ancient apostolic manuscripts—all in one place?',
  keyFeaturesSummary: [
    'One-Tap Guest Mode (No registration required)',
    'Pilgrim Dashboard & Pre-loaded exegesis scrolls (Lazarus & 153 Fish)',
    '6 Foundational Sources including Asher Wilson\'s 81-book Ethiopian Bible',
    'Then vs Now: Levant antiquity vs 21st century living',
    'Interactive Lexicon (Hebrew, Greek, Ge\'ez roots) & Scholar Voice Narration'
  ],
  callToAction: 'Visit xejesus.app today, tap "Test Drive as Guest", and step into the Living Sanctuary.',
  fullScript: `[0:00 - 0:12] THE HOOK
[Visual: Ambient cinematic shot of antique open codex illuminated by warm golden morning light. The mobile screen transitions smoothly into the xejesus.app interface]
[Audio: Reverent, stirring orchestral cello and soft piano chord]
VOICEOVER: "What if you could study the Bible not through personal opinion or surface translations—but through original Hebrew and Greek roots, verified Levant history, and 2,000 years of apostolic wisdom?"

[0:12 - 0:30] ZERO-FRICTION ENTRY & DASHBOARD
[Visual: Screen captures user tapping 'Test Drive as Guest' on the Landing Page. The Pilgrim Headquarters dashboard loads instantly, displaying recent seekings like John 11:35 and John 21:11]
VOICEOVER: "Welcome to XeJesUs—The Living Exegesis Sanctuary. You don't need a credit card or complicated sign-up. Tap 'Test Drive as Guest' and step directly into your study headquarters, pre-loaded with authentic exegesis scrolls."

[0:30 - 0:50] 6-SOURCE CANONICAL ARCHIVE & ETHIOPIAN BIBLE
[Visual: User clicks into the Exegesis Library scroll. The screen reveals the 6 Primary Foundational Sources framework, zooming into Source II: Asher Wilson's Complete Ethiopian Bible with 81 books]
VOICEOVER: "Every seeking is synthesized from six authoritative pillars: Canonical Scriptures, Early Church Fathers, archaeological records, and Asher Wilson's Complete 81-Book Ethiopian Bible—preserving Enoch and Jubilees in English."

[0:50 - 1:12] THEN VS NOW & LINGUISTIC LEXICON
[Visual: Split-screen comparative slider showing Herodian Jerusalem at Golgotha in 33 A.D. alongside modern Holy Sepulchre GPS locations. Then taps into Lexicon Glossary highlighting 'Hesed' in Hebrew and 'Makarios' in Greek]
VOICEOVER: "Explore 'Then vs Now' to bridge ancient Near Eastern history with today's moral dilemmas. Dive into the Lexicon Glossary to uncover Strong's concordance roots in Hebrew, Aramaic, and Koine Greek."

[1:12 - 1:28] COMMUNITY, SCHOLAR VOICES & CHAT
[Visual: Shows 'Bethany Study Circle' communion sharing exegesis scrolls, followed by the AI Scholar voice playing in the voice of C.S. Lewis and Charles Spurgeon]
VOICEOVER: "Gather with fellow believers in Study Groups, consult your 24/7 AI Theologian chat, and listen to exegesis scrolls narrated in renowned scholar personas."

[1:28 - 1:40] CALL TO ACTION & OUTRO
[Visual: Elegant golden sanctuary emblem shines against obsidian black. xejesus.app URL displayed in bold Cormorant Garamond typography]
VOICEOVER: "Travel through the text to discover Jesus' true intentions for Us today. Visit xejesus.app right now, tap 'Test Drive as Guest', and begin your sacred journey."`
};

export const TOPIC_SCRIPTS: Record<string, {
  '60s-commercial': AdScriptItem;
  '30s-reel': AdScriptItem;
  '2m-tutorial': AdScriptItem;
  'podcast-radio': AdScriptItem;
}> = {
  'landing-page': {
    '60s-commercial': {
      topicId: 'landing-page',
      topicName: 'Landing Page',
      title: 'Instant Sanctuary Access: One-Tap Guest Test Drive',
      format: '60s-commercial',
      durationEstimate: '55 Seconds',
      wordCount: 142,
      hook: 'Tired of having to create accounts and fill out forms just to explore a Bible study app?',
      keyFeaturesSummary: [
        'Instant "Test Drive as Guest" one-tap login',
        'Animated "Play How To" orientation tour',
        'Direct access to pre-loaded exegesis scrolls'
      ],
      callToAction: 'Visit xejesus.app today and tap "Test Drive as Guest".',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Close-up of a pilgrim opening a smartphone. The illuminated XeJesUs portal glows with a celestial gold aura]
[Audio: Gentle, uplifting chimes and ambient pad]
VOICEOVER: "Tired of creating passwords and filling out forms just to explore a Bible study app?"

[0:08 - 0:24] PROBLEM & SOLUTION
[Visual: Finger taps the prominent 'Test Drive as Guest' button on the landing page. The screen transitions immediately into the Pilgrim Dashboard]
VOICEOVER: "XeJesUs removes every obstacle between you and the Word. With our instant 'Test Drive as Guest' mode, you enter the Living Exegesis Sanctuary in a single tap."

[0:24 - 0:42] FEATURE HIGHLIGHT
[Visual: User clicks the animated 'Play How To' video banner, watching the 3-minute guided tour of the sanctuary]
VOICEOVER: "Experience pre-loaded exegesis scrolls like John 11:35, explore ancient Greek lemmas, and watch the guided orientation video to master every feature in minutes."

[0:42 - 0:55] CALL TO ACTION
[Visual: Clean xejesus.app URL with the tagline 'Faith through Understanding']
VOICEOVER: "No credit card. No registration. Visit xejesus.app right now, tap 'Test Drive as Guest', and discover Christ's true intentions for us today."`
    },
    '30s-reel': {
      topicId: 'landing-page',
      topicName: 'Landing Page',
      title: '30s Reel: The Bible App with Zero Sign-Up Friction',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 78,
      hook: 'Watch this: a deep Bible exegesis app you can test drive right now without signing up.',
      keyFeaturesSummary: ['One-tap guest access', 'Immediate exegesis access'],
      callToAction: 'Link in bio: xejesus.app',
      fullScript: `[0:00 - 0:05] HOOK
[Visual: Fast-paced cut of typing 'xejesus.app' on mobile browser]
VOICEOVER: "Watch this: a deep biblical exegesis app you can explore right now with zero sign-up."

[0:05 - 0:18] FEATURE
[Visual: Tap 'Test Drive as Guest' -> instant dashboard loads with Greek root words and archaeological Levant maps]
VOICEOVER: "Just hit 'Test Drive as Guest' on the landing page! You get instant access to full scripture scrolls, Strong's Greek roots, and the 81-book Ethiopian Bible."

[0:18 - 0:30] CTA
[Visual: Logo reveal with URL xejesus.app]
VOICEOVER: "Stop guessing scripture. Experience the truth. Head over to xejesus.app and test drive it right now!"`
    },
    '2m-tutorial': {
      topicId: 'landing-page',
      topicName: 'Landing Page',
      title: '2-Minute Walkthrough: How to Test Drive & Navigate the Portal',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 290,
      hook: 'In this walkthrough, we will show you how to access XeJesUs in seconds using Guest Mode.',
      keyFeaturesSummary: ['Landing layout', 'Guest mode credentials', 'Video tour integration'],
      callToAction: 'Start your journey at xejesus.app.',
      fullScript: `[0:00 - 0:20] INTRODUCTION & PORTAL OVERVIEW
[Visual: Host on camera holding tablet, transitioning to screen recording of the Landing Page]
VOICEOVER: "Welcome to XeJesUs. When you first arrive at our portal, our mission is immediately clear: to travel through the text to discover Jesus' true intentions for us today. Let's take a look at how to get started in seconds."

[0:20 - 0:50] STEP 1: ONE-TAP GUEST ACCESS
[Visual: Cursor hovers over 'Test Drive as Guest']
VOICEOVER: "While you can sign in securely with your Google account anytime, we built 'Test Drive as Guest' specifically so you can evaluate the platform risk-free. One click initializes a temporary study sanctuary with full exegesis capabilities."

[0:50 - 1:20] STEP 2: GUIDED HOW-TO VIDEO
[Visual: Cursor clicks on the animated 'Play How To' video banner at the center of the screen]
VOICEOVER: "Notice the pulsating banner right beneath the buttons. Clicking this opens our high-definition guided video tour. It walks you through each exegetical tool: from our linguistic lexicons to our 2-page PDF export engine."

[1:20 - 1:45] STEP 3: SANCTUARY COVENANTS & LEGAL PRIVACY
[Visual: Scrolls to bottom footer showing Privacy Policy and Terms of Use]
VOICEOVER: "At the bottom, our sanctuary covenants outline our complete dedication to your privacy. No personal data selling, no algorithmic manipulation—just pure scripture study."

[1:45 - 2:00] SUMMARY & OUTRO
[Visual: Screen transitions to the dashboard welcome screen]
VOICEOVER: "Now that you know how the portal works, go to xejesus.app and click 'Test Drive as Guest'. See you inside the sanctuary!"`
    },
    'podcast-radio': {
      topicId: 'landing-page',
      topicName: 'Landing Page',
      title: 'Radio & Podcast Spot: Step into the Sanctuary',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 138,
      hook: 'Have you ever wished you could study scripture with the depth of a seminary scholar, without spending years in school?',
      keyFeaturesSummary: ['Accessible exegesis', 'No barriers to entry'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `[0:00 - 0:15] SPOKEN INTRO (Warm, intimate tone, acoustic acoustic guitar in background)
"Have you ever wished you could study scripture with the depth of a seminary scholar, without spending thousands of dollars or years in the classroom?

[0:15 - 0:40] THE MESSAGE
Welcome to XeJesUs—spelled X-E-J-E-S-U-S. It's the groundbreaking biblical exegesis platform that brings ancient Levant history, Hebrew and Greek word roots, and the full 81-book Ethiopian Bible right to your fingertips. And the best part? You don't even have to sign up to try it.

[0:40 - 1:00] THE CALL TO ACTION
Just go to X-E-J-E-S-U-S dot app, click 'Test Drive as Guest', and start exploring within five seconds. That's X-E-J-E-S-U-S dot app. Travel through the text, and discover His truth today."`
    }
  },

  'dashboard': {
    '60s-commercial': {
      topicId: 'dashboard',
      topicName: 'XeJesUs Dashboard',
      title: 'Pilgrim Headquarters: Where Scripture Insights Meet History',
      format: '60s-commercial',
      durationEstimate: '58 Seconds',
      wordCount: 148,
      hook: 'What does an organized, deeply scholarly Bible study command center look like?',
      keyFeaturesSummary: [
        'Central Pilgrim Headquarters',
        'Pre-loaded guest seekings (John 11:35 & John 21:11)',
        'Direct access to Levant geographic logs and Greek grammar'
      ],
      callToAction: 'Explore your pilgrim dashboard at xejesus.app.',
      fullScript: `[0:00 - 0:10] HOOK
[Visual: Desktop screen panning across the sleek Pilgrim Dashboard in Modern Sanctuary gold and black]
[Audio: Thoughtful, inspiring piano accompaniment]
VOICEOVER: "What does a truly organized, deeply scholarly Bible study command center look like?"

[0:10 - 0:28] HEADQUARTERS HIGHLIGHT
[Visual: Highlights the 'Recent Seekings' grid featuring John 11:35 'Why Jesus Wept' and John 21:11 'The 153 Fish']
VOICEOVER: "Welcome to your XeJesUs Pilgrim Headquarters. In Guest Mode, your dashboard comes pre-loaded with rich theological seekings ready for immediate inspection."

[0:28 - 0:45] EXEGETICAL DEPTH
[Visual: User clicks John 11:35 card. Instant expansion shows the Greek distinction between 'edakrysen' and 'eklaisen', plus Bethany geographic maps]
VOICEOVER: "See historical Levant settings, original Greek grammatical nuances, and God's true divine intent—all organized into beautiful study cards."

[0:45 - 0:58] CALL TO ACTION
[Visual: Logo and URL xejesus.app with 'Test Drive as Guest' button highlighted]
VOICEOVER: "Stop scattering your study notes across notebooks. Center your spiritual walk at xejesus.app today."`
    },
    '30s-reel': {
      topicId: 'dashboard',
      topicName: 'XeJesUs Dashboard',
      title: '30s Reel: Your Bible Study Command Center',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 82,
      hook: 'Look at how clean this Bible study dashboard is!',
      keyFeaturesSummary: ['Pre-loaded seekings', 'Clean layout'],
      callToAction: 'Try it free at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Quick zoom into the XeJesUs dashboard]
VOICEOVER: "Look at how clean this Bible study dashboard is! This is XeJesUs."

[0:06 - 0:20] FEATURE HIGHLIGHT
[Visual: Swiping through the pre-loaded Lazarus and 153 Fish inquiry scrolls]
VOICEOVER: "Right out of the box in Guest Mode, you get real theological breakdowns, ancient Greek word roots, and historical maps at your fingertips."

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Level up your Bible time today. Head to xejesus.app and test drive it in guest mode!"`
    },
    '2m-tutorial': {
      topicId: 'dashboard',
      topicName: 'XeJesUs Dashboard',
      title: '2-Minute Tutorial: Mastering Your Exegesis Dashboard',
      format: '2m-tutorial',
      durationEstimate: '120 Seconds',
      wordCount: 285,
      hook: 'Let’s walk through the Pilgrim Dashboard and see how to track your scripture studies.',
      keyFeaturesSummary: ['Inquiry cards', 'Quick verse search', 'Scroll inspection'],
      callToAction: 'Launch your dashboard at xejesus.app.',
      fullScript: `[0:00 - 0:25] WELCOME TO THE DASHBOARD
[Visual: Full screen recording of the Pilgrim Dashboard]
VOICEOVER: "Once you enter the sanctuary, the Dashboard is your central hub. At the top, you'll see your Pilgrim status—whether you're in Guest Mode or logged in with your Google account."

[0:25 - 0:55] EXPLORING PRE-LOADED SEEKINGS
[Visual: Pointing to John 11:35 and John 21:11]
VOICEOVER: "If you're testing XeJesUs as a guest, notice we've pre-loaded two flagship seekings. The first unpacks John 11:35: 'Jesus wept.' The exegesis explains that Christ's tears were quiet tears of profound empathy, not despair, rooted in the Greek word 'edakrysen'."

[0:55 - 1:25] THE 153 FISH AT GALILEE
[Visual: Clicking into the second inquiry card]
VOICEOVER: "The second study covers the 153 fish in Peter's net at John 21:11, detailing the Sea of Galilee's 1st-century fishing industry and God's intentional covenant abundance."

[1:25 - 1:50] INITIATING NEW INQUIRIES
[Visual: Cursor clicks the '+' floating action button]
VOICEOVER: "Ready to study your own verse? Click the '+' button anytime to launch a new query across our six foundational citation pillars."

[1:50 - 2:00] CLOSING
[Visual: xejesus.app banner]
VOICEOVER: "Start organizing your walk with Christ today at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'dashboard',
      topicName: 'XeJesUs Dashboard',
      title: 'Radio Spot: The Command Center for Scripture Seekers',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 140,
      hook: 'Are your Bible study notes scattered across notebooks and sticky notes?',
      keyFeaturesSummary: ['Unified dashboard', 'Instant answers'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Are your Bible study notes scattered across journals, apps, and commentaries? 

Meet XeJesUs—The Living Exegesis Sanctuary. The Pilgrim Dashboard brings all your spiritual seekings into one magnificent headquarters. 

As soon as you enter Guest Mode at xejesus.app, you'll discover deep exegesis cards ready for inspection—explaining original Greek lemmas, ancient Roman-era Levant maps, and God's redemptive purpose. 

No sign-up fee, no registration required. Visit X-E-J-E-S-U-S dot app, click 'Test Drive as Guest', and experience your new study headquarters today."`
    }
  },

  'library': {
    '60s-commercial': {
      topicId: 'library',
      topicName: 'XeJesUs Library',
      title: 'Sacred Scroll Archives: 6-Source Theological Synthesis',
      format: '60s-commercial',
      durationEstimate: '56 Seconds',
      wordCount: 145,
      hook: 'How do you know if an interpretation of the Bible is trustworthy?',
      keyFeaturesSummary: [
        '6-Source Academic Citation Framework',
        'Asher Wilson 81-book Ethiopian Bible preservation',
        '2-Page PDF Exegesis Scroll Export'
      ],
      callToAction: 'Inspect the sacred scrolls at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Magnificent old manuscript scroll rolling open, transitioning into digital exegesis scroll]
[Audio: Solemn choir chant and cathedral acoustics]
VOICEOVER: "How do you know if a biblical interpretation is trustworthy?"

[0:08 - 0:26] THE 6 AUTHORITIES
[Visual: Graphic highlights the 6 pillars: Canonical Scripture, Ethiopian Bible, Lexicons, Church Fathers, Archaeology, Web Grounding]
VOICEOVER: "In the XeJesUs Exegesis Library, every scripture is anchored in six foundational authorities—preventing personal bias and AI hallucinations."

[0:26 - 0:44] ASHER WILSON'S ETHIOPIAN CANON
[Visual: Zoom into Asher Wilson's Complete Ethiopian Bible, showing 1 Enoch and Jubilees citations]
VOICEOVER: "Explore the complete 81-book Ethiopian Orthodox Canon in English, alongside Greek and Hebrew root concordances and Patristic commentary from early Church fathers."

[0:44 - 0:56] CALL TO ACTION
[Visual: Download 2-Page PDF button animation with golden parchment finish]
VOICEOVER: "Download publication-ready two-page PDF scrolls to share with your congregation. Visit xejesus.app and inspect the archives today."`
    },
    '30s-reel': {
      topicId: 'library',
      topicName: 'XeJesUs Library',
      title: '30s Reel: The 6 Sources Every Bible Scholar Needs',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 80,
      hook: 'Did you know there are 81 books in the ancient Ethiopian Bible canon?',
      keyFeaturesSummary: ['81-book canon', 'Church fathers', 'Original languages'],
      callToAction: 'Explore the Library at xejesus.app',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Quick cut of ancient Ge'ez Ethiopian manuscript]
VOICEOVER: "Did you know the ancient Ethiopian Bible preserves 81 books, including Enoch and Jubilees?"

[0:08 - 0:20] FEATURE
[Visual: XeJesUs Library scroll showing 6 citation sources simultaneously]
VOICEOVER: "XeJesUs synthesizes this ancient canon with original Greek concordances, early church fathers, and Levant archaeology in every single study!"

[0:20 - 0:30] CTA
[Visual: xejesus.app logo]
VOICEOVER: "Test drive it free right now at xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'library',
      topicName: 'XeJesUs Library',
      title: '2-Minute Tutorial: Navigating Exegesis Scrolls & Exporting PDFs',
      format: '2m-tutorial',
      durationEstimate: '118 Seconds',
      wordCount: 280,
      hook: 'Let’s explore an exegesis scroll and learn how to export a two-page printable study.',
      keyFeaturesSummary: ['Linguistic breakdown', 'Levant maps', '2-page PDF export'],
      callToAction: 'Download your study scroll at xejesus.app.',
      fullScript: `[0:00 - 0:25] OPENING THE LIBRARY
[Visual: Screen recording entering the Exegesis Library from the sidebar]
VOICEOVER: "Welcome to the Exegesis Library. Every question you or our guest community submits generates a comprehensive theological scroll. Let's open our flagship study on John 11:35."

[0:25 - 0:55] EXAMINING THE SECTIONS
[Visual: Scrolling through 'Interpretation', 'Historical Context', 'Grammar Analysis']
VOICEOVER: "Notice how each scroll is structured. Under Historical Context, we see 1st-century Jewish communal mourning practices. Under Grammar Analysis, we see the Greek word 'edakrysen', contrasting with the crowd's loud wailing."

[0:55 - 1:25] LEVANT GEOGRAPHY & ARCHAEOLOGY
[Visual: Section showing Bethany (al-Eizariya) with 'Then' description and 'Now' description]
VOICEOVER: "Scroll down to Biblical Geography. You get an exact historical breakdown of the site then—on the eastern slope of Mount of Olives—and what stands there now in the modern West Bank."

[1:25 - 1:50] EXPORTING TWO-PAGE PDF SCROLLS
[Visual: Cursor clicks 'Export 2-Page PDF' button, generating a formatted PDF document]
VOICEOVER: "Need this for your Bible study or sermon prep? Click 'Export Two-Page PDF' to generate an elegant, publication-ready study sheet."

[1:50 - 2:00] OUTRO
VOICEOVER: "Start building your theological library today at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'library',
      topicName: 'XeJesUs Library',
      title: 'Radio Spot: The 6-Source Biblical Library',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 142,
      hook: 'Where do you turn when you need answers to difficult biblical questions?',
      keyFeaturesSummary: ['Scholarly rigor', 'Ethiopian Bible'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Where do you turn when you need answers to difficult biblical passages? 

Commentaries can be biased, and generic search engines often give shallow answers. That's why scholars and everyday believers are turning to the XeJesUs Exegesis Library. 

Every study is synthesized across six verified pillars: canonical scriptures, Asher Wilson's complete 81-book Ethiopian Bible, original Greek and Hebrew lexicons, and the early Church fathers. 

You can even print two-page study sheets for your small group. Try it right now with zero registration at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'seek-word': {
    '60s-commercial': {
      topicId: 'seek-word',
      topicName: 'Seek the Word',
      title: 'Seek the Word: Instant Grounded Hermeneutics',
      format: '60s-commercial',
      durationEstimate: '57 Seconds',
      wordCount: 144,
      hook: 'Have you ever read a Bible verse and wondered, "What was Jesus actually saying here?"',
      keyFeaturesSummary: [
        'Hermeneutical Query Input',
        'Standard Pastoral vs Deep Academic Exegesis',
        'Audio Scholar Narration integration'
      ],
      callToAction: 'Ask your question at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Person reading Bible with a puzzled, reflective expression, looking up]
[Audio: Contemplative violin and acoustic resonance]
VOICEOVER: "Have you ever read a Bible passage and wondered: 'What was Jesus actually saying here?'"

[0:08 - 0:25] THE QUERY ENGINE
[Visual: Typing 'What is the distinction between Grace and Mercy in Hebrew?' into the Seek the Word search bar]
VOICEOVER: "With 'Seek the Word' in XeJesUs, you can ask any theological question or enter any scripture passage."

[0:25 - 0:44] COMPREHENSIVE HERMENEUTICS
[Visual: Instant synthesis appears with Hebrew words 'Chen' and 'Rachamim', cultural settings, and God's intentional purpose]
VOICEOVER: "Within seconds, our engine extracts original linguistic roots, 1st-century cultural settings, and God's overarching divine intent for our lives today."

[0:44 - 0:57] CALL TO ACTION
[Visual: Microphone icon activates audio narration with C.S. Lewis voiceover]
VOICEOVER: "Listen with AI Scholar audio or read at your own pace. Visit xejesus.app and seek the Word in Guest Mode right now."`
    },
    '30s-reel': {
      topicId: 'seek-word',
      topicName: 'Seek the Word',
      title: '30s Reel: The AI Biblical Exegesis Engine',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 79,
      hook: 'Type any Bible verse into this tool, and watch what happens.',
      keyFeaturesSummary: ['Instant query', 'Deep roots'],
      callToAction: 'Try it at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Finger typing 'Romans 8:28 Greek context' into XeJesUs]
VOICEOVER: "Type any Bible verse into this tool, and watch what happens."

[0:06 - 0:20] FEATURE
[Visual: Exegesis instantly unrolls with original Greek grammar, historical setting, and cross references]
VOICEOVER: "Boom! You get the original Greek syntax, historical Levant background, and early Church commentary in under three seconds!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "No sign-up required. Try it right now on xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'seek-word',
      topicName: 'Seek the Word',
      title: '2-Minute Tutorial: How to Run a Deep Scripture Seeking',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 275,
      hook: 'Let’s walk through submitting an inquiry and customizing your exegesis depth.',
      keyFeaturesSummary: ['Prompt input', 'Depth selector', 'Audio playback'],
      callToAction: 'Submit your query at xejesus.app.',
      fullScript: `[0:00 - 0:25] INTRODUCING SEEK THE WORD
[Visual: Screen recording clicking into 'Seek the Word' from navigation]
VOICEOVER: "Welcome to 'Seek the Word'. This is the core hermeneutical engine of XeJesUs. Here, you can type a specific book, chapter, and verse—or ask a complex theological question."

[0:25 - 0:50] SUBMITTING A PROMPT
[Visual: Entering 'Why did Jesus curse the fig tree in Mark 11?']
VOICEOVER: "Let's enter a famous hard saying: 'Why did Jesus curse the fig tree in Mark 11?' Instead of simple commentary, XeJesUs examines the prophetic symbolism of the Temple in Second Temple Judaism."

[0:50 - 1:20] UNPACKING THE CITATION FRAMEWORK
[Visual: Highlighting Hebrew/Greek root etymologies and Church Father quotes]
VOICEOVER: "In seconds, the analysis reveals the prophetic sandwich structure of Mark's Gospel, showing that the barren tree symbolized the corrupt temple leadership about to face judgment."

[1:20 - 1:45] AUDIO SCHOLAR NARRATION
[Visual: Toggling audio playback icon, hearing resonant narration]
VOICEOVER: "Prefer to listen? Tap the audio button to hear the study narrated in an expressive scholar voice."

[1:45 - 2:00] OUTRO
VOICEOVER: "Try your own questions right now at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'seek-word',
      topicName: 'Seek the Word',
      title: 'Radio Spot: Ask Any Scripture Question',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 139,
      hook: 'Have you ever had a question about the Bible you were afraid to ask?',
      keyFeaturesSummary: ['No judgment', 'Grounded truth'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Have you ever had a question about the Bible you were afraid to ask? 

Or maybe you've encountered a passage that seemed contradictory or confusing? 

With 'Seek the Word' on XeJesUs, you can bring your toughest theological questions to an engine grounded strictly in sacred scripture, original Greek and Hebrew lexicons, and the early Church fathers. 

No judgment, no shallow summaries—just reverent, academic, and pastoral truth. You can even test drive it as a guest without creating an account. 

Go to X-E-J-E-S-U-S dot app, click 'Test Drive as Guest', and seek the Word today."`
    }
  },

  'then-vs-now': {
    '60s-commercial': {
      topicId: 'then-vs-now',
      topicName: 'Then vs Now',
      title: 'Then vs Now: Reconciling 2,000 Years of Levant History',
      format: '60s-commercial',
      durationEstimate: '58 Seconds',
      wordCount: 146,
      hook: 'What did Golgotha look like during Christ\'s crucifixion compared to Jerusalem today?',
      keyFeaturesSummary: [
        'Comparative historical timelines',
        'Golgotha, Jerusalem, Pharisees & Pentecost presets',
        'Modern Levant cultural and ethical parallels'
      ],
      callToAction: 'Explore the timelines at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Split-screen visual: dusty, Roman-occupied Jerusalem hill in 33 A.D. vs bustling modern Old City Jerusalem]
[Audio: Cinematic drum beat and ambient strings]
VOICEOVER: "What did Golgotha actually look like in 33 A.D. compared to Jerusalem today?"

[0:08 - 0:26] BRIDGING 2,000 YEARS
[Visual: Then vs Now comparative slider moving back and forth between Herodian Levant and modern coordinates]
VOICEOVER: "With 'Then vs Now' in XeJesUs, you can bridge 2,000 years of biblical history with 21st-century reality."

[0:26 - 0:44] ARCHAEOLOGY & ETHICS
[Visual: Side-by-side charts of 1st-century Temple religious sects vs modern culture and church life]
VOICEOVER: "Explore ancient Levant archaeology, Roman road logs, and see how the challenges faced by the early Church connect directly to our modern ethical and spiritual lives."

[0:44 - 0:58] CALL TO ACTION
[Visual: 2-Page printable comparison sheet animation with xejesus.app logo]
VOICEOVER: "Download comparative two-page study sheets today. Visit xejesus.app and experience Then vs Now in Guest Mode."`
    },
    '30s-reel': {
      topicId: 'then-vs-now',
      topicName: 'Then vs Now',
      title: '30s Reel: Biblical Sites Then vs Today',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 81,
      hook: 'Ever wondered what biblical sites look like today?',
      keyFeaturesSummary: ['Ancient vs Modern', 'Interactive maps'],
      callToAction: 'Explore Then vs Now at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Split screen: Ancient Golgotha execution hill vs Modern Church of the Holy Sepulchre]
VOICEOVER: "Ever wondered what biblical sites look like in the 21st century?"

[0:06 - 0:20] FEATURE
[Visual: Fast swipe through XeJesUs Then vs Now comparative slider]
VOICEOVER: "XeJesUs compares ancient Levant history, Roman records, and modern GPS locations side-by-side!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Bridge 2,000 years of history right now at xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'then-vs-now',
      topicName: 'Then vs Now',
      title: '2-Minute Tutorial: Exploring Ancient Levant vs Modern Reality',
      format: '2m-tutorial',
      durationEstimate: '116 Seconds',
      wordCount: 278,
      hook: 'Let’s walk through the flagship Golgotha & Calvary study in Then vs Now.',
      keyFeaturesSummary: ['Category selector', 'Comparative timeline', 'Two-page PDF'],
      callToAction: 'Compare biblical eras at xejesus.app.',
      fullScript: `[0:00 - 0:25] WELCOME TO THEN VS NOW
[Visual: Navigating into 'Then vs Now' from sidebar]
VOICEOVER: "Welcome to 'Then vs Now'. One of the greatest challenges in Bible study is understanding the gap between the ancient Near Eastern world and our contemporary culture. This tool bridges that gap."

[0:25 - 0:55] SELECTING FLAGSHIP TOPICS
[Visual: Clicking 'Golgotha & Calvary' under the Place category]
VOICEOVER: "You can research biblical Places, People, Events, or Phrases. Let's select 'Golgotha & Calvary'. The screen splits into two distinct historical horizons."

[0:55 - 1:25] THE 'THEN' HORIZON VS THE 'NOW' HORIZON
[Visual: Pointing out the Herodian era execution site vs the modern Church of Holy Sepulchre and Garden Tomb]
VOICEOVER: "On the left, 'Then' reconstructs the Herodian era around 30 to 33 A.D. outside Jerusalem's Gennath Gate. On the right, 'Now' examines the shared custody of the Holy Sepulchre and the peaceful Garden Tomb."

[1:25 - 1:50] MODERN ETHICAL LESSONS
[Visual: Highlighting modern spiritual significance and application]
VOICEOVER: "Best of all, you receive actionable contemporary takeaways showing how bearing one's cross applies to 21st-century daily life."

[1:50 - 2:00] OUTRO
VOICEOVER: "Start exploring comparative antiquities at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'then-vs-now',
      topicName: 'Then vs Now',
      title: 'Radio Spot: Bridge the Ancient and the Modern',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 144,
      hook: 'How do you apply a book written two thousand years ago to your life today?',
      keyFeaturesSummary: ['Historical bridge', 'Timeless truth'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"How do you apply a sacred text written two thousand years ago to your high-tech, fast-paced life today? 

By understanding the bridge between 'Then' and 'Now'. 

With the 'Then vs Now' feature on XeJesUs, you can explore biblical sites like Golgotha, ancient religious sects like the Pharisees, and monumental events like Pentecost side-by-side with modern history, archaeology, and ethics. 

Discover what the text meant in ancient Roman Judea, and what it means for your family, career, and spiritual walk right now. 

Experience 'Then vs Now' in Guest Mode at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'study-groups': {
    '60s-commercial': {
      topicId: 'study-groups',
      topicName: 'My Study Groups',
      title: 'Faith Communions: Collaborative Scripture Study',
      format: '60s-commercial',
      durationEstimate: '56 Seconds',
      wordCount: 140,
      hook: 'Faith was never meant to be walked alone.',
      keyFeaturesSummary: ['Communion circles', 'Shared exegesis scrolls', 'Private study discussions'],
      callToAction: 'Form your study communion at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Small group gathered in warm living room with open tablets and Bibles, smiling and discussing]
[Audio: Uplifting acoustic guitar and warm harmonies]
VOICEOVER: "Faith was never meant to be walked alone."

[0:08 - 0:25] THE FEATURE
[Visual: User creates 'Bethany Study Circle' communion in XeJesUs and invites members via Gmail]
VOICEOVER: "With 'My Study Groups' in XeJesUs, you can gather your small group, Sunday school class, or prayer partners into private study sanctuaries."

[0:25 - 0:44] COLLABORATIVE EXEGESIS
[Visual: Sharing an inquiry on John 11:35 into the group feed with live discussion threads]
VOICEOVER: "Share deep exegesis scrolls into your group with one tap. Everyone examines the same historical context, Greek root words, and archaeological insights together."

[0:44 - 0:56] CALL TO ACTION
[Visual: Roster of 12 gatherers with shield owner badges and xejesus.app logo]
VOICEOVER: "Strengthen your fellowship and deepen your discussions. Visit xejesus.app and create your study group today."`
    },
    '30s-reel': {
      topicId: 'study-groups',
      topicName: 'My Study Groups',
      title: '30s Reel: The Small Group Bible App',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 77,
      hook: 'Want your small group Bible studies to go 10x deeper?',
      keyFeaturesSummary: ['Group sharing', 'Live scrolls'],
      callToAction: 'Start a group at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Friends studying scripture together on tablets]
VOICEOVER: "Want your small group Bible studies to go ten times deeper?"

[0:06 - 0:20] FEATURE
[Visual: Sharing an exegesis scroll into a XeJesUs study circle]
VOICEOVER: "With XeJesUs Study Groups, you can share full Greek root breakdowns, historical maps, and theology scrolls directly with your friends!"

[0:20 - 0:30] CTA
[Visual: xejesus.app logo]
VOICEOVER: "Bring your group together at xejesus.app right now!"`
    },
    '2m-tutorial': {
      topicId: 'study-groups',
      topicName: 'My Study Groups',
      title: '2-Minute Tutorial: Creating and Managing a Study Communion',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 270,
      hook: 'Let’s look at how to create a communion, invite members, and share scrolls.',
      keyFeaturesSummary: ['Create group', 'Invite by email', 'Discussion feed'],
      callToAction: 'Create your communion at xejesus.app.',
      fullScript: `[0:00 - 0:25] OVERVIEW
[Visual: Opening 'My Study Groups' from the main menu]
VOICEOVER: "Welcome to 'My Study Groups'. Discipleship flourishes when believers share their inquiries and learn together. Let's see how simple it is to build a communion."

[0:25 - 0:50] CREATING A COMMUNION
[Visual: Clicking 'Create New Communion', typing 'Bethany Study Circle']
VOICEOVER: "Click 'Create Communion'. Enter your group's name and description. As the creator, you are designated as the sanctuary guardian with administrative rights."

[0:50 - 1:20] INVITING GATHERERS
[Visual: Clicking 'Manage Communion' and entering an invite email]
VOICEOVER: "Click 'Manage Communion' to invite fellow seekers by their email address. They will receive an invitation to join your shared study feed immediately."

[1:20 - 1:45] SHARING EXEGESIS SCROLLS
[Visual: Navigating to an inquiry and tapping 'Share to Communion']
VOICEOVER: "Whenever you complete an inquiry in the sanctuary, click 'Share to Communion'. Your study scroll appears in the group feed for collaborative discussion."

[1:45 - 2:00] OUTRO
VOICEOVER: "Gather your community in sacred study at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'study-groups',
      topicName: 'My Study Groups',
      title: 'Radio Spot: Communal Discipleship',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 138,
      hook: 'Is your Bible study group looking for fresh spiritual depth?',
      keyFeaturesSummary: ['Shared learning', 'Deeper fellowship'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Is your church small group or Sunday school class looking for fresh spiritual depth? 

With 'My Study Groups' on XeJesUs, you can gather your circle into a private digital sanctuary. 

Instead of arguing over opinions, your group can examine the exact same historical records, Greek and Hebrew concordance roots, and the complete 81-book Ethiopian Bible together. 

Share your personal study scrolls, discuss biblical insights, and build genuine discipleship in a distraction-free space. 

Start your group today with zero registration required at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'saved-chats': {
    '60s-commercial': {
      topicId: 'saved-chats',
      topicName: 'Saved Chat Sessions',
      title: '24/7 AI Theologian Dialogue: Searchable Spiritual Archives',
      format: '60s-commercial',
      durationEstimate: '57 Seconds',
      wordCount: 142,
      hook: 'Ever have a spiritual question at 2 AM with nobody to ask?',
      keyFeaturesSummary: [
        'Sanctuary Scholar AI Theologian chat',
        'Automatic session archiving',
        'Multi-turn theological Q&A logs'
      ],
      callToAction: 'Chat with the scholar at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Quiet nighttime setting with a lamp illuminating a Bible and laptop]
[Audio: Serene, contemplative piano notes]
VOICEOVER: "Ever have a profound spiritual question late at night with nobody to ask?"

[0:08 - 0:25] THE AI SCHOLAR
[Visual: User opens the Sanctuary Scholar chatbot and types 'Explore Makarios in the Beatitudes']
VOICEOVER: "XeJesUs features a dedicated AI Theologian trained strictly in academic hermeneutics and reverent pastoral wisdom."

[0:25 - 0:44] SAVED ARCHIVES
[Visual: Navigating into 'Saved Chat Sessions', showing past conversations organized with timestamps]
VOICEOVER: "Ask about difficult parables, original translations, or moral ethics. Every single conversation is automatically archived in 'Saved Chat Sessions' so you never lose an insight."

[0:44 - 0:57] CALL TO ACTION
[Visual: Chat bubble expanding with Scripture references and xejesus.app logo]
VOICEOVER: "Pick up your conversation anytime. Visit xejesus.app and chat with your personal AI scholar today."`
    },
    '30s-reel': {
      topicId: 'saved-chats',
      topicName: 'Saved Chat Sessions',
      title: '30s Reel: The AI Theologian in Your Pocket',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 78,
      hook: 'An AI that actually knows original Greek and Church history?',
      keyFeaturesSummary: ['Biblical AI', 'Chat logs'],
      callToAction: 'Chat free at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Opening chat window with question about Greek roots]
VOICEOVER: "An AI that actually knows original Greek and Church history?"

[0:06 - 0:20] FEATURE
[Visual: Scholar AI delivers multi-turn response citing Augustine, Strong's Greek, and Scripture]
VOICEOVER: "Meet the XeJesUs AI Scholar! It answers your deepest theological questions with full scripture citations and saves every chat forever."

[0:20 - 0:30] CTA
[Visual: xejesus.app logo]
VOICEOVER: "Ask your question right now for free at xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'saved-chats',
      topicName: 'Saved Chat Sessions',
      title: '2-Minute Tutorial: Reviewing & Resuming Theological Chats',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 270,
      hook: 'Let’s explore how conversations with the Sanctuary Scholar are archived and resumed.',
      keyFeaturesSummary: ['Chat history', 'Resume thread', 'Export dialogue'],
      callToAction: 'Review your chats at xejesus.app.',
      fullScript: `[0:00 - 0:25] INTRODUCING CHAT SESSIONS
[Visual: Screen recording entering 'Saved Chat Sessions' from sidebar]
VOICEOVER: "Welcome to 'Saved Chat Sessions'. Whenever you interact with the Sanctuary Scholar via the floating chat button, your conversation is continuously archived into structured study volumes."

[0:25 - 0:55] SEARCHING PREVIOUS CONVERSATIONS
[Visual: Searching for 'Beatitudes' in the chat archive list]
VOICEOVER: "Notice how conversations are indexed. You can search by topic or scripture reference. Let's open our sample chat on 'Beatitudes: Makarios vs Modern Happiness'."

[0:55 - 1:25] RESUMING THE DIALOGUE
[Visual: Tapping 'Resume Dialogue' button, opening the full chat interface with preserved history]
VOICEOVER: "Clicking 'Resume Dialogue' opens the exact chat history. The AI Scholar maintains complete context of your past seekings, allowing you to ask follow-up questions seamlessly."

[1:25 - 1:50] EXPORTING TO LITERARY WORKS
[Visual: Tapping 'Export Literary Volume' to generate a book-style theological volume]
VOICEOVER: "You can even convert your saved chats into comprehensive literary volumes with family trees, scholarly citations, and YouTube video recommendations."

[1:50 - 2:00] OUTRO
VOICEOVER: "Start your dialogue today at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'saved-chats',
      topicName: 'Saved Chat Sessions',
      title: 'Radio Spot: Your 24/7 Spiritual Mentor',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 140,
      hook: 'Have you ever had a biblical question but didn\'t want to bother your pastor?',
      keyFeaturesSummary: ['Pastoral AI', 'Permanent archive'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Have you ever had a deep biblical question late at night, but didn't want to bother your pastor? 

With XeJesUs, you have access to a dedicated AI Theologian twenty-four hours a day, seven days a week. 

Grounded strictly in canonical scriptures, original Greek and Hebrew lexicons, and historical commentaries, the Sanctuary Scholar answers with reverence, depth, and pastoral care. 

And best of all, every conversation is saved in your 'Saved Chat Sessions' archive so you can revisit your insights anytime. 

Try chatting as a guest right now with zero registration at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'reports-menu': {
    '60s-commercial': {
      topicId: 'reports-menu',
      topicName: 'Reports Menu',
      title: 'Exegetical Audits: Objective Biblical Analytics',
      format: '60s-commercial',
      durationEstimate: '56 Seconds',
      wordCount: 140,
      hook: 'Do you know which parts of the Bible you study the most—and which you neglect?',
      keyFeaturesSummary: [
        'Testament Coverage Analytics (Torah, Gospels, Epistles)',
        'Thematic breakdown (Grace, Covenant, Holiness)',
        '100% 6-Source Citation Audit Score'
      ],
      callToAction: 'Inspect your spiritual analytics at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Dynamic analytical pie chart displaying Gospels, Epistles, and Old Testament distribution]
[Audio: Clean, modern technological beat with warm synths]
VOICEOVER: "Do you know which parts of the Bible you study the most—and which you neglect?"

[0:08 - 0:25] THE ANALYTICS SUITE
[Visual: Opening the 'Reports Menu' in XeJesUs, revealing visual coverage breakdowns]
VOICEOVER: "With the 'Reports Menu' in XeJesUs, you get an objective analytical audit of your spiritual journey."

[0:25 - 0:44] THEMATIC INSIGHTS
[Visual: Bar charts showing thematic clusters like Covenant, Redemption, and Faith, alongside 6-Source verification scores]
VOICEOVER: "See your balance between the Gospels, Epistles, and Prophets. Track your core theological themes and verify that every inquiry is 100% grounded in our six scholarly pillars."

[0:44 - 0:56] CALL TO ACTION
[Visual: Export executive report button and xejesus.app logo]
VOICEOVER: "Bring balance to your discipleship. Visit xejesus.app and explore the Reports Menu today."`
    },
    '30s-reel': {
      topicId: 'reports-menu',
      topicName: 'Reports Menu',
      title: '30s Reel: The Bible Reading Tracker for Serious Scholars',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 78,
      hook: 'Track your Bible study like a seminary professor!',
      keyFeaturesSummary: ['Coverage charts', 'Thematic balance'],
      callToAction: 'Check your stats at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Beautiful charts spinning on tablet screen]
VOICEOVER: "Track your Bible study like a seminary professor!"

[0:06 - 0:20] FEATURE
[Visual: Demonstrating XeJesUs Reports Menu breakdown of Gospels vs Epistles]
VOICEOVER: "The XeJesUs Reports Menu shows you exactly which books, covenants, and themes you're studying—and where you need more balance!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Check your spiritual analytics today at xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'reports-menu',
      topicName: 'Reports Menu',
      title: '2-Minute Tutorial: How to Audit Your Scripture Coverage',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 265,
      hook: 'Let’s walk through the Reports Menu to analyze your biblical study distribution.',
      keyFeaturesSummary: ['Testament charts', 'Thematic clusters', 'Citation audit'],
      callToAction: 'Audit your study habits at xejesus.app.',
      fullScript: `[0:00 - 0:25] WELCOME TO REPORTS
[Visual: Navigating into 'Reports Menu' from the sidebar]
VOICEOVER: "Welcome to the Reports Menu. As believers, it's easy to spend all our time in a few favorite psalms or epistles while neglecting the broader counsel of God's Word. This tool provides visual accountability."

[0:25 - 0:55] TESTAMENT DISTRIBUTION CHARTS
[Visual: Highlighting the interactive pie chart]
VOICEOVER: "At the top, the Testament Distribution chart analyzes every seeking you've conducted. In our sample data, you can see a healthy balance: 45% Gospels, 30% Pauline Epistles, and 25% Old Testament narrative."

[0:55 - 1:25] THEMATIC CLUSTERING
[Visual: Showing bar chart of top theological themes: Grace, Divine Compassion, Covenant]
VOICEOVER: "Beneath that, our thematic clustering engine maps your theological trajectory. You can see whether your recent studies focus on grace, holiness, or covenant promise."

[1:25 - 1:50] 6-SOURCE INTEGRITY SCORE
[Visual: Showing 100% citation grounding index]
VOICEOVER: "Finally, the Citation Integrity Audit proves that every single answer you receive is cross-referenced with our six authoritative pillars."

[1:50 - 2:00] OUTRO
VOICEOVER: "Bring balance to your study at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'reports-menu',
      topicName: 'Reports Menu',
      title: 'Radio Spot: The Balanced Discipleship Audit',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 140,
      hook: 'Are you getting a balanced spiritual diet from God\'s Word?',
      keyFeaturesSummary: ['Biblical balance', 'Spiritual health'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Are you getting a balanced spiritual diet from God's Word? 

Most Christians stick to familiar verses and skip the hard books. But with the Reports Menu on XeJesUs, you get an objective, visual breakdown of your scripture reading. 

See how much time you spend in the Old Testament versus the Gospels and Epistles. 

Track the theological themes you're exploring—like grace, covenant, and prophecy—and verify that your studies are grounded in verified scholarship. 

Bring intentional balance to your spiritual walk. Visit X-E-J-E-S-U-S dot app, click 'Test Drive as Guest', and inspect your reports today."`
    }
  },

  'lexicon-glossary': {
    '60s-commercial': {
      topicId: 'lexicon-glossary',
      topicName: 'Lexicon Glossary',
      title: 'Original Concordance: Hebrew, Greek & Ge\'ez Roots',
      format: '60s-commercial',
      durationEstimate: '57 Seconds',
      wordCount: 145,
      hook: 'Did you know English translations often miss the deepest meanings of biblical words?',
      keyFeaturesSummary: [
        'Hebrew, Greek, Ge\'ez & Aramaic Concordance',
        'Strong\'s Concordance Numbers (H2617 Hesed, G26 Agape)',
        'Etymological definitions and verse cross-linking'
      ],
      callToAction: 'Unlock original roots at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Ancient Hebrew scroll text transitioning into digital definition card with Hebrew lettering]
[Audio: Ancient harp with acoustic warmth]
VOICEOVER: "Did you know English translations often miss the deepest meanings of biblical words?"

[0:08 - 0:25] BEYOND ENGLISH TRANSLATION
[Visual: User searches 'Hesed' in the Lexicon Glossary, revealing Strong's H2617 and Hebrew lettering חֶסֶד]
VOICEOVER: "Words like 'love' in English fail to capture 'Hesed' in Hebrew—God's unbreakable, loyal covenant love."

[0:25 - 0:44] STRONG'S & GE'EZ INTEGRATION
[Visual: Showing Greek 'Agape' G26 and Ge'ez roots alongside Strong's concordance numbers]
VOICEOVER: "The XeJesUs Lexicon Glossary connects you directly to Strong's, BDB, and BDAG concordances across Hebrew, Aramaic, Koine Greek, and ancient Ge'ez."

[0:44 - 0:57] CALL TO ACTION
[Visual: Instant definition popup over scripture scroll with xejesus.app logo]
VOICEOVER: "Stop guessing what original words meant. Visit xejesus.app and explore the Lexicon Glossary in Guest Mode today."`
    },
    '30s-reel': {
      topicId: 'lexicon-glossary',
      topicName: 'Lexicon Glossary',
      title: '30s Reel: The Hebrew & Greek Bible Dictionary',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 79,
      hook: 'Ever wanted to read biblical Hebrew without learning the whole alphabet?',
      keyFeaturesSummary: ['Instant transliteration', 'Strong\'s numbers'],
      callToAction: 'Try the Lexicon at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Searching 'Hesed' in XeJesUs]
VOICEOVER: "Ever wanted to understand biblical Hebrew without spending years in school?"

[0:06 - 0:20] FEATURE
[Visual: Instant breakdown of Hesed Strong's H2617 with pronunciation and 248 scripture occurrences]
VOICEOVER: "The XeJesUs Lexicon Glossary gives you instant Strong's numbers, pronunciation, and original meanings for Greek, Hebrew, and Ge'ez roots!"

[0:20 - 0:30] CTA
[Visual: xejesus.app logo]
VOICEOVER: "Discover the real meaning of scripture at xejesus.app right now!"`
    },
    '2m-tutorial': {
      topicId: 'lexicon-glossary',
      topicName: 'Lexicon Glossary',
      title: '2-Minute Tutorial: How to Search Strong\'s Roots & Concordances',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 270,
      hook: 'Let’s walk through looking up biblical terms and understanding their morphological roots.',
      keyFeaturesSummary: ['Search bar', 'Transliterations', 'Scripture linkages'],
      callToAction: 'Search the lexicon at xejesus.app.',
      fullScript: `[0:00 - 0:25] INTRODUCING THE LEXICON
[Visual: Screen recording entering 'Lexicon Glossary' from sidebar]
VOICEOVER: "Welcome to the Lexicon Glossary. Every Bible student knows that reading in translation is like drinking water through a straw. This glossary opens up the rich spring of original biblical languages."

[0:25 - 0:55] SEARCHING A THEOLOGICAL TERM
[Visual: Typing 'Hesed' into the search input]
VOICEOVER: "Let's search for 'Hesed'. The card displays the ancient Hebrew letters, phonetic transliteration—'kheh-sed'—and Strong's concordance number H2617."

[0:55 - 1:25] UNPACKING THE MEANING
[Visual: Highlighting the definition: steadfast love, covenant loyalty, unfailing mercy]
VOICEOVER: "Notice the definition. It explains that Hesed is not an emotion; it is a binding covenant obligation of faithful love, appearing 248 times across the Old Testament."

[1:25 - 1:50] GREEK & GE'EZ EQUIVALENTS
[Visual: Showing Greek 'Agape' and 'Eleos' as Septuagint translations]
VOICEOVER: "You can also explore Greek New Testament equivalents like 'Agape' and ancient Ge'ez terms preserved in the Ethiopian canon."

[1:50 - 2:00] OUTRO
VOICEOVER: "Deepen your vocabulary today at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'lexicon-glossary',
      topicName: 'Lexicon Glossary',
      title: 'Radio Spot: The Power of Original Words',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 142,
      hook: 'What did the biblical authors actually say in the original languages?',
      keyFeaturesSummary: ['Original roots', 'Strong\'s dictionary'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"What did the biblical authors actually say in the original Hebrew, Aramaic, and Greek? 

When David wrote Psalm 23, or when Paul penned Romans 8, they chose words rich with ancient cultural and theological nuance that English translations often flatten. 

With the Lexicon Glossary on XeJesUs, you can look up any biblical concept with Strong's Concordance numbers, original linguistic roots, and clear pronunciations. 

Discover what 'Hesed', 'Shalom', and 'Agape' truly mean. You don't need a seminary degree—just an open heart and curiosity. 

Explore the Lexicon Glossary right now in Guest Mode at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'sanctuary-settings': {
    '60s-commercial': {
      topicId: 'sanctuary-settings',
      topicName: 'Sanctuary Settings',
      title: 'Sanctuary Settings: Complete Personalization Hub',
      format: '60s-commercial',
      durationEstimate: '56 Seconds',
      wordCount: 142,
      hook: 'Everyone studies the Bible differently. Why should your study app force one rigid interface?',
      keyFeaturesSummary: [
        'Central control center for atmosphere, voices, and canon',
        'Theme switching (Modern, Midnight, Parchment)',
        'Canonical web linking and 6-source framework'
      ],
      callToAction: 'Customize your study at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Panning over the Sanctuary Settings control panel with icons for Profile, Voices, Sources, and Bible Links]
[Audio: Smooth, reverent ambient track]
VOICEOVER: "Everyone studies the Bible differently. Why should your study app force one rigid interface?"

[0:08 - 0:26] FOUR CORE CONTROLS
[Visual: Quick tour through Pilgrim Profile, Scholars Voices, Foundational Sources, and Bible Canonical Link]
VOICEOVER: "Sanctuary Settings in XeJesUs puts you in complete control of your spiritual study environment."

[0:26 - 0:44] THEMES & CANONICAL LINKS
[Visual: Toggling between Modern, Traditional Parchment, and Midnight Exegesis themes, then selecting BibleGateway preset]
VOICEOVER: "Switch visual atmospheres from Parchment to Midnight, configure AI scholar voice narration, verify your citation framework, and link scriptures directly to BibleGateway or BibleHub."

[0:44 - 0:56] CALL TO ACTION
[Visual: Settings saved confirmation toast with xejesus.app logo]
VOICEOVER: "Build a sanctuary tailored to your prayer life. Visit xejesus.app and configure your settings today."`
    },
    '30s-reel': {
      topicId: 'sanctuary-settings',
      topicName: 'Sanctuary Settings',
      title: '30s Reel: Customize Your Sacred Space',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 76,
      hook: 'Customize your Bible study app like never before!',
      keyFeaturesSummary: ['Themes', 'Voices', 'Bible links'],
      callToAction: 'Configure yours at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Instant theme switch from white to gold-parchment to midnight blue]
VOICEOVER: "Customize your Bible study app like never before!"

[0:06 - 0:20] FEATURE
[Visual: Panning through AI voice selector, Ethiopian Bible toggle, and BibleGateway link]
VOICEOVER: "In XeJesUs Sanctuary Settings, you control visual themes, AI scholar voices, and online Bible cross-references in one tap!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Make it your own today at xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'sanctuary-settings',
      topicName: 'Sanctuary Settings',
      title: '2-Minute Tutorial: Navigating Sanctuary Settings & Four Control Centers',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 268,
      hook: 'Let’s tour the four central settings sections in XeJesUs.',
      keyFeaturesSummary: ['Pilgrim profile', 'Voice engine', '6 sources', 'Canonical link'],
      callToAction: 'Set up your sanctuary at xejesus.app.',
      fullScript: `[0:00 - 0:25] WELCOME TO SETTINGS
[Visual: Navigating into 'Sanctuary Settings' from sidebar]
VOICEOVER: "Welcome to Sanctuary Settings. Unlike typical apps with buried menus, XeJesUs organizes all your study preferences into four dedicated control centers."

[0:25 - 0:50] CENTER 1: PILGRIM'S PROFILE
[Visual: Showing theme selector with Modern, Midnight, and Parchment options]
VOICEOVER: "First is Pilgrim's Profile. Here, you manage your avatar, check your membership tier, and switch visual environments between Modern Sanctuary, Midnight Exegesis, and Traditional Parchment."

[0:50 - 1:15] CENTER 2: SCHOLARS VOICES
[Visual: Demonstrating male and female voice preset buttons]
VOICEOVER: "Second is Scholars Voices. Enable our AI voice engine to hear your exegesis scrolls read aloud in distinct scholar personas like C.S. Lewis or Charles Spurgeon."

[1:15 - 1:40] CENTERS 3 & 4: SOURCES & BIBLE GATEWAYS
[Visual: Showing 6-source framework and BibleGateway quick fill buttons]
VOICEOVER: "Third and fourth, verify the six foundational citation pillars—including the 81-book Ethiopian Bible—and specify your preferred online Bible link for instant cross-referencing."

[1:40 - 2:00] OUTRO
VOICEOVER: "Personalize your study experience today at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'sanctuary-settings',
      topicName: 'Sanctuary Settings',
      title: 'Radio Spot: The Customizable Bible Sanctuary',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 140,
      hook: 'What does your ideal prayer and Bible study environment look like?',
      keyFeaturesSummary: ['Personalized study', 'Multiple themes'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"What does your ideal prayer and Bible study environment look like? 

Do you prefer crisp, modern typography, a dark midnight sanctuary for late-night reflection, or warm antique parchment that feels like an ancient manuscript? 

With Sanctuary Settings on XeJesUs, you choose your visual atmosphere with a single click. 

Configure text-to-speech scholar voices, verify your academic citations, and connect scripture verses directly to your favorite online Bible tool like BibleGateway or BibleHub. 

Your study time should inspire you. Personalize your sanctuary today with zero registration at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'settings-profile': {
    '60s-commercial': {
      topicId: 'settings-profile',
      topicName: 'Pilgrim\'s Profile',
      title: 'Pilgrim\'s Profile: Modern, Midnight & Parchment Environments',
      format: '60s-commercial',
      durationEstimate: '56 Seconds',
      wordCount: 142,
      hook: 'Have you ever had eye strain trying to read small Bible text late at night?',
      keyFeaturesSummary: [
        'High-contrast typography (Inter & Cormorant Garamond)',
        '3 Atmosphere themes: Modern, Midnight Exegesis, Traditional Parchment',
        'Account tier and avatar customization'
      ],
      callToAction: 'Select your atmosphere at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Person reading tablet in dim room, squinting at harsh light, then switching to Midnight Exegesis theme]
[Audio: Gentle, soothing ambient music]
VOICEOVER: "Have you ever experienced eye strain trying to read tiny Bible text late at night?"

[0:08 - 0:26] THREE BESPOKE THEMES
[Visual: Smooth transition: Modern Sanctuary -> Traditional Parchment -> Midnight Exegesis]
VOICEOVER: "Inside Pilgrim's Profile on XeJesUs, choose from three meticulously crafted environments designed specifically for scripture contemplation."

[0:26 - 0:44] HIGH-CONTRAST TYPOGRAPHY
[Visual: Close up of bold Cormorant Garamond serif headers and crisp Inter body text in deep obsidian black and radiant gold]
VOICEOVER: "Experience bold, high-contrast typography, warm antique parchment textures, or serene obsidian dark mode that protects your eyes during late-night prayer."

[0:44 - 0:56] CALL TO ACTION
[Visual: Profile card showing 'Test Pilgrim' guest status and xejesus.app logo]
VOICEOVER: "Study in total comfort. Visit xejesus.app and customize your Pilgrim Profile today."`
    },
    '30s-reel': {
      topicId: 'settings-profile',
      topicName: 'Pilgrim\'s Profile',
      title: '30s Reel: The Most Beautiful Bible Themes',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 76,
      hook: 'Look at the aesthetic themes on this Bible app!',
      keyFeaturesSummary: ['Parchment mode', 'Dark mode'],
      callToAction: 'Check it out at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Instant switch between Parchment scroll texture and deep Midnight blue]
VOICEOVER: "Look at the aesthetic themes on this Bible app!"

[0:06 - 0:20] FEATURE
[Visual: Close-up of rich gold accents and bold serif text in Parchment mode]
VOICEOVER: "XeJesUs lets you read in Modern clean, Midnight dark, or Traditional Parchment that looks like an ancient scroll!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Experience it for yourself at xejesus.app right now!"`
    },
    '2m-tutorial': {
      topicId: 'settings-profile',
      topicName: 'Pilgrim\'s Profile',
      title: '2-Minute Tutorial: Setting Up Your Profile & Atmosphere',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 265,
      hook: 'Let’s walk through setting up your pilgrim profile and choosing your visual theme.',
      keyFeaturesSummary: ['Avatar upload', 'Tier status', 'Theme switching'],
      callToAction: 'Set your profile at xejesus.app.',
      fullScript: `[0:00 - 0:25] NAVIGATING TO PROFILE
[Visual: Navigating to Settings > Pilgrim's Profile]
VOICEOVER: "Welcome to Pilgrim's Profile. Here, you define your presence in the sanctuary and set the visual atmosphere that best supports your focus."

[0:25 - 0:55] USER INFORMATION & ACCOUNT TIERS
[Visual: Pointing to avatar, display name, and tier badges]
VOICEOVER: "At the top, your profile displays your avatar and account status. In Guest Mode, you're assigned 'Test Pilgrim', allowing you to test premium features without entering personal details."

[0:55 - 1:25] THE THREE SANCTUARY ATMOSPHERES
[Visual: Clicking each theme card to show immediate visual transformation]
VOICEOVER: "Below, explore the three Sanctuary Atmospheres. 'Modern Sanctuary' offers clean, high-contrast reading. 'Midnight Exegesis' provides deep obsidian tones for evening prayer. 'Traditional Parchment' simulates warm codex paper."

[1:25 - 1:50] PERSISTENT PREFERENCES
[Visual: Showing settings saved notification]
VOICEOVER: "Your theme choice saves automatically in local storage, ensuring your sanctuary always opens to your favorite atmosphere."

[1:50 - 2:00] OUTRO
VOICEOVER: "Find your ideal study space at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'settings-profile',
      topicName: 'Pilgrim\'s Profile',
      title: 'Radio Spot: The Comfort of Scripture Reading',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 139,
      hook: 'Does reading the Bible on your phone give you tired eyes?',
      keyFeaturesSummary: ['Eyecare', 'Parchment aesthetics'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Does reading the Bible on your phone or computer leave you with tired eyes? 

Most apps use harsh white backgrounds with tiny fonts. But on XeJesUs, Pilgrim's Profile puts your reading comfort first. 

Choose from three beautifully balanced environments: Modern Sanctuary with deep contrast, Midnight Exegesis with soothing sapphire tones, or Traditional Parchment reminiscent of ancient parchment scrolls. 

With bold, darkened typography and zero eye strain, you can focus on what matters most: dwelling in the Word. 

Try all three atmospheres right now in Guest Mode at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'settings-voices': {
    '60s-commercial': {
      topicId: 'settings-voices',
      topicName: 'Scholars Voices',
      title: 'Scholars Voices: Renowned Theological Audio Narration',
      format: '60s-commercial',
      durationEstimate: '58 Seconds',
      wordCount: 146,
      hook: 'Imagine listening to deep Bible studies read aloud in the voice of C.S. Lewis or Charles Spurgeon.',
      keyFeaturesSummary: [
        'AI Scholar Speech Synthesis engine',
        'Male Presets: C.S. Lewis, Charles Spurgeon, John Piper',
        'Female Presets: Priscilla Shirer, Lysa TerKeurst, Oprah Winfrey',
        'Custom Preacher Persona input'
      ],
      callToAction: 'Hear the scholars at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Vintage audio microphone glowing beside leather Bible]
[Audio: Elegant, warm British voiceover reminiscent of Oxford scholar]
VOICEOVER: "Imagine listening to deep Bible studies narrated in the voice of C.S. Lewis or Charles Spurgeon."

[0:08 - 0:26] THE VOICE ENGINE
[Visual: Screen shows 'Scholars Voices' selector with Male and Female preset buttons]
VOICEOVER: "With 'Scholars Voices' in XeJesUs, you can turn any exegesis scroll into an immersive auditory experience."

[0:26 - 0:44] MALE, FEMALE & CUSTOM PERSONAS
[Visual: User clicks 'C.S. Lewis', tests audio sample, then types custom preacher name into the custom persona field]
VOICEOVER: "Choose from eloquent Oxford contemplatives, 19th-century orators, or vibrant modern expositors like Priscilla Shirer. You can even type any custom preacher name!"

[0:44 - 0:58] CALL TO ACTION
[Visual: Headphones icon with audio waveform and xejesus.app logo]
VOICEOVER: "Listen during your morning commute or evening prayer. Visit xejesus.app and sample the scholar voices today."`
    },
    '30s-reel': {
      topicId: 'settings-voices',
      topicName: 'Scholars Voices',
      title: '30s Reel: Listen to Bible Studies in C.S. Lewis\' Voice',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 78,
      hook: 'Listen to this: AI that reads Bible studies like C.S. Lewis!',
      keyFeaturesSummary: ['Scholar audio', 'Custom personas'],
      callToAction: 'Listen free at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Tapping 'C.S. Lewis' in Scholars Voices]
VOICEOVER: "Listen to this: an AI that reads your Bible studies in the persona of C.S. Lewis!"

[0:06 - 0:20] FEATURE
[Visual: Audio waveform pulsing as exegesis scroll plays expressive audio narration]
VOICEOVER: "In XeJesUs, you can choose Spurgeon, C.S. Lewis, Priscilla Shirer, or type your own favorite preacher!"

[0:20 - 0:30] CTA
[Visual: xejesus.app logo]
VOICEOVER: "Try the voice engine free right now at xejesus.app!"`
    },
    '2m-tutorial': {
      topicId: 'settings-voices',
      topicName: 'Scholars Voices',
      title: '2-Minute Tutorial: Configuring Audio Personas & Testing Voices',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 270,
      hook: 'Let’s look at how to enable the AI Scholar voice engine and test audio presets.',
      keyFeaturesSummary: ['Voice toggle', 'Preset testing', 'Custom persona'],
      callToAction: 'Configure your scholar voices at xejesus.app.',
      fullScript: `[0:00 - 0:25] INTRODUCING SCHOLARS VOICES
[Visual: Navigating to Settings > Scholars Voices]
VOICEOVER: "Welcome to Scholars Voices. Reading long theological exegesis scrolls can take time. Our speech synthesis engine brings these texts alive with expressive audio narration."

[0:25 - 0:50] ENABLING THE VOICE ENGINE
[Visual: Toggling the 'Scholar AI Voice Engine' switch to Enabled]
VOICEOVER: "First, ensure the Scholar AI Voice Engine toggle is active. When enabled, high-fidelity AI personas narrate your studies rather than robotic browser voices."

[0:50 - 1:20] TESTING MALE & FEMALE PRESETS
[Visual: Clicking 'Sample Voice' on C.S. Lewis and Priscilla Shirer]
VOICEOVER: "Select your preferred Male and Female scholar voices. You can click 'Sample Voice' to hear an instant audio preview of their distinct vocal cadence and contemplative tone."

[1:20 - 1:45] CUSTOM PREACHER PERSONAS
[Visual: Selecting 'Custom' and typing 'Charles Stanley']
VOICEOVER: "Want a specific teacher? Select 'Custom' and type any pastor or scholar name. The engine adapts its pacing and delivery to match that persona."

[1:45 - 2:00] OUTRO
VOICEOVER: "Listen to scripture come alive at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'settings-voices',
      topicName: 'Scholars Voices',
      title: 'Radio Spot: The Sound of Exegesis',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 140,
      hook: 'Do you spend hours in the car wishing you could redeem that time with deep scripture study?',
      keyFeaturesSummary: ['Audio exegesis', 'Commute companion'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Do you spend hours every week commuting, wishing you could redeem that time with deep scripture study? 

With 'Scholars Voices' on XeJesUs, you can listen to rich biblical exegesis scrolls narrated in renowned theological personas. 

Hear profound insights into Greek root words, Levant archaeology, and Church history read in the contemplative style of C.S. Lewis, Charles Spurgeon, or modern expositors like Priscilla Shirer. 

You can even define your own custom preacher persona. Turn your car, gym, or morning walk into a sacred lecture hall. 

Test drive the audio engine for free in Guest Mode at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'settings-sources': {
    '60s-commercial': {
      topicId: 'settings-sources',
      topicName: 'Primary Foundational Sources',
      title: 'Primary Foundational Sources: The 6 Indispensable Pillars',
      format: '60s-commercial',
      durationEstimate: '57 Seconds',
      wordCount: 145,
      hook: 'What makes XeJesUs the most academically sound biblical platform available?',
      keyFeaturesSummary: [
        '6 Academic & Spiritual Pillars',
        'Asher Wilson Complete Ethiopian Bible (81 Books)',
        'Original Hebrew, Greek & Ge\'ez Lexicons'
      ],
      callToAction: 'Examine the 6 pillars at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Six majestic stone columns rising in ancient temple court with Bible codices]
[Audio: Deep orchestral horns and reverent strings]
VOICEOVER: "What makes XeJesUs the most academically trustworthy biblical platform available?"

[0:08 - 0:26] THE SIX PILLARS
[Visual: Panning through the six source cards in Settings: Canonical Bible, Ethiopian Bible, Lexicons, Fathers, Archaeology, Web Grounding]
VOICEOVER: "Our unbreakable commitment to the Six Primary Foundational Sources Framework."

[0:26 - 0:44] ASHER WILSON'S 81-BOOK CANON
[Visual: Highlighting Source II: Asher Wilson's Ethiopian Bible preserving 1 Enoch, Jubilees, and Meqabyan]
VOICEOVER: "From Genesis to Revelation, through Asher Wilson's 81-book Ethiopian Bible, original Greek and Hebrew roots, and the early Church fathers, every insight is cross-examined."

[0:44 - 0:57] CALL TO ACTION
[Visual: Verified citation shield badge and xejesus.app logo]
VOICEOVER: "No theological drift. No algorithmic hallucinations. Visit xejesus.app and examine the six pillars today."`
    },
    '30s-reel': {
      topicId: 'settings-sources',
      topicName: 'Primary Foundational Sources',
      title: '30s Reel: Why XeJesUs Has Zero Hallucinations',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 78,
      hook: 'Generic AI hallucinates Bible verses. XeJesUs does not. Here is why.',
      keyFeaturesSummary: ['6 pillars', 'Zero hallucinations'],
      callToAction: 'See the proof at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Red warning cross fading into solid golden shield]
VOICEOVER: "Generic AI hallucinates Bible verses. XeJesUs does not. Here's why."

[0:06 - 0:20] FEATURE
[Visual: The 6 citation pillars lighting up on screen]
VOICEOVER: "Every answer is anchored in six verified pillars: Canonical Scripture, the 81-book Ethiopian Bible, Greek lexicons, Church fathers, and archaeology!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Experience real biblical rigor at xejesus.app right now!"`
    },
    '2m-tutorial': {
      topicId: 'settings-sources',
      topicName: 'Primary Foundational Sources',
      title: '2-Minute Tutorial: Understanding the 6 Citation Authorities',
      format: '2m-tutorial',
      durationEstimate: '118 Seconds',
      wordCount: 275,
      hook: 'Let’s examine the six foundational pillars that verify every study in the sanctuary.',
      keyFeaturesSummary: ['Canonical scriptures', 'Ethiopian Bible', 'Patristics', 'Archaeology'],
      callToAction: 'Review the framework at xejesus.app.',
      fullScript: `[0:00 - 0:25] INTRODUCING THE 6 SOURCES
[Visual: Navigating to Settings > Primary Foundational Sources]
VOICEOVER: "Welcome to Primary Foundational Sources. In an era where AI can fabricate quotes, XeJesUs enforces a strict academic and spiritual citation framework. Let's inspect the six pillars."

[0:25 - 0:50] SOURCES I & II: SCRIPTURE & ETHIOPIAN CANON
[Visual: Zooming into Source I and Source II]
VOICEOVER: "Source I is the Primary Canonical Scriptures from Genesis to Revelation. Source II is Asher Wilson's Complete Ethiopian Bible in English, preserving ancient Ge'ez texts like 1 Enoch and Jubilees."

[0:50 - 1:20] SOURCES III & IV: LEXICONS & CHURCH FATHERS
[Visual: Zooming into Source III and Source IV]
VOICEOVER: "Source III provides original linguistic lexicons via Strong's, BDB, and BDAG concordances. Source IV anchors exegesis in Patristic commentators like Augustine, Chrysostom, and Spurgeon."

[1:20 - 1:45] SOURCES V & VI: ARCHAEOLOGY & WEB GROUNDING
[Visual: Zooming into Source V and Source VI]
VOICEOVER: "Source V integrates archaeological logs and Dead Sea Scrolls, while Source VI provides live Google Search web grounding for modern application."

[1:45 - 2:00] OUTRO
VOICEOVER: "Study with confidence at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'settings-sources',
      topicName: 'Primary Foundational Sources',
      title: 'Radio Spot: The 6 Pillars of Truth',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 142,
      hook: 'In a world full of theological opinions, what standard do you trust?',
      keyFeaturesSummary: ['Scholarly bedrock', 'Unshakable truth'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"In a world full of competing theological opinions, what standard do you trust? 

XeJesUs was built on an uncompromising foundation: The Six Primary Foundational Sources Framework. 

Every single exegesis scroll is verified against canonical scripture, Asher Wilson's complete 81-book Ethiopian Bible, original Greek and Hebrew word roots, early Church fathers, and Levant archaeology. 

You never have to wonder if an answer is fabricated or taken out of context. It's grounded, reverent, and academically peer-reviewed. 

Discover what true biblical scholarship looks like in Guest Mode at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  },

  'settings-canonical-link': {
    '60s-commercial': {
      topicId: 'settings-canonical-link',
      topicName: 'Bible Canonical Link',
      title: 'Bible Canonical Link: Connecting Scrolls to the Web',
      format: '60s-commercial',
      durationEstimate: '56 Seconds',
      wordCount: 140,
      hook: 'Ever wish scripture references in your study notes linked directly to your favorite online Bible?',
      keyFeaturesSummary: [
        'Direct in-text scripture hyperlinking',
        'Quick fill presets for BibleGateway, BibleHub, Blue Letter Bible',
        'Asher Wilson Ethiopian Bible research links'
      ],
      callToAction: 'Link your favorite Bible tool at xejesus.app.',
      fullScript: `[0:00 - 0:08] HOOK
[Visual: Finger tapping scripture reference inside study scroll; opens BibleGateway in smooth side view]
[Audio: Clean, modern click sound and energetic electronic pad]
VOICEOVER: "Ever wish scripture references in your study notes linked directly to your favorite online Bible?"

[0:08 - 0:25] THE CANONICAL LINK
[Visual: Showing 'Bible Canonical Link' settings field with preset buttons]
VOICEOVER: "With 'Bible Canonical Link' in XeJesUs, you designate your preferred online scripture portal with one click."

[0:25 - 0:44] SEAMLESS PRESETS
[Visual: Clicking BibleGateway, Blue Letter Bible, and BibleHub quick presets]
VOICEOVER: "Choose BibleGateway, Blue Letter Bible for interlinear Greek studies, BibleHub for parallel translations, or Asher Wilson's Ethiopian Bible research."

[0:44 - 0:56] CALL TO ACTION
[Visual: Exegesis scroll with hyperlinked verse numbers and xejesus.app logo]
VOICEOVER: "Seamless research without copying and pasting. Visit xejesus.app and configure your canonical link today."`
    },
    '30s-reel': {
      topicId: 'settings-canonical-link',
      topicName: 'Bible Canonical Link',
      title: '30s Reel: Click Any Verse to Open BibleGateway',
      format: '30s-reel',
      durationEstimate: '30 Seconds',
      wordCount: 77,
      hook: 'Stop copying and pasting Bible verses into Google!',
      keyFeaturesSummary: ['One-click BibleGateway link', 'Seamless workflow'],
      callToAction: 'Try it at xejesus.app',
      fullScript: `[0:00 - 0:06] HOOK
[Visual: Person furiously copying verse text and pasting into browser]
VOICEOVER: "Stop copying and pasting Bible verses into Google search!"

[0:06 - 0:20] FEATURE
[Visual: Tapping verse link in XeJesUs -> opens instantly in BibleGateway]
VOICEOVER: "In XeJesUs, every scripture citation links directly to BibleGateway, Blue Letter Bible, or BibleHub automatically!"

[0:20 - 0:30] CTA
[Visual: xejesus.app screen]
VOICEOVER: "Save time studying scripture at xejesus.app right now!"`
    },
    '2m-tutorial': {
      topicId: 'settings-canonical-link',
      topicName: 'Bible Canonical Link',
      title: '2-Minute Tutorial: Linking Exegesis Scrolls to BibleGateways',
      format: '2m-tutorial',
      durationEstimate: '115 Seconds',
      wordCount: 268,
      hook: 'Let’s look at how to configure your preferred external online Bible gateway.',
      keyFeaturesSummary: ['URL configuration', 'Preset buttons', 'Scroll integration'],
      callToAction: 'Configure your links at xejesus.app.',
      fullScript: `[0:00 - 0:25] INTRODUCING CANONICAL LINKS
[Visual: Navigating to Settings > Bible Canonical Link]
VOICEOVER: "Welcome to Bible Canonical Link. When reading an exegesis scroll, you often want to read the surrounding chapter in your preferred translation. This tool makes that seamless."

[0:25 - 0:50] USING QUICK FILL PRESETS
[Visual: Clicking the 'BibleGateway' preset button]
VOICEOVER: "Under the Website URL input, click 'BibleGateway'. Notice how the search parameter URL fills automatically. You can also pick 'Blue Letter Bible' for original language concordances or 'BibleHub'."

[0:50 - 1:20] ETHIOPIAN BIBLE RESEARCH
[Visual: Clicking 'Asher Wilson Ethiopian Bible Research' button]
VOICEOVER: "If you're studying the 81-book Ethiopian canon, click 'Asher Wilson Ethiopian Bible Research' to direct your searches to comprehensive scholarship on 1 Enoch and Jubilees."

[1:20 - 1:45] VERIFYING IN-SCROLL HYPERLINKS
[Visual: Navigating to John 11:35 and clicking the scripture link]
VOICEOVER: "Now, whenever a verse reference appears in your interpretation, clicking it immediately opens your chosen gateway."

[1:45 - 2:00] OUTRO
VOICEOVER: "Connect your research today at xejesus.app."`
    },
    'podcast-radio': {
      topicId: 'settings-canonical-link',
      topicName: 'Bible Canonical Link',
      title: 'Radio Spot: Seamless Scripture Linking',
      format: 'podcast-radio',
      durationEstimate: '60 Seconds',
      wordCount: 140,
      hook: 'Do you love using BibleGateway or Blue Letter Bible for your personal devotions?',
      keyFeaturesSummary: ['External tools integration', 'Instant cross reference'],
      callToAction: 'Visit xejesus.app today.',
      fullScript: `"Do you love using BibleGateway, Blue Letter Bible, or BibleHub for your daily devotions? 

With XeJesUs, you don't have to choose between our deep exegesis engine and your favorite online Bible tool. 

The 'Bible Canonical Link' feature lets you designate your preferred scripture gateway with one click. 

Every scripture reference in your exegesis scrolls automatically links directly to your chosen website for instant context. 

Read the Greek and Hebrew exegesis in XeJesUs, and cross-reference the full chapter in your favorite translation seamlessly. 

Test drive it today in Guest Mode at X-E-J-E-S-U-S dot app. That's xejesus.app."`
    }
  }
};

export function getScriptForTopic(
  topicId: string,
  format: ScriptFormat = '60s-commercial'
): AdScriptItem {
  if (format === 'master-commercial' || topicId === 'master-all-features') {
    return MASTER_ALL_FEATURES_SCRIPT;
  }

  const topicGroup = TOPIC_SCRIPTS[topicId];
  if (!topicGroup) {
    return MASTER_ALL_FEATURES_SCRIPT;
  }

  const targetFormat = format as keyof typeof topicGroup;
  return topicGroup[targetFormat] || topicGroup['60s-commercial'];
}
