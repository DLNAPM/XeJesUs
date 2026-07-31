import { GoogleGenAI, Modality } from "@google/genai";
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

export async function generateScholarTTS(
  text: string,
  personaName: string,
  gender: 'male' | 'female'
): Promise<string> {
  const ai = getAi();
  
  // Clean text from markdown formatting (*, #, _, `, etc.)
  const cleanText = text
    .replace(/\*+/g, '')
    .replace(/#+/g, '')
    .replace(/`+/g, '')
    .replace(/_+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return "";

  // Select prebuilt voice and prompt style according to persona
  let voiceName = gender === 'male' ? 'Charon' : 'Kore';
  let promptStyle = `Speak clearly and reverently as ${personaName}:`;

  const lowerPersona = personaName.toLowerCase();

  if (gender === 'male') {
    if (lowerPersona.includes('osteen')) {
      voiceName = 'Puck';
      promptStyle = 'Speak in a warm, encouraging, smiling, bright and optimistic tone as Joel Osteen:';
    } else if (lowerPersona.includes('spurgeon')) {
      voiceName = 'Charon';
      promptStyle = 'Speak in a majestic, deep, resonant, 19th-century British prince of preachers voice as Charles Spurgeon:';
    } else if (lowerPersona.includes('lewis')) {
      voiceName = 'Fenrir';
      promptStyle = 'Speak in an articulate, scholarly, warm Oxbridge professor cadence as C.S. Lewis:';
    } else if (lowerPersona.includes('luther')) {
      voiceName = 'Charon';
      promptStyle = 'Speak in a bold, passionate, strong reformational voice as Martin Luther:';
    } else if (lowerPersona.includes('keller')) {
      voiceName = 'Fenrir';
      promptStyle = 'Speak in a thoughtful, intellectually rich, warm urban pastor voice as Tim Keller:';
    } else if (lowerPersona.includes('graham')) {
      voiceName = 'Charon';
      promptStyle = 'Speak with clear, authoritative, passionate evangelistic clarity as Billy Graham:';
    } else {
      voiceName = 'Fenrir';
      promptStyle = `Speak in a distinctive, dignified male scholar voice as ${personaName}:`;
    }
  } else {
    if (lowerPersona.includes('oprah') || lowerPersona.includes('winfrey')) {
      voiceName = 'Kore';
      promptStyle = 'Speak in a deeply empathetic, warm, resonant, expressive and rich tone as Oprah Winfrey:';
    } else if (lowerPersona.includes('moore')) {
      voiceName = 'Zephyr';
      promptStyle = 'Speak in a passionate, energetic, warm exegetical Bible teacher voice as Beth Moore:';
    } else if (lowerPersona.includes('meyer')) {
      voiceName = 'Zephyr';
      promptStyle = 'Speak in a direct, practical, confident, uplifting and energetic voice as Joyce Meyer:';
    } else if (lowerPersona.includes('shirer')) {
      voiceName = 'Zephyr';
      promptStyle = 'Speak in a faith-filled, bold, inspiring, dynamic voice as Priscilla Shirer:';
    } else if (lowerPersona.includes('arthur')) {
      voiceName = 'Kore';
      promptStyle = 'Speak in a reverent, methodical, gracious and inductive scholar voice as Kay Arthur:';
    } else if (lowerPersona.includes('ten boom') || lowerPersona.includes('corrie')) {
      voiceName = 'Kore';
      promptStyle = 'Speak with gentle wisdom, courageous peace, and serene grace as Corrie ten Boom:';
    } else {
      voiceName = 'Kore';
      promptStyle = `Speak in a distinctive, graceful female scholar voice as ${personaName}:`;
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `${promptStyle}\n\n"${cleanText}"` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini TTS");
  }

  return base64Audio;
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
  
  // 0. Judah, Joseph, Lion of Judah, Patriarchs, Genesis, Jacob, Egypt, Benjamin, Reconciliation, Brother
  if (text.includes("judah") || text.includes("joseph") || text.includes("lion") || text.includes("patriarch") || text.includes("genesis") || text.includes("jacob") || text.includes("benjamin") || text.includes("pharaoh") || text.includes("reconciliation") || text.includes("intercession") || text.includes("plea")) {
    return [
      {
        title: "Judah's Plea & Joseph's Reconciliation in Egypt",
        caption: `Sacred portrayal of Judah's sacrificial intercession before Joseph, embodying brotherly devotion, messianic lineage, and royal mercy in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Scepter of Judah & Patriarchal Covenant",
        caption: `Ancient illuminated manuscript depicting Jacob's blessing over the tribe of Judah and the promise of the royal scepter in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 1. Holy Communion, Last Supper, Eucharist, Bread and Wine, Covenant Table
  if (text.includes("communion") || text.includes("last supper") || text.includes("eucharist") || text.includes("bread") || text.includes("wine") || text.includes("chalice") || text.includes("body and blood") || text.includes("passover") || text.includes("table of the lord") || text.includes("covenant meal")) {
    return [
      {
        title: "The Covenant Table & Golden Wheat Harvest",
        caption: `Golden sheaves of grain representing the bread of life broken for humanity, reflecting the sacred communion theme of "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Illuminated Manuscripts of the New Covenant",
        caption: `Ancient sacred scriptures opened to the institution of the Lord's Supper, illuminating the theological depth of ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 2. Baptism, Holy Waters, Jordan River, Regeneration, Cleansing
  if (text.includes("baptis") || text.includes("jordan river") || text.includes("living water") || text.includes("cleansing") || text.includes("washing") || text.includes("fountain")) {
    return [
      {
        title: "Sacred Waters of the Jordan River",
        caption: `Serene flowing waters of the Jordan, commemorating the baptism of Jesus and the sacrament of spiritual rebirth in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Living Water & Divine Grace",
        caption: `Cascading crystal waters testifying to the washing of regeneration and eternal life promised in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 3. Beatitudes, Sermon on the Mount, Galilee Shoreline, Kingdom
  if (text.includes("beatitude") || text.includes("sermon on the mount") || text.includes("blessed are") || text.includes("salt and light") || text.includes("blessing")) {
    return [
      {
        title: "The Mount of Beatitudes & Galilean Shore",
        caption: `Lush hills overlooking the Sea of Galilee where Jesus delivered the Sermon on the Mount, central to "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Light of the World & Divine Wisdom",
        caption: `Morning sunbeams reflecting off Galilean waters, symbolizing the moral and spiritual kingdom teachings in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 4. Moses, Exodus, Law, Sinai, Tabernacle, Torah, Decalogue
  if (text.includes("moses") || text.includes("exodus") || text.includes("commandment") || text.includes("sinai") || text.includes("red sea") || text.includes("egypt") || text.includes("tabernacle") || text.includes("torah") || text.includes("ark of the covenant") || text.includes("wilderness")) {
    return [
      {
        title: "Wilderness of Sinai & Covenant Mountain",
        caption: `The rugged limestone peaks of Mount Sinai, where Moses received the Ten Commandments, supporting the study of "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Sacred Manuscripts of the Law",
        caption: `Illuminated ancient parchment scrolls containing the books of the Torah and Mosaic statutes in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 5. Paul, Epistles, Missionary Journeys, Romans, Corinthians, Galatians, Ephesians, Philippians, Colossians, Timothy
  if (text.includes("paul") || text.includes("epistle") || text.includes("roman") || text.includes("corinthian") || text.includes("galatian") || text.includes("ephesian") || text.includes("philippian") || text.includes("colossian") || text.includes("thessalonian") || text.includes("timothy") || text.includes("titus") || text.includes("missionary") || text.includes("damascus") || text.includes("apostle")) {
    return [
      {
        title: "Roman Roads & Missionary Journeys of Saint Paul",
        caption: `Ancient Roman stone highways and Mediterranean sea routes traversed by Saint Paul during his apostolic letters in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Apostolic Codex & Early Church Epistles",
        caption: `Classical papyrus epistolary scroll symbolizing the Pauline letters sent to early Christian assemblies in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 6. David, Psalms, Worship, Music, Harp, Solomon, Zion, Praise
  if (text.includes("david") || text.includes("psalm") || text.includes("harp") || text.includes("worship") || text.includes("sing") || text.includes("solomon") || text.includes("samuel") || text.includes("zion") || text.includes("praise") || text.includes("music")) {
    return [
      {
        title: "City of David & Historic Zion Citadel",
        caption: `Ancient stone citadel of Jerusalem, heart of the Davidic kingdom and royal psalmists in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Acoustic Praise & Lyrical Psalms",
        caption: `Stringed melodies and songs of devotion reflecting the poetic heart of the Book of Psalms in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 7. Armor of God, Spiritual Warfare, Fortress, Shield, Defense
  if (text.includes("armor of god") || text.includes("spiritual warfare") || text.includes("shield of faith") || text.includes("helmet of salvation") || text.includes("sword of the spirit") || text.includes("fortress") || text.includes("stronghold")) {
    return [
      {
        title: "Ancient Citadel & Shield of Faith",
        caption: `Unshakable stone fortress symbolizing the divine shield of faith and spiritual protection described in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Sword of the Spirit & Divine Truth",
        caption: `Radiant light on scripture parchment representing the sword of the Spirit, which is the word of God in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 8. Parables, Sower, Shepherd, Vineyard, Harvest, Prodigal, Samaritan
  if (text.includes("parable") || text.includes("sower") || text.includes("shepherd") || text.includes("vineyard") || text.includes("harvest") || text.includes("wheat") || text.includes("prodigal") || text.includes("samaritan") || text.includes("mustard") || text.includes("sheep")) {
    return [
      {
        title: "The Good Shepherd & Pastoral Judean Hills",
        caption: `Gentle pastoral landscapes of the Holy Land reflecting Jesus' parables of the Good Shepherd and lost sheep in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Golden Wheat Harvest & Parable Fields",
        caption: `Fertile agricultural fields representing the Sower, the mustard seed, and the Kingdom of Heaven in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 9. Cross, Crucifixion, Atonement, Passion, Grace, Salvation, Resurrection, Tomb
  if (text.includes("cross") || text.includes("passion") || text.includes("calvary") || text.includes("golgotha") || text.includes("crucifixion") || text.includes("atonement") || text.includes("grace") || text.includes("salvation") || text.includes("resurrection") || text.includes("tomb") || text.includes("easter")) {
    return [
      {
        title: "Mount Calvary & The Redeeming Cross",
        caption: `Solemn silhouette of the cross at sunset, commemorating the ultimate sacrifice and divine grace in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Empty Tomb & Resurrection Dawn",
        caption: `Radiant morning light breaking into an ancient stone tomb, witnessing Christ's victory over death in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 10. Holy Spirit, Pentecost, Flames, Dove, Renewal, Anointing
  if (text.includes("holy spirit") || text.includes("pentecost") || text.includes("tongues of fire") || text.includes("comforter") || text.includes("anointing") || text.includes("spirit")) {
    return [
      {
        title: "Heavenly Rays & Holy Spirit Presence",
        caption: `Divine beams of light breaking through dark clouds, illustrating the outpouring of the Holy Spirit in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Sanctuary Illumination & Spiritual Renewal",
        caption: `Warm candlelight and divine illumination testifying to spiritual transformation and comfort in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 11. Wisdom, Proverbs, Ecclesiastes, Job, Suffering, Trials, Patience
  if (text.includes("wisdom") || text.includes("proverb") || text.includes("ecclesiastes") || text.includes("job") || text.includes("suffering") || text.includes("trial") || text.includes("patience") || text.includes("understanding")) {
    return [
      {
        title: "Solomonic Wisdom & Illuminated Study",
        caption: `A quiet sanctuary of classical wisdom literature, pondering the fear of the Lord and understanding in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Quiet Reflection & Divine Sovereignty",
        caption: `Ancient olive groves providing peaceful solace for theological reflection on human trials in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 12. Prophets, Prophecy, Isaiah, Jeremiah, Ezekiel, Daniel, Revelation, Patmos
  if (text.includes("prophet") || text.includes("prophecy") || text.includes("isaiah") || text.includes("jeremiah") || text.includes("ezekiel") || text.includes("daniel") || text.includes("revelation") || text.includes("vision") || text.includes("patmos") || text.includes("end times")) {
    return [
      {
        title: "Prophetic Watchtower & Heavenly Vision",
        caption: `Solitary high peaks under dramatic skies, symbolizing the prophetic watchmen announcing messianic hope in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Scrolls of Revelation & Apocalyptic Light",
        caption: `Illuminated ancient codex containing prophetic apocalyptic visions and the New Jerusalem promise in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 13. Creation, Genesis, Adam, Eden, Noah, Ark, Cosmos, Nature
  if (text.includes("creation") || text.includes("genesis") || text.includes("adam") || text.includes("eden") || text.includes("noah") || text.includes("ark") || text.includes("flood") || text.includes("nature") || text.includes("stars") || text.includes("cosmos")) {
    return [
      {
        title: "The Heavens Declare Creation's Glory",
        caption: `The vast celestial expanse and star-filled cosmos celebrating Genesis creation in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Living Waters of Paradise",
        caption: `Pure cascading waters and lush flora symbolizing the pristine Garden of Eden and divine grace in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 14. Prayer, Fasting, Altar, Intercession, Devotion
  if (text.includes("prayer") || text.includes("fasting") || text.includes("sanctuary") || text.includes("altar") || text.includes("intercession") || text.includes("devotion")) {
    return [
      {
        title: "Sanctuary of Intercession & Prayer",
        caption: `Warm candlelight illuminating a quiet house of prayer during heartfelt communion with God in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Beam of Heavenly Light & Grace",
        caption: `Luminous light breaking through dark clouds, representing divine answer to prayer and steadfast faith in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 15. Jesus, Gospels, Disciples, Miracles, Savior, Christ
  if (text.includes("jesus") || text.includes("gospel") || text.includes("christ") || text.includes("galilee") || text.includes("disciples") || text.includes("miracle") || text.includes("savior")) {
    return [
      {
        title: "Sea of Galilee at Sunrise",
        caption: `Serene shoreline of Galilee where Jesus called His disciples and performed divine miracles, central to "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Dawn of the Resurrection",
        caption: `Radiant morning light entering an ancient stone sanctuary, testifying to Christ's gospel victory in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 16. Jerusalem, Temple, Holy Land, Israel, Gethsemane
  if (text.includes("jerusalem") || text.includes("temple") || text.includes("holy land") || text.includes("hebrew") || text.includes("israel") || text.includes("gethsemane")) {
    return [
      {
        title: "Historic Gates of Old Jerusalem",
        caption: `Ancient limestone arches and battlements of Jerusalem, city of prophets and messianic promises in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Venerable Olive Grove of Gethsemane",
        caption: `Ancient olive trees standing in quiet meditation near Jerusalem, rooted in biblical history for ${sessionName}.`,
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
      imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
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
8. "images": An array of EXACTLY 2 sacred imagery & historical artwork items tailored specifically to the saved chat session theme "${sessionName}".
   Each item MUST contain:
   - "title": A descriptive, majestic title for sacred artwork directly reflecting the specific subject matter, passage, or doctrine discussed in this chat session (e.g. "The Covenant Table & Golden Harvest", "Mount Sinai & The Decalogue", "The Sermon on the Mount & Kingdom Blessings", "The Parable of the Good Shepherd").
   - "caption": A detailed 2-sentence explanation connecting this visual artwork directly to the specific scriptures, verses, or theological insights from this saved chat session.

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
      
      // Ensure images are strictly paired with guaranteed working, verified sacred artwork URLs matching each image's title and topic
      const imagesWithFallback = Array.isArray(parsed.images) && parsed.images.length > 0
        ? parsed.images.map((img: any, idx: number) => {
            const imgContext = `${img.title || ''} ${img.caption || ''} ${sessionName} ${conversationText}`;
            const specificThemeImages = getThematicImagesForTopic(sessionName, imgContext);
            const chosenThemeImg = specificThemeImages[idx % specificThemeImages.length] || themeSpecificImages[idx % themeSpecificImages.length];

            return {
              title: (img.title && img.title.length > 3) ? img.title : chosenThemeImg.title,
              caption: (img.caption && img.caption.length > 10) ? img.caption : chosenThemeImg.caption,
              imageUrl: chosenThemeImg.imageUrl // GUARANTEED sacred, reverent, vetted Unsplash artwork URL matching theme
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

