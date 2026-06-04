import { storage } from "../storage/index.js";
import { ai, FAST_MODEL, parseGeminiJson } from "./ai.js";
import { feedCollectorService } from "./feedCollectorService.js";

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const oracleService = {
  async mineSpikes() {
    console.log("Oracle mining pass triggered: collecting real data feeds...");
    const sourceData = await feedCollectorService.collectAll();
    const vault = await storage.getVault();

    const prompt = `
You are The Oracle, an advanced AI designed to mine communications (Slack threads, emails, Notion documents, web feeds) for "spikes"—moments where a raw, valuable, and authentic content idea is expressed.

Here is the source data you need to mine:
${JSON.stringify(sourceData, null, 2)}

Your task:
1. Identify potential content ideas hidden in the communications.
2. For each idea:
   - Formulate a compelling working Title.
   - Write a Description of the core concept.
   - List the Source (e.g. "Slack Channel #product-ideas").
   - Score the idea from 1 to 10 on the following 4 dimensions:
     * authenticity: Is this from real experience or generic advice?
     * contrarian: Does this challenge conventional wisdom?
     * storyDensity: Are there specific stories/numbers to extract?
     * audienceValue: Would someone share this?
   - Provide a Rationale for these scores.
3. Compute the final weighted score using this formula: (authenticity * 0.3) + (contrarian * 0.3) + (storyDensity * 0.2) + (audienceValue * 0.2).
4. Return only the qualified ideas where finalScore >= 7.0.

Output MUST be a valid JSON array, matching this format:
[
  {
    "title": "Title of the idea",
    "description": "Short summary of the idea",
    "source": "Details of where it was found",
    "scores": {
      "authenticity": 8.0,
      "contrarian": 7.0,
      "storyDensity": 6.0,
      "audienceValue": 8.0
    },
    "score": 7.4,
    "rationale": "Why this score was given"
  }
]
Do not include markdown tags like \`\`\`json or \`\`\`. Just return raw JSON.
`;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const newIdeas = parseGeminiJson(response.text) || [];

    // Semantic Deduplication via Gemini against existing vault
    let filteredNewIdeas = [];
    if (newIdeas.length > 0 && vault.length > 0) {
      console.log("Running Gemini semantic deduplication against existing vault items...");
      const existingList = vault.map(v => ({ title: v.title, description: v.description }));
      const candidatesList = newIdeas.map(i => ({ title: i.title, description: i.description }));
      
      const dupPrompt = `
You are a deduplication assistant. Compare the list of Candidate Ideas against the list of Existing Ideas in the vault.
For each candidate, determine if it represents the same concept or is a near-duplicate of an existing idea.

Existing Ideas:
${JSON.stringify(existingList, null, 2)}

Candidate Ideas:
${JSON.stringify(candidatesList, null, 2)}

Return a JSON array of objects representing the candidates. For each candidate, set "isDuplicate" to true if it duplicates an existing idea, and "duplicateOf" to the title of that existing idea. Otherwise, set "isDuplicate" to false and "duplicateOf" to null.

Format:
[
  { "title": "Candidate Title", "isDuplicate": true/false, "duplicateOf": "Existing Title or null" }
]
Do not wrap in markdown tags. Return raw JSON.
`;

      const dupResponse = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: dupPrompt,
        config: { responseMimeType: "application/json" }
      });

      const dupResults = parseGeminiJson(dupResponse.text) || [];

      filteredNewIdeas = newIdeas.filter(idea => {
        const match = dupResults.find(d => d.title.toLowerCase() === idea.title.toLowerCase());
        const isDuplicate = match ? match.isDuplicate : false;
        if (isDuplicate) {
          console.log(`Filtered out duplicate idea: "${idea.title}" (duplicate of "${match.duplicateOf}")`);
        }
        return !isDuplicate;
      });
    } else {
      filteredNewIdeas = newIdeas;
    }

    const updatedVault = [...vault];
    
    // Save filtered new ideas to vault and Notion if configured
    for (const idea of filteredNewIdeas) {
      const exists = vault.some(v => v.title.toLowerCase() === idea.title.toLowerCase());
      if (!exists) {
        const id = `idea_oracle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const ideaWithMetadata = {
          id,
          ...idea,
          status: "qualified",
          createdAt: new Date().toISOString()
        };
        updatedVault.push(ideaWithMetadata);
        
        await feedCollectorService.saveIdeaToNotion(ideaWithMetadata);
      }
    }

    await storage.saveVault(updatedVault);

    return {
      minedCount: filteredNewIdeas.length,
      vault: updatedVault
    };
  }
};
