import { storage } from "../storage/index.js";
import { ai, FAST_MODEL, parseGeminiJson } from "./ai.js";

export const learningLoopService = {
  async processLearningLoop(finalApprovedText) {
    const firstDraft = await storage.getDraft("first");
    
    if (!firstDraft || !finalApprovedText) {
      throw new Error("Must have the first draft and final approved text to compare.");
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

    const updatedDb = parseGeminiJson(response.text) || {};

    const ninetyDaysAgo = new Date(todayStr);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const filterDecayed = (list) => {
      if (!Array.isArray(list)) return [];
      return list.filter(item => {
        if (!item.learnedAt) return true;
        const itemDate = new Date(item.learnedAt);
        if (isNaN(itemDate.getTime())) return true;
        return itemDate >= ninetyDaysAgo;
      });
    };

    lessonsData.global = filterDecayed(updatedDb.global || []);
    
    lessonsData.byContentType = {};
    if (updatedDb.byContentType) {
      for (const [key, list] of Object.entries(updatedDb.byContentType)) {
        lessonsData.byContentType[key] = filterDecayed(list);
      }
    }
    
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

    return {
      newLessons: "Lessons database updated with decay metrics.",
      allLessons: JSON.stringify(lessonsData, null, 2)
    };
  }
};
