import { GoogleGenAI } from "@google/genai";
import { Inquiry } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (aiInstance) return aiInstance;
  
  // Use both possible locations for the API key in a Vite environment
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  
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

  const systemInstruction = `You are the "Sanctuary Scholar", a divine AI companion for the EiseJesUs app. 
Your goal is to help pilgrims find deeper insights into their recent biblical studies (seekings), connecting them to current events and personal growth.

User's Recent Seekings Context:
${contextStrings}

Guidelines:
1. Be encouraging, scholarly, and spiritually insightful.
2. Use the provided Google Search tool to research current events or additional context if relevant to the user's questions.
3. When asked about recent studies, refer to the provided context.
4. Help the user apply these biblical truths to modern life and current worldly events.
5. Keep the tone "EiseJesUs" - blending traditional exegesis with modern application.
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
