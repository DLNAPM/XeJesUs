export const MODELS = {
  TEXT: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image",
};

export async function generateExegesis(scripture: string, queryText: string) {
  try {
    const res = await fetch("/api/exegesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scripture, queryText }),
    });

    const rawText = await res.text();

    if (!res.ok) {
      let msg = `Server returned status ${res.status}`;
      try {
        const errObj = JSON.parse(rawText);
        if (errObj.message) msg = errObj.message;
        else if (errObj.error) msg = errObj.error;
      } catch {}
      throw new Error(msg);
    }

    if (!rawText || !rawText.trim()) {
      throw new Error("Sanctuary service returned an empty response. Please try again.");
    }

    const data = JSON.parse(rawText);
    return data;
  } catch (error) {
    console.error("Generate Exegesis Error:", error);
    throw error;
  }
}

export async function fetchDefinition(word: string, context: string): Promise<string> {
  try {
    const res = await fetch("/api/define-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, context }),
    });

    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    if (!rawText || !rawText.trim()) return "";
    const data = JSON.parse(rawText);
    return data.definition || "";
  } catch (error) {
    console.error("Fetch Definition Error:", error);
    throw error;
  }
}

export async function searchScriptureBySubject(subject: string): Promise<{reference: string, reason: string}[]> {
  try {
    const res = await fetch("/api/search-scriptures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });

    const rawText = await res.text();
    if (!res.ok || !rawText || !rawText.trim()) {
      return [];
    }

    const data = JSON.parse(rawText);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Search Scripture Error:", error);
    return [];
  }
}
