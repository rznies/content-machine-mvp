import { StorageInterface } from "../interface.js";
import fs from "fs/promises";
import path from "path";

export class InMemoryStorageAdapter extends StorageInterface {
  constructor() {
    super();
    this.store = new Map();
  }

  async ensureInitialized() {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    const filesToPrepopulate = [
      { key: "vault", name: "vault.json", type: "json", defaultVal: [] },
      { key: "active-idea", name: "active-idea.json", type: "json", defaultVal: null },
      { key: "active-interview", name: "active-interview.json", type: "json", defaultVal: null },
      { key: "style-guide", name: "style-guide.md", type: "text", defaultVal: "" },
      { key: "style-system", name: "style-system.json", type: "json", defaultVal: { voice: {}, rules: [], preferredPhrases: [], platformAdaptations: {}, voiceExamples: [] } },
      { key: "content-lessons", name: "content-lessons.json", type: "json", defaultVal: { global: [], byContentType: {}, metrics: { averageScoreHistory: [], lessonCount: 0, lastUpdated: new Date().toISOString().split("T")[0] } } },
      { key: "derivatives", name: "derivatives.json", type: "json", defaultVal: [] },
      { key: "anti-slop", name: "anti-slop.json", type: "json", defaultVal: { bannedWords: [], bannedPatterns: [], replacements: {} } },
      { key: "golden-examples", name: "golden-examples.json", type: "json", defaultVal: [] },
      { key: "mock-inputs", name: "mock-inputs.json", type: "json", defaultVal: {} },
      { key: "interview-extraction", name: "interview-extraction.json", type: "json", defaultVal: {} },
      { key: "active-content-type", name: "active-content-type.json", type: "json", defaultVal: { contentType: "all" } },
      { key: "active-run-score", name: "active-run-score.json", type: "json", defaultVal: { finalScore: 8.0 } }
    ];

    for (const f of filesToPrepopulate) {
      const filePath = path.join("db", f.name);
      try {
        const data = await fs.readFile(filePath, "utf-8");
        if (f.type === "json") {
          this.store.set(f.key, JSON.parse(data));
          this.store.set(f.name, JSON.parse(data));
        } else {
          this.store.set(f.key, data);
          this.store.set(f.name, data);
        }
      } catch (err) {
        this.store.set(f.key, f.defaultVal);
        this.store.set(f.name, f.defaultVal);
      }
    }
  }

  async getVault() {
    return this.store.get("vault") || [];
  }

  async saveVault(vault) {
    this.store.set("vault", JSON.parse(JSON.stringify(vault)));
  }

  async getActiveIdea() {
    return this.store.get("active-idea") || null;
  }

  async saveActiveIdea(idea) {
    this.store.set("active-idea", idea ? JSON.parse(JSON.stringify(idea)) : null);
  }

  async getActiveInterview() {
    return this.store.get("active-interview") || null;
  }

  async saveActiveInterview(interview) {
    this.store.set("active-interview", interview ? JSON.parse(JSON.stringify(interview)) : null);
  }

  async getResearchReport() {
    return this.store.get("research-report") || "";
  }

  async saveResearchReport(report) {
    this.store.set("research-report", report);
  }

  async getStyleGuide() {
    return this.store.get("style-guide") || "";
  }

  async saveStyleGuide(content) {
    this.store.set("style-guide", content);
  }

  async getStyleSystem() {
    return this.store.get("style-system") || {
      voice: {},
      rules: [],
      preferredPhrases: [],
      platformAdaptations: {},
      voiceExamples: []
    };
  }

  async saveStyleSystem(system) {
    this.store.set("style-system", JSON.parse(JSON.stringify(system)));
  }

  async getLearnings() {
    const todayStr = new Date().toISOString().split("T")[0];
    return this.store.get("content-lessons") || {
      global: [],
      byContentType: {},
      metrics: {
        averageScoreHistory: [],
        lessonCount: 0,
        lastUpdated: todayStr
      }
    };
  }

  async saveLearnings(learnings) {
    this.store.set("content-lessons", JSON.parse(JSON.stringify(learnings)));
  }

  async getDraft(type) {
    return this.store.get(`draft-${type}`) || "";
  }

  async saveDraft(type, content) {
    this.store.set(`draft-${type}`, content);
  }

  async getDerivatives() {
    return this.store.get("derivatives") || [];
  }

  async saveDerivatives(derivatives) {
    this.store.set("derivatives", JSON.parse(JSON.stringify(derivatives)));
  }

  async getAntiSlop() {
    return this.store.get("anti-slop") || { bannedWords: [], bannedPatterns: [], replacements: {} };
  }

  async getGoldenExamples() {
    return this.store.get("golden-examples") || [];
  }

  async getMockInputs() {
    return this.store.get("mock-inputs") || {};
  }

  async getInterviewExtraction() {
    return this.store.get("interview-extraction") || {};
  }

  async saveInterviewExtraction(extraction) {
    this.store.set("interview-extraction", JSON.parse(JSON.stringify(extraction)));
  }

  async getActiveContentType() {
    return this.store.get("active-content-type") || { contentType: "all" };
  }

  async saveActiveContentType(contentType) {
    this.store.set("active-content-type", JSON.parse(JSON.stringify(contentType)));
  }

  async getActiveRunScore() {
    return this.store.get("active-run-score") || { finalScore: 8.0 };
  }

  async saveActiveRunScore(score) {
    this.store.set("active-run-score", JSON.parse(JSON.stringify(score)));
  }

  async readRawFile(name) {
    const val = this.store.get(name);
    if (typeof val === "object") {
      return JSON.stringify(val, null, 2);
    }
    return val || "";
  }

  async writeRawFile(name, content) {
    if (name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(content);
        this.store.set(name, parsed);
        return;
      } catch (e) {
        // Fallback
      }
    }
    this.store.set(name, content);
  }
}
