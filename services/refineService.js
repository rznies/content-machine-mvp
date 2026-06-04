import { storage } from "../storage/index.js";
import { ai, PRO_MODEL } from "./ai.js";

export const refineService = {
  async refineDraft(contentType) {
    if (!contentType) {
      throw new Error("Content type is required.");
    }
    await storage.saveActiveContentType({ contentType });

    const productionRaw = await storage.getDraft("production-raw");
    const styleGuide = await storage.getStyleGuide();
    
    // Load learnings from JSON database and format for the copywriter prompt
    const learnings = await storage.getLearnings();
    let lessonsText = "";
    if (learnings.global && learnings.global.length > 0) {
      lessonsText += "Global Lessons:\n" + learnings.global.map(l => `- [${l.category}] ${l.lesson}`).join("\n") + "\n";
    }
    const typeKey = contentType.toLowerCase().replace(/\s+/g, "_");
    if (learnings.byContentType && learnings.byContentType[typeKey] && learnings.byContentType[typeKey].length > 0) {
      lessonsText += `Lessons for ${contentType}:\n` + learnings.byContentType[typeKey].map(l => `- [${l.category}] ${l.lesson}`).join("\n") + "\n";
    }
    if (!lessonsText) lessonsText = "No lessons logged yet.";

    if (!productionRaw) {
      throw new Error("No production file found. Complete the production step.");
    }

    const prompt = `
You are Refinement AI, a world-class copywriter who writes in the exact voice of the creator.
Your goal is to draft a draft for the content type: "${contentType}".

Here is the source information:
- **Raw Production Material (Sacred - use exact quotes & stories)**:
${productionRaw}

- **Style Guide**:
${styleGuide}

- **Learnings & Lessons from Past Feedback (Overriding style guide on conflict)**:
${lessonsText}

# Rules
1. **Rule #1**: Write like you are texting a friend. 
2. Pull raw, emotional stories and specific numbers from the production material. Do not generalize them.
3. If writing an X Thread, use clear numbering (1/, 2/) and a hook in the first tweet.
4. If writing a LinkedIn post, start with a punchy hook, use short single-sentence paragraphs, and end with an interactive question.
5. If writing a Long Essay, use clear section headers but keep the informal tone.

Draft the first version. Do not include meta comments, just the content draft.
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt
    });

    const draft = response.text;
    await storage.saveDraft("first", draft);
    await storage.saveDraft("current", draft);

    return { draft };
  }
};
