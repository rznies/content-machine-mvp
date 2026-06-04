# Content Machine — UX & Product Design Spec

> A complete, no-code design document for the redesign of the Content Machine
> pipeline UI. Audience for this spec: solo developers, Claude Code, or
> designers picking up the project cold.

**Status:** Locked spec, ready for implementation
**Last updated:** June 2026
**Supersedes:** The current 10-tab sidebar + system-logs-terminal layout

---

## 1. Goals & Non-Goals

### Goals

- A solo marketing-team member can complete the full pipeline on their first
  attempt without asking for help.
- An engineer who built the original UI can still find every existing feature
  behind one toggle.
- Every screen has a single dominant purpose and a single primary action.
- The user is never moved between screens without their consent.
- The "grandmother test" passes: a non-technical first-time user can identify
  what to do next within 5 seconds on every screen.

### Non-Goals (this round)

- Adding new pipeline features.
- Backend changes.
- Mobile-native apps (responsive web only).
- Multi-user collaboration.
- Analytics dashboards (deferred to a future spec).

---

## 2. Audience

**Primary:** Marketing team members with mixed technical skill levels.
Some are non-technical content writers. Some are the engineers who built
the pipeline. The design must work for both without compromise.

**Secondary:** Solo creators / indie writers using the tool themselves
end-to-end.

**Tertiary:** Anyone evaluating the tool via a 5-minute demo.

---

## 3. Locked Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Two-mode IA | Guided (default) + Advanced toggle |
| 2 | Sidebar grouping | All 10 steps visible, grouped under 3 phase headers |
| 3 | Home screen default | Resume in-progress work (falls back to "Start new" if none) |
| 4 | Step 6 (Write first draft) | Accept / Try again buttons (no inline editor) |
| 5 | Terminal replacement | Hidden by default; renamed "Activity"; bell-icon toggle |
| 6 | Auto-navigation after success | Removed everywhere; user clicks "Continue →" |
| 7 | Settings location | Top-right gear icon (not a sidebar footer link) |
| 8 | Brand voice | Friendly & casual |
| 9 | Theme | Auto by `prefers-color-scheme` with explicit toggle override |
| 10 | Sound | None. Removed entirely. |

---

## 4. Brand Voice Guide

**Tone:** Friendly, casual, confident. Like a smart colleague who genuinely
wants to help, not a corporate bot.

### Voice rules

- **Use first names** when a user identity is known ("Hi Maya.").
- **Use contractions** always ("don't", "we'll", "you're").
- **One exclamation per page, max.** Save them for wins.
- **Plain English, no jargon.** "Mine for spikes" → "Find ideas".
  "Compile raw file" → "Gather material". "Convene council" → "Polish draft".
- **Active voice.** "Maya finished reviewing" — not "Review was completed".
- **No acronyms on first mention.** "API key" is fine; "LLM", "JSON",
  "MVP" should be spelled out the first time on a page.
- **Numbers in tables, words in sentences.** "Step 4 of 10" not "Step four
  of ten". "Six reviewers" not "6 reviewers".
- **Avoid these words:** leverage, utilize, robust, holistic, empower,
  unlock, seamlessly, dive in, game-changer, cutting-edge.

### Voice examples

| Situation | Don't say | Say |
|---|---|---|
| Empty state | There are no qualified ideas in your database yet. | Nothing here yet. Run a scan to find some, or add one yourself. |
| Loading | Executing Oracle mining pass across data feeds. | Looking through your messages and notes for things worth writing about. |
| Success | Council revision loop completed. Final score 8.4. | Nice work. 6 reviewers gave it an 8.4. We tightened paragraph 3. |
| Error | API request failed with status 500. | Hmm, something went wrong on our end. Try again in a moment. |
| Confirmation | Idea successfully added to vault. | Saved. Want to start drafting now or keep browsing? |

---

## 5. Theme System

- **Default behavior:** Respect `prefers-color-scheme` on first visit.
- **Override:** A toggle in the top-right (sun/moon icon) cycles through
  three states: `Auto` / `Light` / `Dark`.
- **Persistence:** User's explicit choice stored in `localStorage` under
  a single key. Once set explicitly, ignore the system preference.
- **Reset:** A "Reset to auto" item in the toggle menu.

### Light theme notes

The current dark theme is well-developed. A light theme must be designed
from scratch with the same care — not just inverted.

- **Backgrounds:** Warm off-white (`#FAFAF7` range), not pure white.
- **Text:** Near-black warm gray (`#1A1A1A`), not pure black.
- **Borders:** Cool light gray (`#E5E5E5`), higher contrast than dark mode
  borders because light mode needs less visual weight.
- **Accent color:** Keep the same brand accent. Test on light backgrounds
  before locking. Avoid neon.
- **Shadows:** Slightly heavier in light mode (because there's no
  contrast between panel and background otherwise). Use a layered
  shadow anatomy: one tight ambient + one soft diffuse.
- **Glassmorphism:** Reconsider in light mode. Frosted panels over warm
  backgrounds often look muddy. Prefer solid surfaces with subtle borders.

### Dark theme notes (carried forward)

- Backgrounds: warm near-black (`#0A0A0F` range), not pure black.
- Text: warm off-white (`#F5F5F2` range).
- Borders: cool dark gray (`#1F1F25`).
- Accent: same brand accent, tuned for dark backgrounds.
- Shadows: subtle, but consistent direction (single light source from
  top-left, per `visual-shadow-direction`).

---

## 6. Information Architecture

### Two modes

**Guided mode (default)**

- A single current step is large in the main content area.
- A grouped sidebar shows all 10 steps with status (done / active / locked).
- A "Continue →" button on every step's content area.
- No free-form navigation beyond clicking on previous (done) steps.

**Advanced mode (toggle on)**

- All features and chrome from the current UI are revealed.
- The grouped sidebar expands to show extra metadata per step.
- The Activity panel reveals its "Show technical log" sub-panel.
- Settings reveals its "Advanced" section.
- Toggled per-user, persisted in `localStorage`.

### The 3 phases

The 10 pipeline steps are grouped into 3 phases for the breadcrumb and
the sidebar group headers. They are not clickable targets themselves —
just visual groupings.

| Phase | Steps | Plain-language label |
|---|---|---|
| **FIND** | 1, 2 | Find and pick an idea |
| **BUILD** | 3, 4, 5, 6 | Research, gather, draft |
| **PUBLISH & LEARN** | 7, 8, 9, 10 | Polish, post, edit, learn |

---

## 7. The 10 Steps — Renamed

| # | Old | New | One-line description (subtitle) |
|---|---|---|---|
| 1 | The Oracle | **Find ideas** | Scan your messages, notes, and feeds for things worth writing about. |
| 2 | The Vault | **Pick an idea** | Choose the one you want to turn into a post. |
| 3 | The Researcher | **Research** | Get the facts, sources, and quotes. |
| 4 | Interview Panel | **Answer questions** | We ask, you talk. We pull out your real stories. |
| 5 | Production | **Gather material** | Pull out the best quotes, numbers, and moments. |
| 6 | Refinement | **Write first draft** | We draft it in your voice. You approve or redo. |
| 7 | Writer's Council | **Polish draft** | 6 expert reviewers grade it. We revise until it's strong. |
| 8 | Repurposing | **Post to platforms** | Pick where you want it to appear. |
| 9 | Final Revision | **Final edit** | Your last changes before publishing. |
| 10 | Learning Loop | **What we learned** | Style rules we picked up from this run. |

---

## 8. Visual Model

### Top bar (slim, one row, persistent)

```
[brand mark]  [active idea title — large, central]   [status] [theme] [activity] [settings] [profile]
```

- **Brand mark:** Same logo, smaller, left-aligned.
- **Active idea title:** Truncates with ellipsis at ~40 chars; full title
  on hover.
- **Status pill:** Single live indicator.
  - `Ready` (green)
  - `Working…` (blue, gentle pulse)
  - `Needs you` (amber)
  - `Error` (red)
  - Plain text only. No icons inside the pill.
- **Theme toggle:** Sun/moon icon. Tooltip: "Theme: Auto / Light / Dark".
  Click cycles through three states.
- **Activity:** Bell icon with unread count badge.
- **Settings:** Gear icon.
- **Profile:** Avatar or initial circle. Dropdown: Account, Shortcuts, Help.

### Sidebar (left rail, grouped nav)

```
FIND
  ✓  1.  Find ideas            (done)
  ✓  2.  Pick an idea          (done)

BUILD
  ●  3.  Research              (active, highlighted)
  ○  4.  Answer questions      (locked)
  ○  5.  Gather material       (locked)
  ○  6.  Write first draft     (locked)

PUBLISH & LEARN
  ○  7.  Polish draft          (locked)
  ○  8.  Post to platforms     (locked)
  ○  9.  Final edit            (locked)
  ○ 10.  What we learned       (locked)
```

- Phase headers are quiet text labels, not buttons.
- Each row: status icon, number, name.
- Active row: subtle background, accent-colored status icon, bold text.
- Done rows: clickable, return to that step.
- Locked rows: visible but disabled; tooltip "Complete the previous step first".
- Width: 240px on desktop, collapses to icon-only on narrow screens.

### Main content area

- One current step at a time, full width minus the sidebar.
- A header showing the step number, name, and subtitle.
- The step's primary content.
- A single primary CTA at the bottom: "Continue →" or step-specific action.
- Previous-step link in the header for back-navigation: "← Back to Pick an idea".

### Activity panel (replaces the system-logs terminal)

- 320px wide, slides in from the right, 80% screen height.
- Slides over content (does not push it).
- Cards stacked top-to-bottom, newest at top, auto-scrolling.
- Each card:
  - Timestamp (small, muted)
  - Actor ("Maya", "Researcher", "System")
  - Action in plain language
  - Optional "View" link to the related artifact
- A "Show technical log" toggle at the bottom reveals the raw event stream
  for engineers. Off by default.
- Pin-open shortcut: `Cmd+.` (Mac) / `Ctrl+.` (Windows).

---

## 9. Home Screen

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  Hi Maya. Ready to keep going?                             │
│                                                            │
│  [ Continue "AI voice & academic paraphrasing" — Step 4 ]  │  ← primary
│                                                            │
│  [ Start a new idea ]                                      │  ← secondary
│  [ Browse past posts (12) ]                                │  ← tertiary
│                                                            │
│  ─────────────────────────────────────────────────         │
│                                                            │
│  You have 3 new ideas waiting to be reviewed.              │  ← nudge
│  Your last post went out 2 days ago.                       │
└────────────────────────────────────────────────────────────┘
```

### Behavior

- **If an in-progress pipeline exists** for the user: primary = Continue.
- **If no in-progress work**: primary = Start a new idea; secondary = Browse.
- **Past posts** opens a read-only archive. No editing from there.
- **Nudges** appear only if relevant. Max two lines. No more.
- **First-time users** see a slightly different version: the primary
  is always "Start with a new idea", with a one-line tagline: "We'll
  walk you through it."
- **Empty state of past posts** (no posts yet): "No posts yet. Your
  first one's the hardest — want to start?" with the same primary CTA.

---

## 10. Per-Step Design

### Step 1 — Find ideas

**What the user sees:**

- A list of data sources with counts only: "47 Slack messages",
  "12 emails", "3 transcripts", "89 X posts". No raw feed data on this
  page (too overwhelming before any AI work).
- One primary CTA: "Scan all sources".
- Real brand icons (Slack, Gmail, X, Notion) — not `??` placeholders.

**After clicking Scan:**

- Skeleton list appears immediately (perceived speed).
- Subtle progress text appears: "Reading 47 Slack messages…", "Looking
  through 12 emails…", "Asking the AI for ideas…".
- After 5–10 seconds, results appear as cards.

**Result cards:**

- Title (one line, bold).
- One-line "why this might be worth writing about".
- Source icon + name.
- Strength label: "Strong fit" / "Possible" / "Stretch" (replaces the
  raw "8.4/10" score on the front; the number is still available
  via a tooltip or "Details" expansion).
- Primary action: "Use this idea" (sends to step 2).

### Step 2 — Pick an idea

**What the user sees:**

- Cards sorted by AI recommendation (default) → newest → manual.
- Top card has a "Suggested for you" badge (Von Restorff effect).
- Each card: title, one-line summary, source, strength label, score
  tooltip, rationale expandable.
- Two CTAs at the top right of the page: "Use this idea" (per card) and
  "+ Add idea manually" (in the page header).

**Strength label mapping:**

- `>= 7.5` → "Strong fit"
- `5.0 – 7.4` → "Possible"
- `< 5.0` → "Stretch"

### Step 3 — Research

**What the user sees:**

- A structured report with clear sections:
  - TL;DR (2–3 sentences)
  - Key Facts (bulleted, each with a source link)
  - Quotes (callout cards)
  - Open Questions (where the research is thin)
- Source chips inline with each fact; clicking opens the URL in a new tab.
- A "Show me what was fact-checked" expand, addressing hallucination
  concerns for technical users.

**CTAs:**
- "Looks good — let's draft" (primary)
- "Need more on [topic]" (secondary, opens a chat input)

### Step 4 — Answer questions

**What the user sees:**

- Progress: "Question 1 of 6".
- A single question, large, centered.
- A textarea for the answer.
- Character count: "Aim for at least 80 characters. The AI scores
  longer, more specific answers higher."

**If the AI rejects an answer:**

- Plain explanation: "This scored a 4. Try adding a number, a name,
  or a specific moment. Long answers with details always score higher."
- An example answer: "Here's a strong answer to a similar question: …"
- The user can retry or skip (skip lowers the final draft quality).

**End of interview:**

- A summary card: "Here's what we pulled from you: 3 stories, 2
  numbers, 1 strong opinion. Anything to fix before drafting?"
- One CTA: "Continue to drafting" (primary).

### Step 5 — Gather material

**What the user sees:**

- Categorized cards: **Quotes**, **Numbers**, **Emotional moments**,
  **Open questions**.
- Each card: content, source (which question it came from), star to
  mark "most important for the draft".
- A "3 things we couldn't find" section with three small text inputs
  for the user to add facts manually.

**CTAs:**
- "Looks good — let's draft" (primary)
- "Add more" (secondary)

### Step 6 — Write first draft

**What the user sees:**

- The full draft, rendered as readable text (not markdown source).
- Three small stats above the draft:
  - **Length:** 1,340 words
  - **Read time:** ~5 min
  - **Voice match:** 87% (looks like your past posts)
- A small "View source" link in the top-right (for engineers/power users).
- A small "Edit voice rules" link next to it (opens Settings → Your voice).

**CTAs at the bottom:**

- **Accept and send to reviewers** (primary, large)
- **Try again** with a small dropdown: Same angle / Different angle /
  Shorter / Punchier (secondary)

**What this step does NOT have:**

- No inline rich-text editor.
- No hidden content-type `<select>` leaking state to another tab
  (fixes the existing cross-component coupling bug — see §14).
- No auto-advance.

### Step 7 — Polish draft

**What the user sees:**

- One prominent headline: "6 expert reviewers are reading your draft."
- Animated progress: one reviewer at a time, with their name, role,
  and score appearing as they finish. (Staging rule: one focal point
  at a time.)
- After all 6 finish, the average score is shown large: **8.4 / 10**.
- A diff highlight: "Here's what changed in revision 2." (green = added,
  red = removed, per the existing diff component).
- Per-reviewer breakdown in a collapsible section: their name, score,
  one-line feedback.

**CTAs:**

- "Continue to posting" (primary, user-initiated)
- "Run another round" (secondary)

### Step 8 — Post to platforms

**What the user sees:**

- A smart default of 3 platforms: Twitter/X, LinkedIn, Newsletter
  (based on past usage if available).
- A "Show all 8 platforms" expand that reveals a multi-select grid.
- **Per-platform previews shown side-by-side** as a horizontally
  scrollable row, not stacked vertically. (Uniform connectedness.)
- Per-post quality score with a one-line plain reason: "LinkedIn
  version: 8.7/10 — strong hook, fits the 1,300-character limit."

**CTAs:**

- "Publish selected" (primary)
- "Save as drafts" (secondary)
- "Edit a version" (per card, opens a small modal)

### Step 9 — Final edit

**What the user sees:**

- Inline **diff viewer** (moved here from the current Learning tab —
  see §11).
- Side-by-side: AI draft on left, your version on right, with
  green/red line highlights.
- A simple text editor on the right that the user can type in directly
  (this step DOES allow inline editing, unlike step 6 — because the
  user is doing the final pass).

**CTAs:**

- "Save & publish" (primary)
- "Save as draft" (secondary)

### Step 10 — What we learned

**What the user sees:**

- A **celebration screen** with a soft, single animation (one focal
  point only, per staging rules). No confetti cannons.
- "Done! Here's what we picked up from this run."
- 3–6 plain-language style lessons, e.g.:
  - "You tend to start posts with 'I' less than average. Your
    strongest posts open with a question."
  - "Posts under 1,200 words get more engagement for you."
  - "You use 'actually' twice as often as other writers in your
    niche. We left it in — it's part of your voice."
- A single CTA: **"Start another idea"** (loops back to home).
- A secondary link: "View the full style report" (for the engineer).

---

## 11. Settings — Reorganized

Top-right gear icon, opens a full-page panel. Three sections, grouped by
user need (progressive disclosure):

### Section 1 — Your voice

For the marketer. Plain-language labels.

- **Style guide** (was `style-system.json` + `style-guide.md`) — explained
  as "How we write like you."
- **Anti-slop rules** (was `anti-slop.json`) — "Words and phrases we
  avoid by default."
- **Golden examples** (was `golden-examples.json`) — "Posts we should
  try to sound like."

Each item has a one-line plain description, not the file path.

### Section 2 — Connections

For the admin / engineer.

- **Gemini API key** — status (green/amber/red pill), with an "Update
  in .env" hint.
- **Tavily API key** — same.
- **Firecrawl API key** — same.
- **Research mode** — toggle: Google Grounding / Tavily + Firecrawl.

### Section 3 — Advanced

Collapsed by default. For engineers.

- Raw JSON editor for each file (the current textarea editor lives here).
- Decay settings (was 90-day default; expose as a number input with
  "Reset to default" link).
- "Show technical log" toggle (same as the Activity panel's toggle).
- "Switch to Advanced mode" toggle (replaces the per-user Advanced mode
  flag — Settings becomes the place to flip modes).

---

## 12. Activity Panel — Detailed

### Trigger

- Bell icon in the top-right with unread count badge.
- Click → slide-over opens from the right.
- Keyboard shortcut: `Cmd+.` (Mac) / `Ctrl+.` (Windows) toggles pin-open.

### Card content

- **Timestamp** (small, muted, top-left of card)
- **Actor** ("Maya", "Researcher", "Shaan Puri", "System")
- **Action** in plain language (1–2 sentences)
- **Optional "View" link** → jumps to the relevant step / artifact
- **Optional inline action** (e.g., "Approve", "Skip") for events that
  need a quick response

### Card examples (replacing current console lines)

| Old (terminal) | New (activity card) |
|---|---|
| `info Oracle mining pass initiated` | "Looking through your messages and notes for things worth writing about." |
| `success Oracle identified 7 ideas` | "Found 7 ideas. 3 look strong, 4 are stretches." |
| `info Council revision loop started` | "6 expert reviewers are reading your draft. This usually takes about a minute." |
| `success Revision loop finished, final score 8.4` | "Nice work. 6 reviewers gave it an 8.4. We tightened paragraph 3." |
| `error API failure status 500` | "Hmm, something went wrong on our end. Try again in a moment." |

### Pin-open mode

- When pinned, the panel stays open at 320px wide.
- Main content area shrinks to fit. Nothing is hidden.
- Useful for engineers monitoring a long-running pipeline.

### Show technical log

- A toggle at the bottom of the Activity panel.
- When on, the panel splits: top half is the friendly cards, bottom
  half is the raw `LogLine` array (monospace, color-coded as today).
- Off by default; remember user's choice.

---

## 13. Microcopy Library

A small reference for consistent voice across the app.

### Status pills

| State | Copy |
|---|---|
| Idle | `Ready` |
| Working | `Working…` |
| Awaiting user | `Needs you` |
| Error | `Something went wrong` |
| Success (one-shot) | `Done!` |

### Button labels

| Action | Primary | Secondary |
|---|---|---|
| Start pipeline | Start with a new idea | Browse past posts |
| Resume | Continue "Idea name" | Start something else |
| Confirm and move on | Looks good, continue | Go back |
| Reject and retry | Try again | Keep current |
| Save | Save | Cancel |
| Publish | Publish selected | Save as drafts |
| Delete | Delete | Keep it |

### Empty states

| Surface | Copy |
|---|---|
| Vault | Nothing here yet. Run a scan to find some, or add one yourself. |
| Past posts | No posts yet. Your first one's the hardest — want to start? |
| Research | We haven't done research on this idea yet. Let's fix that. |
| Draft | No draft yet. Once you answer a few questions, we'll write one. |
| Council reviews | No reviews yet. Run a polish pass to get expert feedback. |
| Style rules | We're still learning your style. The more you write with us, the better we get. |

### Error messages

| Situation | Copy |
|---|---|
| Network down | Hmm, we can't reach the server. Check your connection and try again. |
| API key missing | We need an API key to work. Open Settings → Connections to add one. |
| Rate limited | We're getting a lot of requests right now. Give us a minute and try again. |
| Internal error | Something went wrong on our end. Try again — if it keeps happening, let us know. |
| AI rejected answer | This scored a bit low. Try adding a number, a name, or a specific moment. |

---

## 14. Critical UX Bug Fixes (Non-Code)

These are the highest-priority existing bugs to address during the
redesign. They are listed for the implementer to flag in code review.

| # | Where | Bug | Fix |
|---|---|---|---|
| 1 | `OracleTab.tsx`, `ProductionTab.tsx`, `CouncilTab.tsx`, `RepurposeTab.tsx` | `setTimeout(() => onNavigateToTab(...), 1500–2500)` auto-navigates after success. | Replace with a user-initiated "Continue →" button. The button is the only way to advance. |
| 2 | `CouncilTab.tsx` | Reads from a hidden `<select id="refine-content-type">` in another tab. | Move the content-type selector visibly onto the Council page (step 7) — or persist content type as global state. |
| 3 | `OracleTab.tsx` | Accordion headers show `??` placeholder icons (unrendered characters). | Replace with real brand icons (Slack, Gmail, X, Notion), or remove the icons entirely. |
| 4 | `VaultTab.tsx` | Empty state mentions "database". | Use the new microcopy: "Nothing here yet. Run a scan to find some, or add one yourself." |
| 5 | `App.tsx` | "Active Run" sidebar card is tiny, italic, low-contrast. | Move the active idea title to the top bar (large, central). |
| 6 | `App.tsx` | System-logs terminal is visible by default with developer framing. | Hide by default. Move behind the Activity bell toggle. |
| 7 | `CouncilTab.tsx` | Step name is "Writer's Council & Revision Loop" — internal jargon. | Rename to "Polish draft". |
| 8 | `OracleTab.tsx` | Button label "Start Mining Pass" — implementation detail. | Change to "Scan all sources". |
| 9 | All tabs | Badge system "AI / AI + Human / Hybrid / System" in the sidebar. | Remove from sidebar. Show a single status pill in the top bar instead. |
| 10 | All tabs | `glass-panel` class is used decoratively on most cards. | Reconsider. Use solid surfaces with subtle borders in light mode. Keep glass only where it earns its place. |

---

## 15. Empty / Loading / Error States

### Empty states

- Always include a one-sentence explanation of *why* it's empty.
- Always include one primary action ("Run a scan", "Add an idea").
- Never show a blank screen.
- Use the microcopy in §13.

### Loading states

- **Lists** (Vault, Past posts): skeleton rows, not spinners.
- **AI generation** (Research, Council, etc.): one-line progress text
  that updates in place. Show the actor ("Maya is reading your
  draft…") rather than the action ("Council revision loop in
  progress…").
- **Fast actions** (< 400ms): optimistic UI; show the result
  immediately and roll back on error.
- **Long actions** (> 5s): show a progress bar with a percentage if
  computable, or a moving indeterminate bar with a "this might take a
  minute" hint.

### Error states

- Plain language (see microcopy).
- One action: "Try again". Never a dead end.
- If the error is recoverable in Settings (e.g., missing API key),
  link to the relevant Settings page.
- Toast the error in the Activity panel even if a more visible error
  is shown in-place.

---

## 16. Motion & Animation

All user-initiated animations: **max 300ms**. No exceptions.

| Element | Type | Duration | Easing |
|---|---|---|---|
| Hover state on buttons | Color/border change | 120–180ms | `ease-out` |
| Press state on buttons | Scale to 0.97 | 100ms | `ease-out` |
| Tab change | Cross-fade | 200ms | `ease-in-out` |
| Sidebar item active | Background fade | 150ms | `ease-out` |
| Modal open | Scale from 0.95 + fade | 200ms | `ease-out` |
| Modal close | Scale to 0.95 + fade | 150ms | `ease-in` |
| Activity panel slide | Translate from right | 220ms | `ease-out` |
| Status pill pulse | Opacity 1.0 ↔ 0.6 | 1500ms loop | `ease-in-out` |
| Council reviewer appearing | Fade + translate-up 8px | 250ms | `ease-out` |

### Hard rules

- **No motion on keyboard navigation.** Tab focus is instant.
- **Respect `prefers-reduced-motion`.** All animations reduce to
  cross-fades under 100ms when the user has motion reduction enabled.
- **One focal animation at a time.** When the Council is animating
  per-reviewer appearances, the rest of the page is still.
- **No bouncing, no elastic springs on UI controls** (except for
  icon-morphing microinteractions, used sparingly).

---

## 17. Accessibility

### Hit targets

- All interactive elements: **min 32px** tap target.
- Primary CTAs: **min 44px** tall, with at least 8px of breathing
  room above and below.
- Small icons (trash, close, etc.) extend their hit area with
  padding or pseudo-elements to a 32px circle.

### Focus states

- All focusable elements: **visible 2px focus ring** in the accent
  color, with a 2px offset (per `pseudo-hit-target-expansion` pattern).
- Focus ring is never removed by `outline: none` without a replacement.
- Focus order matches visual order.

### Color

- Color is never the only signal. Pair every status color with text
  and an icon (e.g., the green "Strong fit" badge has the text "Strong
  fit" in green, not just a green dot).
- All text: **WCAG AA minimum**, AAA preferred for body text.
- Test all color combinations in both light and dark themes before
  shipping.

### Keyboard

- All flows completable via keyboard alone.
- `Tab` / `Shift+Tab` for navigation, `Enter` / `Space` for
  activation, `Esc` to close modals/panels.
- `Cmd+K` (or `Ctrl+K`) opens a command palette (stretch goal,
  see §19).
- `Cmd+.` (or `Ctrl+.`) pins the Activity panel.

### Motion & sound

- Respect `prefers-reduced-motion` everywhere.
- No sound at all. (Locked decision.)

### Screen readers

- All icons that convey meaning have `aria-label`.
- All decorative icons are `aria-hidden`.
- All form inputs have associated labels (no placeholder-only labels).
- Live regions (`aria-live="polite"`) for the Activity panel so
  events are announced as they happen.

---

## 18. Phased Rollout

### Phase 1 — Quick wins (lowest risk, highest grandmother-test gain)

Scope: copy changes, terminal hiding, auto-nav removal, broken icons.

1. Rename all 10 steps in plain language (table in §7).
2. Hide the system-logs terminal; add an "Activity" bell toggle in
   the top-right that opens the existing logs in a slide-over.
3. Remove all `setTimeout` auto-navigations across all tabs;
   replace with "Continue →" buttons.
4. Replace `??` placeholder icons in `OracleTab.tsx` with real
   brand icons or no icons.
5. Move the "Active Run" sidebar card to the top bar.
6. Update empty-state copy across all tabs to the new microcopy.
7. Remove the "AI / AI + Human / Hybrid / System" badges from the
   sidebar nav; show a single status pill in the top bar.

**Done when:** A non-technical first-time user can complete the
pipeline end-to-end with zero auto-movements, and the UI no longer
looks like a developer tool.

### Phase 2 — Guided path foundation

Scope: home screen, grouped sidebar, theme toggle, settings relocate.

1. Build the new home screen (resume-first, with smart fallback).
2. Group the 10 sidebar tabs under 3 phase headers (Find / Build /
   Publish & Learn). Phase headers are non-interactive labels.
3. Add the theme toggle to the top-right (Auto / Light / Dark).
4. Design the light theme (warm off-white background, warm text,
   borders, shadows). Test all existing components.
5. Move Settings from the sidebar footer to the top-right gear icon.
6. Reorganize Settings into 3 sections: Your voice / Connections /
   Advanced.

**Done when:** A first-time user lands on the home screen, sees
exactly one thing to do, and can complete a pipeline run without
ever seeing the developer chrome.

### Phase 3 — Step-by-step polish

Scope: per-step redesigns, activity panel upgrade, status pill.

1. Redesign Step 1 (Find ideas): counts-only source list, skeleton
   results, strength labels.
2. Redesign Step 2 (Pick an idea): suggested-for-you badge, plain
   strength labels, score as tooltip.
3. Redesign Step 3 (Research): structured report with sections,
   source chips, fact-check expand.
4. Redesign Step 4 (Answer questions): progress bar, plain
   rejection reasons, "help me answer" example, summary screen.
5. Redesign Step 5 (Gather material): categorized cards, stars for
   importance, manual add for gaps.
6. Redesign Step 6 (Write first draft): Accept / Try again buttons,
   voice match indicator, no inline editor.
7. Redesign Step 7 (Polish draft): per-reviewer animated progression,
   large final score, diff highlight, no auto-nav.
8. Redesign Step 8 (Post to platforms): 3-platform default, expand
   to 8, side-by-side previews.
9. Redesign Step 9 (Final edit): inline diff viewer (moved from
   Learning tab), simple text editor.
10. Redesign Step 10 (What we learned): celebration screen, plain-
    language lessons.
11. Upgrade the Activity panel from console lines to human-language
    toasts, with "Show technical log" toggle for engineers.
12. Add the live status pill to the top bar (Ready / Working… /
    Needs you / Error).
13. Build a global "Advanced mode" toggle (in Settings → Advanced)
    that reveals all current developer chrome.
14. Move the cross-component content-type dependency into global
    state (fixes the CouncilTab bug).

**Done when:** Every step has a single dominant purpose, a single
primary action, and a clear peak-end state.

### Phase 4 — Engineer happiness & stretch

Scope: command palette, keyboard shortcuts, raw event access,
polish.

1. Cmd+K command palette: type to search steps, ideas, settings.
2. Keyboard shortcuts 1–0 for the 10 steps (jumps to that step if
   unlocked).
3. Cmd+. to pin the Activity panel.
4. Theme cycle keyboard shortcut (Cmd+Shift+T).
5. Light theme passes visual QA on every component.
6. Accessibility audit (axe, manual screen reader testing).
7. Reduced-motion passes visual QA on every component.
8. Performance: lazy-load tab components, prefetch next step's
   data on hover of the step in the breadcrumb.

**Done when:** An engineer and a non-technical marketer can both
use the product daily without friction, on their preferred device,
in their preferred theme.

---

## 19. Open Items / Future Considerations

These were identified but not locked. Tracked for a future spec.

- **Command palette content.** What shows up in Cmd+K? (All steps,
  all past ideas, all settings, all platform presets?)
- **Multi-idea pipelines.** Can a user have more than one idea in
  progress? (Current UI implies one; home screen assumes one.)
- **Notifications.** Email / browser push when a long pipeline
  finishes? (Out of scope; defer.)
- **Mobile responsive design.** The current UI is desktop-first.
  The new top bar + grouped sidebar should collapse to a
  bottom-sheet nav on mobile. Design not started.
- **Onboarding flow for first-time users.** The home screen has a
  "first time" variant, but a guided product tour (3–5 tooltips)
  is a separate workstream.
- **Analytics & usage data.** What does the marketing team want to
  measure? Time per step, drop-off rate, publish rate? Defer.
- **Brand identity beyond voice.** Logo, color, typography choice
  for the redesigned app. The current dark "developer tool"
  aesthetic is being phased out; a lighter, more marketing-friendly
  brand may need to be designed. Defer to a brand spec.

---

## 20. Acceptance Criteria

The redesign is considered complete when:

1. **Grandmother test passes.** A non-technical first-time user can
   complete a full pipeline run on their first try without asking
   for help.
2. **No auto-navigation.** No screen moves without the user clicking
   a button.
3. **Single primary action per screen.** Every page has exactly one
   visually dominant CTA.
4. **All 10 steps renamed in plain language** and the original
   jargon (Oracle, Vault, Council, Production) is gone from
   user-facing copy.
5. **System-logs terminal is opt-in** behind the Activity bell
   toggle, renamed to "Activity", and the default view is
   human-language toasts.
6. **Light and dark themes both work** with the same level of
   visual care, and the system preference is respected on first
   visit.
7. **No sound at all** in any state of the app.
8. **All four cross-component coupling bugs** (auto-nav,
   content-type handoff, hidden DOM selectors, broken icons) are
   fixed.
9. **Accessibility audit passes** (WCAG AA, keyboard-only flow,
   screen reader labels, reduced-motion respect).
10. **Both Guided and Advanced modes** work, and the Advanced mode
    preserves all functionality of the current UI for engineers.

---

## Appendix A — Files Affected (For Implementer)

This is a non-code hint about scope. The implementer should expect to
touch roughly these areas, but the actual work breakdown is theirs to
plan.

- `frontend/src/App.tsx` — top bar, home screen, grouped sidebar
- `frontend/src/index.css` — light theme tokens, new component
  classes
- `frontend/src/components/OracleTab.tsx` — counts-only UI, skeleton
  results, fixed icons
- `frontend/src/components/VaultTab.tsx` — new empty state, strength
  labels
- `frontend/src/components/ResearcherTab.tsx` — structured report
  layout
- `frontend/src/components/InterviewTab.tsx` — progress, plain
  rejection reasons, summary screen
- `frontend/src/components/ProductionTab.tsx` — categorized cards
- `frontend/src/components/RefinementTab.tsx` — Accept / Try again
  buttons, no inline editor
- `frontend/src/components/CouncilTab.tsx` — per-reviewer progression,
  no auto-nav
- `frontend/src/components/RepurposeTab.tsx` — 3-default previews,
  side-by-side layout
- `frontend/src/components/RevisionTab.tsx` — diff viewer move,
  simple editor
- `frontend/src/components/LearningTab.tsx` — celebration screen,
  plain lessons, diff viewer removed
- `frontend/src/components/SettingsTab.tsx` — 3-section regroup,
  Advanced mode toggle
- `frontend/src/components/ActivityPanel.tsx` (new) — slide-over
  with human-language toasts
- `frontend/src/components/StatusPill.tsx` (new) — top-bar indicator
- `frontend/src/components/ThemeToggle.tsx` (new) — Auto / Light /
  Dark cycle
- `frontend/src/components/HomeScreen.tsx` (new) — resume-first home
- `frontend/src/lib/store.ts` (or new state file) — global state for
  active idea, in-progress pipeline, content type, advanced mode

---

## Appendix B — Wiki Rules Applied

A non-exhaustive cross-reference of which UI-wiki rules drove which
decisions in this spec. Full rule definitions live in the
`userinterface-wiki` skill.

- `ux-hicks-minimize-choices` → 3-phase grouping of 10 steps
- `ux-millers-chunking` → phase headers as visual chunks
- `ux-doherty-under-400ms` → skeletons, optimistic UI, progress
  text
- `ux-doherty-perceived-speed` → skeleton lists, instant status
  pills
- `ux-postels-accept-messy-input` → "Help me answer" example, manual
  add for gaps
- `ux-progressive-disclosure` → Settings 3-section regroup,
  Advanced mode toggle
- `ux-jakobs-familiar-patterns` → plain-language step names, "Start
  with a new idea" home screen
- `ux-aesthetic-usability` → light theme, warm color palette,
  consistent shadows
- `ux-proximity-grouping` → phase headers, status pills near their
  related actions
- `ux-von-restorff-emphasis` → "Suggested for you" badge, single
  primary CTA per page
- `ux-serial-position` → first and last in the step list (1 and 10)
  are the most discoverable
- `ux-peak-end-finish-strong` → Step 10 celebration, no auto-nav
- `ux-teslers-complexity` → system handles routing, content-type
  selection moved to global state
- `ux-goal-gradient-progress` → step progress bar, council score
  display
- `ux-zeigarnik-show-incomplete` → "You have 3 new ideas waiting",
  locked steps visible but disabled
- `ux-pragnanz-simplify` → strength labels (Strong fit / Possible /
  Stretch) instead of raw scores
- `ux-pareto-prioritize-features` → 3-platform default on Step 8
- `ux-cognitive-load-reduce` → no per-step badges, single status
  pill
- `timing-under-300ms` → all animations capped at 300ms
- `timing-consistent` → standard duration table in §16
- `easing-entrance-ease-out` → modal open, panel slide
- `easing-exit-ease-in` → modal close
- `none-keyboard-navigation` → no motion on focus
- `staging-one-focal-point` → Council per-reviewer appearance, no
  simultaneous UI movement
- `pseudo-hit-target-expansion` → small icon hit areas extended to
  32px
- `a11y-reduced-motion-check` → all animations respect user
  preference
- `a11y-toggle-setting` → theme toggle, "Show technical log" toggle
- `visual-consistent-spacing-scale` → spacing scale defined in
  Phase 3
- `visual-border-alpha-colors` → semi-transparent borders that adapt
  to background
- `type-tabular-nums-for-data` → all score displays (8.4 / 10)
- `type-text-wrap-balance-headings` → all page titles
- `type-text-wrap-pretty` → body text
- `prefetch-trajectory-over-hover` → lazy-load next step on hover
  (Phase 4)

---

*End of design spec. Ready for implementation. No code in this document
by design — see `frontend/src/components/*` for the current code, and
the design decisions in this spec for what to change.*
