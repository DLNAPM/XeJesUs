import { Inquiry, ChatSession } from '../types';

/**
 * Pre-populated Flagship Inquiries for Guest Test Drive (Read-Only)
 */
export const GUEST_TEST_INQUIRIES: Inquiry[] = [
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
    createdAt: { seconds: Math.floor(Date.now() / 1000 - 3600), nanoseconds: 0 }
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
    createdAt: { seconds: Math.floor(Date.now() / 1000 - 86400), nanoseconds: 0 }
  }
];

/**
 * Pre-populated Flagship Saved Chat Sessions for Guest Mode
 * Enables guests to view, play with Scholar Voice narration, and explore Sanctuary Settings
 */
export const GUEST_SAVED_SESSIONS: ChatSession[] = [
  {
    id: 'guest-session-1',
    userId: 'guest',
    name: 'The Tears of Christ: The Sacred Mystery of John 11:35',
    messages: [
      {
        role: 'user',
        text: 'Why did Jesus weep at Lazarus’ tomb if He already knew with absolute certainty that He was about to raise him from the dead?'
      },
      {
        role: 'model',
        text: 'In John 11:35, the Holy Spirit records the shortest yet one of the most sublime verses in sacred Scripture: "Jesus wept" (in the original Koine Greek: "edakrysen").\n\nNotice the precise grammatical nuance: unlike "eklaisen", which denotes loud, ceremonial wailing such as that practiced by the mourning crowd, "edakrysen" signifies a quiet, inward welling up of sacred tears. Jesus did not weep out of despair, nor was He taken by surprise, for He had already declared to Martha: "I am the resurrection and the life" (John 11:25).\n\nRather, Christ wept because He stepped completely into the heartbreak of Martha, Mary, and our fallen human condition. His tears reveal the very heart of the Father: God does not stand at a stoic distance from human suffering. Even knowing that victory is moments away, the Lord enters our sorrow, validates our grief, and sanctifies human tears with His own.\n\nAs church father John Chrysostom wrote in his Homilies on John, Christ wept to confirm His genuine human nature, proving that He took upon Himself real human flesh capable of feeling love and sorrow, while simultaneously demonstrating His divine lordship over death when He commanded: "Lazarus, come forth!"'
      },
      {
        role: 'user',
        text: 'How should this minister to us when we walk through personal grief or unanswered prayers today?'
      },
      {
        role: 'model',
        text: 'It reminds us that bringing tears before God is not a failure of faith; it is an act of covenant trust and love. When you walk through a valley of loss, waiting, or quiet heartbreak, Jesus does not ask you to mask your pain.\n\nHe stands beside you in the dust of Bethany, weeping with you in your present ache, even while His sovereign hand is orchestrating the eternal resurrection. Anchor your soul in Hebrews 4:15: we do not have a High Priest who cannot sympathize with our weaknesses. The same Christ who wept at Bethany lives today to comfort and uphold you.'
      }
    ],
    createdAt: { seconds: Math.floor(Date.now() / 1000 - 7200), nanoseconds: 0 }
  },
  {
    id: 'guest-session-2',
    userId: 'guest',
    name: 'Apostolic Abundance: The 153 Fish & The Unbroken Net (John 21:11)',
    messages: [
      {
        role: 'user',
        text: 'What is the biblical, historical, and prophetic meaning behind the disciples catching exactly 153 large fish in John 21:11?'
      },
      {
        role: 'model',
        text: 'In John 21:11, the Apostle Peter pulled the net to shore full of large fish: "a hundred and fifty-three; and although there were so many, the net was not torn."\n\nThis specific number carries deep layers of eyewitness authenticity and biblical typology:\n\n1. Eyewitness Galilean Reality: First-century fishermen on the Sea of Galilee were practical tradesmen. When a catch of that magnitude occurred after an entire night of empty labor, counting and dividing the haul was customary business practice. Its exactness proves historical eyewitness testimony.\n\n2. The All-Embracing Gospel Net: Ancient Greco-Roman naturalists like Oppian of Cilicia cataloged 153 known species of fish in the Mediterranean basin. Church fathers like Jerome and Cyril of Alexandria noted that the 153 fish symbolize the universal scope of the Great Commission: the net of Christ’s Kingdom gathers every tongue, tribe, and nation under heaven.\n\n3. Hebrew Gematria: In ancient Hebrew numerical reckoning, 153 corresponds to the numerical value of "Beni Ha-Elohim" (The Children of God). The catch signifies the full harvest of God’s redeemed sons and daughters.\n\n4. The Unbroken Net: Notice that unlike Luke 5, where the nets broke prior to the resurrection, here in John 21 the net remained whole. In the resurrected Christ, the Church is divinely preserved; not one soul entrusted to Him will be lost (John 10:28).'
      },
      {
        role: 'user',
        text: 'How can I listen to this session using different Scholar Voices?'
      },
      {
        role: 'model',
        text: 'You can audition and switch scholar voices right now! Use the "Scholar Voice" dropdown in the audio toolbar or visit Sanctuary Settings under Pilgrim\'s Profile.\n\nYou can hear this dialogue narrated in the contemplative voice of C.S. Lewis, the roaring passion of Charles Spurgeon, the uplifting encouragement of Joel Osteen, or the gentle fortitude of Corrie ten Boom.'
      }
    ],
    createdAt: { seconds: Math.floor(Date.now() / 1000 - 86400), nanoseconds: 0 }
  },
  {
    id: 'guest-session-3',
    userId: 'guest',
    name: 'The Ge’ez Canon: Asher Wilson’s Ethiopian Bible & 1 Enoch',
    messages: [
      {
        role: 'user',
        text: 'Why does XeJesUs incorporate Asher Wilson’s 81-book Ethiopian Bible and the Book of Enoch into its foundational research?'
      },
      {
        role: 'model',
        text: 'The Ethiopian Orthodox Tewahedo Church possesses the oldest and most complete biblical canon preserved on earth, consisting of 81 canonical books recorded in classical Ge’ez. This includes sacred ancient works such as 1 Enoch (Henok) and the Book of Jubilees, which were preserved in Ethiopia when Western manuscript traditions lost their complete texts.\n\nIn the New Testament canon itself, Jude verses 14–15 directly cites 1 Enoch 1:9 as an inspired apostolic prophecy: "Behold, the Lord comes with ten thousands of His holy ones, to execute judgment on all..."\n\nIn 1 Enoch 46, Enoch is granted a heavenly vision of the "Son of Man" seated alongside the "Ancient of Days," revealing the pre-existent glory and righteousness of the Messiah. By synthesizing Asher Wilson’s complete English translation, XeJesUs allows pilgrims to study scripture within the full, unbroken apostolic horizon that early church fathers like Tertullian, Irenaeus, and Clement of Alexandria knew and revered.'
      },
      {
        role: 'user',
        text: 'How do Sanctuary Settings allow me to tailor my study environment?'
      },
      {
        role: 'model',
        text: 'In Sanctuary Settings, you have full control over:\n• Scholar AI Voice Engine: Choose between male and female scholar personas or disable them for zero-delay speech.\n• Atmosphere: Toggle between Modern Sanctuary, Midnight Exegesis, and Traditional Parchment.\n• Bible Canonical Link: Designate your favorite online Bible portal (BibleGateway, BibleHub, Blue Letter Bible, or Asher Wilson Research) so every scripture reference hyperlinks directly to external concordances!'
      }
    ],
    createdAt: { seconds: Math.floor(Date.now() / 1000 - 172800), nanoseconds: 0 }
  }
];

/**
 * Helper to identify whether a session belongs to a Guest Pilgrim (Test Drive)
 */
export function isGuestUser(
  user?: { isAnonymous?: boolean; email?: string | null } | null,
  userProfile?: { email?: string | null } | null
): boolean {
  if (!user && !userProfile) return true;
  if (user?.isAnonymous) return true;
  if (user?.email === 'guest@xejesus.app') return true;
  if (userProfile?.email === 'guest@xejesus.app') return true;
  return false;
}

