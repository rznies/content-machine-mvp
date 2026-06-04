import { storage } from "../storage/index.js";
import { ai, FAST_MODEL, parseGeminiJson } from "./ai.js";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import Parser from "rss-parser";

// ==========================================
// REAL DATA CONNECTORS & COLLECTORS
// ==========================================

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
// EXPORTED SERVICE
// ==========================================

export const oracleService = {
  async mineSpikes() {
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

    const newIdeas = parseGeminiJson(response.text) || [];

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

      const dupResults = parseGeminiJson(dupResponse.text) || [];

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

    return {
      minedCount: filteredNewIdeas.length,
      vault: updatedVault
    };
  }
};
