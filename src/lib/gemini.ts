import { reportIncident } from "../services/incidentService";

export const MODELS = {
  TEXT: "gemini-3.8-flash",
  IMAGE: "gemini-3.1-flash-lite-image",
};

// Robust helper that avoids "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
async function safeFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  let rawText = '';
  try {
    rawText = await response.text();
  } catch (err: any) {
    throw new Error(`Failed to read response from ${url}: ${err?.message || ''}`);
  }

  let parsed: any = null;
  if (rawText && rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      parsed?.error ||
      parsed?.message ||
      rawText ||
      `Server returned HTTP ${response.status}`;
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  if (parsed === null) {
    throw new Error(`Invalid response received from server (${response.status})`);
  }

  return parsed as T;
}

export async function generateExegesis(scripture: string, queryText: string) {
  try {
    const data = await safeFetchJson<any>('/api/gemini/exegesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scripture, queryText }),
    });

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
    const data = await safeFetchJson<{ definition?: string }>('/api/gemini/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, context }),
    });

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
    const data = await safeFetchJson<{ results?: { reference: string; reason: string }[] }>('/api/gemini/subject-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject }),
    });

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
