import { storage } from "../storage/index.js";
import { ai, FAST_MODEL, PRO_MODEL, parseGeminiJson } from "./ai.js";

// ==========================================
// VOICE LINT ENGINE HELPERS
// ==========================================

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

// ==========================================
// EXPORTED SERVICE
// ==========================================

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

export const councilService = {
  // Expose lint draft as a service utility
  lintDraft,

  async runCouncilLoop(contentType) {
    let draftCurrent = await storage.getDraft("current");
    const productionRaw = await storage.getDraft("production-raw");
    const styleSystem = await storage.getStyleSystem();
    const antiSlop = await storage.getAntiSlop();
    const goldenExamples = await storage.getGoldenExamples();

    if (!draftCurrent) {
      throw new Error("No current draft found. Draft a post first.");
    }

    let iterations = [];
    let currentScore = 0;
    let maxIterations = 3;
    let iterationCount = 0;

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
          
          const result = parseGeminiJson(response.text) || {};
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

    return {
      finalScore: currentScore,
      iterationsCount: iterationCount,
      iterations,
      finalDraft: draftCurrent
    };
  }
};
