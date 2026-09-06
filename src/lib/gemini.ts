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

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned status ${res.status}`);
    }

    const data = await res.json();
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

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
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

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Search Scripture Error:", error);
    return [];
  }
}
