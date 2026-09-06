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

      // Try primary model, fallback if needed
      const candidateModels = ["gemini-3-flash-preview", "gemini-3.6-flash"];
      let responseText = "";
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          const chat = ai.chats.create({
            model,
            config: {
              systemInstruction,
            },
            history: formattedHistory,
          });

          const result = await chat.sendMessage({
            message,
          });

          responseText = result.text || "";
          if (responseText) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Chat model ${model} failed, trying fallback:`, err?.message || err);
        }
      }

      if (!responseText) {
        if (lastError) throw lastError;
        responseText = "The Sanctuary Scholar has pondered your inquiry. May grace and peace be multiplied to you in all things (2 Peter 1:2).";
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

      const candidateModels = ["gemini-3-flash-preview", "gemini-3.6-flash"];
      let data: any = null;
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
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
          });

          const text = response.text;
          if (text) {
            data = JSON.parse(text.trim());
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Exegesis model ${model} failed, trying fallback:`, err?.message || err);
        }
      }

      if (!data) {
        throw lastError || new Error("Failed to generate exegesis from AI");
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
      return res.status(500).json({
        error: "Exegesis error",
        message: error?.message || "Failed to analyze scripture exegesis",
      });
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      });

      const text = response.text;
      const results = text ? JSON.parse(text.trim()) : [];
      return res.json(results);
    } catch (error: any) {
      console.error("Search Scripture API Error:", error);
      return res.status(500).json({ error: "Failed to search scriptures", results: [] });
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return res.json({ definition: (response.text || "").trim() });
    } catch (error: any) {
      console.error("Define Word API Error:", error);
      return res.status(500).json({ error: "Failed to define word" });
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      if (text) {
        return res.json(JSON.parse(text.trim()));
      }
      return res.status(500).json({ error: "Empty response from Gemini" });
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
