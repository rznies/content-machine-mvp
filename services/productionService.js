import { storage } from "../storage/index.js";
import { ai, PRO_MODEL } from "./ai.js";

export const productionService = {
  async compileProductionMarkdown() {
    const interview = await storage.getActiveInterview();
    if (!interview || !interview.completed) {
      throw new Error("Interview must be completed first.");
    }

    const transcript = interview.questionsAsked.map(q => `${q.interviewer}: ${q.question}\nCreator: ${q.answer}`).join("\n\n");
    const extraction = await storage.getInterviewExtraction();

    const prompt = `
You are the Content Production compiler. Your job is to turn the interview transcript into a structured, raw reference Markdown file.
This raw file is SACRED: it must contain the creator's exact stories, key figures, and core quotes. Do not paraphrase them into corporate summaries. Keep the emotional anchor and exact word choices intact.

Here is the interview transcript:
${transcript}

We have also pre-extracted this structured metadata:
${JSON.stringify(extraction, null, 2)}

Create a document with the following sections:
1. **System Metadata & Quality Metrics**:
   - Content Density Score: [Calculate and output: Count of stories, numbers, and quotes per 500 words in the transcript]
   - Story Spine Completeness Validation: [Audit the stories shared. If any story is missing a Resolution or Lesson, flag it as [INCOMPLETE STORY: Name of story] and explain why. Otherwise, label all as [COMPLETE STORY]]
2. **Transcript**: Cleaned up Q&A transcript.
3. **Key Stories**: Break down the specific stories shared. Extract details, timelines, names, and numbers.
4. **Core Insights**: The unique philosophical or operational principles the creator shared.
5. **Quotable Moments**: Select 5-10 powerful, raw quotes directly in the creator's words.
6. **Emotional Anchor**: What was the hardest part? What drove the creator to do this?
7. **Surprising Reveals**: Things that were unexpected or counter-intuitive.
8. **The "So What"**: Why does this matter to the average reader? What is the practical value?

Generate a detailed markdown file.
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt
    });

    const productionMarkdown = response.text;
    await storage.saveDraft("production-raw", productionMarkdown);

    return { productionRaw: productionMarkdown };
  }
};
