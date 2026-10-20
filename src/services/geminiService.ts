import { Inquiry, LiteraryWorkExport, ThenVsNowData } from "../types";
import { reportIncident } from "./incidentService";

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
    // If parse failed (e.g. empty body or truncated JSON), retry with cache-busting
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return safeFetchJson<T>(url, init, retries - 1);
    }
    if (!rawText || rawText.trim().length === 0) {
      throw new Error(`The backend service returned an empty response (${response.status}). On hosts like Render, ensure the app is deployed as a Node.js "Web Service" with GEMINI_API_KEY configured, rather than a "Static Site".`);
    }
    const snippet = rawText.slice(0, 100).replace(/\s+/g, ' ');
    throw new Error(`Invalid JSON received from server (${response.status}): ${snippet}`);
  }

  return parsed as T;
}

/**
 * Direct binary/blob fetcher for Gemini Scholar TTS
 * Uses native streaming audio/wav to avoid massive JSON base64 payloads and parsing errors.
 */
export async function fetchScholarAudioBlob(
  text: string,
  personaName: string,
  gender: 'male' | 'female'
): Promise<Blob | null> {
  const cleanText = text
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

  if (!cleanText) return null;

  try {
    const response = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'audio/wav, application/json'
      },
      cache: 'no-store',
      body: JSON.stringify({ text: cleanText, personaName, gender }),
    });

    if (!response.ok) {
      console.warn(`Gemini TTS endpoint returned HTTP ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';

    // Direct binary audio/wav stream from server (fastest & most reliable)
    if (contentType.includes('audio/')) {
      const blob = await response.blob();
      if (blob && blob.size > 44) {
        return blob;
      }
      return null;
    }

    // Fallback: If server responded with JSON payload
    const rawText = await response.text();
    if (!rawText || rawText.trim().length === 0) {
      console.warn("Gemini TTS response body was empty, falling back to browser voice");
      return null;
    }

    try {
      const parsed = JSON.parse(rawText.trim());
      if (parsed?.audioBase64) {
        const binaryString = atob(parsed.audioBase64);
        const len = binaryString.length;
        const pcmBytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          pcmBytes[i] = binaryString.charCodeAt(i);
        }

        // If the binary already starts with "RIFF", it is already a complete WAV file from Gemini 3.8
        if (pcmBytes.length >= 4 && pcmBytes[0] === 0x52 && pcmBytes[1] === 0x49 && pcmBytes[2] === 0x46 && pcmBytes[3] === 0x46) {
          return new Blob([pcmBytes], { type: 'audio/wav' });
        }

        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
        const blockAlign = (numChannels * bitsPerSample) / 8;
        const dataSize = pcmBytes.length;
        const totalSize = 44 + dataSize;
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, totalSize - 8, true);
        view.setUint32(8, 0x57415645, false); // "WAVE"
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, dataSize, true);
        const wavBytes = new Uint8Array(buffer);
        wavBytes.set(pcmBytes, 44);
        return new Blob([buffer], { type: 'audio/wav' });
      }
    } catch (parseErr) {
      console.warn("Fallback JSON parse notice:", parseErr);
    }

    return null;
  } catch (err) {
    console.warn("Scholar audio fetch notice (gracefully using browser voice):", err);
    return null;
  }
}

export async function generateScholarTTS(
  text: string,
  personaName: string,
  gender: 'male' | 'female'
): Promise<string> {
  const cleanText = text
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

  if (!cleanText) return "";

  try {
    const data = await safeFetchJson<{ audioBase64?: string }>('/api/gemini/tts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ text: cleanText, personaName, gender }),
    });

    return data?.audioBase64 || "";
  } catch (error) {
    console.warn("Gemini Scholar TTS notice (falling back gracefully):", error);
    return "";
  }
}

export async function chatWithSanctuary(
  message: string, 
  history: { role: 'user' | 'model', text: string }[],
  recentInquiries: Inquiry[]
) {
  try {
    const data = await safeFetchJson<{ text?: string }>('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, recentInquiries }),
    });

    return data.text || '';
  } catch (error) {
    console.error("Gemini Scholar Chat Error:", error);
    reportIncident({
      error,
      service: 'Gemini AI',
      endpoint: 'chatWithSanctuary (Sanctuary Scholar)',
      details: { message, historyCount: history.length }
    }).catch(err => console.warn("Could not report incident:", err));
    throw error;
  }
}

export function getThematicImagesForTopic(sessionName: string, conversationText: string): { title: string; caption: string; imageUrl: string }[] {
  const text = (sessionName + " " + conversationText).toLowerCase();
  
  // -1. Ethiopian Bible, Asher Wilson, Enoch, Jubilees, Meqabyan, Ge'ez, Aksum, Tewahedo
  if (text.includes("ethiopia") || text.includes("asher wilson") || text.includes("enoch") || text.includes("jubilee") || text.includes("meqabyan") || text.includes("ge'ez") || text.includes("aksum") || text.includes("tewahedo")) {
    return [
      {
        title: "Ancient Illuminated Ethiopian Ge'ez Manuscript",
        caption: `Sacred illuminated Ge'ez biblical parchment from the ancient Aksumite tradition, honoring the foundational 81-book scriptural heritage in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Historic Monasteries & Cross of Lalibela",
        caption: `Centuries-old Ethiopian rock-hewn sanctuary and processional cross, testifying to the preserved apostolic canon in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 0. Judah, Joseph, Lion of Judah, Patriarchs, Genesis, Jacob, Egypt, Benjamin, Reconciliation, Brother
  if (text.includes("judah") || text.includes("joseph") || text.includes("lion") || text.includes("patriarch") || text.includes("genesis") || text.includes("jacob") || text.includes("benjamin") || text.includes("pharaoh") || text.includes("reconciliation") || text.includes("intercession") || text.includes("plea")) {
    return [
      {
        title: "Judah's Plea & Joseph's Reconciliation in Egypt",
        caption: `Sacred portrayal of Judah's sacrificial intercession before Joseph, embodying brotherly devotion, messianic lineage, and royal mercy in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Scepter of Judah & Patriarchal Covenant",
        caption: `Ancient illuminated manuscript depicting Jacob's blessing over the tribe of Judah and the promise of the royal scepter in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 1. Holy Communion, Last Supper, Eucharist, Bread and Wine, Covenant Table
  if (text.includes("communion") || text.includes("last supper") || text.includes("eucharist") || text.includes("bread") || text.includes("wine") || text.includes("chalice") || text.includes("body and blood") || text.includes("passover") || text.includes("table of the lord") || text.includes("covenant meal")) {
    return [
      {
        title: "The Covenant Table & Golden Wheat Harvest",
        caption: `Golden sheaves of grain representing the bread of life broken for humanity, reflecting the sacred communion theme of "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Illuminated Manuscripts of the New Covenant",
        caption: `Ancient sacred scriptures opened to the institution of the Lord's Supper, illuminating the theological depth of ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 2. Baptism, Holy Waters, Jordan River, Regeneration, Cleansing
  if (text.includes("baptis") || text.includes("jordan river") || text.includes("living water") || text.includes("cleansing") || text.includes("washing") || text.includes("fountain")) {
    return [
      {
        title: "Sacred Waters of the Jordan River",
        caption: `Serene flowing waters of the Jordan, commemorating the baptism of Jesus and the sacrament of spiritual rebirth in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Living Water & Divine Grace",
        caption: `Cascading crystal waters testifying to the washing of regeneration and eternal life promised in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 3. Beatitudes, Sermon on the Mount, Galilee Shoreline, Kingdom
  if (text.includes("beatitude") || text.includes("sermon on the mount") || text.includes("blessed are") || text.includes("salt and light") || text.includes("blessing")) {
    return [
      {
        title: "The Mount of Beatitudes & Galilean Shore",
        caption: `Lush hills overlooking the Sea of Galilee where Jesus delivered the Sermon on the Mount, central to "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Light of the World & Divine Wisdom",
        caption: `Morning sunbeams reflecting off Galilean waters, symbolizing the moral and spiritual kingdom teachings in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 4. Moses, Exodus, Law, Sinai, Tabernacle, Torah, Decalogue
  if (text.includes("moses") || text.includes("exodus") || text.includes("commandment") || text.includes("sinai") || text.includes("red sea") || text.includes("egypt") || text.includes("tabernacle") || text.includes("torah") || text.includes("ark of the covenant") || text.includes("wilderness")) {
    return [
      {
        title: "Wilderness of Sinai & Covenant Mountain",
        caption: `The rugged limestone peaks of Mount Sinai, where Moses received the Ten Commandments, supporting the study of "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Sacred Manuscripts of the Law",
        caption: `Illuminated ancient parchment scrolls containing the books of the Torah and Mosaic statutes in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 5. Paul, Epistles, Missionary Journeys, Romans, Corinthians, Galatians, Ephesians, Philippians, Colossians, Timothy
  if (text.includes("paul") || text.includes("epistle") || text.includes("roman") || text.includes("corinthian") || text.includes("galatian") || text.includes("ephesian") || text.includes("philippian") || text.includes("colossian") || text.includes("thessalonian") || text.includes("timothy") || text.includes("titus") || text.includes("missionary") || text.includes("damascus") || text.includes("apostle")) {
    return [
      {
        title: "Roman Roads & Missionary Journeys of Saint Paul",
        caption: `Ancient Roman stone highways and Mediterranean sea routes traversed by Saint Paul during his apostolic letters in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Apostolic Codex & Early Church Epistles",
        caption: `Classical papyrus epistolary scroll symbolizing the Pauline letters sent to early Christian assemblies in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 6. David, Psalms, Worship, Music, Harp, Solomon, Zion, Praise
  if (text.includes("david") || text.includes("psalm") || text.includes("harp") || text.includes("worship") || text.includes("sing") || text.includes("solomon") || text.includes("samuel") || text.includes("zion") || text.includes("praise") || text.includes("music")) {
    return [
      {
        title: "City of David & Historic Zion Citadel",
        caption: `Ancient stone citadel of Jerusalem, heart of the Davidic kingdom and royal psalmists in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Acoustic Praise & Lyrical Psalms",
        caption: `Stringed melodies and songs of devotion reflecting the poetic heart of the Book of Psalms in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 7. Armor of God, Spiritual Warfare, Fortress, Shield, Defense
  if (text.includes("armor of god") || text.includes("spiritual warfare") || text.includes("shield of faith") || text.includes("helmet of salvation") || text.includes("sword of the spirit") || text.includes("fortress") || text.includes("stronghold")) {
    return [
      {
        title: "Ancient Citadel & Shield of Faith",
        caption: `Unshakable stone fortress symbolizing the divine shield of faith and spiritual protection described in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Sword of the Spirit & Divine Truth",
        caption: `Radiant light on scripture parchment representing the sword of the Spirit, which is the word of God in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 8. Parables, Sower, Shepherd, Vineyard, Harvest, Prodigal, Samaritan
  if (text.includes("parable") || text.includes("sower") || text.includes("shepherd") || text.includes("vineyard") || text.includes("harvest") || text.includes("wheat") || text.includes("prodigal") || text.includes("samaritan") || text.includes("mustard") || text.includes("sheep")) {
    return [
      {
        title: "The Good Shepherd & Pastoral Judean Hills",
        caption: `Gentle pastoral landscapes of the Holy Land reflecting Jesus' parables of the Good Shepherd and lost sheep in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Golden Wheat Harvest & Parable Fields",
        caption: `Fertile agricultural fields representing the Sower, the mustard seed, and the Kingdom of Heaven in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 9. Cross, Crucifixion, Atonement, Passion, Grace, Salvation, Resurrection, Tomb
  if (text.includes("cross") || text.includes("passion") || text.includes("calvary") || text.includes("golgotha") || text.includes("crucifixion") || text.includes("atonement") || text.includes("grace") || text.includes("salvation") || text.includes("resurrection") || text.includes("tomb") || text.includes("easter")) {
    return [
      {
        title: "Mount Calvary & The Redeeming Cross",
        caption: `Solemn silhouette of the cross at sunset, commemorating the ultimate sacrifice and divine grace in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "The Empty Tomb & Resurrection Dawn",
        caption: `Radiant morning light breaking into an ancient stone tomb, witnessing Christ's victory over death in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 10. Holy Spirit, Pentecost, Flames, Dove, Renewal, Anointing
  if (text.includes("holy spirit") || text.includes("pentecost") || text.includes("tongues of fire") || text.includes("comforter") || text.includes("anointing") || text.includes("spirit")) {
    return [
      {
        title: "Heavenly Rays & Holy Spirit Presence",
        caption: `Divine beams of light breaking through dark clouds, illustrating the outpouring of the Holy Spirit in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Sanctuary Illumination & Spiritual Renewal",
        caption: `Warm candlelight and divine illumination testifying to spiritual transformation and comfort in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 11. Wisdom, Proverbs, Ecclesiastes, Job, Suffering, Trials, Patience
  if (text.includes("wisdom") || text.includes("proverb") || text.includes("ecclesiastes") || text.includes("job") || text.includes("suffering") || text.includes("trial") || text.includes("patience") || text.includes("understanding")) {
    return [
      {
        title: "Solomonic Wisdom & Illuminated Study",
        caption: `A quiet sanctuary of classical wisdom literature, pondering the fear of the Lord and understanding in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Quiet Reflection & Divine Sovereignty",
        caption: `Ancient olive groves providing peaceful solace for theological reflection on human trials in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 12. Prophets, Prophecy, Isaiah, Jeremiah, Ezekiel, Daniel, Revelation, Patmos
  if (text.includes("prophet") || text.includes("prophecy") || text.includes("isaiah") || text.includes("jeremiah") || text.includes("ezekiel") || text.includes("daniel") || text.includes("revelation") || text.includes("vision") || text.includes("patmos") || text.includes("end times")) {
    return [
      {
        title: "Prophetic Watchtower & Heavenly Vision",
        caption: `Solitary high peaks under dramatic skies, symbolizing the prophetic watchmen announcing messianic hope in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Scrolls of Revelation & Apocalyptic Light",
        caption: `Illuminated ancient codex containing prophetic apocalyptic visions and the New Jerusalem promise in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 13. Creation, Genesis, Adam, Eden, Noah, Ark, Cosmos, Nature
  if (text.includes("creation") || text.includes("genesis") || text.includes("adam") || text.includes("eden") || text.includes("noah") || text.includes("ark") || text.includes("flood") || text.includes("nature") || text.includes("stars") || text.includes("cosmos")) {
    return [
      {
        title: "The Heavens Declare Creation's Glory",
        caption: `The vast celestial expanse and star-filled cosmos celebrating Genesis creation in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Living Waters of Paradise",
        caption: `Pure cascading waters and lush flora symbolizing the pristine Garden of Eden and divine grace in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 14. Prayer, Fasting, Altar, Intercession, Devotion
  if (text.includes("prayer") || text.includes("fasting") || text.includes("sanctuary") || text.includes("altar") || text.includes("intercession") || text.includes("devotion")) {
    return [
      {
        title: "Sanctuary of Intercession & Prayer",
        caption: `Warm candlelight illuminating a quiet house of prayer during heartfelt communion with God in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Beam of Heavenly Light & Grace",
        caption: `Luminous light breaking through dark clouds, representing divine answer to prayer and steadfast faith in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 15. Jesus, Gospels, Disciples, Miracles, Savior, Christ
  if (text.includes("jesus") || text.includes("gospel") || text.includes("christ") || text.includes("galilee") || text.includes("disciples") || text.includes("miracle") || text.includes("savior")) {
    return [
      {
        title: "Sea of Galilee at Sunrise",
        caption: `Serene shoreline of Galilee where Jesus called His disciples and performed divine miracles, central to "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Dawn of the Resurrection",
        caption: `Radiant morning light entering an ancient stone sanctuary, testifying to Christ's gospel victory in ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // 16. Jerusalem, Temple, Holy Land, Israel, Gethsemane
  if (text.includes("jerusalem") || text.includes("temple") || text.includes("holy land") || text.includes("hebrew") || text.includes("israel") || text.includes("gethsemane")) {
    return [
      {
        title: "Historic Gates of Old Jerusalem",
        caption: `Ancient limestone arches and battlements of Jerusalem, city of prophets and messianic promises in "${sessionName}".`,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Venerable Olive Grove of Gethsemane",
        caption: `Ancient olive trees standing in quiet meditation near Jerusalem, rooted in biblical history for ${sessionName}.`,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // General spiritual fallback
  return [
    {
      title: "Sacred Manuscripts & Scriptures",
      caption: `Illuminated biblical text and open scriptures representing divine truth in the study of "${sessionName}".`,
      imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Sanctuary of Study & Meditation",
      caption: `Peaceful environment reserved for spiritual contemplation and scholarly exegesis of ${sessionName}.`,
      imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80"
    }
  ];
}

export async function generateLiteraryWorkExport(
  sessionName: string,
  messages: { role: 'user' | 'model'; text: string }[]
): Promise<LiteraryWorkExport> {
  const conversationText = messages
    .slice(-15) // take up to last 15 messages for prompt context
    .map(m => `${m.role === 'user' ? 'Pilgrim' : 'Sanctuary Scholar'}: ${m.text}`)
    .join('\n\n');

  const themeSpecificImages = getThematicImagesForTopic(sessionName, conversationText);

  const fallbackData: LiteraryWorkExport = {
    themeTitle: `Literary Exegesis: ${sessionName || 'Sanctuary Study'}`,
    subtitle: "A Formal Synthesis of Scripture, Lineage, and Scholarly Commentary",
    executiveSummary: `This literary work documents the spiritual and intellectual dialogue conducted within the XeJesUs Sanctuary regarding "${sessionName}". The exchange examines fundamental theological principles, connecting ancient covenant promises to contemporary Christian practice. Through rigorous exegesis, the study illuminates how scripture informs personal faith and community worship.`,
    thematicAnalysis: `The thematic core of this discussion hinges upon divine providence, biblical hermeneutics, and covenantal continuity. By tracing primary scriptures and scholarly consensus, we observe a harmonious thread uniting early patriarchs, prophetic revelations, and apostolic doctrine.`,
    familyTree: [
      {
        generation: "1st Generation",
        person: "Abraham",
        biblicalTitle: "Father of the Faithful",
        significance: "Received the everlasting covenant promise in Genesis 12, establishing the line of faith.",
        keyScripture: "Genesis 12:1-3"
      },
      {
        generation: "2nd Generation",
        person: "Isaac",
        biblicalTitle: "Son of Promise",
        significance: "Carried forward the patriarchal covenant and foreshadowed sacrificial obedience.",
        keyScripture: "Genesis 22:1-14"
      },
      {
        generation: "3rd Generation",
        person: "Jacob (Israel)",
        biblicalTitle: "Patriarch of the Twelve Tribes",
        significance: "Wrestled with God at Peniel and fathered the twelve tribes of Israel.",
        keyScripture: "Genesis 32:28"
      },
      {
        generation: "Royal Lineage",
        person: "King David",
        biblicalTitle: "The Royal Psalmist",
        significance: "Established the messianic kingdom lineage through the Davidic Covenant.",
        keyScripture: "2 Samuel 7:12-16"
      },
      {
        generation: "Messianic Fulfillment",
        person: "Jesus Christ",
        biblicalTitle: "The Messiah & Prince of Peace",
        significance: "Fulfilled the law and prophets, establishing the New Covenant for all believers.",
        keyScripture: "Matthew 1:1"
      }
    ],
    scholarlyWorks: [
      {
        title: "The Most Complete Ethiopian Bible In English",
        author: "Asher Wilson",
        era: "Ancient Ge'ez Aksumite Canon / Contemporary English Translation",
        summary: "The definitive English compilation of the complete 81-book Ethiopian biblical canon, containing 1 Enoch, Jubilees, 1-3 Meqabyan, and ancient apostolic scriptures preserved by the Ethiopian Orthodox Tewahedo Church.",
        relevance: "Serves as a Primary Foundational Source for the XeJesUs Academic & Spiritual Citation Framework, providing crucial ancient Second Temple and apostolic context."
      },
      {
        title: "The Antiquities of the Jews",
        author: "Flavius Josephus",
        era: "1st Century AD",
        summary: "A monumental twenty-volume historiographical treatise recording the history of the Jewish people from creation to the Jewish War.",
        relevance: "Provides invaluable socio-political and historical context surrounding the temple period and Jewish messianic expectations."
      },
      {
        title: "De Civitate Dei (The City of God)",
        author: "Saint Augustine of Hippo",
        era: "5th Century Patristic Era",
        summary: "A masterpiece of Christian philosophy contrasting the earthly city with the heavenly City of God.",
        relevance: "Offers profound theological insights into how believers navigate worldly anxieties while anchoring their hope in divine eternity."
      }
    ],
    youtubeVideos: [
      {
        title: "Understanding Biblical Covenants & Theology",
        channel: "The BibleProject",
        searchQuery: "BibleProject Covenant Theology",
        url: "https://www.youtube.com/results?search_query=BibleProject+Covenant+Theology",
        description: "An animated, in-depth visual breakdown exploring how Biblical covenants unify the Old and New Testaments."
      },
      {
        title: "Historical & Textual Context of the Gospels",
        channel: "Yale Divinity Courses",
        searchQuery: "Yale Divinity School New Testament History",
        url: "https://www.youtube.com/results?search_query=Yale+Divinity+School+New+Testament+History",
        description: "Academic lectures analyzing the manuscript history, cultural background, and literary genres of Biblical texts."
      },
      {
        title: "The Historical World of First-Century Judea",
        channel: "Academic Christian History",
        searchQuery: "First Century Judea History Bible",
        url: "https://www.youtube.com/results?search_query=First+Century+Judea+History+Bible",
        description: "Documentary exploring the archaeological discoveries and socio-cultural environment of Jesus and His disciples."
      }
    ],
    images: themeSpecificImages
  };

  try {
    const parsed = await safeFetchJson<any>('/api/gemini/literary-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionName,
        conversationText,
        fallbackData,
      }),
    });

    if (parsed && typeof parsed === 'object') {
        const imagesWithFallback = Array.isArray(parsed.images) && parsed.images.length > 0
          ? parsed.images.map((img: any, idx: number) => {
              const imgContext = `${img.title || ''} ${img.caption || ''} ${sessionName} ${conversationText}`;
              const specificThemeImages = getThematicImagesForTopic(sessionName, imgContext);
              const chosenThemeImg = specificThemeImages[idx % specificThemeImages.length] || themeSpecificImages[idx % themeSpecificImages.length];

              return {
                title: (img.title && img.title.length > 3) ? img.title : chosenThemeImg.title,
                caption: (img.caption && img.caption.length > 10) ? img.caption : chosenThemeImg.caption,
                imageUrl: chosenThemeImg.imageUrl
              };
            })
          : themeSpecificImages;

        return {
          ...fallbackData,
          ...parsed,
          familyTree: Array.isArray(parsed.familyTree) && parsed.familyTree.length > 0 ? parsed.familyTree : fallbackData.familyTree,
          scholarlyWorks: Array.isArray(parsed.scholarlyWorks) && parsed.scholarlyWorks.length > 0 ? parsed.scholarlyWorks : fallbackData.scholarlyWorks,
          youtubeVideos: Array.isArray(parsed.youtubeVideos) && parsed.youtubeVideos.length > 0 ? parsed.youtubeVideos : fallbackData.youtubeVideos,
          images: imagesWithFallback,
        };
      }
  } catch (err) {
    console.warn("Failed to generate literary work from Gemini, using fallback data:", err);
    reportIncident({
      error: err,
      service: 'Gemini AI',
      endpoint: 'generateLiteraryWorkExport (Literary Synthesis)',
      details: { sessionName, messageCount: messages.length }
    }).catch(e => console.warn("Could not report incident:", e));
  }

  return fallbackData;
}

/**
 * Generates an in-depth "Then vs Now" archaeological, theological, and regional study
 * comparing biblical antiquity to contemporary modern reality.
 */
export async function generateThenVsNowStudy(
  query: string,
  category: 'place' | 'people' | 'event' | 'phrase' = 'place'
): Promise<ThenVsNowData> {
  try {
    const result = await safeFetchJson<ThenVsNowData>('/api/gemini/then-vs-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, category }),
    });

    return result;
  } catch (err: any) {
    console.error("Failed to generate Then vs Now study:", err);
    reportIncident({
      error: err,
      service: 'Gemini AI',
      endpoint: 'generateThenVsNowStudy',
      details: { query, category }
    }).catch(e => console.warn("Could not report incident:", e));
    throw err;
  }
}

