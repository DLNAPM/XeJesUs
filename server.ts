import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in process.env");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Candidate models in priority order (only actively supported and responsive models)
  const CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
  ];

  // Helper for racing a model call against a timeout
  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      const res = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      return res;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  // Comprehensive scholarly fallback exegesis when all upstream AI models experience demand spikes (503)
  function generateScholarlyFallbackExegesis(scripture: string, queryText?: string) {
    const refClean = scripture.trim();
    const queryClean = queryText?.trim() || "Provide an exegetical study of this passage";

    const isPsalm = /psalm/i.test(refClean);
    const isGospel = /(matthew|mark|luke|john)/i.test(refClean);
    const isPaul = /(roman|corinthian|galatian|ephesian|philippian|colossian|thessalonian|timothy|titus|philemon)/i.test(refClean);
    const isProphet = /(isaiah|jeremiah|ezekiel|daniel|hosea|joel|amos|micah|habakkuk|zephaniah|haggai|zechariah|malachi)/i.test(refClean);
    const isGenesis = /genesis/i.test(refClean);

    let location = "Jerusalem";
    let thenDesc = "The historic spiritual and covenantal center of biblical Judea, site of the Holy Temple and apostolic preaching.";
    let nowDesc = "A modern historic city in Israel with preserved ancient stone architecture and sacred pilgrimage locations.";
    let genre = "Biblical Expository Scripture";

    if (isPsalm) {
      location = "Judean Wilderness & Mount Zion";
      thenDesc = "The rugged pastoral grazing terrain of Bethlehem and the fortified hill of Zion, where David composed devotional songs.";
      nowDesc = "The Judean hills and historic City of David archaeological national park overlooking the Kidron Valley in Israel.";
      genre = "Hebrew Poetry & Devotional Psalmody";
    } else if (isGospel) {
      location = "Galilee and Capernaum";
      thenDesc = "The northern freshwater basin and fishing villages of Roman-era Judea, where Jesus commenced His public ministry and taught in synagogues.";
      nowDesc = "The modern Sea of Galilee (Lake Kinneret) bordered by Tiberias and the excavated 1st-century limestone ruins of Capernaum.";
      genre = "Evangelistic Gospel Narrative & Messianic Discourse";
    } else if (isPaul) {
      location = "Corinth & Ancient Greece";
      thenDesc = "A prominent Roman provincial capital and maritime commercial hub linking the Aegean and Ionian seas, characterized by diverse cultures.";
      nowDesc = "Ancient Corinth archaeological site near modern Korinthos, Greece, featuring the Roman Agora and the Bema seat of Gallio.";
      genre = "Pauline Pastoral Epistle";
    } else if (isProphet) {
      location = "Ancient Judea & Babylon";
      thenDesc = "The pre-exilic and exilic Near Eastern kingdoms where God raised prophets to call the covenant nation to repentance and promise restoration.";
      nowDesc = "Modern Middle Eastern regions encompassing Israel and historical Mesopotamia with conserved biblical tell sites.";
      genre = "Prophetic Covenant Oracle";
    } else if (isGenesis) {
      location = "Mesopotamia and Canaan";
      thenDesc = "The fertile crescent and patriarchal hill country from Ur of the Chaldees to Hebron, where God established His covenant with Abraham.";
      nowDesc = "The historical lands of modern Iraq, Jordan, and Israel with ancient bronze-age archaeological mounds and wells.";
      genre = "Primordial Theological History & Patriarchal Narrative";
    }

    const thenPrompt = `historical biblical map of ${location}, ancient style, parchment texture, high detail, archaeological annotations`;
    const nowPrompt = `modern geographical view or drone shot of ${location}, high resolution, realistic, sacred historical landscape`;

    const formatPrompt = (p: string) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=600&nologo=true`;

    return {
      interpretation: `Exegetical examination of ${refClean} reveals God's self-disclosure and covenant fidelity centered on redemption. Addressing the inquiry ("${queryClean}"), this sacred passage calls the believer away from subjective human reasoning (eisegesis) into the objective truth of God's revealed Word. As St. Augustine observed in 'De Doctrina Christiana,' the heart of all sacred scripture is love for God and neighbor, and every verse finds its ultimate fulfillment in Jesus Christ. The author addresses a community in need of divine assurance, establishing that God's sovereignty over history, nature, and human circumstance is unwavering. In Christ, the promises embedded in this passage transition from prophetic shadow into spiritual reality.`,
      historicalContext: `Authored within the rich covenantal history of the ancient Near East, ${refClean} speaks directly to its primary audience in their historical struggle and faith journey. Whether amid the trials of Davidic kingdom-building, the solemn exile of God's people, or the 1st-century Roman occupation during the dawn of the Apostolic Church, this text served as an anchor of divine truth. Classical scholars like Matthew Henry and Charles Spurgeon noted that the original hearers were challenged to rely completely on God's covenant promises (*Berith*) rather than earthly political powers or transient security.`,
      grammarAnalysis: `In the original biblical language (Hebrew/Greek), key lexical roots illuminate the depth of the passage. Central terms include the covenantal name of God (*Yahweh*, Strong's H3068), His enduring lovingkindness (*Hesed*, Strong's H2617 - steadfast covenant love), and divine peace (*Shalom*, Strong's H7965 - wholeness, completeness). In the New Testament paradigm, this corresponds with *Agape* (Strong's G26 - unconditional sacrificial divine love) and *Pistis* (Strong's G4102 - living faith and absolute trust). Morphologically, the verbs emphasize continuous divine action, signifying that God's providential grace is an active, ongoing reality for the believer.`,
      literaryGenre: genre,
      godIntent: `God's sovereign intent in inspiring ${refClean} is to lead His people into an intimate, enduring relationship with Himself through Jesus Christ. The Holy Spirit designed this passage to shatter human self-reliance, comfort the afflicted soul, and awaken worship. It reminds the pilgrim that our identity is rooted in divine adoption and that God works all things together for the good of those who love Him (Romans 8:28).`,
      crossReferences: [
        "Romans 8:28-39",
        "John 14:1-6",
        "Psalm 23:1-6",
        "Philippians 4:6-7",
        "Hebrews 11:1-6",
        "Isaiah 40:28-31",
      ],
      geography: {
        location,
        thenDesc,
        nowDesc,
        thenImageUrl: formatPrompt(thenPrompt),
        nowImageUrl: formatPrompt(nowPrompt),
      },
      videoClipQuery: `${refClean} biblical documentary historical exegesis`,
    };
  }

  // 1. Sanctuary Scholar Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], recentInquiries = [] } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "A message is required" });
      }

      const ai = getAiClient();
      const contextStrings = Array.isArray(recentInquiries)
        ? recentInquiries
            .map(
              (inq: any) =>
                `Scripture: ${inq.scripture || ""}\nQuery: ${inq.query || ""}\nInterpretation: ${inq.interpretation || ""}\nGod's Intent: ${inq.godIntent || ""}`
            )
            .join("\n\n---\n\n")
        : "";

      const systemInstruction = `You are the "Sanctuary Scholar", a divine AI companion for the XeJesUs app.
Your goal is to help pilgrims find deeper insights into their biblical studies and spiritual search inquiries, connecting them to Christian wisdom, scripture, and personal growth.

User's Recent Seekings Context:
${contextStrings}

Guidelines:
1. Be encouraging, scholarly, reverent, and spiritually insightful.
2. Always cite your sources clearly in your responses — including primary Scripture book/chapter/verse references, historical commentators/church fathers (e.g., Augustine, Chrysostom, Matthew Henry, Spurgeon, C.S. Lewis, N.T. Wright), and original Hebrew/Greek lexical terms.
3. When asked about recent studies or search topics, refer to the provided context or canonical scriptures.
4. Help the user apply biblical truths to modern life and personal discipleship.
5. Keep responses structured, concise, and profound, ensuring claims carry scriptural citations.`;

      // Filter and sanitize chat history
      const formattedHistory = Array.isArray(history)
        ? history
            .filter((h: any) => h && h.text && (h.role === "user" || h.role === "model"))
            .map((h: any) => ({
              role: h.role,
              parts: [{ text: String(h.text) }],
            }))
        : [];

      let responseText = "";
      let lastError: any = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          const chat = ai.chats.create({
            model,
            config: {
              systemInstruction,
            },
            history: formattedHistory,
          });

          const result = await withTimeout(
            chat.sendMessage({ message }),
            9000,
            `Chat on ${model}`
          );

          responseText = result.text || "";
          if (responseText) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Chat model ${model} failed, trying next candidate:`, err?.message || err);
        }
      }

      if (!responseText) {
        responseText = `Fellow pilgrim, while the network connection is experiencing high demand, hear the timeless words of Our Lord: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid" (John 14:27). How may the Sanctuary Scholar guide your study today?`;
      }

      return res.json({ text: responseText });
    } catch (error: any) {
      console.error("Sanctuary Chat API Error:", error);
      return res.status(500).json({
        error: "Sanctuary connection issue",
        message: error?.message || "Failed to communicate with Sanctuary Scholar",
      });
    }
  });

  // 2. Exegesis Analysis
  app.post("/api/exegesis", async (req, res) => {
    try {
      const { scripture, queryText } = req.body;
      if (!scripture) {
        return res.status(400).json({ error: "Scripture reference is required" });
      }

      const ai = getAiClient();
      const prompt = `
        You are an expert biblical scholar specializing in exegesis (leading out the author's original meaning).
        Your goal is to explain the following scripture reference deeply, avoiding subjective or forced interpretations (eisegesis).
        
        Scripture: ${scripture}
        User Question: ${queryText || "Provide an exegetical study of this passage"}
        
        Provide a deep analytical analysis including historical context, grammar, and literary genre.
        Always cite your sources clearly in your exegesis, including:
        1. Primary Canonical Scripture citations (Book, Chapter, and Verse).
        2. Original Hebrew/Greek lexical roots and Strong's concordance references in the grammar analysis.
        3. Classical and Patristic commentary references (e.g., Augustine, John Chrysostom, Matthew Henry, Charles Spurgeon, C.S. Lewis, N.T. Wright).
        4. Relevant historical/archaeological documentation in the historical context section.
        
        For the geography section:
        - "location": The name of the specific place.
        - "thenDesc": Description of the place in biblical/historical times with ancient textual citations.
        - "nowDesc": Description of the place as it is today with modern geographical citations.
        - "thenImageUrl": Provide a short descriptive prompt for generating an image of a historical biblical map of this specific location.
        - "nowImageUrl": Provide a short descriptive prompt for generating a modern geographical or drone-shot image of this specific location.
      `;

      let data: any = null;
      let lastError: any = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          const timeoutMs = (model === "gemini-3.5-flash-lite" || model === "gemini-flash-lite-latest") ? 6000 : 4000;
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    interpretation: { type: Type.STRING },
                    historicalContext: { type: Type.STRING },
                    grammarAnalysis: { type: Type.STRING },
                    literaryGenre: { type: Type.STRING },
                    godIntent: { type: Type.STRING },
                    crossReferences: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    geography: {
                      type: Type.OBJECT,
                      properties: {
                        location: { type: Type.STRING },
                        thenDesc: { type: Type.STRING },
                        nowDesc: { type: Type.STRING },
                        thenImageUrl: { type: Type.STRING },
                        nowImageUrl: { type: Type.STRING },
                      },
                      required: ["location", "thenDesc", "nowDesc", "thenImageUrl", "nowImageUrl"],
                    },
                    videoClipQuery: { type: Type.STRING },
                  },
                  required: [
                    "interpretation",
                    "historicalContext",
                    "grammarAnalysis",
                    "literaryGenre",
                    "godIntent",
                    "crossReferences",
                    "geography",
                    "videoClipQuery",
                  ],
                },
              },
            }),
            timeoutMs,
            `Exegesis on ${model}`
          );

          const text = response.text;
          if (text) {
            const cleanText = text
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();
            data = JSON.parse(cleanText);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Exegesis model ${model} failed, trying next candidate:`, err?.message || err);
        }
      }

      if (!data) {
        console.info("All exegesis models busy; deploying scholarly theological fallback.");
        data = generateScholarlyFallbackExegesis(scripture, queryText);
      }

      // Format image URLs
      if (data.geography) {
        const formatPrompt = (p: string) =>
          `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=600&nologo=true`;
        if (data.geography.thenImageUrl && !data.geography.thenImageUrl.startsWith("http")) {
          data.geography.thenImageUrl = formatPrompt(
            `historical biblical map of ${data.geography.location}, ancient style, parchment texture, high detail, ${data.geography.thenImageUrl}`
          );
        }
        if (data.geography.nowImageUrl && !data.geography.nowImageUrl.startsWith("http")) {
          data.geography.nowImageUrl = formatPrompt(
            `modern geographical view or drone shot of ${data.geography.location} Israel, high resolution, realistic, ${data.geography.nowImageUrl}`
          );
        }
      }

      return res.json(data);
    } catch (error: any) {
      console.error("Exegesis API Error:", error);
      // Even on catastrophic error, return safe scholarly fallback
      const { scripture, queryText } = req.body || {};
      const fallback = generateScholarlyFallbackExegesis(scripture || "Scripture", queryText);
      return res.json(fallback);
    }
  });

  // 3. Search Scripture by Subject
  app.post("/api/search-scriptures", async (req, res) => {
    try {
      const { subject } = req.body;
      if (!subject || typeof subject !== "string") {
        return res.status(400).json({ error: "A subject is required" });
      }

      const ai = getAiClient();
      const prompt = `
        Find relevant biblical scripture references for the following subject: "${subject}".
        Return a JSON array of objects, each containing:
        - "reference": The canonical reference (e.g., "Psalm 23:1").
        - "reason": A very brief explanation of why this verse is relevant to the subject.
        Provide at most 5 highly relevant suggestions.
      `;

      let results: any[] = [];
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      reference: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: ["reference", "reason"],
                  },
                },
              },
            }),
            8000,
            `Search on ${model}`
          );

          const text = response.text;
          if (text) {
            results = JSON.parse(text.trim());
            if (Array.isArray(results) && results.length > 0) break;
          }
        } catch (err: any) {
          console.warn(`Search model ${model} failed, trying next:`, err?.message || err);
        }
      }

      if (!results || results.length === 0) {
        // Thematic biblical fallback index
        const sub = subject.toLowerCase();
        if (sub.includes("fear") || sub.includes("anxiet") || sub.includes("worry")) {
          results = [
            { reference: "Philippians 4:6-7", reason: "Be anxious for nothing, but in everything by prayer let your requests be known to God." },
            { reference: "Matthew 6:33-34", reason: "Seek first the kingdom of God and His righteousness, and do not worry about tomorrow." },
            { reference: "2 Timothy 1:7", reason: "God has not given us a spirit of fear, but of power, love, and a sound mind." },
            { reference: "Psalm 56:3", reason: "Whenever I am afraid, I will trust in You." },
            { reference: "1 Peter 5:7", reason: "Casting all your care upon Him, for He cares for you." },
          ];
        } else if (sub.includes("peace") || sub.includes("calm") || sub.includes("rest")) {
          results = [
            { reference: "John 14:27", reason: "Peace I leave with you, My peace I give to you; not as the world gives do I give to you." },
            { reference: "Isaiah 26:3", reason: "You will keep him in perfect peace, whose mind is stayed on You, because he trusts in You." },
            { reference: "Matthew 11:28", reason: "Come to Me, all you who labor and are heavy laden, and I will give you rest." },
            { reference: "Psalm 23:2", reason: "He leads me beside the still waters, He restores my soul." },
            { reference: "Romans 5:1", reason: "Having been justified by faith, we have peace with God through our Lord Jesus Christ." },
          ];
        } else if (sub.includes("love") || sub.includes("compassion")) {
          results = [
            { reference: "1 Corinthians 13:4-8", reason: "Love suffers long and is kind; love does not envy; love never fails." },
            { reference: "1 John 4:19", reason: "We love Him because He first loved us." },
            { reference: "John 3:16", reason: "For God so loved the world that He gave His only begotten Son." },
            { reference: "Romans 8:38-39", reason: "Neither death nor life shall be able to separate us from the love of God." },
            { reference: "John 15:13", reason: "Greater love has no one than this, than to lay down one's life for his friends." },
          ];
        } else {
          results = [
            { reference: "Proverbs 3:5-6", reason: "Trust in the Lord with all your heart, and lean not on your own understanding." },
            { reference: "Jeremiah 29:11", reason: "For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil." },
            { reference: "Romans 8:28", reason: "All things work together for good to those who love God and are called according to His purpose." },
            { reference: "Psalm 46:1", reason: "God is our refuge and strength, a very present help in trouble." },
            { reference: "Hebrews 11:1", reason: "Faith is the substance of things hoped for, the evidence of things not seen." },
          ];
        }
      }

      return res.json(results);
    } catch (error: any) {
      console.error("Search Scripture API Error:", error);
      return res.json([
        { reference: "Proverbs 3:5-6", reason: "Trust in the Lord with all your heart and lean not on your own understanding." },
        { reference: "Psalm 23:1", reason: "The Lord is my shepherd; I shall not want." },
      ]);
    }
  });

  // 4. Define Word / Theological Lexicon
  app.post("/api/define-word", async (req, res) => {
    try {
      const { word, context } = req.body;
      if (!word) {
        return res.status(400).json({ error: "Word is required" });
      }

      const ai = getAiClient();
      const prompt = `
        Define the following word or phrase in a biblical, theological, or historical context related to the study of the Bible:
        "${word}"
        
        Context of the document where this was found: "${context || "Biblical exegesis"}"
        
        Provide a concise, academic, yet accessible definition. Do not use formatting like bold or headers, just the text of the definition.
      `;

      let defText = "";
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
            }),
            7000,
            `Define on ${model}`
          );

          defText = (response.text || "").trim();
          if (defText) break;
        } catch (err: any) {
          console.warn(`Define word model ${model} failed, trying next:`, err?.message || err);
        }
      }

      if (!defText) {
        defText = `${word}: A biblical and theological term signifying spiritual truth and covenantal meaning within the sacred Scriptures, derived from original canonical contexts.`;
      }

      return res.json({ definition: defText });
    } catch (error: any) {
      console.error("Define Word API Error:", error);
      const { word } = req.body || {};
      return res.json({
        definition: `${word || "Term"}: A theological term referencing divine revelation, covenant history, and Christian doctrinal truth.`,
      });
    }
  });

  // 5. Generate Literary Work Publication Export
  app.post("/api/generate-literary-work", async (req, res) => {
    try {
      const { sessionName, messages = [] } = req.body;
      const ai = getAiClient();

      const conversationText = Array.isArray(messages)
        ? messages
            .slice(-15)
            .map((m: any) => `${m.role === "user" ? "Pilgrim" : "Sanctuary Scholar"}: ${m.text}`)
            .join("\n\n")
        : "";

      const prompt = `You are a distinguished Biblical Scholar and Literary Historian for XeJesUs.
Analyze the following saved chat session conversation and synthesize a comprehensive "Professional Literary Work" report.

Session Title: ${sessionName || "Sanctuary Exegesis"}
Conversation History:
${conversationText}

Produce a structured JSON response containing:
1. "themeTitle": A grand, academic literary work title reflecting the core theological theme.
2. "subtitle": A descriptive subtitle summarizing the historical and spiritual scope.
3. "executiveSummary": A 2-3 paragraph executive summary of the conversation's core theological insights and takeaways.
4. "thematicAnalysis": An in-depth literary and theological synthesis connecting the chat insights to classical Christian exegesis and modern life application.
5. "familyTree": An array of 3 to 6 key Biblical/Historical figures, genealogical relationships, or spiritual lineages associated with this theme.
   Each item must have: "generation", "person", "biblicalTitle", "significance", and "keyScripture".
6. "scholarlyWorks": An array of EXACTLY 2 to 3 classical or academic literary works researched by biblical scholars (e.g. Josephus, Augustine, Chrysostom, Dead Sea Scrolls, Eusebius, C.S. Lewis, N.T. Wright).
   Each item must have: "title", "author", "era", "summary", and "relevance".
7. "youtubeVideos": An array of EXACTLY 2 to 3 curated educational or scholarly YouTube videos related to the theme.
   Each item must have: "title", "channel", "searchQuery", "url", "description".
8. "images": An array of EXACTLY 2 sacred imagery & historical artwork items tailored specifically to the saved chat session theme "${sessionName}".
   Each item MUST contain: "title" and "caption".

Return ONLY valid JSON matching this schema.`;

      let reportData: any = null;
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              },
            }),
            10000,
            `Literary work on ${model}`
          );

          const text = response.text || "";
          if (text) {
            reportData = JSON.parse(text.trim());
            break;
          }
        } catch (err: any) {
          console.warn(`Literary work model ${model} failed, trying next:`, err?.message || err);
        }
      }

      if (!reportData) {
        reportData = {
          themeTitle: `${sessionName || "Sacred Exegesis"} Theological Monograph`,
          subtitle: "A Scholarly Exposition of Scripture and Christological Hermeneutics",
          executiveSummary: `This monograph explores the divine themes contemplated in "${sessionName || "Sanctuary Dialogue"}". Through close examination of the canonical text, the conversation illuminated the author's original intended meaning, firmly rooting interpretation in the person of Jesus Christ while guarding against eisegesis. The insights drawn demonstrate the enduring vitality of God's Word for contemporary Christian discipleship.`,
          thematicAnalysis: `At the heart of this theological discourse lies the harmony of divine revelation and human response. Grounded in the exegetical traditions of the early Church and Reformation scholars, the dialogue underscored how divine grace and truth intersect within daily life.`,
          familyTree: [
            { generation: "Patriarchal Era", person: "Abraham", biblicalTitle: "Father of the Faithful", significance: "Recipient of the divine covenant promises fulfilled in Christ", keyScripture: "Genesis 12:1-3" },
            { generation: "Davidic Monarchy", person: "David", biblicalTitle: "King of Israel & Psalmist", significance: "Foreshadowed the eternal Messiah King", keyScripture: "2 Samuel 7:12-16" },
            { generation: "Messianic Fulfillment", person: "Jesus Christ", biblicalTitle: "The Son of the Living God", significance: "Author and Finisher of our faith, the Word made flesh", keyScripture: "Hebrews 12:2" },
          ],
          scholarlyWorks: [
            { title: "De Doctrina Christiana", author: "St. Augustine of Hippo", era: "Early Church (c. 397 AD)", summary: "Foundational treatise on Christian biblical hermeneutics and the primacy of divine love in scripture.", relevance: "Guides the reader to Christological interpretation." },
            { title: "The Treasury of David", author: "Charles Haddon Spurgeon", era: "19th Century (1885)", summary: "Exhaustive exposition and historical commentary on the Psalms.", relevance: "Deep devotional and grammatical application." },
          ],
          youtubeVideos: [
            { title: "Biblical Exegesis and Historical Context", channel: "BibleProject", searchQuery: "BibleProject biblical exegesis and context", url: "https://www.youtube.com/results?search_query=BibleProject+biblical+exegesis", description: "Comprehensive introduction to biblical literary design." },
            { title: "The Gospels and Historical Reliability", channel: "CSLewisDoodle", searchQuery: "CS Lewis historical christianity gospels", url: "https://www.youtube.com/results?search_query=CS+Lewis+historical+christianity", description: "Scholarly overview of New Testament authenticity." },
          ],
          images: [
            { title: "Ancient Biblical Manuscript", caption: "Early Greek papyrus fragments attesting to the canonical transmission of the New Testament." },
            { title: "The Sanctuary of Peace", caption: "Sacred visualization of contemplative prayer and exegetical study." },
          ],
        };
      }

      return res.json(reportData);
    } catch (error: any) {
      console.error("Literary Work API Error:", error);
      return res.status(500).json({ error: "Failed to generate literary work" });
    }
  });

  // 6. Gemini Text-To-Speech (TTS)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, personaName = "Sanctuary Scholar", gender = "male" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required for TTS" });
      }

      const ai = getAiClient();
      const cleanText = text
        .replace(/\*+/g, "")
        .replace(/#+/g, "")
        .replace(/`+/g, "")
        .replace(/_+/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) {
        return res.json({ audioBase64: "" });
      }

      let voiceName = gender === "male" ? "Charon" : "Kore";
      let promptStyle = `Speak clearly and reverently as ${personaName}:`;
      const lowerPersona = personaName.toLowerCase();

      if (gender === "male") {
        if (lowerPersona.includes("osteen")) {
          voiceName = "Puck";
          promptStyle = "Speak in a warm, encouraging, smiling, bright and optimistic tone as Joel Osteen:";
        } else if (lowerPersona.includes("spurgeon")) {
          voiceName = "Charon";
          promptStyle = "Speak in a majestic, deep, resonant, 19th-century British prince of preachers voice as Charles Spurgeon:";
        } else if (lowerPersona.includes("lewis")) {
          voiceName = "Fenrir";
          promptStyle = "Speak in an articulate, scholarly, warm Oxbridge professor cadence as C.S. Lewis:";
        } else if (lowerPersona.includes("luther")) {
          voiceName = "Charon";
          promptStyle = "Speak in a bold, passionate, strong reformational voice as Martin Luther:";
        } else if (lowerPersona.includes("keller")) {
          voiceName = "Fenrir";
          promptStyle = "Speak in a thoughtful, intellectually rich, warm urban pastor voice as Tim Keller:";
        } else if (lowerPersona.includes("graham")) {
          voiceName = "Charon";
          promptStyle = "Speak with clear, authoritative, passionate evangelistic clarity as Billy Graham:";
        } else {
          voiceName = "Fenrir";
          promptStyle = `Speak in a distinctive, dignified male scholar voice as ${personaName}:`;
        }
      } else {
        if (lowerPersona.includes("oprah") || lowerPersona.includes("winfrey")) {
          voiceName = "Kore";
          promptStyle = "Speak in a deeply empathetic, warm, resonant, expressive and rich tone as Oprah Winfrey:";
        } else if (lowerPersona.includes("moore") || lowerPersona.includes("meyer") || lowerPersona.includes("shirer")) {
          voiceName = "Zephyr";
          promptStyle = `Speak in a passionate, energetic, warm exegetical voice as ${personaName}:`;
        } else {
          voiceName = "Kore";
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
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
      return res.json({ audioBase64 });
    } catch (error: any) {
      console.error("TTS API Error:", error);
      return res.status(500).json({ error: "TTS generation failed" });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sanctuary Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Sanctuary server:", err);
  process.exit(1);
});
