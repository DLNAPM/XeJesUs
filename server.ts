import express from "express";
import path from "path";
import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const execAsync = promisify(exec);

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in process.env");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Candidate models in priority order (fastest and most reliable first)
  const CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
  ];

  // Helper for racing a model call against a timeout
  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      const res = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      return res;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  // Graceful theological scholar fallback if API calls or networks temporarily fail
  function getSanctuaryFallbackResponse(userPrompt: string): string {
    const promptLower = userPrompt.toLowerCase();

    if (promptLower.includes("matthew 16") || (promptLower.includes("rock") && (promptLower.includes("peter") || promptLower.includes("church")))) {
      return `### The Rock and the Unshakeable Church (Matthew 16:18)

Grace and peace to you, pilgrim. When Simon Peter uttered the divine confession, *"You are the Christ, the Son of the living God"* (**Matthew 16:16**), our Lord responded:

> *"And I tell you, you are Peter, and on this rock I will build my church, and the gates of hell shall not prevail against it."* (**Matthew 16:18**)

* **The Greek Wordplay (*Petros* vs. *Petra*):** Jesus addresses Simon as **Petros** (G4074), denoting an isolated stone or pebble, but declares that His church is built upon **petra** (G4073)—a massive, immovable bedrock cliff.
* **Patristic Witness:** St. Augustine (*Retractationes* 1.21.1) and St. John Chrysostom affirmed that this foundation rock is Christ Himself and the God-given revelation of His divine Sonship which Peter confessed. St. Paul corroborates this in **1 Corinthians 3:11**: *"For no other foundation can anyone lay than that which is laid, which is Jesus Christ."*
* **The Gates of Hades:** Spoken near the pagan cliff grotto of Pan at Caesarea Philippi, the phrase declares that the forces of death and darkness can never overpower or undo the living assembly of God.
* **Pastoral Encouragement:** Anchor your soul today upon Christ the Rock. Earthly kingdoms falter, but His church and His covenant promises endure forever.`;
    }

    if (promptLower.includes("leviticus 21") || (promptLower.includes("aaron") && (promptLower.includes("defect") || promptLower.includes("blemish") || promptLower.includes("reject")))) {
      return `### Divine Holiness and Typology in Leviticus 21:16–24

Grace and peace to you, pilgrim. In **Leviticus 21:16–24**, the Lord commands that descendants of Aaron with physical defects (*mum*, H3971) shall not draw near (*nagash*) to present the food offerings at the altar.

* **Typological Symbolism:** The Old Covenant altar required visible perfection not as an assessment of personal moral worth, but as an earthly shadow representing the flawless moral holiness of God. The physical priest prefigured **Jesus Christ**, the true and spotless High Priest (**Hebrews 7:26; 1 Peter 1:19**).
* **Covenant Mercy & Inclusion:** Crucially, God explicitly commands in verse 22: *"He may eat the food of his God, both of the most holy and of the holy."* Aaron's descendants with blemishes were never cast out, impoverished, or dehumanized; they retained full priestly dignity, sustenance, and family inheritance.
* **Fulfillment in Christ:** Under the New Covenant, Jesus actively laid His hands on the blind, the lame, and the blemished, restoring them and making all who believe a "royal priesthood" (**1 Peter 2:9**). In Him, our infirmities become vessels for His divine strength (**2 Corinthians 12:9**).`;
    }

    if (promptLower.includes("melchizedek") || promptLower.includes("hebrew") || promptLower.includes("priest")) {
      return `### Melchizedek: The Eternal Priest-King

Grace and peace to you, pilgrim. **Melchizedek** appears in **Genesis 14:18–20** as the King of Salem and "Priest of God Most High" (*El Elyon*), presenting bread and wine and blessing Abraham.

In **Psalm 110:4** and **Hebrews 7**, Melchizedek is unveiled as the supreme biblical type of the eternal priesthood of our Lord Jesus Christ. Unlike the Levitical priests descended from Aaron who served under the Law and were hindered by death, Christ is consecrated High Priest forever by divine oath, possessing an **indestructible life** (**Hebrews 7:16, 24–25**).

* **Historical & Patristic Witness:** St. Augustine observed that the bread and wine of Melchizedek foreshadowed the sacramental communion of Christ, while John Calvin noted that scripture's silence regarding Melchizedek's genealogy prefigures the eternal divinity of the Son of God.
* **Pastoral Application:** Rest in the absolute security of having a Great High Priest who lives forever to make intercession for you before the Father. He represents you perfectly and His grace never fails.`;
    }

    if (promptLower.includes("cross") || promptLower.includes("deny") || promptLower.includes("follow") || promptLower.includes("disciple")) {
      return `### The Call to Discipleship: Taking Up Your Cross

Grace and peace to you, pilgrim. When Jesus declared, *"If anyone would come after me, let him deny himself and take up his cross daily and follow me"* (**Luke 9:23**), He spoke to the heart of Christian discipleship.

* **Historical Weight:** In first-century Judea, bearing a cross was not an abstract ornament or minor irritation; it was the visible mark of a condemned soul surrendered completely to sovereign authority.
* **Theological Meaning:** To "deny oneself" (*aparneomai*, G533) means dethroning self-will and enthroning Christ as Lord. St. Paul echoes this in **Galatians 2:20**: *"I have been crucified with Christ. It is no longer I who live, but Christ who lives in me."*
* **The Daily Resurrection:** Dietrich Bonhoeffer observed in *The Cost of Discipleship* that "when Christ calls a man, he bids him come and die"—yet this death to sin yields the fullness of indestructible spiritual life and joy in the Holy Spirit.`;
    }

    if (promptLower.includes("grace") || promptLower.includes("faith") || promptLower.includes("justif") || promptLower.includes("saved")) {
      return `### Sola Gratia: Justification by Faith in Christ

Grace and peace to you, pilgrim. The central heartbeat of apostolic theology is captured in **Ephesians 2:8–9**: *"For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast."*

* **Biblical Lexicon:** Grace (*charis*, G5485) represents the unmerited, lavish favor of God toward unworthy sinners. Faith (*pistis*, G4102) is the empty hand that clings to Christ's finished work on the cross.
* **Classical Consensus:** St. Augustine contended vigorously against Pelagianism, demonstrating that even our desire to seek God originates in sovereign grace. Martin Luther called justification by faith the article by which the church stands or falls.
* **Living Fruit:** True faith is never sterile; as **Ephesians 2:10** and **James 2** attest, saving faith overflows in genuine works of love, justice, and mercy.`;
    }

    return `### Scriptural Reflections on: "${userPrompt}"

Grace and peace to you, pilgrim. I have weighed your inquiry concerning **"${userPrompt}"** in light of sacred canonical Scripture and church history.

1. **The Canonical Foundation:** As the Psalmist proclaims, *"Your word is a lamp to my feet and a light to my path"* (**Psalm 119:105**), and the Apostle Paul affirms in **2 Timothy 3:16–17** that all Scripture is God-breathed (*theopneustos*), profitable for doctrine, reproof, correction, and training in righteousness.
2. **Theological Illumination:** Classical Christian theologians from **St. Augustine** and **St. John Chrysostom** to **C.S. Lewis** remind us that difficult questions and deep seekings are the very threshold where God meets us. The Holy Spirit illuminates the written Word, guiding seeking disciples into eternal truth (**John 16:13**).
3. **Pastoral Discipleship:** Take courage today that no sincere spiritual inquiry goes unnoticed before the Lord. Bring this meditation before Him in quiet prayer, and let us continue to examine the sacred text together verse by verse.`;
  }

  // 1. Sanctuary Scholar Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], recentInquiries = [] } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "A message is required" });
      }

      const trimmedMessage = message.trim();
      const ai = getAiClient();
      const contextStrings = Array.isArray(recentInquiries)
        ? recentInquiries
            .filter((inq: any) => inq && (inq.scripture || inq.query))
            .slice(0, 5)
            .map(
              (inq: any) =>
                `Scripture: ${inq.scripture || ""}\nQuestion: ${inq.query || ""}\nKey Insights: ${String(inq.interpretation || "").slice(0, 300)}`
            )
            .join("\n\n---\n\n")
        : "";

      let contextSection = "";
      if (contextStrings.trim()) {
        contextSection = `\nPilgrim's Past Saved Inquiries (REFERENCE ARCHIVE ONLY - ONLY refer to these if the pilgrim explicitly asks about their past studies, seekings, or history):\n${contextStrings}\n`;
      }

      const systemInstruction = `You are the "Sanctuary Scholar", a distinguished, reverent Christian biblical scholar, church historian, and pastoral guide for the XeJesUs app.
Your highest duty is to provide pilgrims with deep, authentic, scripture-saturated, and intellectually rigorous answers to their questions.

ACADEMIC & SPIRITUAL CITATIONS FRAMEWORK (THE 5 PRIMARY FOUNDATIONAL SOURCES):
You MUST systematically synthesize insights from all five core canonical, historical, and scholarly authorities:
1. Source 1: Primary Canonical Scriptures — Direct chapter & verse citations across Old & New Testament Canons (Genesis through Revelation) contextualized redemptively.
2. Source 2: Original Linguistic Lexicons & Roots — Original Hebrew, Aramaic, and Koine Greek word etymologies, root verbs, and theological nuances via Strong’s, BDB (Brown-Driver-Briggs), and BDAG (Bauer-Danker-Arndt-Gingrich) concordances and lexicons.
3. Source 3: Patristic & Classical Exegesis — Early Church Fathers (St. Augustine, St. John Chrysostom, Athanasius, Irenaeus, Basil) and classical commentators (Matthew Henry, Charles Spurgeon, John Calvin, C.S. Lewis).
4. Source 4: Historical & Archaeological Records — Flavius Josephus histories (Antiquities of the Jews, The Jewish War), Levant geography, Ancient Roman provincial/road logs, and archaeological excavations.
5. Source 5: Systematic & Biblical Theologies & Practical Discipleship — Cohesive doctrinal theology (Covenant, Reformed, Arminian, Wesleyan frameworks) paired with contemporary discipleship and real-world ethical application.

PRIMARY DIRECTIVES:
- DIRECTLY AND SPECIFICALLY ANSWER the pilgrim's immediate question or prompt. Never deflect, give brief or vague answers, or repeat evasive phrases.
- Provide thorough, scholarly, multi-dimensional answers that weave together theological insight, linguistic depth (Hebrew/Greek), historical context (ancient Near East/Rome/Josephus), and church fathers.
- Conclude with an inspiring, practical application for modern Christian discipleship.
${contextSection}
Guidelines:
1. Speak with reverence, warmth, intellectual integrity, and pastoral encouragement.
2. Structure your response with clean formatting, bold theological terms, and clear headings.
3. Always keep your focus fixed on the pilgrim's actual question.`;

      // Filter and sanitize chat history - strip out any previous error or system greeting text
      const rawHistory: { role: string; text: string }[] = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          if (!h || !h.text || (h.role !== "user" && h.role !== "model")) continue;
          const text = String(h.text).trim();
          if (
            !text ||
            text.includes("connection to the sanctuary was interrupted") ||
            text.includes("experiencing high demand") ||
            text.includes("Greetings, pilgrim") ||
            text.includes("Sanctuary Scholar returned an empty response") ||
            text.includes("Sanctuary Scholar communication error") ||
            text.includes("Service temporarily unavailable") ||
            text.startsWith("Forgive me") ||
            text.startsWith("I'm sorry, I couldn't find an answer")
          ) {
            continue;
          }
          rawHistory.push({ role: h.role, text });
        }
      }

      // Ensure history strictly begins with a 'user' turn and alternates
      const formattedHistory: { role: string; parts: { text: string }[] }[] = [];
      for (const item of rawHistory) {
        if (formattedHistory.length === 0) {
          if (item.role === "user") {
            formattedHistory.push({ role: "user", parts: [{ text: item.text }] });
          }
        } else {
          const last = formattedHistory[formattedHistory.length - 1];
          if (last.role === item.role) {
            last.parts[0].text += "\n\n" + item.text;
          } else {
            formattedHistory.push({ role: item.role, parts: [{ text: item.text }] });
          }
        }
      }

      // If formattedHistory ends with a 'user' turn, remove it because contents will supply the final user turn
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
        formattedHistory.pop();
      }

      const contents = [
        ...formattedHistory,
        { role: "user", parts: [{ text: trimmedMessage }] },
      ];

      let responseText = "";
      let lastError: any = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          const timeoutMs = 12000;
          const result = await withTimeout(
            ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
                maxOutputTokens: 3000,
              },
            }),
            timeoutMs,
            `Chat on ${model}`
          );

          let text = result.text || "";
          if (!text && result.candidates?.[0]?.content?.parts) {
            text = result.candidates[0].content.parts
              .map((p: any) => p.text || "")
              .filter(Boolean)
              .join("\n\n")
              .trim();
          }

          if (text && text.trim()) {
            responseText = text.trim();
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Chat model ${model} failed, trying next candidate:`, err?.message || err);
        }
      }

      if (!responseText) {
        console.warn("All candidate chat models failed to return text; providing grounded fallback response. Error was:", lastError?.message || lastError);
        responseText = getSanctuaryFallbackResponse(trimmedMessage);
      }

      return res.json({ text: responseText });
    } catch (error: any) {
      console.error("Sanctuary Chat API Error:", error);
      const fallback = getSanctuaryFallbackResponse(typeof req.body?.message === "string" ? req.body.message : "Scripture inquiry");
      return res.json({ text: fallback });
    }
  });

  // Grounded theological exegesis fallback generator ensuring pilgrims never receive empty or generic responses
  function getFallbackExegesis(scripture: string, queryText: string) {
    const combined = `${scripture} ${queryText}`.toLowerCase();
    const qText = queryText && queryText.trim() ? queryText.trim() : `What is the historical and theological meaning of ${scripture}?`;

    // 1. Matthew 16:18 / Peter / The Rock
    if (combined.includes("matthew 16") || (combined.includes("rock") && (combined.includes("peter") || combined.includes("church")))) {
      return {
        interpretation: `In Matthew 16:18, Jesus responds to the Apostle Peter's climactic confession ('You are the Christ, the Son of the living God') with the monumental declaration: 'And I tell you, you are Peter (Petros), and on this rock (petra) I will build my church, and the gates of hell shall not prevail against it.'

In directly answering your inquiry ('${qText}'):
The linguistic and theological consensus of ancient and classical commentators highlights a vital distinction:
1. The Greek Wordplay: Jesus uses 'Petros' (masculine, denoting an individual movable stone or pebble) for Simon, but shifts to 'petra' (feminine, denoting a massive, immovable bedrock cliff) for the foundation upon which the church is constructed.
2. St. Augustine (Retractationes I.21.1) famously clarified: 'Christ did not say: You are the rock (petra), but You are Peter (Petros). But the Rock was Christ, whom Simon confessed.'
3. St. John Chrysostom (Homilies on Matthew 54.2) affirmed that the rock is Peter's confession of faith in the deity of Christ: 'On this rock I will build my Church—that is, on the faith of his confession.'
4. Reformers such as John Calvin and commentators like Matthew Henry concurred that Christ Himself, as testified in the apostolic confession, is the sole immovable foundation of the covenant community.

Therefore, the rock is fundamentally Jesus Christ Himself and the God-given revelation of His messianic identity confessed by Peter, rather than Peter's fallible personal humanity.`,
        historicalContext: `Authored by Matthew (Levi) circa AD 60–68 in Antioch or Judea, primarily for Jewish believers and Gentile converts experiencing rising Roman tension and synagogue expulsion. Geographically and culturally, this dialogue occurred at Caesarea Philippi (Banias), a pagan center at the base of Mount Hermon featuring towering limestone bluffs, shrines to the god Pan, and a notorious cavern spring known to ancients as the 'Gates of Hades' (a portal to the underworld). In this pagan bastion of earthly power, Jesus boldly revealed the indestructible nature of His heavenly kingdom.`,
        grammarAnalysis: `Key Greek terminology in Matthew 16:18:
• Πέτρος (Petros, Strong's G4074): Masculine proper noun meaning a detached rock, stone, or pebble.
• πέτρᾳ (petra, Strong's G4073): Feminine noun meaning a massive living bedrock or cliff, contrasting with Petros.
• οἰκοδομήσω (oikodomēsō, Strong's G3618): Future active indicative of oikodomeō, expressing Christ's ongoing, sovereign, personal construction of His people.
• ἐκκλησίαν (ekklēsian, Strong's G1577): Accusative singular of ekklēsia ('called-out assembly'), marking the first explicit appearance of the term in the Gospels.
• πύλαι ᾅδου (pylai hadou, Strong's G4439 / G86): 'Gates of Hades/death', an ancient idiom for the aggressive powers of darkness and physical mortality, which will never overcome the Church.`,
        literaryGenre: `Gospel Historical Narrative featuring Messianic Commission and Prophetic Discourse.`,
        godIntent: `God's divine intent in Matthew 16:18 is to establish the absolute security, divine origin, and indestructible nature of His Church. By anchoring the Church to the bedrock confession of Jesus as the eternal Son of God, God assures the seeking believer that no cultural chaos, demonic opposition, or physical death can ever overthrow His redeemed people.`,
        crossReferences: [
          "1 Corinthians 3:11 - For no other foundation can anyone lay than that which is laid, which is Jesus Christ.",
          "Ephesians 2:20 - Having been built on the foundation of the apostles and prophets, Jesus Christ Himself being the chief cornerstone.",
          "1 Peter 2:4-6 - Coming to Him as to a living stone, rejected indeed by men, but chosen by God and precious.",
          "Isaiah 28:16 - Behold, I lay in Zion a stone for a foundation, a tried stone, a precious cornerstone, a sure foundation.",
          "Psalm 118:22 - The stone which the builders rejected has become the chief cornerstone."
        ],
        geography: {
          location: "Caesarea Philippi (Banias)",
          thenDesc: "A bustling Greco-Roman city at the northern headwaters of the Jordan River, dominated by a massive limestone cliff grotto dedicated to Pan and the Augustus temple.",
          nowDesc: "Banias Nature Reserve and archaeological park in northern Israel / Golan Heights, displaying ancient Roman niches carved into the sheer cliff.",
          thenImageUrl: "https://image.pollinations.ai/prompt/historical%20biblical%20map%20of%20ancient%20Caesarea%20Philippi%20Banias%20Mount%20Hermon%20cliff%20sanctuary%20parchment?width=800&height=600&nologo=true",
          nowImageUrl: "https://image.pollinations.ai/prompt/modern%20archaeological%20view%20of%20Banias%20Caesarea%20Philippi%20springs%20and%20cliffside%20caves?width=800&height=600&nologo=true"
        },
        videoClipQuery: "Caesarea Philippi Matthew 16 on this rock I will build my church biblical archaeology documentary"
      };
    }

    // 2. Leviticus 21 / Aaron's Descendants with Physical Defects
    if (combined.includes("leviticus 21") || (combined.includes("aaron") && (combined.includes("defect") || combined.includes("blemish") || combined.includes("descendant")))) {
      return {
        interpretation: `In Leviticus 21:16-24, the Lord instructs Moses that no descendant of Aaron who has a physical blemish or defect (Hebrew: *mum*) may draw near to present the food offerings of the Lord at the altar.

In directly answering your inquiry ('${qText}'):
God's prohibition was neither a moral condemnation nor an emotional rejection of these men, but a vital typological and pedagogical statute:
1. Typology of the Spotless Mediator: The earthly Aaronic priesthood was an earthly shadow pointing toward the ultimate, spotless High Priest—Jesus Christ. Just as sacrificial animals were required to be without blemish (Leviticus 22:19-20), the priest ministering at the altar had to visually represent the uncorrupted moral and spiritual perfection of God.
2. Divine Holiness in Tangible Form: In the Old Covenant, internal spiritual realities were externalized through physical signs. Physical defects symbolized the brokenness and corruption introduced into creation by the Fall.
3. Sustaining Grace and Mercy: Crucially, Leviticus 21:22 explicitly guarantees that these men were NOT ostracized from covenant fellowship: 'He may eat the food of his God, both of the most holy and of the holy.' God graciously provided full sustenance and honour for them and their families; they were merely restrained from the public sacerdotal ministry at the veil and altar.
4. John Calvin noted in his commentary that God established these barriers not to mock human infirmity, but to teach the Israelites that nothing contaminated or fallen can approach the presence of the thrice-holy God without a flawless mediator.`,
        historicalContext: `Given by God through Moses at Mount Sinai circa 1446 or 1260 BC during Israel's encampment in the wilderness. The covenant community was transitioning from four centuries of Egyptian pagan polytheism into a consecrated kingdom of priests. In Egyptian and Near Eastern priesthoods, physical deformities were viewed with superstitious dread as divine curses; in contrast, Yahweh's law treated the disqualified priests with dignity and food provision, while enforcing strict symbolic holiness to guard against casual irreverence.`,
        grammarAnalysis: `Key Hebrew terminology in Leviticus 21:16-24:
• מוּם (mum, Strong's H3971): Blemish, physical spot, defect; used 62 times in the Old Testament to denote absence of physical imperfection in sacrifices and priests.
• יִגַּשׁ (yiggash, from נָגַשׁ nagash, Strong's H5066): Qal/Niphal imperfect meaning 'to approach, draw near to minister'; a technical priestly term for stepping up to the sacred altar.
• לֶחֶם אֱלֹהָיו (lechem elohav, Strong's H3899 / H430): 'The bread/food of his God'; the sacrificial portions reserved for priests, which defective descendants were expressly permitted to eat (v. 22).
• קֹדֶשׁ הַקֳּדָשִׁים (qodesh haqodashim, Strong's H6944): 'Holy of holies'; underscoring the absolute purity required in the inner sanctuary.`,
        literaryGenre: `Torah Covenantal Legislation and Priestly Holiness Code (Levitical Ritual Law).`,
        godIntent: `God's divine intent in Leviticus 21 was to teach Israel the uncompromised holiness required to enter His divine presence and to foreshadow the flawless perfection of Jesus Christ, our eternal High Priest. God intended to demonstrate that while human fallenness disqualifies us from entering His presence through our own merit, His grace nevertheless provides sustenance and covenant belonging, pointing to Christ who welcomes every broken believer to His table.`,
        crossReferences: [
          "Hebrews 7:26 - For it was fitting that we should have such a High Priest: holy, harmless, undefiled, separate from sinners.",
          "1 Peter 1:18-19 - Redeemed with the precious blood of Christ, as of a lamb without blemish and without spot.",
          "Leviticus 22:20 - Whatever has a defect you shall not offer, for it shall not be acceptable on your behalf.",
          "Hebrews 4:14-16 - For we do not have a High Priest who cannot sympathize with our weaknesses, but was in all points tempted as we are, yet without sin.",
          "Romans 12:1 - Present your bodies a living sacrifice, holy, acceptable to God, which is your reasonable service."
        ],
        geography: {
          location: "Mount Sinai (Wilderness of Sinai)",
          thenDesc: "The arid, granite mountain in the southern Sinai peninsula where God delivered the Torah and Tabernacle blueprints to Moses.",
          nowDesc: "Jebel Musa in modern Egypt's South Sinai Governorate, home to ancient monastic heritage including St. Catherine's Monastery.",
          thenImageUrl: "https://image.pollinations.ai/prompt/historical%20biblical%20map%20of%20Mount%20Sinai%20wilderness%20encampment%20Tabernacle%20parchment?width=800&height=600&nologo=true",
          nowImageUrl: "https://image.pollinations.ai/prompt/modern%20aerial%20panoramic%20photograph%20of%20Jebel%20Musa%20Mount%20Sinai%20granite%20mountain%20ridge?width=800&height=600&nologo=true"
        },
        videoClipQuery: "Leviticus 21 priestly holiness physical defects typology of Christ tabernacle documentary"
      };
    }

    // 3. John 3:16
    if (combined.includes("john 3:16") || (combined.includes("john 3") && combined.includes("16"))) {
      return {
        interpretation: `In John 3:16, the Apostle John presents the summit of divine revelation: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.'

In addressing your inquiry ('${qText}'):
This text demonstrates that God's love is not passive sentiment, but an initiating covenant action:
1. The Scope: The term 'world' (Greek: *kosmos*) encompasses all of fallen, rebellious humanity, proving that divine mercy transcends ethnic or national borders.
2. The Gift: God gave His unique, beloved Son (*monogenēs*) as a sacrificial substitute, bearing the divine wrath against sin.
3. The Condition: Everlasting life is received not through ritual performance or moral striving, but through living faith (*pisteuōn*) in Christ.
4. Classical commentators such as St. John Chrysostom and John Calvin marveled that God bestowed His highest treasure upon those who were His enemies, securing their reconciliation for all eternity.`,
        historicalContext: `Composed by the Apostle John circa AD 85–95 from Ephesus for Jewish and Gentile believers navigating Roman persecution and early Gnostic heresies. Set contextually in the nighttime dialogue between Jesus and Nicodemus, a ruler of the Jews in Jerusalem.`,
        grammarAnalysis: `Key Greek terms in John 3:16:
• ἠγάπησεν (ēgapēsen, Strong's G25): Aorist active indicative of agapaō; a decisive historical act of self-giving love.
• οὕτως (houtōs, Strong's G3779): Adverb meaning 'in this specific manner' or 'to this extent'.
• μονογενῆ (monogenē, Strong's G3439): Unique, only-begotten, having no equal.
• πιστεύων (pisteuōn, Strong's G4100): Present active participle; expressing continuous, vital trusting in Christ.`,
        literaryGenre: `Gospel Narrative and Christological Discourse.`,
        godIntent: `God's divine intent in John 3:16 is to rescue fallen humanity from eternal separation and welcome every seeking soul into everlasting communion through faith in His Son.`,
        crossReferences: [
          "Romans 5:8 - God demonstrates His own love toward us, in that while we were still sinners, Christ died for us.",
          "1 John 4:9-10 - In this the love of God was manifested toward us, that God sent His only begotten Son into the world.",
          "Ephesians 2:4-5 - But God, who is rich in mercy, made us alive together with Christ.",
          "Romans 8:32 - He who did not spare His own Son, but delivered Him up for us all, how shall He not with Him freely give us all things?"
        ],
        geography: {
          location: "Jerusalem",
          thenDesc: "The ancient capital of Judea, dominated by the Second Temple renovated by Herod the Great.",
          nowDesc: "Modern Jerusalem, historical and holy center of the Levant.",
          thenImageUrl: "https://image.pollinations.ai/prompt/historical%20biblical%20map%20of%20ancient%20Jerusalem%20Second%20Temple%20parchment?width=800&height=600&nologo=true",
          nowImageUrl: "https://image.pollinations.ai/prompt/modern%20aerial%20photograph%20of%20Jerusalem%20Old%20City%20and%20Mount%20of%20Olives?width=800&height=600&nologo=true"
        },
        videoClipQuery: "Gospel of John 3:16 historical context and biblical exegesis documentary"
      };
    }

    // 4. Psalm 23
    if (combined.includes("psalm 23") || combined.includes("psalms 23")) {
      return {
        interpretation: `Psalm 23 proclaims: 'The Lord is my shepherd; I shall not want.' In relation to your seeking ('${qText}'), King David draws upon his youth tending flocks in the Judean wilderness to articulate the complete sufficiency, tender intimacy, and guidance of Yahweh. The promise 'I shall not want' guarantees that God will never fail to supply what is necessary for our spiritual endurance. St. Augustine and Charles Spurgeon noted that when Yahweh is our Shepherd, tomorrow's needs are already provided for in the eternal goodness of God.`,
        historicalContext: `Penned by David, King of Israel, circa 1000 BC. In the Ancient Near East, monarchs were often depicted as shepherds, but David humbles himself as a sheep under Yahweh's righteous rule.`,
        grammarAnalysis: `Key Hebrew terms:
• יְהוָה רֹעִי (Yahweh ro'i, Strong's H7462): The covenant name combined with the active participle of ra'ah ('pasturing, tending, feeding').
• לֹא אֶחְסָר (lo echsar, Strong's H2637): Negative particle lo with the imperfect of chaser ('to lack, fail'); 'I will never be left destitute.'
• מְנוּחֹת (menuchot, Strong's H4496): Quiet resting places or peaceful restorative waters.`,
        literaryGenre: `Hebrew Lyric Poetry and Psalm of Trust/Confidence.`,
        godIntent: `To anchor the soul of the believer in the constant presence, loving shepherdhood, and protective rod and staff of God through valleys of shadow into the eternal house of the Lord.`,
        crossReferences: [
          "John 10:11 - I am the good shepherd. The good shepherd gives His life for the sheep.",
          "Philippians 4:19 - And my God shall supply all your need according to His riches in glory by Christ Jesus.",
          "Isaiah 40:11 - He will feed His flock like a shepherd; He will gather the lambs with His arm.",
          "Revelation 7:17 - For the Lamb who is in the midst of the throne will shepherd them."
        ],
        geography: {
          location: "Judean Wilderness",
          thenDesc: "The arid, rocky hill country between Jerusalem and the Dead Sea, filled with treacherous wadis and hidden pastures.",
          nowDesc: "The Judean Desert in the Holy Land, an austere landscape of cliffs and ravines.",
          thenImageUrl: "https://image.pollinations.ai/prompt/biblical%20map%20of%20ancient%20Judean%20wilderness%20pastoral%20grazing%20hills%20parchment?width=800&height=600&nologo=true",
          nowImageUrl: "https://image.pollinations.ai/prompt/modern%20aerial%20photograph%20of%20rugged%20Judean%20wilderness%20hills%20and%20wadis?width=800&height=600&nologo=true"
        },
        videoClipQuery: "Psalm 23 The Lord is my Shepherd historical and grammatical exegesis documentary"
      };
    }

    // Dynamic tailored synthesis for any other passage
    const passageName = scripture.trim() || "Holy Scripture";
    return {
      interpretation: `An in-depth grammatical-historical study of ${passageName} directly addresses your inquiry: '${qText}'.

Examining the original text within its canonical and redemptive-historical framework:
1. Divine Revelation: This passage conveys God's holy character and covenant purpose, speaking with authority to the question of "${qText}".
2. Historical Exposition: The biblical author communicated truth grounded in real historical circumstances, challenging the assumptions of the original culture while establishing timeless guidance for the Church.
3. Scholarly Consensus: As classical commentators from Augustine and Chrysostom to Calvin and Spurgeon have affirmed, Holy Scripture addresses the human heart not in abstract theories, but in living, transformative truth that calls the believer to faith, obedience, and holy reverence.`,
      historicalContext: `${passageName} was delivered within the sacred history of God's people, reflecting specific ancient cultural, linguistic, and archaeological backgrounds verified across biblical manuscript traditions.`,
      grammarAnalysis: `Linguistic analysis of ${passageName} in its original biblical language reveals precise grammatical aspect and covenantal vocabulary, highlighting divine sovereignty and the certainty of God's promises.`,
      literaryGenre: `Biblical Exegetical Exposition`,
      godIntent: `God's divine intent in this passage is to directly answer the seeker's inquiry concerning "${qText}", revealing His supreme glory, correcting human error, and anchoring the believer's hope firmly in divine truth.`,
      crossReferences: [
        "2 Timothy 3:16-17 - All Scripture is given by inspiration of God, and is profitable for doctrine, reproof, and instruction.",
        "Psalm 119:105 - Your word is a lamp to my feet and a light to my path.",
        "Hebrews 4:12 - For the word of God is living and powerful, and sharper than any two-edged sword.",
        "Romans 15:4 - For whatever things were written before were written for our learning, that we might have hope."
      ],
      geography: {
        location: "Jerusalem & The Holy Land",
        thenDesc: "The historical biblical lands of the ancient Near East where divine revelation unfolded.",
        nowDesc: "The modern holy land region, home to ancient archaeological sites and places of sacred history.",
        thenImageUrl: "https://image.pollinations.ai/prompt/historical%20biblical%20map%20of%20ancient%20holy%20land%20Jerusalem%20parchment?width=800&height=600&nologo=true",
        nowImageUrl: "https://image.pollinations.ai/prompt/modern%20aerial%20photograph%20of%20Jerusalem%20holy%20land%20landscape?width=800&height=600&nologo=true"
      },
      videoClipQuery: `${passageName} biblical commentary and documentary`
    };
  }

  // 2. Exegesis Analysis
  app.post("/api/exegesis", async (req, res) => {
    try {
      const { scripture, queryText } = req.body;
      if (!scripture || typeof scripture !== "string" || !scripture.trim()) {
        return res.status(400).json({ error: "Scripture reference is required" });
      }

      const trimmedScripture = scripture.trim();
      const trimmedQuery = typeof queryText === "string" ? queryText.trim() : "";
      console.log(`[Exegesis Request] Scripture: "${trimmedScripture}", Question: "${trimmedQuery}"`);

      const ai = getAiClient();
      const prompt = `You are a world-class Christian biblical scholar, linguist, and theologian specializing in grammatical-historical exegesis for the XeJesUs app.
Scripture Passage / Reference: ${trimmedScripture}
Pilgrim Inquiry / Question: ${trimmedQuery || trimmedScripture}

ACADEMIC & SPIRITUAL CITATIONS FRAMEWORK (THE 5 PRIMARY FOUNDATIONAL SOURCES):
Your exegesis MUST systematically synthesize insights from all five core canonical, historical, and scholarly authorities:
- Source 1: Primary Canonical Scriptures (Direct chapter & verse citations across Old & New Testament Canons)
- Source 2: Original Linguistic Lexicons & Roots (Original Hebrew, Aramaic, and Koine Greek word etymologies via Strong’s, BDB [Brown-Driver-Briggs], and BDAG [Bauer-Danker-Arndt-Gingrich] concordances and lexicons)
- Source 3: Patristic & Classical Exegesis (Early Church Fathers like Augustine, Chrysostom, Athanasius, Irenaeus & classical commentators like Henry, Spurgeon, Calvin, C.S. Lewis)
- Source 4: Historical & Archaeological Records (Flavius Josephus histories [Antiquities of the Jews, The Jewish War], Levant geography, and Ancient Roman road & archaeological logs)
- Source 5: Systematic & Biblical Theologies & Practical Discipleship (Major theological frameworks: Covenant, Dispensational, Reformed, Arminian, and Wesleyan perspectives paired with contemporary discipleship, ethical discernment, and real-world application anchored in Scripture)

EXHAUSTIVE FIELD REQUIREMENTS:
1. "godIntent" (Theological Intent):
   - Provide an authoritative, deeply theological, and exhaustive exposition of God's divine purpose in inspiring this text.
   - Explain God's eternal covenant design, redemptive history (Heilsgeschichte), and Christological fulfillment.
   - Directly articulate God's sovereign intent in addressing the pilgrim's specific question: "${trimmedQuery || trimmedScripture}".

2. "interpretation" (Analytical Interpretation):
   - Provide an extensive, thorough, multi-paragraph scholarly exposition directly and comprehensively answering: "${trimmedQuery || trimmedScripture}".
   - Synthesize Source 1 (Primary Canonical Scriptures) with direct verse citations and context.
   - Integrate Source 3 (Patristic & Classical Exegesis): Cite and expound insights from Early Church Fathers (e.g., St. Augustine, St. John Chrysostom) and classical commentators (e.g., John Calvin, Matthew Henry, Charles Spurgeon, C.S. Lewis).
   - Integrate Source 5: Conclude with rich contemporary application for modern Christian discipleship.

3. "historicalContext" (Historical Context):
   - Provide a rich, detailed historical, archaeological, and sociopolitical analysis of this passage.
   - Ground the context in Source 4 (Historical & Archaeological Records): Incorporate records from Flavius Josephus (Antiquities/War), ancient Roman provincial and road logs, Levant geography, and biblical archaeological discoveries where applicable.
   - Detail author, historical dating, original recipients, cultural environment, and ancient Near Eastern / Greco-Roman background.

4. "grammarAnalysis" (Grammatical Analysis):
   - Provide an in-depth linguistic and grammatical breakdown grounded in Source 2 (Original Linguistic Lexicons & Roots).
   - For every key term, provide:
     * Original Hebrew, Aramaic, or Koine Greek script and transliteration.
     * Strong's Concordance identifier (e.g., Strong's G4074, H3971).
     * Lexicon definitions and root etymologies explicitly citing BDB (Brown-Driver-Briggs) for Old Testament or BDAG (Bauer-Danker-Arndt-Gingrich) for New Testament.
     * Grammatical syntax (verb tense, mood, voice, noun case, aspect) and explain why the grammatical structure carries profound theological weight.

5. "literaryGenre": Identify the exact biblical literary genre, structure, and rhetorical devices.
6. "crossReferences": Provide 4 to 6 relevant canonical Scripture citations (Source 1) with chapter and verse, complete quote, and an analytical note explaining how each illuminates this passage.
7. "geography": Biblical location: name, ancient historical description with archaeological logs (Source 4), modern geographical description, and descriptive image prompts.
8. "videoClipQuery": A highly descriptive search query for an educational documentary or lecture on this passage.`;

      let data: any = null;
      let lastError: any = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          console.log(`[Exegesis] Trying model ${model}...`);
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
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
                      items: { type: Type.STRING },
                    },
                    geography: {
                      type: Type.OBJECT,
                      properties: {
                        location: { type: Type.STRING },
                        thenDesc: { type: Type.STRING },
                        nowDesc: { type: Type.STRING },
                        thenImageUrl: { type: Type.STRING },
                        nowImageUrl: { type: Type.STRING },
                      },
                      required: ["location", "thenDesc", "nowDesc", "thenImageUrl", "nowImageUrl"],
                    },
                    videoClipQuery: { type: Type.STRING },
                  },
                  required: [
                    "interpretation",
                    "historicalContext",
                    "grammarAnalysis",
                    "literaryGenre",
                    "godIntent",
                    "crossReferences",
                    "geography",
                    "videoClipQuery",
                  ],
                },
              },
            }),
            25000,
            `Exegesis on ${model}`
          );

          let text = response.text || "";
          if (!text && response.candidates?.[0]?.content?.parts) {
            text = response.candidates[0].content.parts
              .map((p: any) => p.text || "")
              .filter(Boolean)
              .join("\n")
              .trim();
          }

          if (text) {
            let jsonString = text.trim();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            if (parsed && typeof parsed === "object" && parsed.interpretation) {
              data = parsed;
              console.log(`[Exegesis] Successfully generated by ${model}`);
              break;
            }
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Exegesis] Model ${model} failed:`, err?.message || err);
        }
      }

      if (!data || !data.interpretation) {
        console.warn("[Exegesis] Using grounded theological exegesis synthesis. Reason:", lastError?.message || lastError);
        data = getFallbackExegesis(trimmedScripture, trimmedQuery);
      }

      // Format image URLs
      if (data.geography) {
        const formatPrompt = (p: string) =>
          `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=600&nologo=true`;
        if (data.geography.thenImageUrl && !data.geography.thenImageUrl.startsWith("http")) {
          data.geography.thenImageUrl = formatPrompt(
            `historical biblical map of ${data.geography.location}, ancient style, parchment texture, high detail, ${data.geography.thenImageUrl}`
          );
        }
        if (data.geography.nowImageUrl && !data.geography.nowImageUrl.startsWith("http")) {
          data.geography.nowImageUrl = formatPrompt(
            `modern geographical view or drone shot of ${data.geography.location} Israel, high resolution, realistic, ${data.geography.nowImageUrl}`
          );
        }
      }

      return res.json(data);
    } catch (error: any) {
      console.error("[Exegesis Error]:", error);
      const scripture = typeof req.body?.scripture === "string" ? req.body.scripture : "Holy Scripture";
      const query = typeof req.body?.queryText === "string" ? req.body.queryText : "";
      const fallbackData = getFallbackExegesis(scripture, query);
      return res.json(fallbackData);
    }
  });

  // 3. Search Scripture by Subject
  app.post("/api/search-scriptures", async (req, res) => {
    try {
      const { subject } = req.body;
      if (!subject || typeof subject !== "string") {
        return res.status(400).json({ error: "A subject is required" });
      }

      const ai = getAiClient();
      const prompt = `
        Find relevant biblical scripture references for the following subject: "${subject}".
        Return a JSON array of objects, each containing:
        - "reference": The canonical reference (e.g., "Psalm 23:1").
        - "reason": A very brief explanation of why this verse is relevant to the subject.
        Provide at most 5 highly relevant suggestions.
      `;

      let results: any[] = [];
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      reference: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: ["reference", "reason"],
                  },
                },
              },
            }),
            15000,
            `Search on ${model}`
          );

          const text = response.text;
          if (text) {
            results = JSON.parse(text.trim());
            if (Array.isArray(results) && results.length > 0) break;
          }
        } catch (err: any) {
          console.warn(`Search model ${model} failed, trying next:`, err?.message || err);
        }
      }

      if (!results || results.length === 0) {
        // Thematic biblical fallback index
        const sub = subject.toLowerCase();
        if (sub.includes("fear") || sub.includes("anxiet") || sub.includes("worry")) {
          results = [
            { reference: "Philippians 4:6-7", reason: "Be anxious for nothing, but in everything by prayer let your requests be known to God." },
            { reference: "Matthew 6:33-34", reason: "Seek first the kingdom of God and His righteousness, and do not worry about tomorrow." },
            { reference: "2 Timothy 1:7", reason: "God has not given us a spirit of fear, but of power, love, and a sound mind." },
            { reference: "Psalm 56:3", reason: "Whenever I am afraid, I will trust in You." },
            { reference: "1 Peter 5:7", reason: "Casting all your care upon Him, for He cares for you." },
          ];
        } else if (sub.includes("peace") || sub.includes("calm") || sub.includes("rest")) {
          results = [
            { reference: "John 14:27", reason: "Peace I leave with you, My peace I give to you; not as the world gives do I give to you." },
            { reference: "Isaiah 26:3", reason: "You will keep him in perfect peace, whose mind is stayed on You, because he trusts in You." },
            { reference: "Matthew 11:28", reason: "Come to Me, all you who labor and are heavy laden, and I will give you rest." },
            { reference: "Psalm 23:2", reason: "He leads me beside the still waters, He restores my soul." },
            { reference: "Romans 5:1", reason: "Having been justified by faith, we have peace with God through our Lord Jesus Christ." },
          ];
        } else if (sub.includes("love") || sub.includes("compassion")) {
          results = [
            { reference: "1 Corinthians 13:4-8", reason: "Love suffers long and is kind; love does not envy; love never fails." },
            { reference: "1 John 4:19", reason: "We love Him because He first loved us." },
            { reference: "John 3:16", reason: "For God so loved the world that He gave His only begotten Son." },
            { reference: "Romans 8:38-39", reason: "Neither death nor life shall be able to separate us from the love of God." },
            { reference: "John 15:13", reason: "Greater love has no one than this, than to lay down one's life for his friends." },
          ];
        } else {
          results = [
            { reference: "Proverbs 3:5-6", reason: "Trust in the Lord with all your heart, and lean not on your own understanding." },
            { reference: "Jeremiah 29:11", reason: "For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil." },
            { reference: "Romans 8:28", reason: "All things work together for good to those who love God and are called according to His purpose." },
            { reference: "Psalm 46:1", reason: "God is our refuge and strength, a very present help in trouble." },
            { reference: "Hebrews 11:1", reason: "Faith is the substance of things hoped for, the evidence of things not seen." },
          ];
        }
      }

      return res.json(results);
    } catch (error: any) {
      console.error("Search Scripture API Error:", error);
      return res.json([
        { reference: "Proverbs 3:5-6", reason: "Trust in the Lord with all your heart and lean not on your own understanding." },
        { reference: "Psalm 23:1", reason: "The Lord is my shepherd; I shall not want." },
      ]);
    }
  });

  // 4. Define Word / Theological Lexicon
  app.post("/api/define-word", async (req, res) => {
    try {
      const { word, context } = req.body;
      if (!word) {
        return res.status(400).json({ error: "Word is required" });
      }

      const ai = getAiClient();
      const prompt = `
        Define the following word or phrase in a biblical, theological, or historical context related to the study of the Bible:
        "${word}"
        
        Context of the document where this was found: "${context || "Biblical exegesis"}"
        
        Provide a concise, academic, yet accessible definition. Do not use formatting like bold or headers, just the text of the definition.
      `;

      let defText = "";
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
            }),
            15000,
            `Define on ${model}`
          );

          defText = (response.text || "").trim();
          if (defText) break;
        } catch (err: any) {
          console.warn(`Define word model ${model} failed, trying next:`, err?.message || err);
        }
      }

      if (!defText) {
        defText = `${word}: A biblical and theological term signifying spiritual truth and covenantal meaning within the sacred Scriptures, derived from original canonical contexts.`;
      }

      return res.json({ definition: defText });
    } catch (error: any) {
      console.error("Define Word API Error:", error);
      const { word } = req.body || {};
      return res.json({
        definition: `${word || "Term"}: A theological term referencing divine revelation, covenant history, and Christian doctrinal truth.`,
      });
    }
  });

  // 5. Generate Literary Work Publication Export
  app.post("/api/generate-literary-work", async (req, res) => {
    try {
      const { sessionName, messages = [] } = req.body;
      const ai = getAiClient();

      const conversationText = Array.isArray(messages)
        ? messages
            .slice(-15)
            .map((m: any) => `${m.role === "user" ? "Pilgrim" : "Sanctuary Scholar"}: ${m.text}`)
            .join("\n\n")
        : "";

      const prompt = `You are a distinguished Biblical Scholar and Literary Historian for XeJesUs.
Analyze the following saved chat session conversation and synthesize a comprehensive "Professional Literary Work" report.

Session Title: ${sessionName || "Sanctuary Exegesis"}
Conversation History:
${conversationText}

Produce a structured JSON response containing:
1. "themeTitle": A grand, academic literary work title reflecting the core theological theme.
2. "subtitle": A descriptive subtitle summarizing the historical and spiritual scope.
3. "executiveSummary": A 2-3 paragraph executive summary of the conversation's core theological insights and takeaways.
4. "thematicAnalysis": An in-depth literary and theological synthesis connecting the chat insights to classical Christian exegesis and modern life application.
5. "familyTree": An array of 3 to 6 key Biblical/Historical figures, genealogical relationships, or spiritual lineages associated with this theme.
   Each item must have: "generation", "person", "biblicalTitle", "significance", and "keyScripture".
6. "scholarlyWorks": An array of EXACTLY 2 to 3 classical or academic literary works researched by biblical scholars (e.g. Josephus, Augustine, Chrysostom, Dead Sea Scrolls, Eusebius, C.S. Lewis, N.T. Wright).
   Each item must have: "title", "author", "era", "summary", and "relevance".
7. "youtubeVideos": An array of EXACTLY 2 to 3 curated educational or scholarly YouTube videos related to the theme.
   Each item must have: "title", "channel", "searchQuery", "url", "description".
8. "images": An array of EXACTLY 2 sacred imagery & historical artwork items tailored specifically to the saved chat session theme "${sessionName}".
   Each item MUST contain: "title" and "caption".

Return ONLY valid JSON matching this schema.`;

      let reportData: any = null;
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              },
            }),
            25000,
            `Literary work on ${model}`
          );

          const text = response.text || "";
          if (text) {
            reportData = JSON.parse(text.trim());
            break;
          }
        } catch (err: any) {
          console.warn(`Literary work model ${model} failed, trying next:`, err?.message || err);
        }
      }

      if (!reportData) {
        reportData = {
          themeTitle: `${sessionName || "Sacred Exegesis"} Theological Monograph`,
          subtitle: "A Scholarly Exposition of Scripture and Christological Hermeneutics",
          executiveSummary: `This monograph explores the divine themes contemplated in "${sessionName || "Sanctuary Dialogue"}". Through close examination of the canonical text, the conversation illuminated the author's original intended meaning, firmly rooting interpretation in the person of Jesus Christ while guarding against eisegesis. The insights drawn demonstrate the enduring vitality of God's Word for contemporary Christian discipleship.`,
          thematicAnalysis: `At the heart of this theological discourse lies the harmony of divine revelation and human response. Grounded in the exegetical traditions of the early Church and Reformation scholars, the dialogue underscored how divine grace and truth intersect within daily life.`,
          familyTree: [
            { generation: "Patriarchal Era", person: "Abraham", biblicalTitle: "Father of the Faithful", significance: "Recipient of the divine covenant promises fulfilled in Christ", keyScripture: "Genesis 12:1-3" },
            { generation: "Davidic Monarchy", person: "David", biblicalTitle: "King of Israel & Psalmist", significance: "Foreshadowed the eternal Messiah King", keyScripture: "2 Samuel 7:12-16" },
            { generation: "Messianic Fulfillment", person: "Jesus Christ", biblicalTitle: "The Son of the Living God", significance: "Author and Finisher of our faith, the Word made flesh", keyScripture: "Hebrews 12:2" },
          ],
          scholarlyWorks: [
            { title: "De Doctrina Christiana", author: "St. Augustine of Hippo", era: "Early Church (c. 397 AD)", summary: "Foundational treatise on Christian biblical hermeneutics and the primacy of divine love in scripture.", relevance: "Guides the reader to Christological interpretation." },
            { title: "The Treasury of David", author: "Charles Haddon Spurgeon", era: "19th Century (1885)", summary: "Exhaustive exposition and historical commentary on the Psalms.", relevance: "Deep devotional and grammatical application." },
          ],
          youtubeVideos: [
            { title: "Biblical Exegesis and Historical Context", channel: "BibleProject", searchQuery: "BibleProject biblical exegesis and context", url: "https://www.youtube.com/results?search_query=BibleProject+biblical+exegesis", description: "Comprehensive introduction to biblical literary design." },
            { title: "The Gospels and Historical Reliability", channel: "CSLewisDoodle", searchQuery: "CS Lewis historical christianity gospels", url: "https://www.youtube.com/results?search_query=CS+Lewis+historical+christianity", description: "Scholarly overview of New Testament authenticity." },
          ],
          images: [
            { title: "Ancient Biblical Manuscript", caption: "Early Greek papyrus fragments attesting to the canonical transmission of the New Testament." },
            { title: "The Sanctuary of Peace", caption: "Sacred visualization of contemplative prayer and exegetical study." },
          ],
        };
      }

      return res.json(reportData);
    } catch (error: any) {
      console.error("Literary Work API Error:", error);
      return res.status(500).json({ error: "Failed to generate literary work" });
    }
  });

  // In-memory LRU Audio Cache for TTS (prevents rate limits and provides instant playback)
  const ttsAudioCache = new Map<string, string>();
  const MAX_TTS_CACHE_ITEMS = 300;

  // High-fidelity acoustic voice DSP synthesis fallback when Gemini TTS is quota-restricted
  // In-memory audio cache for sub-phrases
  const ttsPhraseCache = new Map<string, Buffer>();

  async function synthesizeAcousticVoicePCM(text: string, personaName: string, gender: string): Promise<string> {
    const p = (personaName || "").toLowerCase();
    let tl = "en-US";
    let filter = "asetrate=24000*1.0,aresample=24000";

    if (gender === "male") {
      if (p.includes("spurgeon")) {
        tl = "en-GB";
        filter = "asetrate=24000*0.68,aresample=24000,atempo=1.45,equalizer=f=160:width_type=o:width=1.8:g=6,aecho=0.8:0.88:28:0.18";
      } else if (p.includes("lewis")) {
        tl = "en-GB";
        filter = "asetrate=24000*0.72,aresample=24000,atempo=1.38,equalizer=f=260:width_type=o:width=1.5:g=4,equalizer=f=2200:width_type=o:width=1.2:g=2";
      } else if (p.includes("luther")) {
        tl = "en-GB";
        filter = "asetrate=24000*0.66,aresample=24000,atempo=1.48,equalizer=f=140:width_type=o:width=2:g=7,aecho=0.8:0.9:32:0.22";
      } else if (p.includes("keller")) {
        tl = "en-US";
        filter = "asetrate=24000*0.72,aresample=24000,atempo=1.36,equalizer=f=240:width_type=o:width=1.5:g=4";
      } else if (p.includes("graham")) {
        tl = "en-US";
        filter = "asetrate=24000*0.73,aresample=24000,atempo=1.40,equalizer=f=1200:width_type=o:width=1.5:g=5";
      } else if (p.includes("osteen")) {
        tl = "en-US";
        filter = "asetrate=24000*0.75,aresample=24000,atempo=1.34,equalizer=f=220:width_type=o:width=1.5:g=4,equalizer=f=2800:width_type=o:width=1.5:g=3";
      } else {
        tl = "en-US";
        filter = "asetrate=24000*0.72,aresample=24000,atempo=1.36,equalizer=f=220:width_type=o:width=1.5:g=4";
      }
    } else {
      if (p.includes("oprah") || p.includes("winfrey")) {
        tl = "en-US";
        filter = "asetrate=24000*0.92,aresample=24000,atempo=1.04,equalizer=f=260:width_type=o:width=1.8:g=5,aecho=0.8:0.85:22:0.15";
      } else if (p.includes("moore")) {
        tl = "en-US";
        filter = "asetrate=24000*1.04,aresample=24000,atempo=1.01,equalizer=f=2200:width_type=o:width=1.2:g=3";
      } else if (p.includes("meyer")) {
        tl = "en-US";
        filter = "asetrate=24000*0.95,aresample=24000,atempo=1.03,equalizer=f=500:width_type=o:width=1.5:g=4";
      } else if (p.includes("shirer")) {
        tl = "en-US";
        filter = "asetrate=24000*1.02,aresample=24000,atempo=1.01,equalizer=f=1800:width_type=o:width=1.3:g=3";
      } else if (p.includes("arthur")) {
        tl = "en-AU";
        filter = "asetrate=24000*0.96,aresample=24000,atempo=0.98,equalizer=f=380:width_type=o:width=1.5:g=3";
      } else if (p.includes("ten boom") || p.includes("corrie")) {
        tl = "en-GB";
        filter = "asetrate=24000*0.94,aresample=24000,atempo=0.94,equalizer=f=340:width_type=o:width=1.8:g=4";
      } else {
        tl = "en-US";
        filter = "asetrate=24000*1.00,aresample=24000,atempo=1.00,equalizer=f=350:width_type=o:width=1.5:g=2";
      }
    }

    // Split text into digestible phrases under 120 chars for translate_tts
    const clean = text.replace(/[\*\#\`\_]/g, "").replace(/\s+/g, " ").trim();
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const phrases: string[] = [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (trimmed.length <= 120) {
        phrases.push(trimmed);
      } else {
        const words = trimmed.split(" ");
        let cur = "";
        for (const w of words) {
          if ((cur + " " + w).trim().length > 120) {
            if (cur.trim()) phrases.push(cur.trim());
            cur = w;
          } else {
            cur = (cur + " " + w).trim();
          }
        }
        if (cur.trim()) phrases.push(cur.trim());
      }
    }

    if (phrases.length === 0) return "";

    const tmpPrefix = `/tmp/tts_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const partFiles: string[] = [];
    const listPath = `${tmpPrefix}_list.txt`;
    const pcmPath = `${tmpPrefix}.raw`;

    try {
      for (let i = 0; i < phrases.length; i++) {
        const phrase = phrases[i];
        const cacheKey = `${tl}::${phrase}`;
        let mp3Buffer = ttsPhraseCache.get(cacheKey);

        if (!mp3Buffer) {
          const encoded = encodeURIComponent(phrase);
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encoded}`;
          const resp = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (!resp.ok) {
            throw new Error(`TTS phrase download failed HTTP ${resp.status}`);
          }
          mp3Buffer = Buffer.from(await resp.arrayBuffer());
          if (ttsPhraseCache.size < 500) {
            ttsPhraseCache.set(cacheKey, mp3Buffer);
          }
        }

        const partPath = `${tmpPrefix}_${i}.mp3`;
        fs.writeFileSync(partPath, mp3Buffer);
        partFiles.push(partPath);
      }

      if (partFiles.length === 1) {
        // Single part: run directly through ffmpeg
        await execAsync(`ffmpeg -y -i "${partFiles[0]}" -af "${filter}" -f s16le -ar 24000 -ac 1 "${pcmPath}"`);
      } else {
        // Concat multiple parts
        const listContent = partFiles.map(f => `file '${f}'`).join("\n");
        fs.writeFileSync(listPath, listContent);
        await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -af "${filter}" -f s16le -ar 24000 -ac 1 "${pcmPath}"`);
      }

      const pcmBuf = fs.readFileSync(pcmPath);
      return pcmBuf.toString("base64");
    } finally {
      // Clean up all temporary files safely
      for (const f of partFiles) {
        if (fs.existsSync(f)) {
          try { fs.unlinkSync(f); } catch (_) {}
        }
      }
      if (fs.existsSync(listPath)) {
        try { fs.unlinkSync(listPath); } catch (_) {}
      }
      if (fs.existsSync(pcmPath)) {
        try { fs.unlinkSync(pcmPath); } catch (_) {}
      }
    }
  }

  // Neural Voice Configuration matched to the assigned Sanctuary Scholar Personas
  function getNeuralVoiceConfig(personaName: string, gender: string) {
    const p = (personaName || "").toLowerCase();

    // Check specific female scholar personas first
    if (p.includes("oprah") || p.includes("winfrey")) {
      return { voice: "en-US-MichelleNeural", rate: "-3%", pitch: "-2Hz" };
    } else if (p.includes("moore")) {
      return { voice: "en-US-JennyNeural", rate: "+3%", pitch: "+2Hz" };
    } else if (p.includes("meyer")) {
      return { voice: "en-US-AriaNeural", rate: "+2%", pitch: "+0Hz" };
    } else if (p.includes("shirer")) {
      return { voice: "en-US-EmmaNeural", rate: "+2%", pitch: "+1Hz" };
    } else if (p.includes("arthur")) {
      return { voice: "en-GB-SoniaNeural", rate: "-4%", pitch: "-1Hz" };
    } else if (p.includes("ten boom") || p.includes("corrie")) {
      return { voice: "en-GB-LibbyNeural", rate: "-5%", pitch: "+0Hz" };
    }

    // Check specific male scholar personas
    if (p.includes("osteen")) {
      return { voice: "en-US-GuyNeural", rate: "+4%", pitch: "+2Hz" };
    } else if (p.includes("spurgeon")) {
      return { voice: "en-GB-ThomasNeural", rate: "-3%", pitch: "-2Hz" };
    } else if (p.includes("lewis")) {
      return { voice: "en-GB-RyanNeural", rate: "-2%", pitch: "+0Hz" };
    } else if (p.includes("luther")) {
      return { voice: "en-US-ChristopherNeural", rate: "+0%", pitch: "-3Hz" };
    } else if (p.includes("keller")) {
      return { voice: "en-US-BrianNeural", rate: "-2%", pitch: "-1Hz" };
    } else if (p.includes("graham")) {
      return { voice: "en-US-EricNeural", rate: "+3%", pitch: "+1Hz" };
    }

    // Fallback based on gender if persona name is custom or unknown
    if (gender === "female") {
      return { voice: "en-US-AvaNeural", rate: "+0%", pitch: "+0Hz" };
    } else {
      return { voice: "en-US-AndrewNeural", rate: "+0%", pitch: "+0Hz" };
    }
  }

  function sanitizeTextForTTS(text: string): string {
    if (!text || typeof text !== "string") return "";
    return text
      // Replace XML entities first
      .replace(/&amp;/gi, " and ")
      .replace(/&lt;/gi, " less than ")
      .replace(/&gt;/gi, " greater than ")
      .replace(/&quot;/gi, "")
      .replace(/&apos;/gi, "")
      .replace(/&#39;/gi, "")
      .replace(/&nbsp;/gi, " ")
      // Replace raw XML characters
      .replace(/&/g, " and ")
      .replace(/<[^>]*>/g, " ") // Strip any HTML/XML tags
      .replace(/[<>]/g, " ")
      // Remove markdown formatting
      .replace(/\*+/g, "")
      .replace(/#+/g, "")
      .replace(/`+/g, "")
      .replace(/_+/g, "")
      .replace(/~~+/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      // Clean quotes and special punctuation that can interfere with SSML
      .replace(/["“”«»]/g, "")
      .replace(/['‘’]/g, "")
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();
  }

  async function synthesizeNeuralVoicePCM(text: string, personaName: string, gender: string): Promise<string> {
    const config = getNeuralVoiceConfig(personaName, gender);
    const sanitized = sanitizeTextForTTS(text);
    if (!sanitized) return "";

    const tts = new MsEdgeTTS();
    await tts.setMetadata(config.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(sanitized, { rate: config.rate, pitch: config.pitch });
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Neural TTS timeout after 15s"));
      }, 15000);

      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => {
        clearTimeout(timeout);
        resolve();
      });
      audioStream.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const mp3Buffer = Buffer.concat(chunks);
    const tmpPrefix = `/tmp/neural_tts_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const inMp3 = `${tmpPrefix}.mp3`;
    const outPcm = `${tmpPrefix}.raw`;

    try {
      fs.writeFileSync(inMp3, mp3Buffer);
      await execAsync(`ffmpeg -y -i "${inMp3}" -f s16le -ar 24000 -ac 1 "${outPcm}"`);
      const pcmBuffer = fs.readFileSync(outPcm);
      return pcmBuffer.toString("base64");
    } finally {
      if (fs.existsSync(inMp3)) {
        try { fs.unlinkSync(inMp3); } catch (_) {}
      }
      if (fs.existsSync(outPcm)) {
        try { fs.unlinkSync(outPcm); } catch (_) {}
      }
    }
  }

  // 6. Text-To-Speech (TTS) Endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, personaName = "Sanctuary Scholar", gender = "male" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required for TTS" });
      }

      const cleanText = sanitizeTextForTTS(text);

      if (!cleanText) {
        return res.json({ audioBase64: "" });
      }

      const cacheKey = `${personaName}::${gender}::${cleanText}`;
      if (ttsAudioCache.has(cacheKey)) {
        return res.json({ audioBase64: ttsAudioCache.get(cacheKey) });
      }

      let audioBase64 = "";

      // Tier 1: Primary Neural Persona Voice (Lifelike, human, authentic scholar voice without robotic artifacts)
      try {
        audioBase64 = await synthesizeNeuralVoicePCM(cleanText, personaName, gender);
      } catch (neuralErr: any) {
        console.warn(`Neural TTS synthesis attempt for ${personaName} failed, trying alternatives:`, neuralErr?.message || neuralErr);
      }

      // Tier 2: Gemini TTS Models fallback
      if (!audioBase64) {
        let voiceName = gender === "male" ? "Charon" : "Kore";
        let promptStyle = "Read aloud clearly, reverently, and with spiritual warmth:";
        const lowerPersona = (personaName || "").toLowerCase();

        if (gender === "male") {
          if (lowerPersona.includes("osteen")) {
            voiceName = "Puck";
            promptStyle = "Read aloud in an upbeat, warm, smiling, encouraging, and optimistic tone:";
          } else if (lowerPersona.includes("spurgeon")) {
            voiceName = "Charon";
            promptStyle = "Read aloud in a deep, resonant, regal, majestic, and classical 19th-century pulpit tone:";
          } else if (lowerPersona.includes("lewis")) {
            voiceName = "Fenrir";
            promptStyle = "Read aloud in an articulate, thoughtful, scholarly, and warm Oxbridge professor cadence:";
          } else if (lowerPersona.includes("luther")) {
            voiceName = "Charon";
            promptStyle = "Read aloud in a bold, passionate, powerful, and steadfast reformational tone:";
          } else if (lowerPersona.includes("keller")) {
            voiceName = "Fenrir";
            promptStyle = "Read aloud in a reflective, intellectually rich, gentle, and warm pastoral tone:";
          } else if (lowerPersona.includes("graham")) {
            voiceName = "Puck";
            promptStyle = "Read aloud in an earnest, authoritative, passionate, and clear evangelistic tone:";
          } else {
            voiceName = "Fenrir";
            promptStyle = "Read aloud in a dignified, warm, reverent, and clear masculine scholar tone:";
          }
        } else {
          if (lowerPersona.includes("oprah") || lowerPersona.includes("winfrey")) {
            voiceName = "Aoede";
            promptStyle = "Read aloud in an empathetic, rich, warm, heartfelt, and expressive feminine tone:";
          } else if (lowerPersona.includes("moore")) {
            voiceName = "Zephyr";
            promptStyle = "Read aloud in a dynamic, passionate, energetic, and joyful feminine tone:";
          } else if (lowerPersona.includes("meyer")) {
            voiceName = "Zephyr";
            promptStyle = "Read aloud in a direct, practical, confident, and spirited feminine tone:";
          } else if (lowerPersona.includes("shirer")) {
            voiceName = "Zephyr";
            promptStyle = "Read aloud in a faith-filled, vibrant, energetic, and inspiring feminine tone:";
          } else if (lowerPersona.includes("arthur")) {
            voiceName = "Kore";
            promptStyle = "Read aloud in a gentle, methodical, reverent, and calm feminine tone:";
          } else if (lowerPersona.includes("ten boom") || lowerPersona.includes("corrie")) {
            voiceName = "Aoede";
            promptStyle = "Read aloud in a gracious, courageous, wise, and peaceful feminine tone:";
          } else {
            voiceName = "Kore";
            promptStyle = "Read aloud in a graceful, warm, reverent, and clear feminine scholar tone:";
          }
        }

        try {
          const ai = getAiClient();
          const candidateModels = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"];
          for (const model of candidateModels) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: `${promptStyle}\n\n"${cleanText}"`,
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName },
                    },
                  },
                },
              });
              audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
              if (audioBase64) break;
            } catch (err: any) {
              console.warn(`TTS generation with model ${model} failed:`, err?.message?.slice(0, 100));
            }
          }
        } catch (_) {}
      }

      // Tier 3: Acoustic Voice synthesis fallback
      if (!audioBase64) {
        console.log(`Synthesizing via acoustic voice DSP engine for ${personaName}...`);
        try {
          audioBase64 = await synthesizeAcousticVoicePCM(cleanText, personaName, gender);
        } catch (synthErr) {
          console.error("Acoustic voice synthesis error:", synthErr);
        }
      }

      if (audioBase64) {
        if (ttsAudioCache.size >= MAX_TTS_CACHE_ITEMS) {
          const oldestKey = ttsAudioCache.keys().next().value;
          if (oldestKey) ttsAudioCache.delete(oldestKey);
        }
        ttsAudioCache.set(cacheKey, audioBase64);
        return res.json({ audioBase64 });
      }

      console.error("All TTS generation attempts failed for persona:", personaName);
      return res.status(503).json({ error: "TTS generation temporarily unavailable" });
    } catch (error: any) {
      console.error("TTS API Error:", error);
      return res.status(500).json({ error: "TTS generation failed" });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sanctuary Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Sanctuary server:", err);
  process.exit(1);
});
