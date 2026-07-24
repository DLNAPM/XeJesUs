import { GoogleGenAI } from "@google/genai";
import { Inquiry, LiteraryWorkExport } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (aiInstance) return aiInstance;
  
  // Use both possible locations for the API key in a Vite environment
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process?.env?.GEMINI_API_KEY : '') || '';
  
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please ensure GEMINI_API_KEY is configured in your project settings.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

export async function chatWithSanctuary(
  message: string, 
  history: { role: 'user' | 'model', text: string }[],
  recentInquiries: Inquiry[]
) {
  const ai = getAi();
  const modelName = "gemini-3-flash-preview";
  
  const contextStrings = recentInquiries.map(inq => 
    `Scripture: ${inq.scripture}\nQuery: ${inq.query}\nInterpretation: ${inq.interpretation}\nGod's Intent: ${inq.godIntent}`
  ).join("\n\n---\n\n");

  const systemInstruction = `You are the "Sanctuary Scholar", a divine AI companion for the XeJesUs app. 
Your goal is to help pilgrims find deeper insights into their recent biblical studies (seekings), connecting them to current events and personal growth.

User's Recent Seekings Context:
${contextStrings}

Guidelines:
1. Be encouraging, scholarly, and spiritually insightful.
2. Use the provided Google Search tool to research current events or additional context if relevant to the user's questions.
3. When asked about recent studies, refer to the provided context.
4. Help the user apply these biblical truths to modern life and current worldly events.
5. Keep the tone "XeJesUs" - blending traditional exegesis with modern application.
6. If a user asks something completely unrelated to faith or their studies, gently guide them back to their spiritual journey.
7. Keep responses relatively concise but profound.`;

  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }] // Adding Google Search Grounding
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const result = await chat.sendMessage({
    message: message
  });

  return result.text;
}

export function getThematicImagesForTopic(sessionName: string, conversationText: string): { title: string; caption: string; imageUrl: string }[] {
  const text = (sessionName + " " + conversationText).toLowerCase();
  
  // 1. Moses, Exodus, Law, Sinai, Tabernacle
  if (text.includes("moses") || text.includes("exodus") || text.includes("commandment") || text.includes("sinai") || text.includes("red sea") || text.includes("egypt") || text.includes("tabernacle") || text.includes("torah")) {
    return [
      {
        title: "Wilderness of Sinai & Covenant Mountain",
        caption: "The rugged peaks of Mount Sinai, where Moses received the Ten Commandments and the Mosaic covenant.",
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Sacred Manuscripts of the Law",
        caption: "Ancient scripture parchment containing the books of the Torah and Mosaic statutes.",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 2. Paul, Epistles, Missionary Journeys, Romans, Corinthians, Galatians
  if (text.includes("paul") || text.includes("epistle") || text.includes("roman") || text.includes("corinthian") || text.includes("galatian") || text.includes("ephesian") || text.includes("philippian") || text.includes("timothy") || text.includes("missionary") || text.includes("damascus")) {
    return [
      {
        title: "Roman Roads & Missionary Journeys of Saint Paul",
        caption: "Ancient Roman highways and Mediterranean sea routes traversed by the Apostle Paul during his evangelistic epistles.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Apostolic Codex & Early Church Letters",
        caption: "Classical papyrus epistolary scroll symbolizing the Pauline letters sent to early Christian communities.",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 3. David, Psalms, Worship, Songs, Harp, Solomon
  if (text.includes("david") || text.includes("psalm") || text.includes("harp") || text.includes("worship") || text.includes("sing") || text.includes("solomon") || text.includes("samuel") || text.includes("zion")) {
    return [
      {
        title: "City of David & Historic Zion",
        caption: "Ancient stone citadel of Jerusalem, heart of the Davidic kingdom and royal psalmists.",
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Acoustic Praise & Lyrical Psalms",
        caption: "Stringed melodies and songs of devotion reflecting the poetic heart of the Book of Psalms.",
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 4. Parables, Sower, Shepherd, Vineyard, Harvest, Teaching
  if (text.includes("parable") || text.includes("sower") || text.includes("shepherd") || text.includes("vineyard") || text.includes("harvest") || text.includes("wheat") || text.includes("prodigal") || text.includes("samaritan") || text.includes("mustard")) {
    return [
      {
        title: "The Good Shepherd & Pastoral Judean Hills",
        caption: "Gentle pastoral landscapes of the Holy Land reflecting Jesus' parables of the Good Shepherd and lost sheep.",
        imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Golden Wheat Harvest & Parable Fields",
        caption: "Fertile agricultural fields representing the Sower, the mustard seed, and the Kingdom of Heaven.",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 5. Cross, Crucifixion, Atonement, Passion, Grace, Salvation, Resurrection
  if (text.includes("cross") || text.includes("passion") || text.includes("calvary") || text.includes("golgotha") || text.includes("crucifixion") || text.includes("atonement") || text.includes("grace") || text.includes("salvation") || text.includes("resurrection") || text.includes("tomb")) {
    return [
      {
        title: "Mount Calvary & The Redeeming Cross",
        caption: "Solemn silhouette of the cross at sunset, commemorating the ultimate sacrifice and divine grace.",
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Empty Tomb & Resurrection Dawn",
        caption: "Radiant morning light breaking into an ancient stone tomb, witnessing Christ's victory over death.",
        imageUrl: "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 6. Wisdom, Proverbs, Ecclesiastes, Job, Suffering
  if (text.includes("wisdom") || text.includes("proverb") || text.includes("ecclesiastes") || text.includes("job") || text.includes("suffering") || text.includes("trial") || text.includes("patience") || text.includes("understanding")) {
    return [
      {
        title: "Solomonic Wisdom & Illuminated Study",
        caption: "A quiet sanctuary of classical wisdom literature, pondering the fear of the Lord and true understanding.",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Quiet Reflection & Divine Sovereignty",
        caption: "Ancient olive groves providing peaceful solace for theological reflection on human trials and divine majesty.",
        imageUrl: "https://images.unsplash.com/photo-1509021436468-d5103e6071ee?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 7. Prophets, Prophecy, Isaiah, Jeremiah, Ezekiel, Daniel, Revelation, End Times
  if (text.includes("prophet") || text.includes("prophecy") || text.includes("isaiah") || text.includes("jeremiah") || text.includes("ezekiel") || text.includes("daniel") || text.includes("revelation") || text.includes("vision") || text.includes("patmos") || text.includes("end times")) {
    return [
      {
        title: "Prophetic Watchtower & Heavenly Vision",
        caption: "Solitary high peaks under dramatic skies, symbolizing the prophetic watchmen announcing messianic hope.",
        imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Scrolls of Revelation & Apocalyptic Light",
        caption: "Illuminated ancient codex containing prophetic apocalyptic visions and the New Jerusalem promise.",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 8. Creation, Genesis, Adam, Eden, Noah, Nature, Cosmos
  if (text.includes("creation") || text.includes("genesis") || text.includes("adam") || text.includes("eden") || text.includes("noah") || text.includes("ark") || text.includes("flood") || text.includes("nature") || text.includes("stars") || text.includes("cosmos")) {
    return [
      {
        title: "The Heavens Declare Creation's Glory",
        caption: "The vast celestial expanse and star-filled cosmos celebrating Genesis creation.",
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Living Waters of Paradise",
        caption: "Pure cascading waters and lush flora symbolizing the pristine Garden of Eden and divine grace.",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 9. Jesus, Gospels, Beatitudes, Galilee, Disciples, Miracles
  if (text.includes("jesus") || text.includes("gospel") || text.includes("christ") || text.includes("beatitudes") || text.includes("galilee") || text.includes("disciples") || text.includes("sermon") || text.includes("miracle")) {
    return [
      {
        title: "Sea of Galilee at Sunrise",
        caption: "Serene shoreline of Galilee where Jesus called His disciples and delivered the Sermon on the Mount.",
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Dawn of the Resurrection",
        caption: "Radiant morning light entering an ancient stone sanctuary, testifying to Christ's resurrection victory.",
        imageUrl: "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 10. Prayer, Faith, Holy Spirit, Pentecost, Sanctuary, Peace
  if (text.includes("prayer") || text.includes("faith") || text.includes("sanctuary") || text.includes("spirit") || text.includes("peace") || text.includes("hope") || text.includes("love") || text.includes("forgiveness") || text.includes("pentecost")) {
    return [
      {
        title: "Sanctuary of Intercession & Prayer",
        caption: "Warm candlelight illuminating a quiet house of prayer during heartfelt communion with God.",
        imageUrl: "https://images.unsplash.com/photo-1509021436468-d5103e6071ee?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Beam of Heavenly Light & Grace",
        caption: "Luminous light breaking through dark clouds, representing divine answer to prayer and steadfast faith.",
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 11. Jerusalem, Temple, Holy Land, Heritage
  if (text.includes("jerusalem") || text.includes("temple") || text.includes("holy land") || text.includes("hebrew") || text.includes("israel")) {
    return [
      {
        title: "Historic Gates of Old Jerusalem",
        caption: "Ancient limestone arches and battlements of Jerusalem, city of prophets and messianic promises.",
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Venerable Olive Grove of Gethsemane",
        caption: "Ancient olive trees standing in quiet meditation near Jerusalem, rooted in biblical history.",
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // General spiritual fallback
  return [
    {
      title: "Sacred Manuscripts & Scriptures",
      caption: `Illuminated biblical text and open scriptures representing divine truth in the study of "${sessionName}".`,
      imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Sanctuary of Study & Meditation",
      caption: `Peaceful environment reserved for spiritual contemplation and scholarly exegesis of ${sessionName}.`,
      imageUrl: "https://images.unsplash.com/photo-1509021436468-d5103e6071ee?auto=format&fit=crop&w=800&q=80"
    }
  ];
}

export async function generateLiteraryWorkExport(
  sessionName: string,
  messages: { role: 'user' | 'model'; text: string }[]
): Promise<LiteraryWorkExport> {
  const conversationText = messages
    .slice(-15) // take up to last 15 messages for prompt context
    .map(m => `${m.role === 'user' ? 'Pilgrim' : 'Sanctuary Scholar'}: ${m.text}`)
    .join('\n\n');

  const themeSpecificImages = getThematicImagesForTopic(sessionName, conversationText);

  const fallbackData: LiteraryWorkExport = {
    themeTitle: `Literary Exegesis: ${sessionName || 'Sanctuary Study'}`,
    subtitle: "A Formal Synthesis of Scripture, Lineage, and Scholarly Commentary",
    executiveSummary: `This literary work documents the spiritual and intellectual dialogue conducted within the XeJesUs Sanctuary regarding "${sessionName}". The exchange examines fundamental theological principles, connecting ancient covenant promises to contemporary Christian practice. Through rigorous exegesis, the study illuminates how scripture informs personal faith and community worship.`,
    thematicAnalysis: `The thematic core of this discussion hinges upon divine providence, biblical hermeneutics, and covenantal continuity. By tracing primary scriptures and scholarly consensus, we observe a harmonious thread uniting early patriarchs, prophetic revelations, and apostolic doctrine.`,
    familyTree: [
      {
        generation: "1st Generation",
        person: "Abraham",
        biblicalTitle: "Father of the Faithful",
        significance: "Received the everlasting covenant promise in Genesis 12, establishing the line of faith.",
        keyScripture: "Genesis 12:1-3"
      },
      {
        generation: "2nd Generation",
        person: "Isaac",
        biblicalTitle: "Son of Promise",
        significance: "Carried forward the patriarchal covenant and foreshadowed sacrificial obedience.",
        keyScripture: "Genesis 22:1-14"
      },
      {
        generation: "3rd Generation",
        person: "Jacob (Israel)",
        biblicalTitle: "Patriarch of the Twelve Tribes",
        significance: "Wrestled with God at Peniel and fathered the twelve tribes of Israel.",
        keyScripture: "Genesis 32:28"
      },
      {
        generation: "Royal Lineage",
        person: "King David",
        biblicalTitle: "The Royal Psalmist",
        significance: "Established the messianic kingdom lineage through the Davidic Covenant.",
        keyScripture: "2 Samuel 7:12-16"
      },
      {
        generation: "Messianic Fulfillment",
        person: "Jesus Christ",
        biblicalTitle: "The Messiah & Prince of Peace",
        significance: "Fulfilled the law and prophets, establishing the New Covenant for all believers.",
        keyScripture: "Matthew 1:1"
      }
    ],
    scholarlyWorks: [
      {
        title: "The Antiquities of the Jews",
        author: "Flavius Josephus",
        era: "1st Century AD",
        summary: "A monumental twenty-volume historiographical treatise recording the history of the Jewish people from creation to the Jewish War.",
        relevance: "Provides invaluable socio-political and historical context surrounding the temple period and Jewish messianic expectations."
      },
      {
        title: "De Civitate Dei (The City of God)",
        author: "Saint Augustine of Hippo",
        era: "5th Century Patristic Era",
        summary: "A masterpiece of Christian philosophy contrasting the earthly city with the heavenly City of God.",
        relevance: "Offers profound theological insights into how believers navigate worldly anxieties while anchoring their hope in divine eternity."
      },
      {
        title: "Commentary on the Holy Scriptures",
        author: "John Chrysostom",
        era: "4th Century AD",
        summary: "Renowned homiletic exegesis celebrated for literal and moral applications of Biblical books.",
        relevance: "Illustrates early Church preaching techniques and practical Christian discipleship."
      }
    ],
    youtubeVideos: [
      {
        title: "Understanding Biblical Covenants & Theology",
        channel: "The BibleProject",
        searchQuery: "BibleProject Covenant Theology",
        url: "https://www.youtube.com/results?search_query=BibleProject+Covenant+Theology",
        description: "An animated, in-depth visual breakdown exploring how Biblical covenants unify the Old and New Testaments."
      },
      {
        title: "Historical & Textual Context of the Gospels",
        channel: "Yale Divinity Courses",
        searchQuery: "Yale Divinity School New Testament History",
        url: "https://www.youtube.com/results?search_query=Yale+Divinity+School+New+Testament+History",
        description: "Academic lectures analyzing the manuscript history, cultural background, and literary genres of Biblical texts."
      },
      {
        title: "The Historical World of First-Century Judea",
        channel: "Academic Christian History",
        searchQuery: "First Century Judea History Bible",
        url: "https://www.youtube.com/results?search_query=First+Century+Judea+History+Bible",
        description: "Documentary exploring the archaeological discoveries and socio-cultural environment of Jesus and His disciples."
      }
    ],
    images: themeSpecificImages
  };

  try {
    const ai = getAi();
    const modelName = "gemini-3-flash-preview";

    const prompt = `You are a distinguished Biblical Scholar and Literary Historian for XeJesUs.
Analyze the following saved chat session conversation and synthesize a comprehensive "Professional Literary Work" report.

Session Title: ${sessionName}
Conversation History:
${conversationText}

Produce a structured JSON response containing:
1. "themeTitle": A grand, academic literary work title reflecting the core theological theme.
2. "subtitle": A descriptive subtitle summarizing the historical and spiritual scope.
3. "executiveSummary": A 2-3 paragraph executive summary of the conversation's core theological insights and takeaways.
4. "thematicAnalysis": An in-depth literary and theological synthesis connecting the chat insights to classical Christian exegesis and modern life application.
5. "familyTree": An array of 3 to 6 key Biblical/Historical figures, genealogical relationships, or spiritual lineages associated with this theme.
   Each item must have: "generation" (e.g. "1st Generation", "Patriarchal Era", "Davidic Royalty"), "person" (e.g. "Abraham", "King David", "Apostle Paul"), "biblicalTitle" (e.g. "Father of Nations", "Royal Psalmist"), "significance" (description of role in this theme), and "keyScripture" (e.g. "Genesis 12:1-3").
6. "scholarlyWorks": An array of EXACTLY 2 to 3 classical or academic literary works researched by biblical scholars (e.g. Josephus, Augustine, Chrysostom, Dead Sea Scrolls, Eusebius, C.S. Lewis, N.T. Wright).
   Each item must have: "title", "author", "era" (e.g. "1st Century AD", "4th Century Patristic Era"), "summary" (brief synopsis of the work), and "relevance" (why it supports this chat theme).
7. "youtubeVideos": An array of EXACTLY 2 to 3 curated educational or scholarly YouTube videos related to the theme (e.g. BibleProject series, Academic lectures, Documentary analyses).
   Each item must have: "title", "channel" (e.g. "The BibleProject", "Yale Divinity Courses"), "searchQuery" (search query string), "url" (valid YouTube search URL like "https://www.youtube.com/results?search_query=..."), "description" (why pilgrims should watch this).
8. "images": An array of 2 curated thematic image descriptions with image URLs that are explicitly directly related to the theme of "${sessionName}".
   Each item must have:
   - "title": A descriptive title tailored directly to the theme "${sessionName}"
   - "caption": A detailed caption explaining how this specific image relates to the chat session's topic
   - "imageUrl": A high-quality Unsplash image URL matching the theme (e.g. "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80").

Return ONLY valid JSON matching this schema.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    if (text) {
      const parsed = JSON.parse(text);
      
      // Ensure images are strictly paired with guaranteed working, verified thematic artwork URLs
      const imagesWithFallback = Array.isArray(parsed.images) && parsed.images.length > 0
        ? parsed.images.map((img: any, idx: number) => {
            const themeImg = themeSpecificImages[idx % themeSpecificImages.length];
            return {
              title: (img.title && img.title.length > 3) ? img.title : themeImg.title,
              caption: (img.caption && img.caption.length > 10) ? img.caption : themeImg.caption,
              imageUrl: themeImg.imageUrl // Guarantees crisp, verified Unsplash image related to the theme
            };
          })
        : themeSpecificImages;

      return {
        ...fallbackData,
        ...parsed,
        familyTree: Array.isArray(parsed.familyTree) && parsed.familyTree.length > 0 ? parsed.familyTree : fallbackData.familyTree,
        scholarlyWorks: Array.isArray(parsed.scholarlyWorks) && parsed.scholarlyWorks.length > 0 ? parsed.scholarlyWorks : fallbackData.scholarlyWorks,
        youtubeVideos: Array.isArray(parsed.youtubeVideos) && parsed.youtubeVideos.length > 0 ? parsed.youtubeVideos : fallbackData.youtubeVideos,
        images: imagesWithFallback,
      };
    }
  } catch (err) {
    console.warn("Failed to generate literary work from Gemini, using fallback data:", err);
  }

  return fallbackData;
}

