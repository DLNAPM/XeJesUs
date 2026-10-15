import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini instance on the server
function getAi(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to execute generation with automatic multi-tier resilience fallback
async function generateWithFallback(options: {
  contents: any;
  config?: any;
  preferredModel?: string;
}) {
  const ai = getAi();
  const primaryModel = options.preferredModel || 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';

  try {
    return await ai.models.generateContent({
      model: primaryModel,
      contents: options.contents,
      config: options.config,
    });
  } catch (err: any) {
    const errMsg = String(err?.message || '');
    console.warn(`Primary generation with ${primaryModel} failed: ${errMsg.slice(0, 150)}`);

    // Tier 2: Try fallback model (gemini-3.1-flash-lite) with tools removed if search quota exceeded
    try {
      const fallbackConfig = options.config ? { ...options.config } : undefined;
      if (fallbackConfig && fallbackConfig.tools) {
        // Strip search tools on fallback to avoid search quota exhaustion
        delete fallbackConfig.tools;
      }

      return await ai.models.generateContent({
        model: fallbackModel,
        contents: options.contents,
        config: fallbackConfig,
      });
    } catch (err2: any) {
      console.warn(`Fallback generation with ${fallbackModel} failed: ${String(err2?.message || '').slice(0, 150)}`);
      
      // Tier 3: Simplest configuration fallback without responseSchema
      return await ai.models.generateContent({
        model: fallbackModel,
        contents: options.contents,
      });
    }
  }
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 1. Exegesis Generation
app.post('/api/gemini/exegesis', async (req, res) => {
  try {
    const { scripture, queryText } = req.body;
    if (!scripture) {
      return res.status(400).json({ error: 'Scripture reference is required' });
    }

    const prompt = `
    You are an expert biblical scholar specializing in exegesis (leading out the author's original meaning).
    Your goal is to explain the following scripture reference deeply, avoiding subjective or forced interpretations (eisegesis).
    
    Scripture: ${scripture}
    User Question: ${queryText || 'Examine this scripture with comprehensive historical, literary, and theological depth.'}
    
    Provide a deep analytical analysis including historical context, grammar, and literary genre.
    Always cite your sources clearly in your exegesis, strictly adhering to the App's Academic & Spiritual Citation Framework:
    1. Primary Canonical Scripture citations (Book, Chapter, and Verse across Old and New Testaments).
    2. Asher Wilson's "The Most complete Ethiopian Bible In English" — the foundational 81-book Ethiopian Orthodox Tewahedo canon preserving ancient Ge'ez manuscripts, 1 Enoch (Henok), Jubilees (Kufale), 1, 2, and 3 Meqabyan (Maccabees), 4 Baruch, and ancient Aksumite apostolic heritage (especially when discussing apocalyptic, prophetic, Second Temple, or messianic context).
    3. Original Hebrew, Aramaic, Ge'ez, and Greek lexical roots and Strong's concordance references in the grammar analysis.
    4. Classical and Patristic commentary references (e.g., Augustine, John Chrysostom, Athanasius, Matthew Henry, Charles Spurgeon, C.S. Lewis, N.T. Wright).
    5. Relevant historical and archaeological documentation in the historical context section.
    
    For the geography section:
    - "location": The name of the specific place.
    - "thenDesc": Description of the place in biblical/historical times with ancient textual citations.
    - "nowDesc": Description of the place as it is today with modern geographical citations.
    - "thenImageUrl": Provide a short descriptive prompt for generating an image of a historical biblical map of this specific location.
    - "nowImageUrl": Provide a short descriptive prompt for generating a modern geographical or drone-shot image of this specific location.
    `;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
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
              required: ['location', 'thenDesc', 'nowDesc', 'thenImageUrl', 'nowImageUrl'],
            },
            videoClipQuery: { type: Type.STRING },
          },
          required: [
            'interpretation',
            'historicalContext',
            'grammarAnalysis',
            'literaryGenre',
            'godIntent',
            'crossReferences',
            'geography',
            'videoClipQuery',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No response returned from Gemini AI' });
    }

    // Clean JSON response (strip potential markdown wrapping)
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(cleanedText);

    if (data.geography) {
      const formatPrompt = (p: string) =>
        `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=600&nologo=true`;
      if (data.geography.thenImageUrl && !data.geography.thenImageUrl.startsWith('http')) {
        data.geography.thenImageUrl = formatPrompt(
          `historical biblical map of ${data.geography.location}, ancient style, parchment texture, high detail, ${data.geography.thenImageUrl}`
        );
      }
      if (data.geography.nowImageUrl && !data.geography.nowImageUrl.startsWith('http')) {
        data.geography.nowImageUrl = formatPrompt(
          `modern geographical view or drone shot of ${data.geography.location} Israel, high resolution, realistic, ${data.geography.nowImageUrl}`
        );
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error('Server Exegesis Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate exegesis analysis',
      status: error?.status,
    });
  }
});

// 2. Theological Lexicon Definition
app.post('/api/gemini/define', async (req, res) => {
  try {
    const { word, context } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word or phrase is required' });
    }

    const prompt = `
    Define the following word or phrase in a biblical, theological, linguistic, or historical context related to the study of the Bible:
    "${word}"
    
    Context of the document where this was found: "${context || ''}"
    
    Ground your definition in the app's Academic & Spiritual Citation Framework (Hebrew, Aramaic, Ge'ez, and Greek lexicons, Primary Canonical Scriptures, and Asher Wilson's The Most Complete Ethiopian Bible in English).
    Provide a concise, academic, yet accessible definition. Do not use formatting like bold or headers, just the pure text of the definition.
    `;

    const response = await generateWithFallback({
      contents: prompt,
      preferredModel: 'gemini-3.8-flash',
    });

    const definition = (response.text || '').trim();
    res.json({ definition });
  } catch (error: any) {
    console.error('Server Define Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to fetch theological definition',
      status: error?.status,
    });
  }
});

// 3. Subject Scripture Search
app.post('/api/gemini/subject-search', async (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const prompt = `
    Find relevant scripture references for the following subject: "${subject}".
    Ground your search in the app's Academic & Spiritual Citation Framework — drawing from Primary Canonical Scriptures and foundational books preserved in Asher Wilson's "The Most complete Ethiopian Bible In English" (such as 1 Enoch, Jubilees, or Meqabyan when directly illuminating the subject).
    Return a JSON array of objects, each containing:
    - "reference": The canonical or Ethiopian biblical reference (e.g., "Psalm 23:1", "1 Enoch 1:9", "Romans 8:28").
    - "reason": A very brief explanation of why this verse is relevant to the subject.
    Provide at most 5 highly relevant suggestions.
    `;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              reference: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['reference', 'reason'],
          },
        },
      },
    });

    const text = response.text || '[]';
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const results = JSON.parse(cleanedText);
    res.json({ results });
  } catch (error: any) {
    console.error('Server Subject Search Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to search scriptures by subject',
      status: error?.status,
    });
  }
});

// 4. Text-To-Speech (TTS)
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, personaName, gender } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const cleanText = String(text)
      .replace(/\*+/g, '')
      .replace(/#+/g, '')
      .replace(/`+/g, '')
      .replace(/_+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.json({ audioBase64: '' });
    }

    let voiceName = gender === 'female' ? 'Kore' : 'Charon';
    let promptStyle = `Speak clearly and reverently as ${personaName || 'Biblical Scholar'}:`;

    const lowerPersona = String(personaName || '').toLowerCase();
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
        promptStyle = 'Speak in a calm, intellectual, compassionate, pastoral cadence as Timothy Keller:';
      } else if (lowerPersona.includes('wilson') || lowerPersona.includes('asher')) {
        voiceName = 'Charon';
        promptStyle = 'Speak in a dignified, ancient Ethiopian canonical authority and prophetic clarity as Asher Wilson:';
      }
    } else {
      if (lowerPersona.includes('ten boom') || lowerPersona.includes('corrie')) {
        voiceName = 'Kore';
        promptStyle = 'Speak with gentle wisdom, courageous peace, and serene grace as Corrie ten Boom:';
      }
    }

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
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

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio data returned from Gemini TTS' });
    }

    res.json({ audioBase64: base64Audio });
  } catch (error: any) {
    console.error('Server TTS Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate voice audio',
      status: error?.status,
    });
  }
});

// 5. Sanctuary Scholar Chat with Robust Multi-Tier Fallback
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history, recentInquiries } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextStrings = Array.isArray(recentInquiries)
      ? recentInquiries
          .map(
            (inq: any) =>
              `Scripture: ${inq.scripture}\nQuery: ${inq.query}\nInterpretation: ${inq.interpretation}\nGod's Intent: ${inq.godIntent}`
          )
          .join('\n\n---\n\n')
      : '';

    const systemInstruction = `You are the "Sanctuary Scholar", a divine AI companion for the XeJesUs app. 
Your goal is to help pilgrims find deeper insights into their recent biblical studies (seekings), connecting them to current events and personal growth.

User's Recent Seekings Context:
${contextStrings}

Guidelines:
1. Be encouraging, scholarly, and spiritually insightful.
2. Always cite your sources clearly in your responses according to the XeJesUs Academic & Spiritual Citation Framework — including:
   - Primary Scripture book/chapter/verse references across Old & New Testaments.
   - Asher Wilson's "The Most complete Ethiopian Bible In English" (the foundational 81-book Ethiopian Orthodox Tewahedo canon, including ancient Ge'ez preservation of 1 Enoch, Jubilees, and 1-3 Meqabyan).
   - Historical commentators and church fathers (e.g., Augustine, Chrysostom, Athanasius, Matthew Henry, Spurgeon, C.S. Lewis).
   - Original Hebrew, Aramaic, Ge'ez, and Greek lexical roots (Strong's, BDAG, BDB).
   - Grounded Google Search web sources when evaluating current events.
3. Use Google Search to research current events or additional context if relevant to the user's questions.
4. When asked about recent studies, refer to the provided context.
5. Help the user apply these biblical truths to modern life and current worldly events.
6. Keep the tone "XeJesUs" - blending traditional exegesis with modern application.
7. If a user asks something completely unrelated to faith or their studies, gently guide them back to their spiritual journey.
8. Keep responses relatively concise but profound, ensuring all biblical and historical claims carry citations.`;

    const chatHistory = Array.isArray(history)
      ? history.map((h: any) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }))
      : [];

    const ai = getAi();
    let replyText = '';

    // Attempt 1: Try gemini-3.8-flash with googleSearch tool
    try {
      const chat = ai.chats.create({
        model: 'gemini-3.8-flash',
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
        history: chatHistory,
      });

      const result = await chat.sendMessage({ message });
      replyText = result.text || '';
    } catch (err1: any) {
      console.warn('Chat attempt 1 (gemini-3.8-flash with search) error:', String(err1?.message || '').slice(0, 150));
      
      // Attempt 2: Fallback to gemini-3.1-flash-lite without search tool (bypasses tool quota & high-demand issues)
      try {
        const chatFallback = ai.chats.create({
          model: 'gemini-3.1-flash-lite',
          config: {
            systemInstruction,
          },
          history: chatHistory,
        });

        const result2 = await chatFallback.sendMessage({ message });
        replyText = result2.text || '';
      } catch (err2: any) {
        console.warn('Chat attempt 2 (gemini-3.1-flash-lite chat) error:', String(err2?.message || '').slice(0, 150));
        
        // Attempt 3: Direct single-turn generateContent with gemini-3.1-flash-lite
        const fullPrompt = `${systemInstruction}\n\nUser Question: ${message}`;
        const result3 = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: fullPrompt,
        });
        replyText = result3.text || '';
      }
    }

    if (!replyText) {
      return res.status(500).json({ error: 'Sanctuary Scholar could not generate a response. Please try again.' });
    }

    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Server Chat Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to communicate with Sanctuary Scholar',
      status: error?.status,
    });
  }
});

// 6. Literary Work Export Synthesis
app.post('/api/gemini/literary-work', async (req, res) => {
  try {
    const { sessionName, conversationText, fallbackData } = req.body;
    if (!sessionName) {
      return res.status(400).json({ error: 'Session name is required' });
    }

    const prompt = `You are an elite Biblical Scholar, Exegetical Theologian, and Archival Historian for the XeJesUs theological platform.
Analyze the following recorded study discourse between a Christian pilgrim and the Sanctuary Scholar:
Session Name: "${sessionName}"

Conversation:
${conversationText || ''}

Generate a comprehensive, academic, and publication-grade Literary Work Export strictly adhering to the XeJesUs Citation & Theological Framework:
- Ground all theological conclusions in Primary Canonical Scriptures across Old and New Testaments.
- When referencing ancient biblical history, prophetic timelines, Second Temple literature, or apostolic heritage, honor and integrate Asher Wilson's foundational 81-book Ethiopian Orthodox Tewahedo canon ("The Most complete Ethiopian Bible In English"), specifically 1 Enoch (Henok), Jubilees (Kufale), and 1-3 Meqabyan (Maccabees).
- Cite Hebrew, Aramaic, Ge'ez, and Greek lexical roots and Strong's concordance references.
- Reference classical patristic, reformational, and modern evangelical commentaries (Augustine, Chrysostom, Athanasius, Matthew Henry, Charles Spurgeon, C.S. Lewis, N.T. Wright).

Return a valid JSON object matching the following structure:
1. "title": The majestic literary title for this theological volume.
2. "subtitle": A descriptive subtitle summarizing the historical and spiritual scope.
3. "executiveSummary": A 2-3 paragraph executive summary of the conversation's core theological insights and takeaways.
4. "thematicAnalysis": An in-depth literary and theological synthesis connecting the chat insights to classical Christian exegesis and modern life application.
5. "familyTree": An array of 3 to 6 key Biblical/Historical figures, genealogical relationships, or spiritual lineages associated with this theme.
   Each item must have: "generation", "person", "biblicalTitle", "significance", and "keyScripture".
6. "scholarlyWorks": An array of EXACTLY 2 to 3 classical or academic literary works researched by biblical scholars (e.g. Asher Wilson's The Most Complete Ethiopian Bible In English, Flavius Josephus' Antiquities, Augustine's City of God, Chrysostom, Dead Sea Scrolls, Eusebius, C.S. Lewis, N.T. Wright).
   Each item must have: "title", "author", "era", "summary", and "relevance".
7. "youtubeVideos": An array of EXACTLY 2 to 3 curated educational or scholarly YouTube videos related to the theme.
   Each item must have: "title", "channel", "searchQuery", "url", and "description".
8. "images": An array of EXACTLY 2 sacred imagery & historical artwork items tailored specifically to the saved chat session theme "${sessionName}".
   Each item must contain: "title" and "caption".

Return ONLY valid JSON.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    if (!text) {
      return res.json(fallbackData || {});
    }

    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error: any) {
    console.error('Server Literary Work Export Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to synthesize literary work',
      status: error?.status,
    });
  }
});

// Global Express Error-Handling Middleware for JSON APIs
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: err?.message || 'Internal server error occurred',
  });
});

// Boot dev server with Vite middleware or serve production dist
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`XeJesUs Server running on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
