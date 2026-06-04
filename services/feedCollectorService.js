import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import Parser from "rss-parser";
import { webService } from "./webService.js";

// ==========================================
// REAL DATA CONNECTORS & COLLECTORS
// ==========================================

async function fetchRealSlack() {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) {
    console.log("Slack config missing (SLACK_BOT_TOKEN/SLACK_CHANNEL_ID). Returning empty list.");
    return [];
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
      console.warn("Slack API response failed:", data.error);
      return [];
    }
  } catch (err) {
    console.error("Slack fetch error:", err.message);
    return [];
  }
}

async function fetchRealGmail() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.log("Gmail IMAP config missing (GMAIL_USER/GMAIL_APP_PASSWORD). Returning empty list.");
    return [];
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
    console.error("Gmail IMAP fetch error:", err.message);
    return [];
  }
}

async function fetchRealNotion() {
  const apiKey = process.env.NOTION_API_KEY;
  const pageIdsStr = process.env.NOTION_PAGE_IDS;
  if (!apiKey || !pageIdsStr) {
    console.log("Notion page config missing (NOTION_API_KEY/NOTION_PAGE_IDS). Returning empty list.");
    return [];
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

    return notionNotes;
  } catch (err) {
    console.error("Notion fetch error:", err.message);
    return [];
  }
}

async function fetchRealRSS() {
  const feedUrlsStr = process.env.FEED_URLS;
  if (!feedUrlsStr) {
    console.log("FEED_URLS config missing. Returning empty list.");
    return [];
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
          title: item.title || "",
          text: `Title: ${item.title}\nSummary: ${item.contentSnippet || item.content || ""}`,
          link: item.link || ""
        });
      });
    }

    return feedItems;
  } catch (err) {
    console.error("RSS fetch error:", err.message);
    return [];
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

export const feedCollectorService = {
  async collectAll() {
    const slack = await fetchRealSlack();
    const gmail = await fetchRealGmail();
    const transcripts = await fetchRealNotion();
    let x_feed = await fetchRealRSS();

    const fcApiKey = process.env.FIRECRAWL_API_KEY;
    if (fcApiKey && x_feed.length > 0) {
      console.log(`Firecrawl API Key present. Scraping full content of top RSS feed items...`);
      const itemsToScrape = x_feed.slice(0, 5);
      const scrapePromises = itemsToScrape.map(async (item) => {
        if (item.link) {
          const scraped = await webService.scrape(item.link, fcApiKey);
          if (scraped && scraped.markdown) {
            return {
              ...item,
              text: `Title: ${item.title || scraped.title || item.author || "Feed Item"}\nLink: ${item.link}\nFull Article Content:\n${scraped.markdown.substring(0, 8000)}`
            };
          }
        }
        return item;
      });
      const scrapedItems = await Promise.all(scrapePromises);
      x_feed = [...scrapedItems, ...x_feed.slice(5)];
    }

    return { slack, gmail, transcripts, x_feed };
  },

  async saveIdeaToNotion(idea) {
    return await saveToRealNotionVault(idea);
  }
};
