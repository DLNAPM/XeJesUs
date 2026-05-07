import { GoogleGenAI } from "@google/genai";
import { Inquiry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || '' });

export async function chatWithSanctuary(
  message: string, 
  history: { role: 'user' | 'model', text: string }[],
  recentInquiries: Inquiry[]
) {
  if (!process.env.GEMINI_API_KEY && !(import.meta as any).env.VITE_GEMINI_API_KEY) {
    throw new Error("API key is missing. Please ensure GEMINI_API_KEY is set in the environment.");
  }

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
2. When asked about recent studies, refer to the provided context.
3. Help the user apply these biblical truths to modern life and current worldly events.
4. Keep the tone "EiseJesUs" - blending traditional exegesis with modern application.
5. If a user asks something completely unrelated to faith or their studies, gently guide them back to their spiritual journey.
6. Keep responses relatively concise but profound.`;

  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction,
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
