import { storage } from "../storage/index.js";
import { ai, FAST_MODEL } from "./ai.js";
import { webService } from "./webService.js";

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const researcherService = {
  async conductResearch() {
    const activeIdea = await storage.getActiveIdea();
    if (!activeIdea) {
      throw new Error("No active idea selected.");
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
        webService.search(query1, tavilyKey),
        webService.search(query2, tavilyKey),
        webService.search(query3, tavilyKey)
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
        const scraped = await webService.scrape(item.url, firecrawlKey);
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
    return { report: reportContent };
  }
};
