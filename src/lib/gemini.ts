import { reportIncident } from "../services/incidentService";

export const MODELS = {
  TEXT: "gemini-3.8-flash",
  IMAGE: "gemini-3.1-flash-lite-image",
};

export async function generateExegesis(scripture: string, queryText: string) {
  try {
    const response = await fetch('/api/gemini/exegesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scripture, queryText }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Exegesis server error (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Gemini Exegesis Error:", error);
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
  try {
    const response = await fetch('/api/gemini/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, context }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Lexicon definition server error (${response.status})`);
    }

    const data = await response.json();
    return data.definition || '';
  } catch (error: any) {
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
  try {
    const response = await fetch('/api/gemini/subject-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Subject search server error (${response.status})`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error: any) {
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
