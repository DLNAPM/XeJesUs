import { GoogleGenAI, Type } from "@google/genai";
import { reportIncident } from "../services/incidentService";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (aiInstance) return aiInstance;
  
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process?.env?.GEMINI_API_KEY : '') || (import.meta as any).env?.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please ensure GEMINI_API_KEY is configured in your project settings.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

export const MODELS = {
  TEXT: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image",
};

export async function generateExegesis(scripture: string, queryText: string) {
  const ai = getAi();
  const prompt = `
    You are an expert biblical scholar specializing in exegesis (leading out the author's original meaning).
    Your goal is to explain the following scripture reference deeply, avoiding subjective or forced interpretations (eisegesis).
    
    Scripture: ${scripture}
    User Question: ${queryText}
    
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

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
              items: { type: Type.STRING } 
            },
            geography: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                thenDesc: { type: Type.STRING },
                nowDesc: { type: Type.STRING },
                thenImageUrl: { type: Type.STRING },
                nowImageUrl: { type: Type.STRING }
              },
              required: ["location", "thenDesc", "nowDesc", "thenImageUrl", "nowImageUrl"]
            },
            videoClipQuery: { type: Type.STRING }
          },
          required: [
            "interpretation", 
            "historicalContext", 
            "grammarAnalysis", 
            "literaryGenre", 
            "godIntent", 
            "crossReferences", 
            "geography", 
            "videoClipQuery"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Process response to format image URLs if they are just prompts
    const data = JSON.parse(text.trim());
    
    // Ensure URLs are valid image generation URLs
    if (data.geography) {
      const formatPrompt = (p: string) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=600&nologo=true`;
      if (!data.geography.thenImageUrl.startsWith('http')) {
        data.geography.thenImageUrl = formatPrompt(`historical biblical map of ${data.geography.location}, ancient style, parchment texture, high detail, ${data.geography.thenImageUrl}`);
      }
      if (!data.geography.nowImageUrl.startsWith('http')) {
        data.geography.nowImageUrl = formatPrompt(`modern geographical view or drone shot of ${data.geography.location} Israel, high resolution, realistic, ${data.geography.nowImageUrl}`);
      }
    }

    return data;
  } catch (error) {
    console.error("Gemini Error:", error);
    reportIncident({
      error,
      service: 'Gemini AI',
      endpoint: 'generateExegesis (Seek the Word)',
      details: { scripture, queryText }
    }).catch(err => console.warn("Could not log incident:", err));
    throw error;
  }
}

export async function fetchDefinition(word: string, context: string): Promise<string> {
  const ai = getAi();
  const prompt = `
    Define the following word or phrase in a biblical, theological, linguistic, or historical context related to the study of the Bible:
    "${word}"
    
    Context of the document where this was found: "${context}"
    
    Ground your definition in the app's Academic & Spiritual Citation Framework (Hebrew, Aramaic, Ge'ez, and Greek lexicons, Primary Canonical Scriptures, and Asher Wilson's The Most Complete Ethiopian Bible in English).
    Provide a concise, academic, yet accessible definition. Do not use formatting like bold or headers, just the text of the definition.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fetch Definition Error:", error);
    reportIncident({
      error,
      service: 'Gemini AI',
      endpoint: 'fetchDefinition (Theological Lexicon)',
      details: { word, context }
    }).catch(err => console.warn("Could not log incident:", err));
    throw error;
  }
}

export async function searchScriptureBySubject(subject: string): Promise<{reference: string, reason: string}[]> {
  const ai = getAi();
  const prompt = `
    Find relevant scripture references for the following subject: "${subject}".
    Ground your search in the app's Academic & Spiritual Citation Framework — drawing from Primary Canonical Scriptures and foundational books preserved in Asher Wilson's "The Most complete Ethiopian Bible In English" (such as 1 Enoch, Jubilees, or Meqabyan when directly illuminating the subject).
    Return a JSON array of objects, each containing:
    - "reference": The canonical or Ethiopian biblical reference (e.g., "Psalm 23:1", "1 Enoch 1:9", "Romans 8:28").
    - "reason": A very brief explanation of why this verse is relevant to the subject.
    Provide at most 5 highly relevant suggestions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              reference: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["reference", "reason"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Search Scripture Error:", error);
    reportIncident({
      error,
      service: 'Gemini AI',
      endpoint: 'searchScriptureBySubject',
      details: { subject }
    }).catch(err => console.warn("Could not log incident:", err));
    return [];
  }
}
