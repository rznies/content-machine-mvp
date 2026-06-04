import { storage } from "../storage/index.js";
import { ai, FAST_MODEL, parseGeminiJson } from "./ai.js";

const INTERVIEWERS = [
  { name: "Michael Barbaro", dimension: "Emotional pivots", pushFor: "What did that feel like in the moment?", persona: "Host of The Daily. Slow, inquisitive, focuses on the human element, the quiet moments, the emotional pivots. Frequently uses 'Hmm' and asks 'What did that feel like?'" },
  { name: "Joe Rogan", dimension: "Practical mechanics", pushFor: "Walk me through the exact steps", persona: "Raw, curious, casual, pushes for raw truth, practical application, and physical details. Focuses on the gritty reality: 'That's wild. But wait, how does that actually work in practice? What did you do next?'" },
  { name: "Howard Stern", dimension: "Conflict & vulnerability", pushFor: "Who disagreed? What went wrong?", persona: "Ultra-direct, provocative, focuses on relationships, hidden insecurities, ego, and conflict. Pushes for uncomfortable honesty: 'Who was mad at you? Did you feel like a failure? Tell me the truth.'" },
  { name: "Terry Gross", dimension: "Origins & context", pushFor: "Take me back to before this started", persona: "Empathetic, incredibly prepared, digs into origins, artistic/creative blocks, and deep reflections. 'I want to go back to what you said earlier about... how did that shape your worldview?'" },
  { name: "Lex Fridman", dimension: "Systems & principles", pushFor: "What's the underlying framework?", persona: "Analytical, philosophical, talks about love, struggles, technical mechanics, and core values. Focuses on deep systems: 'What is the beautiful code behind this? What was the hardest lesson?'" },
  { name: "Oprah Winfrey", dimension: "Lessons & audience value", pushFor: "What would you tell someone starting this?", persona: "Warm, connecting, searches for the soul, the core lesson, and the message for the audience. 'What was the 'Aha!' moment? How did you lift yourself out of that?'" }
];

export const interviewService = {
  async startInterview(maxQuestions = 10) {
    const activeIdea = await storage.getActiveIdea();
    if (!activeIdea) {
      throw new Error("No active idea selected.");
    }

    const researchReport = await storage.getResearchReport() || "No research report available.";
    const firstInterviewer = INTERVIEWERS[0];

    const prompt = `
You are ${firstInterviewer.name}. Persona: ${firstInterviewer.persona}.
You are conducting the first turn of a content interview with a creator.
Your target dimension is: "${firstInterviewer.dimension}". You must push for: "${firstInterviewer.pushFor}".

The content idea is:
Title: "${activeIdea.title}"
Description: "${activeIdea.description}"

Here is the background research report:
${researchReport}

Ask the very first, highly engaging question to kick off the interview. Keep it in character, focused on getting concrete stories, emotional pivots, and specific numbers right from the start.

Output your question as a short message.
`;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt
    });

    const firstQuestion = response.text.trim();

    const state = {
      ideaId: activeIdea.id,
      title: activeIdea.title,
      questionsAsked: [],
      currentInterviewer: firstInterviewer.name,
      currentQuestion: firstQuestion,
      completed: false,
      maxQuestions
    };

    await storage.saveActiveInterview(state);
    return { state };
  },

  async submitAnswer(answer) {
    const state = await storage.getActiveInterview();
    if (!state) {
      throw new Error("No active interview session.");
    }

    if (!answer || answer.trim() === "") {
      throw new Error("Answer cannot be empty.");
    }

    const currentInterviewer = state.currentInterviewer;
    const currentQuestion = state.currentQuestion;

    // Evaluate response quality: check specificity, numbers, stories, and story spine
    const evalPrompt = `
You are the interviewer ${currentInterviewer}. You just asked: "${currentQuestion}"
The creator responded with: "${answer}"

Your job is to evaluate if this answer is high quality or if it is too vague.
A high-quality answer contains:
- 1-2 specific stories or moments
- Real numbers or concrete data points
- Emotional specificity (what they felt, what was hard)

Evaluate the answer against this Story Spine validation:
- Setup (situation before): Does it describe the starting state?
- Complication (what went wrong/was hard): Is there an obstacle or conflict?
- Turning point (exact moment of pivot): Is the moment of action clear?
- Resolution (what happened after): Is the outcome clear?
- Lesson (takeaway): Is there a learning?

Perform an evaluation and output a JSON object:
{
  "score": 1-10 rating (10 being extremely detailed with numbers and stories, 1 being generic corporate speak. Scale: 9-10 excellent, 7-8 good, 5-6 acceptable, 3-4 poor, 1-2 failure),
  "storySpine": {
    "setup": true,
    "complication": true,
    "turningPoint": true,
    "resolution": true,
    "lesson": true
  },
  "feedback": "Your brief reaction in character. If the score is below 7, explain what story-spine element, story or number is missing and ask them to expand on it. If it is 7 or higher, praise the detail and transition."
}
Do not include markdown wrappers. Return raw JSON.
`;

    const evalResponse = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });

    const evaluation = parseGeminiJson(evalResponse.text);

    // If score is low (< 6), make them answer again / follow up
    if (evaluation.score < 6 && state.questionsAsked.length < state.maxQuestions) {
      state.currentQuestion = `${evaluation.feedback}\n\nCan you give me a specific story or actual number to back that up?`;
      await storage.saveActiveInterview(state);
      return {
        advance: false,
        state,
        evaluation
      };
    }

    // Save current Q&A
    state.questionsAsked.push({
      interviewer: currentInterviewer,
      question: currentQuestion,
      answer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      storySpine: evaluation.storySpine
    });

    // Check if interview is completed
    if (state.questionsAsked.length >= state.maxQuestions) {
      state.completed = true;
      state.currentInterviewer = "System";
      state.currentQuestion = "Interview completed! Ready to compile production markdown.";
      await storage.saveActiveInterview(state);

      // Run Post-interview extraction pass
      try {
        console.log("Running post-interview extraction pass...");
        const fullTranscript = state.questionsAsked.map(q => `${q.interviewer}: ${q.question}\nCreator: ${q.answer}`).join("\n\n");
        const extractPrompt = `
You are an expert content researcher. Analyze the following interview transcript:
"""
${fullTranscript}
"""

Extract:
1. **Emotional Palette Map**: Identify the specific emotional spikes (joy, frustration, fear, pride) and tie them to exact moments or quotes in the transcript.
2. **Numeric Inventory**: Identify EVERY single number, metric, date, or dollar amount mentioned by the creator. Keep it as a raw list of objects with the number and its context.
3. **Quote Inventory**: List the exact, raw, powerful phrases the creator used that are worth keeping verbatim (no corporate editing).

Return output as a valid JSON object matching:
{
  "emotionalPalette": [
    { "emotion": "joy/frustration/fear/pride", "moment": "brief description", "quote": "exact quote" }
  ],
  "numericInventory": [
    { "value": "1,400", "context": "users in 90 days" }
  ],
  "quoteInventory": [
    "exact quote 1",
    "exact quote 2"
  ]
}
Do not wrap in markdown tags. Return raw JSON.
`;

        const extractResponse = await ai.models.generateContent({
          model: FAST_MODEL,
          contents: extractPrompt,
          config: { responseMimeType: "application/json" }
        });

        const extraction = parseGeminiJson(extractResponse.text) || {};
        await storage.saveInterviewExtraction(extraction);
        console.log("Saved interview extraction file successfully.");
      } catch (err) {
        console.error("Error during post-interview extraction:", err.message);
      }

      return {
        advance: true,
        state,
        evaluation
      };
    }

    // Transition to the next interviewer
    const nextInterviewer = INTERVIEWERS[state.questionsAsked.length % INTERVIEWERS.length];
    const researchReport = await storage.getResearchReport() || "No research report available.";

    const nextPrompt = `
You are ${nextInterviewer.name}. Persona: ${nextInterviewer.persona}.
You are conducting the next turn of a content interview with a creator.
Your target dimension is: "${nextInterviewer.dimension}". You must push for: "${nextInterviewer.pushFor}".

The transcript of the interview so far:
${state.questionsAsked.map(q => `${q.interviewer}: ${q.question}\nCreator: ${q.answer}`).join("\n\n")}

Background research report for context:
${researchReport}

Acknowledge the previous answer briefly in character, and ask the next highly engaging question. Focus on your target dimension. Keep it conversational.

Output your question as a short message.
`;

    const nextResponse = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: nextPrompt
    });

    state.currentInterviewer = nextInterviewer.name;
    state.currentQuestion = nextResponse.text.trim();

    await storage.saveActiveInterview(state);

    return {
      advance: true,
      state,
      evaluation
    };
  }
};
