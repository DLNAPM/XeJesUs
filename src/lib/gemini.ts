import { GoogleGenAI, Type } from "@google/genai";

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
    For the geography section:
    - "location": The name of the specific place.
    - "thenDesc": Description of the place in biblical/historical times.
    - "nowDesc": Description of the place as it is today.
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
    throw error;
  }
}

export async function fetchDefinition(word: string, context: string): Promise<string> {
  const ai = getAi();
  const prompt = `
    Define the following word or phrase in a biblical, theological, or historical context related to the study of the Bible:
    "${word}"
    
    Context of the document where this was found: "${context}"
    
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
    throw error;
  }
}

export async function searchScriptureBySubject(subject: string): Promise<{reference: string, reason: string}[]> {
  const ai = getAi();
  const prompt = `
    Find relevant biblical scripture references for the following subject: "${subject}".
    Return a JSON array of objects, each containing:
    - "reference": The canonical reference (e.g., "Psalm 23:1").
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
    return [];
  }
}
