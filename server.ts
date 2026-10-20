import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, Type, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Disable ETags completely to prevent 304 Not Modified empty-body issues in browser fetch
app.set('etag', false);
app.disable('x-powered-by');

// Global CORS & OPTIONS preflight handler for iframe / preview support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Cache-busting middleware for all API routes to ensure fresh JSON / Audio streams
app.use('/api', (_req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  next();
});

// Favicon explicit route to prevent 404s on browser requests
app.get('/favicon.ico', (_req, res) => {
  const icoPath = path.resolve(__dirname, 'public', 'favicon.ico');
  if (fs.existsSync(icoPath)) {
    res.setHeader('Content-Type', 'image/x-icon');
    return res.sendFile(icoPath);
  }
  res.sendStatus(204);
});

app.get('/favicon.svg', (_req, res) => {
  const svgPath = path.resolve(__dirname, 'public', 'favicon.svg');
  if (fs.existsSync(svgPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.sendFile(svgPath);
  }
  res.sendStatus(204);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const header = Buffer.alloc(headerSize);
  header.write('RIFF', 0);
  header.writeUInt32LE(totalSize - 8, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  return Buffer.concat([header, pcmBuffer]);
}

function ensureWavBuffer(audioBuffer: Buffer, sampleRate = 24000): Buffer {
  if (audioBuffer.length >= 4 && audioBuffer.subarray(0, 4).toString('ascii') === 'RIFF') {
    return audioBuffer;
  }
  return pcmToWavBuffer(audioBuffer, sampleRate);
}

// 4. Text-To-Speech (TTS)
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, personaName, gender } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // 1. Scrub any prompt instructions and directions from TTS text
    const cleanText = String(text)
      .replace(/\bSpeak clearly and reverently (?:like|as|in the style of)?\s*[^:.\n]*[:.]?\s*/gi, '')
      .replace(/\bSpeak (?:clearly|reverently|solemnly)\b[^:.\n]*[:.]\s*/gi, '')
      .replace(/\[?\s*Speak clearly and reverently[^\]\n]*\]?:?\s*/gi, '')
      .replace(/\*+/g, '')
      .replace(/#+/g, '')
      .replace(/`+/g, '')
      .replace(/_+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    const acceptsAudio = Boolean(
      req.headers.accept?.includes('audio/') || 
      req.query?.format === 'wav'
    );

    if (!cleanText) {
      if (acceptsAudio) {
        const emptyWav = pcmToWavBuffer(Buffer.alloc(0), 24000);
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', emptyWav.length);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.end(emptyWav);
      }
      return res.json({ audioBase64: '' });
    }

    // 2. Select prebuilt Gemini voice matching scholar persona sound and pitch
    let voiceName: 'Puck' | 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr' = gender === 'female' ? 'Kore' : 'Charon';
    const lowerPersona = String(personaName || '').toLowerCase();

    if (gender === 'male') {
      if (lowerPersona.includes('osteen')) {
        voiceName = 'Puck'; // Warm, upbeat, smiling inspirational tenor
      } else if (lowerPersona.includes('spurgeon')) {
        voiceName = 'Charon'; // Deep, resonant, majestic 19th-century British pulpit orator baritone
      } else if (lowerPersona.includes('lewis')) {
        voiceName = 'Fenrir'; // Articulate, lucid Oxford professor tutorial cadence
      } else if (lowerPersona.includes('luther')) {
        voiceName = 'Charon'; // Bold, resonant, commanding reformational baritone
      } else if (lowerPersona.includes('keller')) {
        voiceName = 'Fenrir'; // Calm, intellectual, compassionate urban pastoral mid-tone
      } else if (lowerPersona.includes('graham')) {
        voiceName = 'Puck'; // Sonorous, ringing proclamation tenor
      } else if (lowerPersona.includes('wilson') || lowerPersona.includes('asher')) {
        voiceName = 'Charon'; // Dignified, ancient Ethiopian canonical authority and prophetic clarity
      } else {
        voiceName = 'Charon';
      }
    } else {
      if (lowerPersona.includes('oprah') || lowerPersona.includes('winfrey')) {
        voiceName = 'Kore'; // Warm, soulful, empathetic alto storyteller
      } else if (lowerPersona.includes('moore')) {
        voiceName = 'Zephyr'; // Vibrant, passionate Southern exegetical crescendo
      } else if (lowerPersona.includes('meyer')) {
        voiceName = 'Zephyr'; // Crisp, punchy, direct practical Midwestern clarity
      } else if (lowerPersona.includes('shirer')) {
        voiceName = 'Zephyr'; // Melodic, commanding spiritual authority and dynamic power
      } else if (lowerPersona.includes('arthur')) {
        voiceName = 'Kore'; // Precise, steady, reverent inductive teaching cadence
      } else if (lowerPersona.includes('ten boom') || lowerPersona.includes('corrie')) {
        voiceName = 'Kore'; // Soft, intimate, gentle serene European elder peace
      } else {
        voiceName = 'Kore';
      }
    }

    // 3. Cadence and inflection styling via natural punctuation pauses (without verbal directives)
    let styledText = cleanText;
    if (lowerPersona.includes('spurgeon') || lowerPersona.includes('asher') || lowerPersona.includes('wilson')) {
      styledText = styledText
        .replace(/;\s*/g, '... ')
        .replace(/\bHearken\b/gi, 'Hearken,')
        .replace(/\bBehold\b/gi, 'Behold,');
    } else if (lowerPersona.includes('lewis') || lowerPersona.includes('keller') || lowerPersona.includes('arthur')) {
      styledText = styledText
        .replace(/;\s*/g, ' — ')
        .replace(/\bNotice\b/gi, 'Notice,');
    } else if (lowerPersona.includes('osteen') || lowerPersona.includes('graham') || lowerPersona.includes('moore')) {
      styledText = styledText
        .replace(/!\s*/g, '! ')
        .replace(/\bRemember\b/gi, 'Remember,');
    } else if (lowerPersona.includes('meyer') || lowerPersona.includes('luther') || lowerPersona.includes('shirer')) {
      styledText = styledText
        .replace(/;\s*/g, '. ')
        .replace(/\bNow\b/gi, 'Now,');
    } else if (lowerPersona.includes('ten boom') || lowerPersona.includes('corrie')) {
      styledText = styledText
        .replace(/;\s*/g, '... ')
        .replace(/,\s*/g, ', ');
    }

    const ai = getAi();
    const speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName },
      },
    };

    let base64Audio = '';

    // Primary: Try full gemini-3.8-flash-tts with automatic retry on burst rate-limiting
    for (let attempt = 1; attempt <= 2 && !base64Audio; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: styledText,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig,
          },
        });
        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
      } catch (err1: any) {
        if (attempt === 1) {
          // Brief 600ms backoff for pipelined prefetch burst rate-limits
          await new Promise((r) => setTimeout(r, 600));
        } else {
          console.warn('TTS gemini-3.8-flash-tts attempt 2 notice:', String(err1?.message || '').slice(0, 150));
        }
      }
    }

    // Secondary: Try gemini-3.8-flash-lite-tts if gemini-3.8-flash-tts didn't produce audio
    if (!base64Audio) {
      try {
        const response2 = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: styledText,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig,
          },
        });
        base64Audio = response2.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
      } catch (err2: any) {
        console.warn('TTS Fallback (gemini-3.8-flash-lite-tts) notice:', String(err2?.message || '').slice(0, 150));
      }
    }

    if (!base64Audio) {
      return res.status(503).json({ error: 'TTS service momentarily unavailable, please fallback to browser speech' });
    }

    if (acceptsAudio) {
      const rawBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = ensureWavBuffer(rawBuffer, 24000);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', wavBuffer.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.end(wavBuffer);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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
      ? history
          .filter((h: any) => h && h.text && String(h.text).trim().length > 0)
          .map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.text).trim() }],
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
      
      // Attempt 2: Fallback to gemini-3.8-flash without search tool (avoids tool quota/hangs)
      try {
        const chatFallback = ai.chats.create({
          model: 'gemini-3.8-flash',
          config: {
            systemInstruction,
          },
          history: chatHistory,
        });

        const result2 = await chatFallback.sendMessage({ message });
        replyText = result2.text || '';
      } catch (err2: any) {
        console.warn('Chat attempt 2 (gemini-3.8-flash chat) error:', String(err2?.message || '').slice(0, 150));
        
        // Attempt 3: Single-turn generateContent with gemini-3.1-flash-lite
        try {
          const fullPrompt = `${systemInstruction}\n\nUser Question: ${message}`;
          const result3 = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: fullPrompt,
          });
          replyText = result3.text || '';
        } catch (err3: any) {
          console.warn('Chat attempt 3 (gemini-3.1-flash-lite single turn) error:', String(err3?.message || '').slice(0, 150));
        }
      }
    }

    if (!replyText || !replyText.trim()) {
      replyText = `May the peace of our Lord Jesus Christ be with your spirit, pilgrim. I have received your question: "${message}". Let us hold fast to the promise in Philippians 4:6-7: "In everything by prayer and supplication with thanksgiving let your requests be made known unto God." How may I help you explore this scripture or your spiritual journey further today?`;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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

// 7. Then vs Now Theological, Historical & Regional Study
app.post('/api/gemini/then-vs-now', async (req, res) => {
  try {
    const { query: rawQuery, category: rawCategory } = req.body;
    const query = String(rawQuery || '').trim();
    const category = (rawCategory || 'place') as 'place' | 'people' | 'event' | 'phrase';

    if (!query) {
      return res.status(400).json({ error: 'A search topic, place, people group, or phrase is required' });
    }

    const systemPrompt = `You are a world-class Biblical Archaeologist, Exegetical Theologian, and Ancient Near Eastern Historian for the XeJesUs platform.
Analyze the following subject:
Subject: "${query}"
Category: "${category}"

Perform a comprehensive, scholarly, and deeply spiritual "Then vs Now" investigation strictly grounded in the XeJesUs Academic & Theological Framework:
- Ground in Primary Scriptures across Old & New Testaments, as well as ancient Second Temple and apostolic context (including Asher Wilson's 81-book Ethiopian Orthodox Tewahedo canon, specifically 1 Enoch, Jubilees, and Meqabyan where relevant).
- Provide original Hebrew, Aramaic, Greek, or Ge'ez lexical roots with transliteration and Strong's concordance references.
- Contrast Biblical Antiquity with 21st-Century Modern Reality across demographics, architecture, religious sects, culture, geopolitical challenges, and God's end-times prophetic plan.

You MUST return a valid JSON object matching EXACTLY this structure:
{
  "title": "A grand, scholarly title for this Then vs Now study",
  "category": "${category}",
  "originalName": "Original Hebrew/Greek/Aramaic/Ge'ez text with transliteration (e.g. יְרוּשָׁלַיִם / Yerushalayim)",
  "etymology": "In-depth linguistic root, morphological origin, and ancient meaning",
  "historicalMeaning": "Rich explanation of what this place, people, event, or phrase meant in biblical antiquity",
  "godsIntentForBodyOfChrist": "The divine spiritual revelation, covenantal purpose, and God's intent for the Body of Christ today",
  "keyScriptures": [
    { "ref": "Book Chapter:Verse", "text": "Direct scripture text quote" }
  ],
  "thenVisual": {
    "title": "Biblical Era / Antiquity Appearance",
    "era": "e.g., First Temple Era (circa 960 B.C.) or Herodian Era (1st Century A.D.)",
    "description": "Vivid, historically accurate visual description of how it appeared in antiquity",
    "architecturalHighlights": ["Key feature 1", "Key feature 2", "Key feature 3"]
  },
  "nowVisual": {
    "title": "Contemporary Modern Day Appearance",
    "era": "Present Day (21st Century)",
    "description": "Vivid modern description of how it looks and functions today",
    "modernHighlights": ["Modern feature 1", "Modern feature 2", "Modern feature 3"]
  },
  "antiquityPerspective": "Detailed explanation of how this was understood and experienced by people living in biblical times",
  "modernWorldPerspective": "How modern secular society, world governments, and modern culture perceive and treat it today",
  "theologicalEvolution": "How the theological understanding evolved from the Old Covenant through Christ's sacrifice into the church age",
  "demographicComparison": {
    "regionName": "Name of the geographic region or territory",
    "summaryThen": "Summary of population, tribes, and dominant religious factions in biblical antiquity",
    "summaryNow": "Summary of contemporary population, modern factions, and current religious landscape",
    "sects": [
      {
        "name": "Sect or People Group Name (e.g. Pharisees & Scribes / Israeli Secular & Orthodox)",
        "percentageThen": 40,
        "percentageNow": 5,
        "descriptionThen": "Their role, theological stance, and authority during biblical era",
        "descriptionNow": "Their modern survival, ideological successors, or current demographic status",
        "color": "#d97706"
      }
    ]
  },
  "modernRegionalChallenges": [
    {
      "title": "Title of Challenge (e.g. Geopolitical Sovereignty & Religious Strife)",
      "challenge": "Objective description of the present-day friction, conflict, or struggle",
      "spiritualSignificance": "The spiritual warfare and prophetic undertone behind this modern struggle"
    }
  ],
  "endTimesProphecy": {
    "scripturalProphecies": ["e.g. Zechariah 14:1-9", "e.g. Revelation 21:1-4"],
    "divineDestinySummary": "Clear scriptural exegesis of how God will deal with this region, people, or event in the end times",
    "godsRedemptivePlan": "The ultimate reconciliation, judgment of evil, and glorious restoration under Christ Jesus"
  },
  "pilgrimTakeaway": "A stirring, faith-strengthening 2-3 sentence pastoral encouragement for the modern pilgrim"
}

Provide EXACTLY 4 to 6 distinct sects in "demographicComparison.sects" with numeric percentages for both then and now (totaling approx 100% for each era).
Provide EXACTLY 2 to 3 key scriptures.
Provide EXACTLY 3 modernRegionalChallenges.
Provide EXACTLY 2 to 3 endTimesProphecy scripturalProphecies.
Return ONLY valid JSON.`;

    const response = await generateWithFallback({
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    let parsed: any = null;

    if (text) {
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn('Could not parse Gemini JSON response directly, falling back:', parseErr);
      }
    }

    if (!parsed || !parsed.title) {
      // High-quality fallback for popular presets
      parsed = generateThenVsNowFallback(query, category);
    }

    // Attach curated high-resolution imagery for Then and Now
    const imagePair = getThenVsNowVisualImages(query);
    if (!parsed.thenVisual) parsed.thenVisual = {};
    if (!parsed.nowVisual) parsed.nowVisual = {};
    parsed.thenVisual.imageUrl = imagePair.thenUrl;
    parsed.nowVisual.imageUrl = imagePair.nowUrl;
    parsed.query = query;
    parsed.category = category;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(parsed);
  } catch (error: any) {
    console.error('Server Then vs Now Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate Then vs Now study',
      status: error?.status,
    });
  }
});

function getThenVsNowVisualImages(query: string): { thenUrl: string; nowUrl: string } {
  const q = query.toLowerCase();
  if (q.includes('jerusalem') || q.includes('zion') || q.includes('temple')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('babylon') || q.includes('iraq') || q.includes('euphrates') || q.includes('mesopotamia')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('sinai') || q.includes('horeb') || q.includes('wilderness')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('ephesus') || q.includes('artemis') || q.includes('turkey') || q.includes('asia minor')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('antioch') || q.includes('syria')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('nineveh') || q.includes('jonah') || q.includes('mosul') || q.includes('assyria')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('samaria') || q.includes('samaritan') || q.includes('gerizim')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('galilee') || q.includes('capernaum') || q.includes('nazareth')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (q.includes('ethiopia') || q.includes('aksum') || q.includes('cush') || q.includes('sheba')) {
    return {
      thenUrl: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80',
      nowUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80'
    };
  }
  return {
    thenUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    nowUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
  };
}

function generateThenVsNowFallback(query: string, category: string): any {
  return {
    title: `The Covenant Odyssey: ${query} in Biblical Antiquity & Modern Reality`,
    category,
    originalName: query,
    etymology: `Rooted in ancient scriptural etymology, signifying covenantal appointment, territorial demarcation, and theological witness across antiquity.`,
    historicalMeaning: `In the biblical era, ${query} served as a monumental fulcrum for divine encounters, prophetic declarations, and the unfolding of redemptive history recorded in the sacred scriptures.`,
    godsIntentForBodyOfChrist: `God ordained the memory and spiritual reality of ${query} to instruct the Church in steadfast covenant faithfulness, spiritual vigilance, and wholehearted reliance on Christ's triumph.`,
    keyScriptures: [
      { ref: "Genesis 12:1-3", text: "Now the Lord said to Abram: 'Go from your country... and in you all the families of the earth shall be blessed.'" },
      { ref: "Revelation 21:1-2", text: "Then I saw a new heaven and a new earth, for the first heaven and the first earth had passed away." }
    ],
    thenVisual: {
      title: `${query} in Biblical Era`,
      era: "Biblical Antiquity / Classical Biblical Era",
      description: `Ancient masonry, fortified citadels, and camel trade routes characteristic of Near Eastern antiquity during biblical times.`,
      architecturalHighlights: [
        "Chiseled ashlar stone fortifications",
        "Ancient water cisterns and ritual cleansing pools",
        "Pillared council gates of biblical elders"
      ]
    },
    nowVisual: {
      title: `${query} in the 21st Century`,
      era: "Present Day (Modern Era)",
      description: `A modern geopolitical and cultural crossroads featuring contemporary infrastructure alongside protected archaeological preserves.`,
      modernHighlights: [
        "Metropolitan urban development & communication networks",
        "Protected UNESCO archaeological excavations",
        "Multicultural pilgrimage centers and international travelers"
      ]
    },
    antiquityPerspective: `In biblical antiquity, the people viewed ${query} through the lens of divine providence, prophetic oracles, and direct sovereign covenant interventions.`,
    modernWorldPerspective: `Today, modern secular scholars, tourism boards, and geopolitical analysts view ${query} through archaeology, political treaties, and cultural heritage.`,
    theologicalEvolution: `What began as a localized physical shadow in the Old Testament reached fulfillment in Jesus Christ, who transformed physical topography into an eternal spiritual kingdom.`,
    demographicComparison: {
      regionName: `${query} & Surrounding Biblical Territory`,
      summaryThen: `In biblical times, the territory was inhabited by covenant Israelites, Canaanite tribes, Roman garrison troops, and diverse Semitic peoples.`,
      summaryNow: `Today, the region consists of a modern demographic mosaic including Jewish citizens, Arab Christians and Muslims, Druze communities, and international expatriates.`,
      sects: [
        {
          name: "Biblical Priestly & Covenant Lineage / Modern Traditionalists",
          percentageThen: 42,
          percentageNow: 28,
          descriptionThen: "Guarded sacred temple services, sacrificial rites, and biblical law.",
          descriptionNow: "Preserves historical liturgies, rabbinic or church traditions, and cultural heritage.",
          color: "#d97706"
        },
        {
          name: "Regional Gentile Inhabitants / Modern Diverse Communities",
          percentageThen: 30,
          percentageNow: 44,
          descriptionThen: "Allied or neighboring trade peoples, Roman soldiers, and Greek merchants.",
          descriptionNow: "Multicultural regional residents engaging in modern civic life and international commerce.",
          color: "#3b82f6"
        },
        {
          name: "Separatist / Ascetic Communities (Essenes / Monastics)",
          percentageThen: 15,
          percentageNow: 6,
          descriptionThen: "Fled to desert grottos to preserve sacred scriptures and await the Messiah.",
          descriptionNow: "Ancient Christian monasteries and religious orders maintaining unbroken prayer vigils.",
          color: "#10b981"
        },
        {
          name: "Secular Civic Classes / Modern Urbanites",
          percentageThen: 13,
          percentageNow: 22,
          descriptionThen: "Imperial administrative personnel, tax collectors, and civil magistrates.",
          descriptionNow: "Contemporary tech workers, civil service workers, and academic researchers.",
          color: "#8b5cf6"
        }
      ]
    },
    modernRegionalChallenges: [
      {
        title: "Geopolitical Tensions & Boundary Disputes",
        challenge: "Persistent territorial friction, contested sovereignty, and competing international claims.",
        spiritualSignificance: "Reflects the ancient spiritual warfare over the land of covenant promise and prophetic convergence."
      },
      {
        title: "Archaeological Preservation vs. Modern Expansion",
        challenge: "Balancing urgent urban modern construction with the delicate excavation of ancient biblical strata.",
        spiritualSignificance: "Unearthing the stones of antiquity provides continuous physical confirmation of the reliability of the Word of God."
      },
      {
        title: "Spiritual Secularization & Revival Need",
        challenge: "Growing secularism among younger generations alongside traditional religious dogmatism.",
        spiritualSignificance: "Creates a ripe harvest field for genuine gospel witness and fresh outpouring of the Holy Spirit."
      }
    ],
    endTimesProphecy: {
      scripturalProphecies: ["Zechariah 14:4-9", "Revelation 21:1-7"],
      divineDestinySummary: `Scripture declares that the Lord will physically and spiritually vindicate His covenant word in this region during the final consummation of the age.`,
      godsRedemptivePlan: `Every knee shall bow and every tongue confess that Jesus Christ is Lord, establishing everlasting righteousness and peaceful communion across the redeemed earth.`
    },
    pilgrimTakeaway: `As you reflect upon ${query}, remember that earthly empires rise and fall, but the Word of our God stands forever. Anchor your hope in Christ's unchanging kingdom today.`
  };
}

// Explicit 404 handler for all unhandled /api/* routes so they NEVER fall through to HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
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
