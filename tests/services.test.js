process.env.NODE_ENV = "test";
import test from "node:test";
import assert from "node:assert";
import { setStorage, storage } from "../storage/index.js";
import { InMemoryStorageAdapter } from "../storage/adapters/memory.js";
import { ai } from "../services/ai.js";

// Import services to test
import { oracleService } from "../services/oracleService.js";
import { researcherService } from "../services/researcherService.js";
import { interviewService } from "../services/interviewService.js";
import { productionService } from "../services/productionService.js";
import { refineService } from "../services/refineService.js";
import { councilService } from "../services/councilService.js";
import { repurposeService } from "../services/repurposeService.js";
import { learningLoopService } from "../services/learningLoopService.js";
import { webService } from "../services/webService.js";
import { feedCollectorService } from "../services/feedCollectorService.js";

let originalSearch;
let originalScrape;
let originalCollectAll;
let originalSaveIdeaToNotion;

// Setup InMemoryStorageAdapter before running tests
test.before(async () => {
  // Save original functions to test them directly
  originalSearch = webService.search;
  originalScrape = webService.scrape;
  originalCollectAll = feedCollectorService.collectAll;
  originalSaveIdeaToNotion = feedCollectorService.saveIdeaToNotion;

  // Stub Web & Ingestion Services to decouple them from AI logic tests
  webService.search = async () => [
    { url: "https://example.com/deep-modules", title: "Deep Modules Guide", content: "Deep modules have deep interfaces." }
  ];
  webService.scrape = async () => ({
    markdown: "Scraped content about deep modules.",
    title: "Deep Modules Guide",
    description: "Deep modules have deep interfaces."
  });
  feedCollectorService.collectAll = async () => ({
    slack: [{ id: "ts1", author: "User1", timestamp: "2026-06-04T12:00:00Z", text: "We should collapse shallow modules to deepen them." }],
    gmail: [],
    transcripts: [],
    x_feed: []
  });
  feedCollectorService.saveIdeaToNotion = async () => true;

  // Mock API keys to enable full Tavily/Firecrawl pipeline testing
  process.env.TAVILY_API_KEY = "mock-tavily-key";
  process.env.FIRECRAWL_API_KEY = "mock-firecrawl-key";

  const memStorage = new InMemoryStorageAdapter();
  await memStorage.ensureInitialized();
  
  // Set up mock inputs in storage for Oracle mining and settings status checking
  memStorage.store.set("mock-inputs", {
    slack: [{ id: "ts1", author: "User1", timestamp: "2026-06-04T12:00:00Z", text: "We should collapse shallow modules to deepen them." }],
    gmail: [],
    transcripts: [],
    x_feed: [
      {
        id: "tweet_1",
        author: "@levie",
        timestamp: "2026-06-03T18:22:00Z",
        text: "The next wave of software...",
        link: "https://example.com/tweet_1"
      }
    ]
  });
  
  memStorage.store.set("style-system", { voice: { sentenceLength: { max: 25 }, readingLevel: { target: "Grade 7", max: "Grade 9" } } });
  memStorage.store.set("anti-slop", { bannedWords: ["revolutionary", "synergy"] });
  memStorage.store.set("golden-examples", []);

  setStorage(memStorage);

  // Stub/Mock the Gemini SDK generateContent call to return realistic mock responses
  ai.models.generateContent = async (config) => {
    const prompt = config.contents || "";
    
    if (prompt.includes("The Oracle")) {
      return {
        text: JSON.stringify([
          {
            title: "MOCK: Deep Modules",
            description: "Deep modules provide high leverage.",
            source: "Slack Channel #product-ideas",
            scores: { authenticity: 9.0, contrarian: 8.0, storyDensity: 7.0, audienceValue: 8.0 },
            score: 8.2,
            rationale: "Authentic engineering concept."
          }
        ])
      };
    }
    
    if (prompt.includes("deduplication")) {
      return {
        text: JSON.stringify([
          { title: "MOCK: Deep Modules", isDuplicate: false, duplicateOf: null }
        ])
      };
    }
    
    if (prompt.includes("The Researcher")) {
      return {
        text: "# Research Report: MOCK Deep Modules\n\n## TL;DR\nSynthesized details."
      };
    }
    
    if (prompt.includes("fact-checker")) {
      return {
        text: "## Fact Check & Verification\n[Verified] Confirmed."
      };
    }
    
    if (prompt.includes("conducting the first turn")) {
      return {
        text: "Mock Barbaro Question: What did that feel like?"
      };
    }
    
    if (prompt.includes("evaluate if this answer is high quality")) {
      if (prompt.includes('responded with: "bad answer"')) {
        return {
          text: JSON.stringify({
            score: 4.0,
            storySpine: { setup: false, complication: false, turningPoint: false, resolution: false, lesson: false },
            feedback: "Too vague. Need stories."
          })
        };
      }
      return {
        text: JSON.stringify({
          score: 8.0,
          storySpine: { setup: true, complication: true, turningPoint: true, resolution: true, lesson: true },
          feedback: "Praise details."
        })
      };
    }

    if (prompt.includes("expert content researcher")) {
      return {
        text: JSON.stringify({
          emotionalPalette: [{ emotion: "joy", moment: "Refactoring code", quote: "We did it!" }],
          numericInventory: [{ value: "1", context: "code test" }],
          quoteInventory: ["We did it!"]
        })
      };
    }

    if (prompt.includes("conducting the next turn")) {
      return {
        text: "Mock Joe Rogan Question: Walk me through it."
      };
    }
    
    if (prompt.includes("Content Production compiler")) {
      return {
        text: "# Production Reference File\n\n## Key Stories\n- Story 1: Modularizing pipelines."
      };
    }
    
    if (prompt.includes("Refinement AI")) {
      return {
        text: "Draft: Decouple pipelines to write cleaner tests."
      };
    }
    
    if (prompt.includes("Evaluate the following draft")) {
      return {
        text: JSON.stringify({
          score: 9.2,
          reasoning: "Meets rules.",
          editorialFixes: [],
          infoGaps: []
        })
      };
    }
    
    if (prompt.includes("Repurposing Engine")) {
      return {
        text: JSON.stringify({
          derivatives: [
            { platform: "X Short Post", content: "Mock X Tweet content" },
            { platform: "LinkedIn Post", content: "Mock LinkedIn content" }
          ]
        })
      };
    }
    
    if (prompt.includes("Quality Gate reviewer")) {
      return {
        text: JSON.stringify({
          score: 9.0,
          feedback: ""
        })
      };
    }
    
    if (prompt.includes("Learning Loop state manager")) {
      return {
        text: JSON.stringify({
          global: [{ lesson: "Keep it simple", category: "tone", contentType: "all", learnedAt: "2026-06-04", confidence: 0.6 }],
          byContentType: {}
        })
      };
    }
    
    return { text: "Mock standard fallback" };
  };
});

test("Oracle Service - mineSpikes pipeline runs successfully", async () => {
  const result = await oracleService.mineSpikes();
  assert.strictEqual(result.minedCount, 1);
  assert.strictEqual(result.vault.length, 1);
  assert.strictEqual(result.vault[0].title, "MOCK: Deep Modules");
});

test("Researcher Service - conductResearch pipeline synthesizes and fact-checks report", async () => {
  // Set selected active idea
  await storage.saveActiveIdea({ id: "idea1", title: "MOCK: Deep Modules", description: "Deep modules provide high leverage." });
  
  const result = await researcherService.conductResearch();
  assert.ok(result.report);
  assert.ok(result.report.includes("Research Report: MOCK Deep Modules"));
  assert.ok(result.report.includes("Fact Check & Verification"));
});

test("Interview Service - executes start and answer sequence", async () => {
  await storage.saveActiveIdea({ id: "idea1", title: "MOCK: Deep Modules", description: "Deep modules provide high leverage." });
  await storage.saveResearchReport("# Research Report: MOCK Deep Modules");

  // Test start interview
  const startResult = await interviewService.startInterview(2); // Set maxQuestions to 2
  assert.strictEqual(startResult.state.completed, false);
  assert.strictEqual(startResult.state.currentInterviewer, "Michael Barbaro");
  assert.strictEqual(startResult.state.currentQuestion, "Mock Barbaro Question: What did that feel like?");

  // Test submit answer (Question 1)
  const answerResult1 = await interviewService.submitAnswer("In the moment it felt daunting, but we just got started.");
  assert.strictEqual(answerResult1.advance, true);
  assert.strictEqual(answerResult1.state.questionsAsked.length, 1);
  assert.strictEqual(answerResult1.state.currentInterviewer, "Joe Rogan");

  // Test submit answer (Question 2 - completes the interview)
  const answerResult2 = await interviewService.submitAnswer("We did it by writing code.");
  assert.strictEqual(answerResult2.advance, true);
  assert.strictEqual(answerResult2.state.completed, true);
  assert.strictEqual(answerResult2.state.currentInterviewer, "System");
});

test("Production Service - compiles reference markdown", async () => {
  const result = await productionService.compileProductionMarkdown();
  assert.ok(result.productionRaw);
  assert.ok(result.productionRaw.includes("Production Reference File"));
});

test("Refine Service - generates platform draft", async () => {
  const result = await refineService.refineDraft("LinkedIn Post");
  assert.ok(result.draft);
  assert.ok(result.draft.includes("Draft: Decouple pipelines"));
});

test("Council Service - runs revision and lint loops", async () => {
  const result = await councilService.runCouncilLoop("LinkedIn Post");
  assert.ok(result.finalScore);
  assert.ok(result.finalDraft);
  assert.strictEqual(result.iterations.length, 1);
});

test("Repurpose Service - generates 8 derivatives with Quality Gates", async () => {
  const result = await repurposeService.generateRepurposedContent();
  assert.strictEqual(result.derivatives.length, 2);
  assert.strictEqual(result.derivatives[0].platform, "X Short Post");
});

test("Learning Loop Service - updates lesson database and handles score metrics", async () => {
  const result = await learningLoopService.processLearningLoop("Final Draft: Decouple pipelines to write cleaner tests and mock APIs.");
  assert.ok(result.newLessons);
  assert.ok(result.allLessons);
  
  const parsedLessons = JSON.parse(result.allLessons);
  assert.strictEqual(parsedLessons.global.length, 1);
  assert.strictEqual(parsedLessons.global[0].lesson, "Keep it simple");
});

test("Interview Service - rejects low-scoring answers", async () => {
  await storage.saveActiveIdea({ id: "idea1", title: "MOCK: Deep Modules", description: "Deep modules provide high leverage." });
  await storage.saveResearchReport("# Research Report: MOCK Deep Modules");

  // Start interview
  await interviewService.startInterview(2);

  // Submit a low-scoring answer ("bad answer")
  const result = await interviewService.submitAnswer("bad answer");
  
  // Verify that it did not advance, completed remains false, and question asks to expand
  assert.strictEqual(result.advance, false);
  assert.strictEqual(result.state.completed, false);
  assert.strictEqual(result.state.questionsAsked.length, 0);
  assert.ok(result.state.currentQuestion.includes("Too vague. Need stories."));
  
  // Submit a high-scoring answer to advance
  const advanceResult = await interviewService.submitAnswer("We did it by writing code and saving 40 hours of manual labor.");
  assert.strictEqual(advanceResult.advance, true);
  assert.strictEqual(advanceResult.state.questionsAsked.length, 1);
  assert.strictEqual(advanceResult.state.currentInterviewer, "Joe Rogan");
});

test("Web Service - search returns Tavily results", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => ({
        results: [
          { url: "https://example.com/deep-modules", title: "Deep Modules Guide", content: "Deep modules have deep interfaces." }
        ]
      })
    };
  };
  try {
    const results = await originalSearch("test query", "mock-key");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, "Deep Modules Guide");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Web Service - scrape returns Firecrawl markdown", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          markdown: "Scraped content about deep modules.",
          metadata: { title: "Deep Modules Guide", description: "Deep modules have deep interfaces." }
        }
      })
    };
  };
  try {
    const result = await originalScrape("https://example.com/deep-modules", "mock-key");
    assert.ok(result);
    assert.strictEqual(result.title, "Deep Modules Guide");
    assert.strictEqual(result.markdown, "Scraped content about deep modules.");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Feed Collector Service - collectAll returns parsed feeds", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const urlString = String(url);
    if (urlString.includes("slack.com")) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          messages: [
            { client_msg_id: "ts1", ts: "1717500000", user: "User1", text: "We should collapse shallow modules to deepen them." }
          ]
        })
      };
    }
    return { ok: false, text: async () => "Not Found" };
  };

  // Temporarily set API key so real flow (with mock fetch) runs
  process.env.SLACK_BOT_TOKEN = "mock-token";
  process.env.SLACK_CHANNEL_ID = "mock-channel";
  
  try {
    const feeds = await originalCollectAll();
    assert.ok(feeds.slack);
    assert.strictEqual(feeds.slack.length, 1);
    assert.strictEqual(feeds.slack[0].author, "User1");
    // Verify scraping flow was executed using stubbed webService.scrape
    assert.ok(feeds.x_feed[0].text.includes("Scraped content about deep modules."));
  } finally {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    globalThis.fetch = originalFetch;
  }
});

test("Feed Collector Service - saveIdeaToNotion executes fetch page creation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const urlString = String(url);
    if (urlString.includes("api.notion.com")) {
      return {
        ok: true,
        json: async () => ({
          ok: true
        })
      };
    }
    return { ok: false, text: async () => "Not Found" };
  };

  process.env.NOTION_API_KEY = "mock-key";
  process.env.NOTION_DATABASE_ID = "mock-db";
  
  try {
    const success = await originalSaveIdeaToNotion({ title: "Idea 1", score: 8.5 });
    assert.strictEqual(success, true);
  } finally {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_DATABASE_ID;
    globalThis.fetch = originalFetch;
  }
});

test.after(() => {
  // Restore original methods
  if (originalSearch) webService.search = originalSearch;
  if (originalScrape) webService.scrape = originalScrape;
  if (originalCollectAll) feedCollectorService.collectAll = originalCollectAll;
  if (originalSaveIdeaToNotion) feedCollectorService.saveIdeaToNotion = originalSaveIdeaToNotion;
});
