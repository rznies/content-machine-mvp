import { StorageInterface } from "../interface.js";

export class InMemoryStorageAdapter extends StorageInterface {
  constructor() {
    super();
    this.store = new Map();
  }

  async ensureInitialized() {
    // No-op for in-memory adapter
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
