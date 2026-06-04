# Implementation Notes: Content Machine MVP

This document captures the key design decisions, trade-offs, and implementation details for the Content Machine MVP built from scratch.

## Key Architectural Decisions

1. **Local File Database (`db/`)**:
   - **Spec**: The tweet mentions integrating with Notion (The Vault), Gmail, Slack, and curating X feeds.
   - **Trade-off/Decision**: For the MVP, requiring credentials for four separate APIs is a huge barrier to entry. Instead, we created `db/vault.json` and `db/mock-inputs.json` to simulate the data feeds. The app works instantly out-of-the-box, saving all state changes to local JSON and Markdown files.
   - **Benefit**: Fully offline-capable (except for LLM calls), zero setup, and highly inspectable.

2. **Gemini API & Search Grounding**:
   - **Decision**: Enabled Google Search grounding (`tools: [{ googleSearch: {} }]`) on **The Researcher** agent.
   - **Benefit**: This allows the Researcher to fetch current links and check developments in real-time using Google's search index without needing a separate scraper.

3. **Interview Panel Length (6 vs 15 Questions)**:
   - **Spec**: The tweet suggests 12–15 questions.
   - **Trade-off/Decision**: For a manual developer demo, answering 15 questions is tedious. We configured the panel to conduct a 6-question interview (one question per interviewer).
   - **AI Gatekeeping**: The system still enforces the tweet's rule: if the user's answer scores `< 6/10` (evaluated by Gemini for stories, numbers, or emotional specificity), the interviewer rejects the answer and asks a follow-up, refusing to advance.

4. **Writer's Council & Auto-Revision Loop**:
   - **Spec**: 6 reviewers score the draft, looping until the score is $\ge$ 9/10.
   - **Decision**: The backend automatically executes this loop. It gets reviews, checks the score, triggers the revision engine with the editorial fixes, and re-reviews up to 3 times to avoid infinite API loops or excessive token usage.
   - **Information Gaps**: If the Council detects gaps that require creator input (e.g. missing facts/numbers), it breaks the loop and lists them for the user.

5. **Learning Loop & Diff Viewer**:
   - **Decision**: Created a lightweight line-by-line diff compiler in vanilla JavaScript.
   - **Benefit**: Displays additions (green) and deletions (rose) directly in the UI without installing heavy packages.

## Running the Application

To run the application, ensure you have a `GEMINI_API_KEY` set. You can set it globally or in the `.env` file:
```env
GEMINI_API_KEY=your_key_here
```

Then run the development command:
```bash
npm start
```
And navigate to `http://localhost:3000` in your web browser.

## React & shadcn/ui Migration Notes (June 2026)

We migrated the vanilla HTML, CSS, and JS frontend to a modern, type-safe **React (TypeScript)** SPA using **Tailwind CSS** and **shadcn/ui** design aesthetics.

### 1. Structural Prefactoring
- **Vanilla Preservation**: Renamed the original vanilla static folder to `public_vanilla/` to preserve the original code and avoid path conflicts.
- **Frontend Subdirectory**: Organized the React code inside a `frontend/` directory, containing its own build-tooling configurations.
- **Concurrently script integration**: Installed `concurrently` in the root `package.json` to let a single `npm run dev` start both the Express backend and the Vite dev server simultaneously.

### 2. Dev Proxying & Production Packaging
- **Local Dev Proxy**: Added proxy settings in `frontend/vite.config.ts` so that all API (`/api/*`) and static mock (`/db/*`) calls on the Vite dev server (port 5173) are forwarded to Express (port 3000).
- **Static Output Target**: Configured Vite's build settings to output into the root `public/` folder, allowing `server.js` to serve the React SPA directly in production.

### 3. Visual System & Components Design
- **Theme Aesthetics**: Implemented a dark theme using deep gray backgrounds (`#030712`), border accents (`hsl(var(--border))`), neon-violet button glows, and glassmorphic panels (`glass-panel` backdrop filters).
- **Responsive Layout**: Recreated the sidebar navigation showing steps `01` to `10` with badges indicating `AI`, `Human`, or `Hybrid` dependencies, along with an indicator showing the active selected idea run.
- **Console terminal logs**: Managed system status logs globally in React, feeding them into a bottom-anchored scrollable terminal box that can be expanded or collapsed.
- **Visual Diff Viewer**: Hand-coded a clean inline line-by-line diff compiler inside `LearningTab.tsx` displaying line additions and deletions, mapping human edits and extracting lessons cleanly.
- **Markdown Rendering**: Created a custom `MarkdownViewer` component styling lists, titles, and codes to present sourced research reports and production transcript compiles beautifully.

## Upgrades Implementation Decisions & Trade-offs (June 2026)

1. **REST Client wrappers for APIs**: Rather than using package-based Tavily and Firecrawl libraries (which could crash due to ESM/CommonJS imports), we implemented raw HTTP `fetch` handlers. This minimizes dependencies and operates natively on Node 18+.
2. **Double-Pass Research Synthesizer**: Inside `/api/research`, we run a dual Gemini pass: first to synthesize the Tavily/Firecrawl scraped materials into a report, and second to adversarially fact-check the generated report against the sources to prevent hallucinations.
3. **Semantic Deduplication**: Before writing Oracle content ideas to the vault, we compare candidate concepts against existing items using a Gemini-powered semantic filter, successfully eliminating redundant entries.
4. **Weighted Council Averages**: Upgraded `/api/council` to trigger 6 parallel calls concurrently (`Promise.all`) using focused persona prompts, merging results using specific weights (e.g. 1.2x for Shaan Puri) and checking local style lints.
5. **Quality Gate Repurposing**: Expanded output platforms to 8. Each repurposing draft is checked by a 2-persona evaluation panel; if the native formatting score falls below 8.0, an auto-revision loop is executed in the background.
6. **Decay-Aware Loop JSON database**: Changed legacy markdown learnings to a JSON structure with confidence weightings, categorization, and automatic removal of rules older than 90 days.


