import fs from "fs/promises";
import path from "path";
import { StorageInterface } from "../interface.js";

export class DiskStorageAdapter extends StorageInterface {
  constructor(basePath = "db") {
    super();
    this.basePath = basePath;
    this.writeMutexes = new Map();
  }

  // Helper to ensure base directory exists
  async ensureInitialized() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  // Mutex lock to serialize writes to the same file key
  async runLocked(fileKey, operation) {
    if (!this.writeMutexes.has(fileKey)) {
      this.writeMutexes.set(fileKey, Promise.resolve());
    }
    
    const previousPromise = this.writeMutexes.get(fileKey);
    const newPromise = previousPromise.then(async () => {
      try {
        return await operation();
      } catch (err) {
        console.error(`Error in locked storage operation for key: ${fileKey}`, err);
        throw err;
      }
    });

    this.writeMutexes.set(fileKey, newPromise.catch(() => {}));
    return newPromise;
  }

  // Generic JSON read helper with fallback
  async readJson(filename, defaultValue) {
    const filePath = path.join(this.basePath, filename);
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return defaultValue;
      }
      if (error instanceof SyntaxError) {
        console.warn(`JSON corruption detected in ${filePath}. Renaming file and returning default.`);
        try {
          const backupPath = `${filePath}.corrupted-${Date.now()}`;
          await fs.rename(filePath, backupPath);
        } catch (renameError) {
          console.error(`Failed to create corrupted backup for ${filename}:`, renameError.message);
        }
      } else {
        console.error(`Error reading JSON file ${filename}:`, error.message);
      }
      return defaultValue;
    }
  }

  // Generic JSON write helper
  async writeJson(filename, data) {
    await this.ensureInitialized();
    const filePath = path.join(this.basePath, filename);
    await this.runLocked(filename, async () => {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    });
  }

  // Generic Markdown read helper with fallback
  async readMarkdown(filename, defaultValue = "") {
    const filePath = path.join(this.basePath, filename);
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      if (error.code === "ENOENT") {
        return defaultValue;
      }
      console.error(`Error reading markdown file ${filename}:`, error.message);
      return defaultValue;
    }
  }

  // Generic Markdown write helper
  async writeMarkdown(filename, content) {
    await this.ensureInitialized();
    const filePath = path.join(this.basePath, filename);
    await this.runLocked(filename, async () => {
      await fs.writeFile(filePath, content, "utf-8");
    });
  }

  // --- IStorage Implementation ---

  async getVault() {
    return await this.readJson("vault.json", []);
  }

  async saveVault(vault) {
    await this.writeJson("vault.json", vault);
  }

  async getActiveIdea() {
    return await this.readJson("active-idea.json", null);
  }

  async saveActiveIdea(idea) {
    await this.writeJson("active-idea.json", idea);
  }

  async getActiveInterview() {
    return await this.readJson("active-interview.json", null);
  }

  async saveActiveInterview(interview) {
    await this.writeJson("active-interview.json", interview);
  }

  async getResearchReport() {
    return await this.readMarkdown("research-report.md", "");
  }

  async saveResearchReport(report) {
    await this.writeMarkdown("research-report.md", report);
  }

  async getStyleGuide() {
    return await this.readMarkdown("style-guide.md", "");
  }

  async saveStyleGuide(content) {
    await this.writeMarkdown("style-guide.md", content);
  }

  async getStyleSystem() {
    return await this.readJson("style-system.json", {
      voice: {},
      rules: [],
      preferredPhrases: [],
      platformAdaptations: {},
      voiceExamples: []
    });
  }

  async saveStyleSystem(system) {
    await this.writeJson("style-system.json", system);
  }

  async getLearnings() {
    const todayStr = new Date().toISOString().split("T")[0];
    return await this.readJson("content-lessons.json", {
      global: [],
      byContentType: {},
      metrics: {
        averageScoreHistory: [],
        lessonCount: 0,
        lastUpdated: todayStr
      }
    });
  }

  async saveLearnings(learnings) {
    await this.writeJson("content-lessons.json", learnings);
  }

  async getDraft(type) {
    return await this.readMarkdown(`draft-${type}.md`, "");
  }

  async saveDraft(type, content) {
    await this.writeMarkdown(`draft-${type}.md`, content);
  }

  async getDerivatives() {
    return await this.readJson("derivatives.json", []);
  }

  async saveDerivatives(derivatives) {
    await this.writeJson("derivatives.json", derivatives);
  }

  async getAntiSlop() {
    return await this.readJson("anti-slop.json", { bannedWords: [], bannedPatterns: [], replacements: {} });
  }

  async getGoldenExamples() {
    return await this.readJson("golden-examples.json", []);
  }

  async getInterviewExtraction() {
    return await this.readJson("interview-extraction.json", {});
  }

  async saveInterviewExtraction(extraction) {
    await this.writeJson("interview-extraction.json", extraction);
  }

  async getActiveContentType() {
    return await this.readJson("active-content-type.json", { contentType: "all" });
  }

  async saveActiveContentType(contentType) {
    await this.writeJson("active-content-type.json", contentType);
  }

  async getActiveRunScore() {
    return await this.readJson("active-run-score.json", { finalScore: 8.0 });
  }

  async saveActiveRunScore(score) {
    await this.writeJson("active-run-score.json", score);
  }

  async readRawFile(name) {
    return await this.readMarkdown(name, "");
  }

  async writeRawFile(name, content) {
    if (name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(content);
        await this.writeJson(name, parsed);
        return;
      } catch (e) {
        // Fallback to raw text writing
      }
    }
    await this.writeMarkdown(name, content);
  }
}
