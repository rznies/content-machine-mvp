import { storage } from "../storage/index.js";
import { ai, FAST_MODEL, PRO_MODEL, parseGeminiJson } from "./ai.js";

export const repurposeService = {
  async generateRepurposedContent() {
    const approvedDraft = await storage.getDraft("current");
    if (!approvedDraft) {
      throw new Error("No approved draft found. Create a draft first.");
    }

    const prompt = `
You are the Repurposing Engine. Take the following anchor content post and generate natively-formatted versions for the following channels.
Each derivative must capture the exact essence, hooks, stories, and metrics of the anchor, but match the specific formatting and behavioral rules of its platform.

Anchor Post:
"""
${approvedDraft}
"""

Generate derivatives for these 8 platforms:
1. **X (Twitter) Short Post**: A single, punchy tweet (under 280 chars) summarizing the core lesson.
2. **X Thread (5-7 tweets)**: A structured thread detailing the step-by-step process.
3. **LinkedIn Short Post**: A clean, professional but casual text post with single-sentence paragraph breaks and high-value takeaways.
4. **Email Newsletter Section**: A conversational newsletter editorial style, adding a greeting and a warm call-to-action.
5. **Instagram/Threads Caption**: A visual-first story format, using bullet points and casual emojis.
6. **Short-Form Video Script**: A 60-90 second script, featuring a strong hook in the first 3 seconds, pattern interrupts, and visual cues.
7. **Quote Graphics Text**: 3-5 standalone, high-impact quotable statements suitable for image graphics.
8. **SEO Blog Post**: A longer-form, structured article optimized for keywords, including headers (H1, H2) and a clean, clean call to action.

Return a JSON object containing the platforms:
{
  "derivatives": [
    { "platform": "X Short Post", "content": "text" },
    { "platform": "X Thread", "content": "tweet 1\\n\\ntweet 2..." },
    { "platform": "LinkedIn Post", "content": "text" },
    { "platform": "Email Newsletter", "content": "text" },
    { "platform": "Instagram Caption", "content": "text" },
    { "platform": "Short-Form Video Script", "content": "script text" },
    { "platform": "Quote Graphics", "content": "quotes list text" },
    { "platform": "SEO Blog Post", "content": "blog post markdown" }
  ]
}
Do not use markdown blocks. Return raw JSON.
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const result = parseGeminiJson(response.text) || {};
    const derivatives = result.derivatives || [];
    console.log(`Generated ${derivatives.length} derivatives. Running parallel Quality Gate review...`);

    const gatePromises = derivatives.map(async (derivative) => {
      const gatePrompt = `
You are a Quality Gate reviewer. Evaluate this repurposed content derivative against the target platform native formatting and rules.

Platform: "${derivative.platform}"
Repurposed Content:
"""
${derivative.content}
"""

Anchor Post Reference:
"""
${approvedDraft}
"""

Score the content from 1 to 10 based on how well it captures the essence of the anchor post and fits the native platform formatting rules.
Return JSON:
{
  "score": 8.5,
  "feedback": "brief feedback if score is below 8.0, explaining what formatting or details need adjustment. Otherwise leave empty."
}
Do not use markdown blocks. Return raw JSON.
`;
      try {
        const gateResponse = await ai.models.generateContent({
          model: FAST_MODEL,
          contents: gatePrompt,
          config: { responseMimeType: "application/json" }
        });
        
        const gateResult = parseGeminiJson(gateResponse.text) || {};
        const score = gateResult.score || 8.0;
        console.log(`Quality Gate for "${derivative.platform}" scored: ${score}/10`);

        if (score < 8.0) {
          console.log(`Triggering auto-revision pass for "${derivative.platform}" due to score < 8.0...`);
          const revisePrompt = `
You are a Content Editor. Revise the following repurposed content based on this quality feedback: "${gateResult.feedback}"

Platform: "${derivative.platform}"
Current Version:
"""
${derivative.content}
"""

Anchor Post Reference:
"""
${approvedDraft}
"""

Provide the revised version. Output only the content.
`;
          const reviseResponse = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: revisePrompt
          });
          return {
            platform: derivative.platform,
            content: reviseResponse.text.trim(),
            score: score,
            revised: true
          };
        }

        return {
          platform: derivative.platform,
          content: derivative.content,
          score: score,
          revised: false
        };

      } catch (err) {
        console.error(`Error in Quality Gate for "${derivative.platform}":`, err.message);
        return derivative;
      }
    });

    const finalDerivatives = await Promise.all(gatePromises);
    await storage.saveDerivatives(finalDerivatives);

    return { derivatives: finalDerivatives };
  }
};
