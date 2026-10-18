import { reportIncident } from "../services/incidentService";

export const MODELS = {
  TEXT: "gemini-3.8-flash",
  IMAGE: "gemini-3.1-flash-lite-image",
};

// Robust helper that avoids "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
// and handles HTML fallbacks, transient network truncations, and clear diagnostics
async function safeFetchJson<T>(url: string, init?: RequestInit, retries = 2): Promise<T> {
  const fetchUrl = retries < 2 
    ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`
    : url;

  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(fetchUrl, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (netErr: any) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 400));
      return safeFetchJson<T>(url, init, retries - 1);
    }
    throw netErr;
  }

  const contentType = response.headers.get('content-type') || '';
  let rawText = '';
  try {
    rawText = await response.text();
  } catch (err: any) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 400));
      return safeFetchJson<T>(url, init, retries - 1);
    }
    throw new Error(`Failed to read response from ${url}: ${err?.message || ''}`);
  }

  // Detect HTML response masquerading with 200 OK (e.g. SPA index.html fallback)
  if (
    contentType.includes('text/html') || 
    rawText.trim().startsWith('<!doctype') || 
    rawText.trim().startsWith('<html')
  ) {
    if (retries > 0 && init?.method === 'POST') {
      await new Promise(r => setTimeout(r, 600));
      return safeFetchJson<T>(url, init, retries - 1);
    }
    throw new Error(`Server returned HTML document instead of JSON (${response.status}). The service route may be unconfigured.`);
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
    let errorMsg = parsed?.error || parsed?.message || rawText || `Server returned HTTP ${response.status}`;
    if (typeof errorMsg === 'string') {
      try {
        const nested = JSON.parse(errorMsg);
        if (nested?.error?.message) {
          errorMsg = nested.error.message;
        }
      } catch {}
    } else {
      errorMsg = JSON.stringify(errorMsg);
    }
    throw new Error(errorMsg);
  }

  if (parsed === null) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return safeFetchJson<T>(url, init, retries - 1);
    }
    const snippet = rawText ? rawText.slice(0, 100).replace(/\s+/g, ' ') : '<empty>';
    throw new Error(`Invalid response received from server (${response.status}): ${snippet}`);
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
