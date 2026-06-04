import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage/index.js";

// Import Pipeline Services
import { oracleService } from "./services/oracleService.js";
import { researcherService } from "./services/researcherService.js";
import { interviewService } from "./services/interviewService.js";
import { productionService } from "./services/productionService.js";
import { refineService } from "./services/refineService.js";
import { councilService } from "./services/councilService.js";
import { repurposeService } from "./services/repurposeService.js";
import { learningLoopService } from "./services/learningLoopService.js";

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

// ==========================================
// 1. The Oracle Endpoint (/api/oracle/mine)
// ==========================================
app.post("/api/oracle/mine", async (req, res) => {
  try {
    const result = await oracleService.mineSpikes();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Oracle endpoint error:", error);
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
    const result = await researcherService.conductResearch();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Researcher endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. Interview Panel Endpoints (/api/interview)
// ==========================================
app.post("/api/interview/start", async (req, res) => {
  try {
    const maxQs = req.body.maxQuestions || 10;
    const result = await interviewService.startInterview(maxQs);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Interview start endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/interview/status", async (req, res) => {
  const state = await storage.getActiveInterview();
  res.json({ success: true, state });
});

app.post("/api/interview/answer", async (req, res) => {
  try {
    const { answer } = req.body;
    const result = await interviewService.submitAnswer(answer);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Interview answer endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. Production Compile (/api/production)
// ==========================================
app.post("/api/production", async (req, res) => {
  try {
    const result = await productionService.compileProductionMarkdown();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Production compile endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. Refinement Endpoint (/api/refine)
// ==========================================
app.post("/api/refine", async (req, res) => {
  try {
    const { contentType } = req.body;
    const result = await refineService.refineDraft(contentType);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Refinement endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. Writer's Council & Revision (/api/council)
// ==========================================
app.post("/api/council", async (req, res) => {
  try {
    const { contentType } = req.body;
    const result = await councilService.runCouncilLoop(contentType);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Council endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. Repurposing Endpoint (/api/repurpose)
// ==========================================
app.post("/api/repurpose", async (req, res) => {
  try {
    const result = await repurposeService.generateRepurposedContent();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Repurposing endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. Learning Loop Endpoint (/api/learning-loop)
// ==========================================
app.post("/api/learning-loop", async (req, res) => {
  try {
    const { finalApprovedText } = req.body;
    const result = await learningLoopService.processLearningLoop(finalApprovedText);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Learning Loop endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 10. Analytics & Settings Endpoints
// ==========================================
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

app.get("/api/file/:name", async (req, res) => {
  try {
    const { name } = req.params;
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const content = await storage.readRawFile(name);
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/settings/save-file", async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
      return res.status(400).json({ success: false, error: "Invalid filename" });
    }
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

app.post("/api/settings/save-style", async (req, res) => {
  try {
    const { content } = req.body;
    await storage.saveStyleGuide(content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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
