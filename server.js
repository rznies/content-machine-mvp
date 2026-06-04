import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import Parser from "rss-parser";
import { storage } from "./storage/index.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ensure database directory exists
await storage.ensureInitialized();

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Please add it to your .env file.");
}
const ai = new GoogleGenAI({ apiKey });

// Model Configurations
const FAST_MODEL = "gemini-2.5-flash";
const PRO_MODEL = "gemini-2.5-pro";

// Loaders for new structured database configuration files
async function loadAntiSlop() {
  return await storage.getAntiSlop();
}

async function loadStyleSystem() {
  return await storage.getStyleSystem();
}

async function loadGoldenExamples() {
  return await storage.getGoldenExamples();
}

// Local draft slop checking and metric extraction
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function lintDraft(text, styleSystem, antiSlop) {
  const issues = [];
  const lowercaseText = text.toLowerCase();

  // 1. Check for banned words
  const bannedFound = [];
  for (const word of antiSlop.bannedWords) {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(text)) {
      bannedFound.push(word);
    }
  }
  if (bannedFound.length > 0) {
    issues.push({
      type: "banned-word",
      message: `Found banned words: ${bannedFound.join(", ")}`,
      severity: "error"
    });
  }

  // 2. Check sentence length (max 25 words)
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  let longSentencesCount = 0;
  for (const s of sentences) {
    const words = s.split(/\s+/).filter(w => w.length > 0);
    if (words.length > (styleSystem.voice?.sentenceLength?.max || 25)) {
      longSentencesCount++;
    }
  }
  if (longSentencesCount > 0) {
    issues.push({
      type: "sentence-length",
      message: `${longSentencesCount} sentence(s) exceed the word limit.`,
      severity: "warning"
    });
  }

  // 3. Check for passive voice
  const passiveVoiceRegex = /\b(is|was|were|be|been|being)\b\s+(\w+ed|written|taken|seen|done|given|known|held|made|built|run)\b/gi;
  const passiveMatches = text.match(passiveVoiceRegex) || [];
  if (passiveMatches.length > 0) {
    issues.push({
      type: "passive-voice",
      message: `Found ${passiveMatches.length} passive voice instance(s): "${passiveMatches.join('", "')}"`,
      severity: "warning"
    });
  }

  // 4. Reading level estimation (Flesch-Kincaid Grade Level)
  let totalWords = 0;
  let totalSyllables = 0;
  const words = text.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, "")).filter(w => w.length > 0);
  totalWords = words.length;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }
  const totalSentences = sentences.length || 1;
  const wordsPerSentence = totalWords / totalSentences;
  const syllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 0;
  const gradeLevel = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const roundedGrade = Math.round(gradeLevel * 10) / 10;
  
  const targetGrade = styleSystem.voice?.readingLevel?.target || "Grade 7";
  const maxGrade = styleSystem.voice?.readingLevel?.max || "Grade 9";
  const targetVal = parseInt(targetGrade.replace(/[^0-9]/g, "")) || 7;
  const maxVal = parseInt(maxGrade.replace(/[^0-9]/g, "")) || 9;
  
  if (roundedGrade > maxVal) {
    issues.push({
      type: "reading-level",
      message: `Flesch-Kincaid Grade Level is ${roundedGrade} (Target: ${targetGrade}-${maxGrade}). Text is too complex.`,
      severity: "warning"
    });
  }

  // 5. Check specific numbers count (should be >= 3)
  const numberRegex = /\b\d+(?:,\d+)*(?:\.\d+)?(?:k|m)?\b/g;
  const numberMatches = text.match(numberRegex) || [];
  if (numberMatches.length < 3) {
    issues.push({
      type: "numbers-density",
      message: `Only found ${numberMatches.length} number(s). Try to inject at least 3 concrete numbers/metrics.`,
      severity: "warning"
    });
  }

  return {
    success: issues.length === 0,
    issues,
    metrics: {
      wordCount: totalWords,
      sentenceCount: totalSentences,
      avgSentenceLength: Math.round(wordsPerSentence * 10) / 10,
      gradeLevel: roundedGrade,
      passiveCount: passiveMatches.length,
      numbersCount: numberMatches.length
    }
  };
}

// Lightweight HTTP REST client functions for Tavily & Firecrawl
async function searchTavily(query, apiKey) {
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 5
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn("Tavily search API failed:", errText);
      return [];
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Error calling Tavily search:", err.message);
    return [];
  }
}

async function scrapeFirecrawl(url, apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Firecrawl scrape failed for ${url}:`, errText);
      return null;
    }
    const data = await res.json();
    if (data.success && data.data) {
      return {
        markdown: data.data.markdown || "",
        title: data.data.metadata?.title || "",
        description: data.data.metadata?.description || ""
      };
    }
    return null;
  } catch (err) {
    console.error(`Error calling Firecrawl scrape for ${url}:`, err.message);
    return null;
  }
}

// ==========================================
// REAL DATA CONNECTORS & COLLECTORS
// ==========================================

// Helper to fetch Slack messages
async function fetchRealSlack() {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) {
    console.log("Slack config missing (SLACK_BOT_TOKEN/SLACK_CHANNEL_ID). Using mock Slack data.");
    const mock = await storage.getMockInputs();
    return mock.slack || [];
  }

  try {
    const res = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&limit=20`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.ok && data.messages) {
      return data.messages.map(m => ({
        id: m.client_msg_id || m.ts,
        channel: `Slack Channel #${channel}`,
        author: m.user || "Slack User",
        timestamp: new Date(parseFloat(m.ts) * 1000).toISOString(),
        text: m.text
      }));
    } else {
      console.warn("Slack API response failed, using mock:", data.error);
      const mock = await storage.getMockInputs();
      return mock.slack || [];
    }
  } catch (err) {
    console.error("Slack fetch error, falling back to mock:", err.message);
    const mock = await storage.getMockInputs();
    return mock.slack || [];
  }
}

// Helper to fetch Gmail via IMAP App Passwords
async function fetchRealGmail() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.log("Gmail IMAP config missing (GMAIL_USER/GMAIL_APP_PASSWORD). Using mock Gmail data.");
    const mock = await storage.getMockInputs();
    return mock.gmail || [];
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false
  });

  try {
    await client.connect();
    let lock = await client.getMailboxLock("INBOX");
    const emails = [];
    try {
      const totalMessages = client.mailbox.exists;
      if (totalMessages > 0) {
        const startRange = Math.max(1, totalMessages - 4);
        const range = `${startRange}:${totalMessages}`;
        
        for await (let msg of client.fetch(range, { source: true, envelope: true })) {
          const parsed = await simpleParser(msg.source);
          emails.push({
            id: msg.uid.toString(),
            from: parsed.from?.text || msg.envelope.from?.map(f => f.address).join(", ") || "Unknown Sender",
            subject: parsed.subject || msg.envelope.subject || "(No Subject)",
            timestamp: msg.envelope.date ? msg.envelope.date.toISOString() : new Date().toISOString(),
            body: parsed.text || ""
          });
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
    return emails.reverse();
  } catch (err) {
    console.error("Gmail IMAP fetch error, falling back to mock:", err.message);
    const mock = await storage.getMockInputs();
    return mock.gmail || [];
  }
}

// Helper to fetch Notion Pages blocks
async function fetchRealNotion() {
  const apiKey = process.env.NOTION_API_KEY;
  const pageIdsStr = process.env.NOTION_PAGE_IDS;
  if (!apiKey || !pageIdsStr) {
    console.log("Notion page config missing (NOTION_API_KEY/NOTION_PAGE_IDS). Using mock transcripts/Notion data.");
    const mock = await storage.getMockInputs();
    return mock.transcripts || [];
  }

  try {
    const pageIds = pageIdsStr.split(",").map(id => id.trim());
    const notionNotes = [];

    for (const pageId of pageIds) {
      const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28"
        }
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const textBlocks = data.results
          .filter(b => b.type === "paragraph" || b.type === "heading_1" || b.type === "heading_2" || b.type === "heading_3" || b.type === "bulleted_list_item" || b.type === "numbered_list_item")
          .map(b => {
            const type = b.type;
            const richText = b[type]?.rich_text || [];
            return richText.map(t => t.plain_text).join("");
          })
          .filter(t => t.trim() !== "");
        
        notionNotes.push({
          id: pageId,
          title: `Notion Note (Page ID ${pageId.substring(0, 8)}...)`,
          timestamp: new Date().toISOString(),
          content: textBlocks.join("\n")
        });
      } else {
        console.warn(`Notion Page ${pageId} fetch failed:`, data.message);
      }
    }

    if (notionNotes.length > 0) {
      return notionNotes;
    } else {
      const mock = await storage.getMockInputs();
      return mock.transcripts || [];
    }
  } catch (err) {
    console.error("Notion fetch error, falling back to mock:", err.message);
    const mock = await storage.getMockInputs();
    return mock.transcripts || [];
  }
}

// Helper to fetch RSS Web Feeds (replacing mock X feed)
async function fetchRealRSS() {
  const feedUrlsStr = process.env.FEED_URLS;
  if (!feedUrlsStr) {
    console.log("FEED_URLS config missing. Using mock X feed.");
    const mock = await storage.getMockInputs();
    return mock.x_feed || [];
  }

  try {
    const parser = new Parser();
    const urls = feedUrlsStr.split(",").map(url => url.trim());
    const feedItems = [];

    for (const url of urls) {
      const feed = await parser.parseURL(url);
      feed.items.slice(0, 5).forEach((item, index) => {
        feedItems.push({
          id: item.guid || `${url}_${index}`,
          author: feed.title || "RSS Feed",
          timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          text: `Title: ${item.title}\nSummary: ${item.contentSnippet || item.content || ""}`,
          link: item.link || ""
        });
      });
    }

    if (feedItems.length > 0) {
      return feedItems;
    } else {
      const mock = await storage.getMockInputs();
      return mock.x_feed || [];
    }
  } catch (err) {
    console.error("RSS fetch error, falling back to mock:", err.message);
    const mock = await storage.getMockInputs();
    return mock.x_feed || [];
  }
}

// Helper to optionally write qualified ideas to a real Notion Database Vault
async function saveToRealNotionVault(idea) {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !dbId) return false;

  try {
    const res = await fetch(`https://api.notion.com/v1/pages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: {
            title: [
              { text: { content: idea.title } }
            ]
          },
          Description: {
            rich_text: [
              { text: { content: idea.description } }
            ]
          },
          Source: {
            rich_text: [
              { text: { content: idea.source } }
            ]
          },
          Score: {
            number: idea.score
          },
          Rationale: {
            rich_text: [
              { text: { content: idea.rationale } }
            ]
          }
        }
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`Saved idea "${idea.title}" to Notion Database ${dbId}.`);
      return true;
    } else {
      console.warn("Failed to write to Notion Database:", data.message);
      return false;
    }
  } catch (err) {
    console.error("Notion database write error:", err.message);
    return false;
  }
}

// ==========================================
// 1. The Oracle Endpoint (/api/oracle/mine)
// ==========================================
app.post("/api/oracle/mine", async (req, res) => {
  try {
    console.log("Oracle mining pass triggered: collecting real data feeds...");
    const slack = await fetchRealSlack();
    const gmail = await fetchRealGmail();
    const transcripts = await fetchRealNotion();
    let x_feed = await fetchRealRSS();
    const vault = await storage.getVault();

    const fcApiKey = process.env.FIRECRAWL_API_KEY;
    if (fcApiKey && x_feed.length > 0) {
      console.log(`Firecrawl API Key present. Scraping full content of top RSS feed items...`);
      const itemsToScrape = x_feed.slice(0, 5);
      const scrapePromises = itemsToScrape.map(async (item) => {
        if (item.link) {
          const scraped = await scrapeFirecrawl(item.link, fcApiKey);
          if (scraped && scraped.markdown) {
            return {
              ...item,
              text: `Title: ${item.title}\nLink: ${item.link}\nFull Article Content:\n${scraped.markdown.substring(0, 8000)}`
            };
          }
        }
        return item;
      });
      const scrapedItems = await Promise.all(scrapePromises);
      x_feed = [...scrapedItems, ...x_feed.slice(5)];
    }

    const sourceData = { slack, gmail, transcripts, x_feed };

    const prompt = `
You are The Oracle, an advanced AI designed to mine communications (Slack threads, emails, Notion documents, web feeds) for "spikes"—moments where a raw, valuable, and authentic content idea is expressed.

Here is the source data you need to mine:
${JSON.stringify(sourceData, null, 2)}

Your task:
1. Identify potential content ideas hidden in the communications.
2. For each idea:
   - Formulate a compelling working Title.
   - Write a Description of the core concept.
   - List the Source (e.g. "Slack Channel #product-ideas").
   - Score the idea from 1 to 10 on the following 4 dimensions:
     * authenticity: Is this from real experience or generic advice?
     * contrarian: Does this challenge conventional wisdom?
     * storyDensity: Are there specific stories/numbers to extract?
     * audienceValue: Would someone share this?
   - Provide a Rationale for these scores.
3. Compute the final weighted score using this formula: (authenticity * 0.3) + (contrarian * 0.3) + (storyDensity * 0.2) + (audienceValue * 0.2).
4. Return only the qualified ideas where finalScore >= 7.0.

Output MUST be a valid JSON array, matching this format:
[
  {
    "title": "Title of the idea",
    "description": "Short summary of the idea",
    "source": "Details of where it was found",
    "scores": {
      "authenticity": 8.0,
      "contrarian": 7.0,
      "storyDensity": 6.0,
      "audienceValue": 8.0
    },
    "score": 7.4,
    "rationale": "Why this score was given"
  }
]
Do not include markdown tags like \`\`\`json or \`\`\`. Just return raw JSON.
`;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let newIdeas = [];
    try {
      newIdeas = JSON.parse(response.text.trim());
    } catch (e) {
      const cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      newIdeas = JSON.parse(cleanText);
    }

    // Semantic Deduplication via Gemini against existing vault
    let filteredNewIdeas = [];
    if (newIdeas.length > 0 && vault.length > 0) {
      console.log("Running Gemini semantic deduplication against existing vault items...");
      const existingList = vault.map(v => ({ title: v.title, description: v.description }));
      const candidatesList = newIdeas.map(i => ({ title: i.title, description: i.description }));
      
      const dupPrompt = `
You are a deduplication assistant. Compare the list of Candidate Ideas against the list of Existing Ideas in the vault.
For each candidate, determine if it represents the same concept or is a near-duplicate of an existing idea.

Existing Ideas:
${JSON.stringify(existingList, null, 2)}

Candidate Ideas:
${JSON.stringify(candidatesList, null, 2)}

Return a JSON array of objects representing the candidates. For each candidate, set "isDuplicate" to true if it duplicates an existing idea, and "duplicateOf" to the title of that existing idea. Otherwise, set "isDuplicate" to false and "duplicateOf" to null.

Format:
[
  { "title": "Candidate Title", "isDuplicate": true/false, "duplicateOf": "Existing Title or null" }
]
Do not wrap in markdown tags. Return raw JSON.
`;

      const dupResponse = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: dupPrompt,
        config: { responseMimeType: "application/json" }
      });

      let dupResults = [];
      try {
        dupResults = JSON.parse(dupResponse.text.trim());
      } catch (e) {
        const clean = dupResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
        dupResults = JSON.parse(clean);
      }

      filteredNewIdeas = newIdeas.filter(idea => {
        const match = dupResults.find(d => d.title.toLowerCase() === idea.title.toLowerCase());
        const isDuplicate = match ? match.isDuplicate : false;
        if (isDuplicate) {
          console.log(`Filtered out duplicate idea: "${idea.title}" (duplicate of "${match.duplicateOf}")`);
        }
        return !isDuplicate;
      });
    } else {
      filteredNewIdeas = newIdeas;
    }

    const updatedVault = [...vault];
    
    // Save filtered new ideas to vault and Notion if configured
    for (const idea of filteredNewIdeas) {
      const exists = vault.some(v => v.title.toLowerCase() === idea.title.toLowerCase());
      if (!exists) {
        const id = `idea_oracle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const ideaWithMetadata = {
          id,
          ...idea,
          status: "qualified",
          createdAt: new Date().toISOString()
        };
        updatedVault.push(ideaWithMetadata);
        
        await saveToRealNotionVault(ideaWithMetadata);
      }
    }

    await storage.saveVault(updatedVault);

    res.json({
      success: true,
      minedCount: filteredNewIdeas.length,
      vault: updatedVault
    });
  } catch (error) {
    console.error("Oracle error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. Vault Endpoints (/api/vault)
// ==========================================
app.get("/api/vault", async (req, res) => {
  const vault = await storage.getVault();
  res.json({ success: true, vault });
});

app.post("/api/vault/add", async (req, res) => {
  try {
    const { title, description, source } = req.body;
    const vault = await storage.getVault();
    const newIdea = {
      id: `idea_manual_${Date.now()}`,
      title,
      description,
      source: source || "Manually added",
      score: 10.0,
      rationale: "Manually entered by user.",
      status: "qualified",
      createdAt: new Date().toISOString()
    };
    vault.push(newIdea);
    await storage.saveVault(vault);
    res.json({ success: true, vault });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/vault/select", async (req, res) => {
  try {
    const { ideaId } = req.body;
    const vault = await storage.getVault();
    const selected = vault.find(i => i.id === ideaId);
    if (!selected) {
      return res.status(404).json({ success: false, error: "Idea not found" });
    }
    await storage.saveActiveIdea(selected);
    res.json({ success: true, selected });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/vault/active", async (req, res) => {
  const active = await storage.getActiveIdea();
  res.json({ success: true, active });
});

// ==========================================
// 3. The Researcher Endpoint (/api/research)
// ==========================================
app.post("/api/research", async (req, res) => {
  try {
    const activeIdea = await storage.getActiveIdea();
    if (!activeIdea) {
      return res.status(400).json({ success: false, error: "No active idea selected." });
    }

    const tavilyKey = process.env.TAVILY_API_KEY;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;

    let reportContent = "";

    if (tavilyKey && firecrawlKey) {
      console.log("Deep research pipeline triggered using Tavily and Firecrawl...");
      
      const query1 = `"${activeIdea.title}" latest developments 2026`;
      const query2 = `"${activeIdea.title}" contrarian opinion perspective`;
      const query3 = `"${activeIdea.title}" data statistics research studies`;

      console.log(`Running Tavily searches for: \n- "${query1}"\n- "${query2}"\n- "${query3}"`);
      const [results1, results2, results3] = await Promise.all([
        searchTavily(query1, tavilyKey),
        searchTavily(query2, tavilyKey),
        searchTavily(query3, tavilyKey)
      ]);

      const allResults = [...results1, ...results2, ...results3];
      
      const uniqueUrlsMap = new Map();
      for (const item of allResults) {
        if (item.url && !uniqueUrlsMap.has(item.url)) {
          uniqueUrlsMap.set(item.url, item);
        }
      }
      const uniqueResults = Array.from(uniqueUrlsMap.values());
      console.log(`Found ${uniqueResults.length} unique URLs. Selecting top 5 for scraping...`);

      const topResults = uniqueResults.slice(0, 5);

      console.log("Scraping page content with Firecrawl in parallel...");
      const scrapePromises = topResults.map(async (item) => {
        const scraped = await scrapeFirecrawl(item.url, firecrawlKey);
        if (scraped) {
          return {
            url: item.url,
            title: scraped.title || item.title || "Untitled Source",
            snippet: item.content || "",
            markdown: scraped.markdown || ""
          };
        }
        return {
          url: item.url,
          title: item.title || "Untitled Source",
          snippet: item.content || "",
          markdown: item.content || ""
        };
      });
      const scrapedSources = await Promise.all(scrapePromises);

      const formattedSources = scrapedSources.map((source, index) => {
        return `[Source #${index + 1}]
Title: ${source.title}
URL: ${source.url}
Snippet: ${source.snippet}
Full Scraped Text:
${source.markdown.substring(0, 4000)}
-----------------------------------------`;
      }).join("\n\n");

      const synthesisPrompt = `
You are The Researcher, an elite investigative journalist and analyst. Your goal is to construct a rigorous research report for the following content idea:

Title: "${activeIdea.title}"
Description: "${activeIdea.description}"

We have gathered the following raw scraped materials from the web:
"""
${formattedSources}
"""

Perform the following tasks:
1. Synthesize current developments and opinions on this topic using the scraped source materials. You MUST use real citations and links from the provided sources. Do not make up links or facts.
2. Outline what is already being said on the internet (the conventional wisdom).
3. Identify contrarian angles or gaps in the current conversation that we can exploit to stand out.
4. Create a list of 5-7 open questions to ask the creator in the upcoming interview to extract real stories, specific numbers, and emotional depth.

Produce a sourced, markdown-formatted report:
# Research Report: ${activeIdea.title}

## TL;DR
[Brief summary of the report]

## Key Facts & Sources
[Key facts with source links/citations. Format: [Source Title](URL)]

## Current Developments
[What is happening in this space right now based on the sources]

## Conventional Wisdom (What everyone is saying)
[The common talking points on the web]

## The Contrarian Angle (Our edge)
[How we can write something counter-intuitive and unique]

## Open Questions for Creator
[5-7 highly specific, challenging questions for the interview]
`;

      const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: synthesisPrompt
      });

      const rawReport = response.text;

      console.log("Running adversarial fact-check pass...");
      const factCheckPrompt = `
You are an adversarial fact-checker. Review this draft research report and identify any claims that are unsupported by the source materials provided, or any potential hallucinations.

Draft Research Report:
"""
${rawReport}
"""

Source Materials:
"""
${formattedSources}
"""

Output a markdown section "## Fact Check & Verification" where you flag any weak or unsupported claims, label them as [Verified] or [Unverified], and provide corrections based strictly on the source materials. Keep it brief.
`;

      const factCheckResponse = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: factCheckPrompt
      });

      reportContent = `${rawReport}\n\n## Fact Check & Verification\n${factCheckResponse.text}`;

    } else {
      console.log("Tavily or Firecrawl key missing. Falling back to Google Search grounding...");
      const fallbackPrompt = `
You are The Researcher, an elite investigative journalist and analyst. Your goal is to construct a rigorous research report for the following content idea:

Title: "${activeIdea.title}"
Description: "${activeIdea.description}"

Perform the following tasks:
1. Conduct research on current developments and opinions on this topic. Find facts, examples, and link references.
2. Outline what is already being said on the internet (the conventional wisdom).
3. Identify contrarian angles or gaps in the current conversation that we can exploit to stand out.
4. Separate verified facts from opinion claims. Check them adversarially.
5. Create a list of 5-7 open questions to ask the creator in the upcoming interview to extract real stories, specific numbers, and emotional depth.

Produce a sourced, markdown-formatted report:
# Research Report: ${activeIdea.title}

## TL;DR
[Brief summary of the report]

## Key Facts & Sources
[Key facts with source links/citations]

## Current Developments
[What is happening in this space right now]

## Conventional Wisdom (What everyone is saying)
[The common talking points on the web]

## The Contrarian Angle (Our edge)
[How we can write something counter-intuitive and unique]

## Open Questions for Creator
[5-7 highly specific, challenging questions for the interview]
`;

      const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: fallbackPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      reportContent = response.text;
    }

    await storage.saveResearchReport(reportContent);

    res.json({
      success: true,
      report: reportContent
    });
  } catch (error) {
    console.error("Researcher error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. Interview Panel Endpoints (/api/interview)
// ==========================================
const INTERVIEWERS = [
  { name: "Michael Barbaro", dimension: "Emotional pivots", pushFor: "What did that feel like in the moment?", persona: "Host of The Daily. Slow, inquisitive, focuses on the human element, the quiet moments, the emotional pivots. Frequently uses 'Hmm' and asks 'What did that feel like?'" },
  { name: "Joe Rogan", dimension: "Practical mechanics", pushFor: "Walk me through the exact steps", persona: "Raw, curious, casual, pushes for raw truth, practical application, and physical details. Focuses on the gritty reality: 'That's wild. But wait, how does that actually work in practice? What did you do next?'" },
  { name: "Howard Stern", dimension: "Conflict & vulnerability", pushFor: "Who disagreed? What went wrong?", persona: "Ultra-direct, provocative, focuses on relationships, hidden insecurities, ego, and conflict. Pushes for uncomfortable honesty: 'Who was mad at you? Did you feel like a failure? Tell me the truth.'" },
  { name: "Terry Gross", dimension: "Origins & context", pushFor: "Take me back to before this started", persona: "Empathetic, incredibly prepared, digs into origins, artistic/creative blocks, and deep reflections. 'I want to go back to what you said earlier about... how did that shape your worldview?'" },
  { name: "Lex Fridman", dimension: "Systems & principles", pushFor: "What's the underlying framework?", persona: "Analytical, philosophical, talks about love, struggles, technical mechanics, and core values. Focuses on deep systems: 'What is the beautiful code behind this? What was the hardest lesson?'" },
  { name: "Oprah Winfrey", dimension: "Lessons & audience value", pushFor: "What would you tell someone starting this?", persona: "Warm, connecting, searches for the soul, the core lesson, and the message for the audience. 'What was the 'Aha!' moment? How did you lift yourself out of that?'" }
];

app.post("/api/interview/start", async (req, res) => {
  try {
    const activeIdea = await storage.getActiveIdea();
    if (!activeIdea) {
      return res.status(400).json({ success: false, error: "No active idea selected." });
    }

    const researchReport = await storage.getResearchReport() || "No research report available.";
    const firstInterviewer = INTERVIEWERS[0];

    const prompt = `
You are ${firstInterviewer.name}. Persona: ${firstInterviewer.persona}.
You are conducting the first turn of a content interview with a creator.
Your target dimension is: "${firstInterviewer.dimension}". You must push for: "${firstInterviewer.pushFor}".

The content idea is:
Title: "${activeIdea.title}"
Description: "${activeIdea.description}"

Here is the background research report:
${researchReport}

Ask the very first, highly engaging question to kick off the interview. Keep it in character, focused on getting concrete stories, emotional pivots, and specific numbers right from the start.

Output your question as a short message.
`;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt
    });

    const firstQuestion = response.text.trim();

    const maxQs = req.body.maxQuestions || 10;

    const state = {
      ideaId: activeIdea.id,
      title: activeIdea.title,
      questionsAsked: [],
      currentInterviewer: firstInterviewer.name,
      currentQuestion: firstQuestion,
      completed: false,
      maxQuestions: maxQs
    };

    await storage.saveActiveInterview(state);
    res.json({ success: true, state });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/interview/status", async (req, res) => {
  const state = await storage.getActiveInterview();
  res.json({ success: true, state });
});

app.post("/api/interview/answer", async (req, res) => {
  try {
    const state = await storage.getActiveInterview();
    if (!state) {
      return res.status(400).json({ success: false, error: "No active interview session." });
    }

    const { answer } = req.body;
    if (!answer || answer.trim() === "") {
      return res.status(400).json({ success: false, error: "Answer cannot be empty." });
    }

    const currentInterviewer = state.currentInterviewer;
    const currentQuestion = state.currentQuestion;

    // Evaluate response quality: check specificity, numbers, stories, and story spine
    const evalPrompt = `
You are the interviewer ${currentInterviewer}. You just asked: "${currentQuestion}"
The creator responded with: "${answer}"

Your job is to evaluate if this answer is high quality or if it is too vague.
A high-quality answer contains:
- 1-2 specific stories or moments
- Real numbers or concrete data points
- Emotional specificity (what they felt, what was hard)

Evaluate the answer against this Story Spine validation:
- Setup (situation before): Does it describe the starting state?
- Complication (what went wrong/was hard): Is there an obstacle or conflict?
- Turning point (exact moment of pivot): Is the moment of action clear?
- Resolution (what happened after): Is the outcome clear?
- Lesson (takeaway): Is there a learning?

Perform an evaluation and output a JSON object:
{
  "score": 1-10 rating (10 being extremely detailed with numbers and stories, 1 being generic corporate speak. Scale: 9-10 excellent, 7-8 good, 5-6 acceptable, 3-4 poor, 1-2 failure),
  "storySpine": {
    "setup": true,
    "complication": true,
    "turningPoint": true,
    "resolution": true,
    "lesson": true
  },
  "feedback": "Your brief reaction in character. If the score is below 7, explain what story-spine element, story or number is missing and ask them to expand on it. If it is 7 or higher, praise the detail and transition."
}
Do not include markdown wrappers. Return raw JSON.
`;

    const evalResponse = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });

    let evaluation;
    try {
      evaluation = JSON.parse(evalResponse.text.trim());
    } catch (e) {
      const clean = evalResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
      evaluation = JSON.parse(clean);
    }

    // If score is low (< 7), make them answer again / follow up
    if (evaluation.score < 7 && state.questionsAsked.length < state.maxQuestions) {
      state.currentQuestion = `${evaluation.feedback}\n\nCan you give me a specific story or actual number to back that up?`;
      await storage.saveActiveInterview(state);
      return res.json({
        success: true,
        advance: false,
        state,
        evaluation
      });
    }

    // Save current Q&A
    state.questionsAsked.push({
      interviewer: currentInterviewer,
      question: currentQuestion,
      answer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      storySpine: evaluation.storySpine
    });

    // Check if interview is completed
    if (state.questionsAsked.length >= state.maxQuestions) {
      state.completed = true;
      state.currentInterviewer = "System";
      state.currentQuestion = "Interview completed! Ready to compile production markdown.";
      await storage.saveActiveInterview(state);

      // Run Post-interview extraction pass
      try {
        console.log("Running post-interview extraction pass...");
        const fullTranscript = state.questionsAsked.map(q => `${q.interviewer}: ${q.question}\nCreator: ${q.answer}`).join("\n\n");
        const extractPrompt = `
You are an expert content researcher. Analyze the following interview transcript:
"""
${fullTranscript}
"""

Extract:
1. **Emotional Palette Map**: Identify the specific emotional spikes (joy, frustration, fear, pride) and tie them to exact moments or quotes in the transcript.
2. **Numeric Inventory**: Identify EVERY single number, metric, date, or dollar amount mentioned by the creator. Keep it as a raw list of objects with the number and its context.
3. **Quote Inventory**: List the exact, raw, powerful phrases the creator used that are worth keeping verbatim (no corporate editing).

Return output as a valid JSON object matching:
{
  "emotionalPalette": [
    { "emotion": "joy/frustration/fear/pride", "moment": "brief description", "quote": "exact quote" }
  ],
  "numericInventory": [
    { "value": "1,400", "context": "users in 90 days" }
  ],
  "quoteInventory": [
    "exact quote 1",
    "exact quote 2"
  ]
}
Do not wrap in markdown tags. Return raw JSON.
`;

        const extractResponse = await ai.models.generateContent({
          model: FAST_MODEL,
          contents: extractPrompt,
          config: { responseMimeType: "application/json" }
        });

        let extraction = {};
        try {
          extraction = JSON.parse(extractResponse.text.trim());
        } catch (e) {
          const clean = extractResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
          extraction = JSON.parse(clean);
        }

        await storage.saveInterviewExtraction(extraction);
        console.log("Saved interview extraction file successfully.");
      } catch (err) {
        console.error("Error during post-interview extraction:", err.message);
      }

      return res.json({
        success: true,
        advance: true,
        state,
        evaluation
      });
    }

    // Transition to the next interviewer
    const nextInterviewer = INTERVIEWERS[state.questionsAsked.length % INTERVIEWERS.length];
    const researchReport = await storage.getResearchReport();
    const transcriptHistory = state.questionsAsked.map(q => `${q.interviewer}: ${q.question}\nCreator: ${q.answer}`).join("\n\n");

    const nextPrompt = `
You are ${nextInterviewer.name}. Persona: ${nextInterviewer.persona}.
You are conducting the next turn of a content interview with a creator.

The content idea is: "${state.title}"
Background research:
${researchReport}

Here is the conversation transcript so far:
${transcriptHistory}

Based on the transcript and research, ask the next question to explore a new dimension (e.g. if previous questions focused on details, ask about the emotional cost, the contrarian lesson, or the specific step-by-step process). Be in character. PUSH for specific stories and real data.

Output your question as a short message.
`;

    const nextResponse = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: nextPrompt
    });

    state.currentInterviewer = nextInterviewer.name;
    state.currentQuestion = nextResponse.text.trim();

    await storage.saveActiveInterview(state);

    res.json({
      success: true,
      advance: true,
      state,
      evaluation
    });
  } catch (error) {
    console.error("Interview error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. Production Endpoint (/api/production)
// ==========================================
app.post("/api/production", async (req, res) => {
  try {
    const interview = await storage.getActiveInterview();
    if (!interview || !interview.completed) {
      return res.status(400).json({ success: false, error: "Interview must be completed first." });
    }

    const transcript = interview.questionsAsked.map(q => `${q.interviewer}: ${q.question}\nCreator: ${q.answer}`).join("\n\n");
    const extraction = await storage.getInterviewExtraction();

    const prompt = `
You are the Content Production compiler. Your job is to turn the interview transcript into a structured, raw reference Markdown file.
This raw file is SACRED: it must contain the creator's exact stories, key figures, and core quotes. Do not paraphrase them into corporate summaries. Keep the emotional anchor and exact word choices intact.

Here is the interview transcript:
${transcript}

We have also pre-extracted this structured metadata:
${JSON.stringify(extraction, null, 2)}

Create a document with the following sections:
1. **System Metadata & Quality Metrics**:
   - Content Density Score: [Calculate and output: Count of stories, numbers, and quotes per 500 words in the transcript]
   - Story Spine Completeness Validation: [Audit the stories shared. If any story is missing a Resolution or Lesson, flag it as [INCOMPLETE STORY: Name of story] and explain why. Otherwise, label all as [COMPLETE STORY]]
2. **Transcript**: Cleaned up Q&A transcript.
3. **Key Stories**: Break down the specific stories shared. Extract details, timelines, names, and numbers.
4. **Core Insights**: The unique philosophical or operational principles the creator shared.
5. **Quotable Moments**: Select 5-10 powerful, raw quotes directly in the creator's words.
6. **Emotional Anchor**: What was the hardest part? What drove the creator to do this?
7. **Surprising Reveals**: Things that were unexpected or counter-intuitive.
8. **The "So What"**: Why does this matter to the average reader? What is the practical value?

Generate a detailed markdown file.
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt
    });

    const productionMarkdown = response.text;
    await storage.saveDraft("production-raw", productionMarkdown);

    res.json({
      success: true,
      productionRaw: productionMarkdown
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. Refinement Endpoint (/api/refine)
// ==========================================
app.post("/api/refine", async (req, res) => {
  try {
    const { contentType } = req.body; // e.g. "LinkedIn Post", "X Thread", "Long Essay"
    if (!contentType) {
      return res.status(400).json({ success: false, error: "Content type is required." });
    }
    await storage.saveActiveContentType({ contentType });

    const productionRaw = await storage.getDraft("production-raw");
    const styleGuide = await storage.getStyleGuide();
    
    // Load learnings from JSON database and format for the copywriter prompt (Bug Fix)
    const learnings = await storage.getLearnings();
    let lessonsText = "";
    if (learnings.global && learnings.global.length > 0) {
      lessonsText += "Global Lessons:\n" + learnings.global.map(l => `- [${l.category}] ${l.lesson}`).join("\n") + "\n";
    }
    const typeKey = contentType.toLowerCase().replace(/\s+/g, "_");
    if (learnings.byContentType && learnings.byContentType[typeKey] && learnings.byContentType[typeKey].length > 0) {
      lessonsText += `Lessons for ${contentType}:\n` + learnings.byContentType[typeKey].map(l => `- [${l.category}] ${l.lesson}`).join("\n") + "\n";
    }
    if (!lessonsText) lessonsText = "No lessons logged yet.";

    if (!productionRaw) {
      return res.status(400).json({ success: false, error: "No production file found. Complete the production step." });
    }

    const prompt = `
You are Refinement AI, a world-class copywriter who writes in the exact voice of the creator.
Your goal is to draft a draft for the content type: "${contentType}".

Here is the source information:
- **Raw Production Material (Sacred - use exact quotes & stories)**:
${productionRaw}

- **Style Guide**:
${styleGuide}

- **Learnings & Lessons from Past Feedback (Overriding style guide on conflict)**:
${lessonsText}

# Rules
1. **Rule #1**: Write like you are texting a friend. 
2. Pull raw, emotional stories and specific numbers from the production material. Do not generalize them.
3. If writing an X Thread, use clear numbering (1/, 2/) and a hook in the first tweet.
4. If writing a LinkedIn post, start with a punchy hook, use short single-sentence paragraphs, and end with an interactive question.
5. If writing a Long Essay, use clear section headers but keep the informal tone.

Draft the first version. Do not include meta comments, just the content draft.
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt
    });

    const draft = response.text;
    await storage.saveDraft("first", draft);
    await storage.saveDraft("current", draft);

    res.json({
      success: true,
      draft
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. Writer's Council & Revision (/api/council)
// ==========================================
app.post("/api/council", async (req, res) => {
  try {
    const { contentType } = req.body;
    let draftCurrent = await storage.getDraft("current");
    const productionRaw = await storage.getDraft("production-raw");
    const styleSystem = await loadStyleSystem();
    const antiSlop = await loadAntiSlop();
    const goldenExamples = await loadGoldenExamples();

    if (!draftCurrent) {
      return res.status(400).json({ success: false, error: "No current draft found. Draft a post first." });
    }

    let iterations = [];
    let currentScore = 0;
    let maxIterations = 3;
    let iterationCount = 0;

    const councilMembers = [
      { name: "Shaan Puri", focus: "Hooks, virality, and pure entertainment value. Pushes for high-energy wording and story angles." },
      { name: "Morgan Housel", focus: "Timeless wisdom, simplicity, clear metaphors. Looks for insights that will be true in 10 years." },
      { name: "David Perell", focus: "Clear writing, specific nouns, avoiding clichés. Looks for beautiful phrasing and crisp points." },
      { name: "Paul Graham", focus: "Unvarnished truth, intellectual honesty, logical flow. Dislikes hyperbole or fake marketing energy." },
      { name: "Ali Abdaal", focus: "Actionability, readability, friendliness. Wants clean formatting and clear takeaways." },
      { name: "Alex Hormozi", focus: "Direct, high-value, conviction-driven business lessons. Focuses on frameworks and clear roi." }
    ];

    const weights = {
      "Shaan Puri": 1.2,
      "Morgan Housel": 1.0,
      "David Perell": 1.0,
      "Paul Graham": 1.1,
      "Ali Abdaal": 1.0,
      "Alex Hormozi": 1.1
    };

    while (iterationCount < maxIterations) {
      iterationCount++;
      console.log(`Convening council iteration #${iterationCount}...`);

      const reviewPromises = councilMembers.map(async (member) => {
        const prompt = `
You are ${member.name}. Focus area: "${member.focus}".

Evaluate the following draft for the content type: "${contentType}".
Current Draft:
"""
${draftCurrent}
"""

Raw Material Reference:
"""
${productionRaw}
"""

We are using this Style System config:
${JSON.stringify(styleSystem, null, 2)}

We are enforcing these Anti-Slop guidelines:
${JSON.stringify(antiSlop, null, 2)}

Here are Golden Examples of high-quality copy to calibrate against:
${JSON.stringify(goldenExamples, null, 2)}

Score this draft on your specific focus area from 1 to 10 using this rubric:
9-10: Out-of-the-box excellent, hits the gold standard.
7-8: Good, needs minor tweaks.
5-6: Acceptable, but generic.
3-4: Poor, needs significant changes.
1-2: Failure, generic slop.

Identify:
1. Editorial fixes: style, flow, word choices or phrasing changes you suggest.
2. Creator info gaps: missing facts, stories, context, or numbers that ONLY the human creator can provide.

Return output as a valid JSON object matching:
{
  "score": 8.0,
  "reasoning": "Explain your score based on your specific focus area",
  "editorialFixes": ["fix 1", "fix 2"],
  "infoGaps": ["gap 1", "gap 2"]
}
Do not wrap in markdown tags. Return raw JSON.
`;
        try {
          const response = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          
          let result;
          try {
            result = JSON.parse(response.text.trim());
          } catch (e) {
            const clean = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
            result = JSON.parse(clean);
          }
          return {
            name: member.name,
            score: result.score || 5.0,
            feedback: result.reasoning || "",
            editorialFixes: result.editorialFixes || [],
            infoGaps: result.infoGaps || []
          };
        } catch (err) {
          console.error(`Error reviewing draft from ${member.name}:`, err.message);
          return {
            name: member.name,
            score: 5.0,
            feedback: `Failed to review: ${err.message}`,
            editorialFixes: [],
            infoGaps: []
          };
        }
      });

      const reviews = await Promise.all(reviewPromises);

      let sumWeightedScores = 0;
      let sumWeights = 0;
      let allEditorialFixes = [];
      let allInfoGaps = [];

      for (const rev of reviews) {
        const w = weights[rev.name] || 1.0;
        sumWeightedScores += rev.score * w;
        sumWeights += w;
        
        allEditorialFixes = [...allEditorialFixes, ...rev.editorialFixes];
        allInfoGaps = [...allInfoGaps, ...rev.infoGaps];
      }
      currentScore = sumWeightedScores / sumWeights;

      iterations.push({
        iteration: iterationCount,
        draft: draftCurrent,
        reviews: reviews.map(r => ({ name: r.name, score: r.score, feedback: r.feedback })),
        score: currentScore,
        editorialFixes: Array.from(new Set(allEditorialFixes)),
        infoGaps: Array.from(new Set(allInfoGaps))
      });

      if (currentScore >= 9.0 || iterationCount >= maxIterations || allInfoGaps.length > 0) {
        break;
      }

      console.log(`Running revision for iteration #${iterationCount}...`);
      const revisionPrompt = `
You are the Revision Engine. Your task is to update the current content draft based on the editorial fixes suggested by the Writer's Council.

Current Draft:
"""
${draftCurrent}
"""

Feedback & Suggested Fixes from Council:
${JSON.stringify(reviews, null, 2)}

Style Guide & Production Material context:
Style System:
${JSON.stringify(styleSystem, null, 2)}

Anti-Slop Guidelines:
${JSON.stringify(antiSlop, null, 2)}

Instructions:
1. Pay close attention to issues flagged by multiple reviewers (consensus fixes) and treat them as mandatory.
2. Fix other issues if they don't conflict.
3. Keep the conversational "texting a friend" tone.
4. Preserve all original stories and numbers.

Output the revised draft. Do not include meta remarks.
`;

      const revisionResponse = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: revisionPrompt
      });

      draftCurrent = revisionResponse.text;
      
      const lintReport = lintDraft(draftCurrent, styleSystem, antiSlop);
      if (!lintReport.success) {
        console.log(`Lint check failed for iteration #${iterationCount}:`, lintReport.issues);
        const lintFixes = lintReport.issues.map(i => `[LINT FIX] ${i.message}`);
        allEditorialFixes = [...allEditorialFixes, ...lintFixes];
      }

      await storage.saveDraft("current", draftCurrent);
    }

    await storage.saveActiveRunScore({ finalScore: currentScore });

    res.json({
      success: true,
      finalScore: currentScore,
      iterationsCount: iterationCount,
      iterations,
      finalDraft: draftCurrent
    });
  } catch (error) {
    console.error("Council error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ==========================================
// 8. Repurposing Endpoint (/api/repurpose)
// ==========================================
app.post("/api/repurpose", async (req, res) => {
  try {
    const approvedDraft = await storage.getDraft("current");
    if (!approvedDraft) {
      return res.status(400).json({ success: false, error: "No approved draft found. Create a draft first." });
    }

    const prompt = `
You are the Repurposing Engine. Take the following anchor content post and generate natively-formatted versions for the following channels.
Each derivative must capture the exact essence, hooks, stories, and metrics of the anchor, but match the specific formatting and behavioral rules of its platform.

Anchor Post:
"""
${approvedDraft}
"""

Generate derivatives for these 8 platforms:
1. **X (Twitter) Short Post**: A single, punchy tweet (under 280 chars) summarizing the core lesson.
2. **X Thread (5-7 tweets)**: A structured thread detailing the step-by-step process.
3. **LinkedIn Short Post**: A clean, professional but casual text post with single-sentence paragraph breaks and high-value takeaways.
4. **Email Newsletter Section**: A conversational newsletter editorial style, adding a greeting and a warm call-to-action.
5. **Instagram/Threads Caption**: A visual-first story format, using bullet points and casual emojis.
6. **Short-Form Video Script**: A 60-90 second script, featuring a strong hook in the first 3 seconds, pattern interrupts, and visual cues.
7. **Quote Graphics Text**: 3-5 standalone, high-impact quotable statements suitable for image graphics.
8. **SEO Blog Post**: A longer-form, structured article optimized for keywords, including headers (H1, H2) and a clear, clean call to action.

Return a JSON object containing the platforms:
{
  "derivatives": [
    { "platform": "X Short Post", "content": "text" },
    { "platform": "X Thread", "content": "tweet 1\\n\\ntweet 2..." },
    { "platform": "LinkedIn Post", "content": "text" },
    { "platform": "Email Newsletter", "content": "text" },
    { "platform": "Instagram Caption", "content": "text" },
    { "platform": "Short-Form Video Script", "content": "script text" },
    { "platform": "Quote Graphics", "content": "quotes list text" },
    { "platform": "SEO Blog Post", "content": "blog post markdown" }
  ]
}
Do not use markdown blocks. Return raw JSON.
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let result;
    try {
      result = JSON.parse(response.text.trim());
    } catch (e) {
      const clean = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      result = JSON.parse(clean);
    }

    const derivatives = result.derivatives || [];
    console.log(`Generated ${derivatives.length} derivatives. Running parallel Quality Gate review...`);

    const gatePromises = derivatives.map(async (derivative) => {
      const gatePrompt = `
You are a Quality Gate reviewer. Evaluate this repurposed content derivative against the target platform native formatting and rules.

Platform: "${derivative.platform}"
Repurposed Content:
"""
${derivative.content}
"""

Anchor Post Reference:
"""
${approvedDraft}
"""

Score the content from 1 to 10 based on how well it captures the essence of the anchor post and fits the native platform formatting rules.
Return JSON:
{
  "score": 8.5,
  "feedback": "brief feedback if score is below 8.0, explaining what formatting or details need adjustment. Otherwise leave empty."
}
Do not use markdown blocks. Return raw JSON.
`;
      try {
        const gateResponse = await ai.models.generateContent({
          model: FAST_MODEL,
          contents: gatePrompt,
          config: { responseMimeType: "application/json" }
        });
        
        let gateResult;
        try {
          gateResult = JSON.parse(gateResponse.text.trim());
        } catch (e) {
          const clean = gateResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
          gateResult = JSON.parse(clean);
        }

        const score = gateResult.score || 8.0;
        console.log(`Quality Gate for "${derivative.platform}" scored: ${score}/10`);

        if (score < 8.0) {
          console.log(`Triggering auto-revision pass for "${derivative.platform}" due to score < 8.0...`);
          const revisePrompt = `
You are a Content Editor. Revise the following repurposed content based on this quality feedback: "${gateResult.feedback}"

Platform: "${derivative.platform}"
Current Version:
"""
${derivative.content}
"""

Anchor Post Reference:
"""
${approvedDraft}
"""

Provide the revised version. Output only the content.
`;
          const reviseResponse = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: revisePrompt
          });
          return {
            platform: derivative.platform,
            content: reviseResponse.text.trim(),
            score: score,
            revised: true
          };
        }

        return {
          platform: derivative.platform,
          content: derivative.content,
          score: score,
          revised: false
        };

      } catch (err) {
        console.error(`Error in Quality Gate for "${derivative.platform}":`, err.message);
        return derivative;
      }
    });

    const finalDerivatives = await Promise.all(gatePromises);
    await storage.saveDerivatives(finalDerivatives);

    res.json({
      success: true,
      derivatives: finalDerivatives
    });
  } catch (error) {
    console.error("Repurposing error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. Learning Loop Endpoint (/api/learning-loop)
// ==========================================
app.post("/api/learning-loop", async (req, res) => {
  try {
    const { finalApprovedText } = req.body;
    const firstDraft = await storage.getDraft("first");
    
    if (!firstDraft || !finalApprovedText) {
      return res.status(400).json({ success: false, error: "Must have the first draft and final approved text to compare." });
    }

    const lessonsData = await storage.getLearnings();

    const activeContentTypeData = await storage.getActiveContentType();
    const activeContentType = activeContentTypeData.contentType.toLowerCase().replace(/\s+/g, "_");

    const activeScoreData = await storage.getActiveRunScore();
    const todayStr = new Date().toISOString().split("T")[0];

    const prompt = `
You are the Learning Loop state manager. Your job is to update the lessons database based on human edits.
Compare the First Draft (AI-generated) against the Final Approved Draft (human-refined) to extract concrete writing lessons.

First Draft:
"""
${firstDraft}
"""

Final Approved Draft:
"""
${finalApprovedText}
"""

Here is the existing lessons database:
${JSON.stringify({ global: lessonsData.global, byContentType: lessonsData.byContentType }, null, 2)}

Active Content Type: "${activeContentType}"
Today's Date: "${todayStr}"

Tasks:
1. Compare First Draft and Final Approved Draft. Identify 2-4 writing lessons.
2. For each lesson:
   - Categorize by dimension: 'hooks', 'tone', 'structure', 'stories', or 'formatting'.
   - Decide if it is 'global' (applies to all formats) or specific to the active content type ("${activeContentType}").
   - Match it against existing lessons in the database. If it is similar to an existing lesson:
     * Keep the existing lesson but update 'confidence' (add 0.1, cap at 1.0).
     * Update 'learnedAt' to today's date.
   - If it is new:
     * Add it to the database with confidence 0.5 and learnedAt set to today's date.
3. For all existing lessons in the database, if a lesson has not been updated ('learnedAt') in over 90 days relative to today's date, remove it (lesson decay).

Return the updated database JSON, matching this schema:
{
  "global": [
    { "lesson": "...", "category": "...", "contentType": "all", "learnedAt": "YYYY-MM-DD", "confidence": 0.8 }
  ],
  "byContentType": {
    "linkedin": [
      { "lesson": "...", "category": "...", "contentType": "linkedin", "learnedAt": "YYYY-MM-DD", "confidence": 0.6 }
    ]
  }
}
Do not wrap in markdown tags. Return raw JSON.
`;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let updatedDb;
    try {
      updatedDb = JSON.parse(response.text.trim());
    } catch (e) {
      const clean = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      updatedDb = JSON.parse(clean);
    }

    lessonsData.global = updatedDb.global || [];
    lessonsData.byContentType = updatedDb.byContentType || {};
    
    if (!lessonsData.metrics) {
      lessonsData.metrics = {
        averageScoreHistory: [],
        lessonCount: 0,
        lastUpdated: todayStr
      };
    }
    
    const avgScoreHistory = lessonsData.metrics.averageScoreHistory || [];
    avgScoreHistory.push(activeScoreData.finalScore || 8.0);
    if (avgScoreHistory.length > 10) avgScoreHistory.shift();
    
    const totalLessonsCount = (lessonsData.global?.length || 0) + 
      Object.values(lessonsData.byContentType).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);

    lessonsData.metrics = {
      averageScoreHistory: avgScoreHistory,
      lessonCount: totalLessonsCount,
      lastUpdated: todayStr
    };

    await storage.saveLearnings(lessonsData);
    await storage.saveDraft("final-approved", finalApprovedText);

    res.json({
      success: true,
      newLessons: "Lessons database updated with decay metrics.",
      allLessons: JSON.stringify(lessonsData, null, 2)
    });
  } catch (error) {
    console.error("Learning Loop error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/learning-loop/metrics", async (req, res) => {
  try {
    const lessonsData = await storage.getLearnings();

    const totalLessons = (lessonsData.global?.length || 0) + 
      Object.values(lessonsData.byContentType || {}).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);

    const averageScoreHistory = lessonsData.metrics?.averageScoreHistory || [8.0];
    
    const categoriesMap = {};
    const allLessons = [...(lessonsData.global || [])];
    Object.values(lessonsData.byContentType || {}).forEach(list => {
      if (Array.isArray(list)) allLessons.push(...list);
    });
    
    for (const l of allLessons) {
      const cat = l.category || "general";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    }
    
    const topCategories = Object.entries(categoriesMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    let staleLessonsCount = 0;
    const now = Date.now();
    for (const l of allLessons) {
      if (l.learnedAt) {
        const ageDays = (now - new Date(l.learnedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > 60) {
          staleLessonsCount++;
        }
      }
    }

    res.json({
      success: true,
      totalLessons,
      averageScoreHistory,
      topCategories: topCategories.slice(0, 3),
      staleLessons: staleLessonsCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to retrieve file contents (used to display Markdown files in UI)
app.get("/api/file/:name", async (req, res) => {
  try {
    const { name } = req.params;
    // Basic sanitization
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const content = await storage.readRawFile(name);
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic endpoint to save settings files (Markdown or JSON)
app.post("/api/settings/save-file", async (req, res) => {
  try {
    const { name, content } = req.body;
    
    // Basic sanitization
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
      return res.status(400).json({ success: false, error: "Invalid filename" });
    }
    
    // If the file is JSON, validate it before saving
    if (name.endsWith(".json")) {
      try {
        JSON.parse(content);
      } catch (err) {
        return res.status(400).json({ success: false, error: `Invalid JSON format: ${err.message}` });
      }
    }
    
    await storage.writeRawFile(name, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to save the style guide (legacy fallback wrapper)
app.post("/api/settings/save-style", async (req, res) => {
  try {
    const { content } = req.body;
    await storage.saveStyleGuide(content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to check settings status (reports configured APIs and research mode)
app.get("/api/settings/status", async (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasTavilyKey = !!process.env.TAVILY_API_KEY;
  const hasFirecrawlKey = !!process.env.FIRECRAWL_API_KEY;
  const hasSlackToken = !!process.env.SLACK_BOT_TOKEN;
  
  let researchMode = "google-grounding";
  if (hasTavilyKey && hasFirecrawlKey) {
    researchMode = "tavily+firecrawl";
  } else if (hasTavilyKey) {
    researchMode = "tavily";
  }
  
  res.json({
    success: true,
    hasApiKey: hasGeminiKey,
    hasGeminiKey,
    hasTavilyKey,
    hasFirecrawlKey,
    hasSlackToken,
    researchMode,
    message: hasGeminiKey 
      ? `Gemini API: Connected | Research Mode: ${researchMode}`
      : "Gemini API Key Missing. Set GEMINI_API_KEY in .env"
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Content Machine Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to interact.`);
  console.log(`==================================================`);
});
