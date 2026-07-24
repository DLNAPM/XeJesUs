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

export async function generateLiteraryWorkExport(
  sessionName: string,
  messages: { role: 'user' | 'model'; text: string }[]
): Promise<LiteraryWorkExport> {
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
    images: [
      {
        title: "Ancient Sacred Scriptures",
        caption: "Illuminated biblical manuscripts and scrolls preserving divine truth across generations.",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Historic Study & Reflection",
        caption: "Quiet sanctuary space dedicated to scholarly research and prayerful meditation.",
        imageUrl: "https://images.unsplash.com/photo-1509021436468-d5103e6071ee?auto=format&fit=crop&w=800&q=80"
      }
    ]
  };

  try {
    const ai = getAi();
    const modelName = "gemini-3-flash-preview";

    const conversationText = messages
      .slice(-15) // take up to last 15 messages for prompt context
      .map(m => `${m.role === 'user' ? 'Pilgrim' : 'Sanctuary Scholar'}: ${m.text}`)
      .join('\n\n');

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
8. "images": An array of 2 curated thematic image descriptions with high quality unsplash image URLs relevant to ancient manuscript, open bible, ancient Jerusalem, starry night desert, ancient parchment, or olive trees.
   Each item must have: "title", "caption", "imageUrl" (use valid unsplash URLs like "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80" or "https://images.unsplash.com/photo-1509021436468-d5103e6071ee?auto=format&fit=crop&w=800&q=80").

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
      return {
        ...fallbackData,
        ...parsed,
        familyTree: Array.isArray(parsed.familyTree) && parsed.familyTree.length > 0 ? parsed.familyTree : fallbackData.familyTree,
        scholarlyWorks: Array.isArray(parsed.scholarlyWorks) && parsed.scholarlyWorks.length > 0 ? parsed.scholarlyWorks : fallbackData.scholarlyWorks,
        youtubeVideos: Array.isArray(parsed.youtubeVideos) && parsed.youtubeVideos.length > 0 ? parsed.youtubeVideos : fallbackData.youtubeVideos,
        images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : fallbackData.images,
      };
    }
  } catch (err) {
    console.warn("Failed to generate literary work from Gemini, using fallback data:", err);
  }

  return fallbackData;
}

