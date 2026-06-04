# Content Machine MVP

A state-of-the-art content creation pipeline that automates, refines, and repurposes creator ideas into high-quality publication drafts. Built as a React (TypeScript) frontend coupled with an Express backend, leveraging the **Google Gemini API** for reasoning, Google Search grounding, and adversarial fact-checking.

## Features

1. **Idea Ingestion (Oracle)**: Simulates inputs from sources like Notion, Gmail, Slack, and X feeds into a central repository (`db/vault.json`).
2. **AI Search Grounding (Researcher)**: A dual-pass research synthesizer using Gemini Search Grounding. The first pass aggregates and synthesizes information; the second pass performs an adversarial fact-check against source links to prevent hallucination.
3. **Creator Interview Panel**: Conducts a structured 6-question interview (one question per interviewer/persona). Gemini evaluates answers for stories, details, and emotional specificity, gatekeeping progression unless answers score at least `6/10`.
4. **The Writer's Council**: A panel of 6 virtual content reviewers (e.g., Shaan Puri, Paul Graham) that grade draft quality. The system runs an automated loop, revising the draft up to 3 times to achieve a score $\ge 9/10$, or highlights gaps if creator input is required.
5. **Multi-Platform Repurposer**: Drafts custom posts tailored to 8 different social platforms. A two-persona verification panel tests native formatting rules and requests revisions if the quality score is below `8/10`.
6. **Decay-Aware Learning Loop**: A JSON database tracking style rules and formatting guidelines derived from edits, automatically decaying and removing rules older than 90 days.
7. **Line-by-Line Diff Viewer**: Displays clean inline additions (green) and deletions (rose) directly in the UI to compare human edits against AI-generated versions.

---

## Tech Stack

- **Frontend**: React (TypeScript), Tailwind CSS, Vite, Lucide icons, glassmorphism aesthetics.
- **Backend**: Node.js, Express, Google Gemini SDK (`@google/genai`).
- **Dev-tooling**: `concurrently` (for starting backend and frontend dev servers together).

---

## Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/api-keys).

### 2. Environment Configuration
Create a `.env` file at the root of the project:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Install Dependencies
Run the installation command at the project root (which also installs the frontend dependencies via `postinstall`):
```bash
npm install
```

### 4. Start the Application
Run the unified dev command to launch the Express server and Vite development server simultaneously:
```bash
npm run dev
```

The frontend will run at `http://localhost:5173` (with API requests proxied to `http://localhost:3000`), and the server will serve the built production bundle directly at `http://localhost:3000` in production mode.

---

## Project Structure

```
.
├── .agents/                    # Agent specifications and skills
├── db/                         # Local JSON database & mock inputs
│   ├── vault.json              # Curated ideas repository
│   ├── mock-inputs.json        # Incoming feed inputs simulation
│   └── style-system.json       # Decay-aware style rules database
├── docs/                       # Project documentation & ADRs
├── frontend/                   # React (TypeScript) SPA source
│   ├── src/                    # Components, hooks, and tabs
│   └── vite.config.ts          # Vite proxy and build configuration
├── server.js                   # Express server and Gemini pipeline logic
├── package.json                # Project configurations & scripts
└── README.md                   # Project documentation
```

## License
MIT
