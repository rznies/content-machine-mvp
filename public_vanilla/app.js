// API URL base (relative for local hosting)
const API_BASE = "";

// Global State
let activeIdea = null;
let interviewState = null;
let currentDerivatives = [];

// ==========================================
// SPA ROUTING & NAVIGATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initOracleTab();
  initVaultTab();
  initResearcherTab();
  initInterviewTab();
  initProductionTab();
  initRefinementTab();
  initCouncilTab();
  initRepurposingTab();
  initRevisionTab();
  initLearningTab();
  initSettingsTab();
  
  // Load initial status
  checkApiAndStatus();
});

function initNavigation() {
  const navLinks = document.querySelectorAll(".sidebar-nav a, .settings-link");
  const sections = document.querySelectorAll(".tab-panel");
  const stepTitle = document.getElementById("current-step-title");
  const stepDesc = document.getElementById("current-step-desc");

  const stepDetails = {
    oracle: { title: "The Oracle [AI]", desc: "Mines internal Slack, Notion, call transcripts, and external feeds for content spikes." },
    vault: { title: "The Vault [Human]", desc: "A curated list of qualified content ideas. Select or create an idea to start your content pipeline." },
    researcher: { title: "The Researcher [AI]", desc: "Uses Google Search grounding to build a sourced research report and structure interviewer questions." },
    interview: { title: "Interview Panel [AI + Human]", desc: "Six world-class interviewers challenge your ideas one-by-one to extract real stories and metrics." },
    production: { title: "Production [AI]", desc: "Compiles the raw interview transcript into a structured reference Markdown document." },
    refinement: { title: "Refinement [AI + Human]", desc: "Combines the Style Guide, lessons, and production data to draft your content in your voice." },
    council: { title: "Writer's Council & Revision Loop [AI]", desc: "Six expert reviewers score your draft. The machine automatically rewrites and loops until score is >= 9/10." },
    repurpose: { title: "Repurposing Engine [AI]", desc: "Transforms the finalized anchor post into native formats for Twitter/X threads, LinkedIn, newsletters, and more." },
    revision: { title: "Final Revision [Human]", desc: "Fine-tune the draft manually to add personal finishing touches and sign-off on publication." },
    learning: { title: "Learning Loop [AI]", desc: "Compares your first vs final draft to extract writing lessons, making the machine smarter over time." },
    settings: { title: "Settings", desc: "Manage configurations, system instructions, and style guides." }
  };

  function switchTab(tabName) {
    // Deactivate all links & panels
    navLinks.forEach(l => l.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));

    // Activate selected link & panel
    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.getElementById(`tab-${tabName}`);

    if (activeLink) activeLink.classList.add("active");
    if (activePanel) activePanel.classList.add("active");

    // Update Headers
    if (stepDetails[tabName]) {
      stepTitle.innerText = stepDetails[tabName].title;
      stepDesc.innerText = stepDetails[tabName].desc;
    }
  }

  // Event Listeners
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      switchTab(tab);
      window.location.hash = tab;
    });
  });

  // Handle Hash routing on load
  const hash = window.location.hash.substring(1);
  if (hash && stepDetails[hash]) {
    switchTab(hash);
  }
}

// ==========================================
// LOGGER HELPER
// ==========================================
function log(type, message) {
  const terminal = document.getElementById("system-logs");
  if (!terminal) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  line.innerHTML = `[${time}] [${type.toUpperCase()}] ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// ==========================================
// SYSTEM CHECK
// ==========================================
async function checkApiAndStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/vault/active`);
    const data = await res.json();
    if (data.success && data.active) {
      updateActiveIdeaDisplay(data.active);
      log("info", `Active Content Run loaded: "${data.active.title}"`);
    } else {
      updateActiveIdeaDisplay(null);
    }
  } catch (err) {
    log("error", "Failed to connect to backend server.");
  }
}

function updateActiveIdeaDisplay(idea) {
  activeIdea = idea;
  const display = document.getElementById("active-idea-display");
  if (idea) {
    display.className = "active-idea-title";
    display.innerText = idea.title;
  } else {
    display.className = "active-idea-empty";
    display.innerText = "No idea selected";
  }
}

// ==========================================
// STEP 1: ORACLE TAB
// ==========================================
async function initOracleTab() {
  const slackPreview = document.getElementById("feed-slack-preview");
  const gmailPreview = document.getElementById("feed-gmail-preview");
  const transcriptPreview = document.getElementById("feed-transcripts-preview");
  const xPreview = document.getElementById("feed-x-preview");
  const btnMine = document.getElementById("btn-oracle-mine");

  // Load static previews
  try {
    const res = await fetch(`${API_BASE}/db/mock-inputs.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    slackPreview.innerText = data.slack.map(s => `[${s.channel}] ${s.author}: "${s.text}"`).join("\n\n");
    gmailPreview.innerText = data.gmail.map(g => `Subject: ${g.subject}\nBody: ${g.body}`).join("\n\n");
    transcriptPreview.innerText = data.transcripts.map(t => `${t.title}:\n${t.content}`).join("\n\n");
    xPreview.innerText = data.x_feed.map(x => `${x.author}: "${x.text}"`).join("\n\n");
  } catch (e) {
    // If not found, use hardcoded mocks directly
    slackPreview.innerText = "Slack #general: 'Alice: AI voice is ruined by academic paraphrasing...'";
    gmailPreview.innerText = "Gmail: partner@tenex_labs.com - 'Linked essay drove 80% pipeline growth...'";
    transcriptPreview.innerText = "Transcript: CEO: 'Interview builders, extract raw stories...'";
    xPreview.innerText = "X Feed: @levie: 'Centaur software integrates human stories...'";
  }

  btnMine.addEventListener("click", async () => {
    btnMine.disabled = true;
    btnMine.innerHTML = "<span>Mining Feeds (Running Oracle)...</span>";
    log("info", "Starting Oracle Mining pass across Slack, Gmail, X, and call logs...");

    try {
      const res = await fetch(`${API_BASE}/api/oracle/mine`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        log("success", `Oracle identified & qualified ${data.minedCount} new ideas from the feeds!`);
        btnMine.innerHTML = "<span>Scan & Mine Done</span>";
        setTimeout(() => {
          btnMine.disabled = false;
          btnMine.innerHTML = "<span>Start Mining Pass</span>";
          // Redirect to Vault
          document.querySelector('[data-tab="vault"]').click();
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Oracle mining failed: ${err.message}`);
      btnMine.disabled = false;
      btnMine.innerHTML = "<span>Start Mining Pass</span>";
    }
  });

  // Simple Accordion Toggle
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      item.classList.toggle("active");
    });
  });
}

// ==========================================
// STEP 2: VAULT TAB
// ==========================================
function initVaultTab() {
  const btnAddModal = document.getElementById("btn-add-idea-modal");
  const modal = document.getElementById("add-idea-modal");
  const closeModal = document.getElementById("close-modal");
  const addForm = document.getElementById("add-idea-form");

  btnAddModal.addEventListener("click", () => modal.style.display = "flex");
  closeModal.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("new-idea-title").value;
    const description = document.getElementById("new-idea-desc").value;
    const source = document.getElementById("new-idea-source").value;

    log("info", `Manually adding new content idea: "${title}"...`);
    try {
      const res = await fetch(`${API_BASE}/api/vault/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, source })
      });
      const data = await res.json();
      if (data.success) {
        log("success", "New idea saved to Vault.");
        modal.style.display = "none";
        addForm.reset();
        renderVaultList(data.vault);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Failed to save idea: ${err.message}`);
    }
  });

  // Pull ideas on tab reveal
  document.querySelector('[data-tab="vault"]').addEventListener("click", loadVault);
}

async function loadVault() {
  try {
    const res = await fetch(`${API_BASE}/api/vault`);
    const data = await res.json();
    if (data.success) {
      renderVaultList(data.vault);
    }
  } catch (err) {
    log("error", "Failed to retrieve Vault.");
  }
}

function renderVaultList(ideas) {
  const container = document.getElementById("vault-ideas-list");
  container.innerHTML = "";

  if (ideas.length === 0) {
    container.innerHTML = `<p class="placeholder-text">No ideas qualified yet. Mine feeds or create one.</p>`;
    return;
  }

  ideas.forEach(idea => {
    const isActive = activeIdea && activeIdea.id === idea.id;
    const card = document.createElement("div");
    card.className = `idea-card ${isActive ? 'active-run' : ''}`;
    card.innerHTML = `
      <div class="idea-main-info">
        <div class="idea-badge-row">
          <span class="idea-score-badge">★ ${idea.score.toFixed(1)}/10</span>
          <span class="idea-source-badge">${idea.source}</span>
        </div>
        <h4>${idea.title}</h4>
        <p>${idea.description}</p>
        <p class="idea-rationale">Oracle: ${idea.rationale}</p>
      </div>
      <button class="btn btn-secondary btn-sm btn-select-idea" data-id="${idea.id}">
        ${isActive ? 'Selected' : 'Select'}
      </button>
    `;
    container.appendChild(card);
  });

  // Add click listener
  container.querySelectorAll(".btn-select-idea").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      log("info", "Selecting active idea...");
      try {
        const res = await fetch(`${API_BASE}/api/vault/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ideaId: id })
        });
        const data = await res.json();
        if (data.success) {
          updateActiveIdeaDisplay(data.selected);
          log("success", `Active pipeline idea selected: "${data.selected.title}"`);
          loadVault(); // Re-render selected border
          // Move to next tab
          document.querySelector('[data-tab="researcher"]').click();
        }
      } catch (err) {
        log("error", `Failed to select idea: ${err.message}`);
      }
    });
  });
}

// ==========================================
// STEP 3: THE RESEARCHER TAB
// ==========================================
function initResearcherTab() {
  const btnGenerate = document.getElementById("btn-research-generate");
  const btnTab = document.querySelector('[data-tab="researcher"]');

  btnTab.addEventListener("click", loadResearchReport);

  btnGenerate.addEventListener("click", async () => {
    if (!activeIdea) {
      log("warning", "Choose an idea in The Vault first.");
      alert("Please choose an idea from The Vault first.");
      return;
    }

    btnGenerate.disabled = true;
    btnGenerate.innerText = "Researching Search Grounding...";
    log("info", `Running Google Search Grounded Research for idea: "${activeIdea.title}"...`);
    document.getElementById("research-status-banner").innerText = "Report Status: AI Running...";
    document.getElementById("research-report-content").innerHTML = `<p class="placeholder-text">Searching Google and composing report (usually takes 5-10s)...</p>`;

    try {
      const res = await fetch(`${API_BASE}/api/research`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        log("success", "Sourced Research Report generated successfully.");
        document.getElementById("research-status-banner").innerText = "Report Status: Compiled & Saved to research-report.md";
        renderMarkdown("research-report-content", data.report);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Research generation failed: ${err.message}`);
      document.getElementById("research-status-banner").innerText = "Report Status: Failed";
      document.getElementById("research-report-content").innerHTML = `<p class="placeholder-text error">Error: ${err.message}</p>`;
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.innerText = "Generate Sourced Report";
    }
  });
}

async function loadResearchReport() {
  try {
    const res = await fetch(`${API_BASE}/api/file/research-report.md`);
    const data = await res.json();
    if (data.success && data.content.trim() !== "") {
      document.getElementById("research-status-banner").innerText = "Report Status: Loaded from research-report.md";
      renderMarkdown("research-report-content", data.content);
    }
  } catch (err) {
    // Ignore error, report is empty
  }
}

// ==========================================
// STEP 4: INTERVIEW PANEL TAB
// ==========================================
function initInterviewTab() {
  const btnStart = document.getElementById("btn-interview-start");
  const btnSend = document.getElementById("btn-interview-send");
  const inputAnswer = document.getElementById("interview-answer-input");
  const btnTab = document.querySelector('[data-tab="interview"]');

  btnTab.addEventListener("click", loadInterviewStatus);

  btnStart.addEventListener("click", async () => {
    if (!activeIdea) {
      log("warning", "No active idea. Start by selecting an idea in The Vault.");
      return;
    }
    btnStart.disabled = true;
    btnStart.innerText = "Initializing...";
    log("info", "Starting interview panel with 6 world-class reviewers...");

    try {
      const res = await fetch(`${API_BASE}/api/interview/start`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        interviewState = data.state;
        renderInterviewChat();
        log("success", `${interviewState.currentInterviewer} opened the panel.`);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Interview failed to start: ${err.message}`);
      btnStart.disabled = false;
      btnStart.innerText = "Start Interview";
    }
  });

  btnSend.addEventListener("click", sendInterviewAnswer);
  inputAnswer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendInterviewAnswer();
    }
  });
}

async function loadInterviewStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/interview/status`);
    const data = await res.json();
    if (data.success && data.state) {
      interviewState = data.state;
      renderInterviewChat();
    }
  } catch (err) {
    log("error", "Failed to retrieve interview status.");
  }
}

function renderInterviewChat() {
  if (!interviewState) return;

  const btnStart = document.getElementById("btn-interview-start");
  const btnSend = document.getElementById("btn-interview-send");
  const inputAnswer = document.getElementById("interview-answer-input");
  const chatHistory = document.getElementById("chat-history");
  const activeName = document.getElementById("active-interviewer-name");
  const activeAvatar = document.getElementById("active-interviewer-avatar");
  const progressFill = document.getElementById("interview-progress-fill");
  const progressText = document.getElementById("interview-progress-text");

  // Update button statuses
  btnStart.style.display = interviewState.completed ? "inline-block" : "none";
  btnStart.innerText = interviewState.completed ? "Restart Interview" : "Start Interview";
  btnStart.disabled = false;

  btnSend.disabled = interviewState.completed;
  inputAnswer.disabled = interviewState.completed;

  // Update progress
  const answeredCount = interviewState.questionsAsked.length;
  const progressPct = (answeredCount / interviewState.maxQuestions) * 100;
  progressFill.style.width = `${progressPct}%`;
  progressText.innerText = `Questions: ${answeredCount} / ${interviewState.maxQuestions}`;

  // Update active card indicator
  document.querySelectorAll(".interviewer-card").forEach(card => {
    card.classList.remove("active");
    if (card.getAttribute("data-interviewer") === interviewState.currentInterviewer) {
      card.classList.add("active");
    }
  });

  // Set chat avatars
  const avatars = {
    "Michael Barbaro": "🎙️",
    "Joe Rogan": "🥋",
    "Howard Stern": "🕶️",
    "Terry Gross": "📻",
    "Lex Fridman": "🤖",
    "Oprah Winfrey": "👑",
    "System": "⚡"
  };

  activeName.innerText = interviewState.currentInterviewer;
  activeAvatar.innerText = avatars[interviewState.currentInterviewer] || "🎙️";

  // Build History
  chatHistory.innerHTML = "";
  
  interviewState.questionsAsked.forEach(q => {
    // Interviewer message
    const msgQ = document.createElement("div");
    msgQ.className = "chat-message assistant";
    msgQ.innerHTML = `
      <span class="speaker-label">${q.interviewer}</span>
      <div class="message-content">${q.question}</div>
    `;
    chatHistory.appendChild(msgQ);

    // Creator answer
    const msgA = document.createElement("div");
    msgA.className = "chat-message user";
    msgA.innerHTML = `
      <span class="speaker-label">Creator (You)</span>
      <div class="message-content">${q.answer}</div>
    `;
    chatHistory.appendChild(msgA);
    
    // Evaluation feedback (shown as inline whisper log)
    const logInfo = document.createElement("div");
    logInfo.className = "log-line system";
    logInfo.style.fontSize = "10px";
    logInfo.style.alignSelf = "center";
    logInfo.style.margin = "4px 0";
    logInfo.innerText = `[Feedback System] ${q.interviewer} Score: ${q.score}/10. ${q.feedback}`;
    chatHistory.appendChild(logInfo);
  });

  // Current active question
  if (!interviewState.completed) {
    const currentQ = document.createElement("div");
    currentQ.className = "chat-message assistant";
    currentQ.innerHTML = `
      <span class="speaker-label">${interviewState.currentInterviewer}</span>
      <div class="message-content">${interviewState.currentQuestion}</div>
    `;
    chatHistory.appendChild(currentQ);
  } else {
    const endMsg = document.createElement("div");
    endMsg.className = "chat-message assistant";
    endMsg.innerHTML = `
      <span class="speaker-label">System</span>
      <div class="message-content">🏁 **Interview Finished!** You answered all questions. Go to Step 5 (Production) to generate the raw content compiler document.</div>
    `;
    chatHistory.appendChild(endMsg);
  }

  // Scroll chat to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendInterviewAnswer() {
  const inputAnswer = document.getElementById("interview-answer-input");
  const btnSend = document.getElementById("btn-interview-send");
  const answer = inputAnswer.value.trim();

  if (answer === "") return;

  btnSend.disabled = true;
  inputAnswer.disabled = true;
  log("info", "Sending response to Interview Panel...");

  try {
    const res = await fetch(`${API_BASE}/api/interview/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer })
    });
    const data = await res.json();
    if (data.success) {
      interviewState = data.state;
      inputAnswer.value = "";
      
      const score = data.evaluation.score;
      if (score < 6) {
        log("warning", `Reaction: ${data.evaluation.feedback}`);
      } else {
        log("success", `Reaction: Approved. Score ${score}/10.`);
      }

      renderInterviewChat();

      if (interviewState.completed) {
        // Move to Production Tab
        setTimeout(() => {
          document.querySelector('[data-tab="production"]').click();
        }, 2000);
      }
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    log("error", `Failed to send answer: ${err.message}`);
  } finally {
    btnSend.disabled = interviewState.completed;
    inputAnswer.disabled = interviewState.completed;
  }
}

// ==========================================
// STEP 5: PRODUCTION TAB
// ==========================================
function initProductionTab() {
  const btnCompile = document.getElementById("btn-production-compile");
  const btnTab = document.querySelector('[data-tab="production"]');

  btnTab.addEventListener("click", loadProductionFile);

  btnCompile.addEventListener("click", async () => {
    btnCompile.disabled = true;
    btnCompile.innerText = "Compiling raw markdown...";
    log("info", "Compiling production transcript to raw reference markdown...");

    try {
      const res = await fetch(`${API_BASE}/api/production`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        log("success", "Production markdown successfully compiled & saved to production-raw.md.");
        renderMarkdown("production-content", data.productionRaw);
        // Transition to refinement
        setTimeout(() => {
          document.querySelector('[data-tab="refinement"]').click();
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Production failed: ${err.message}`);
      document.getElementById("production-content").innerHTML = `<p class="placeholder-text error">Error: ${err.message}</p>`;
    } finally {
      btnCompile.disabled = false;
      btnCompile.innerText = "Compile Raw File";
    }
  });
}

async function loadProductionFile() {
  try {
    const res = await fetch(`${API_BASE}/api/file/production-raw.md`);
    const data = await res.json();
    if (data.success && data.content.trim() !== "") {
      renderMarkdown("production-content", data.content);
    }
  } catch (err) {
    // Ignore error
  }
}

// ==========================================
// STEP 6: REFINEMENT TAB
// ==========================================
function initRefinementTab() {
  const btnDraft = document.getElementById("btn-refine-draft");
  const btnTab = document.querySelector('[data-tab="refinement"]');

  btnTab.addEventListener("click", async () => {
    loadRefinementData();
    loadCurrentDraft();
  });

  btnDraft.addEventListener("click", async () => {
    const contentType = document.getElementById("refine-content-type").value;
    btnDraft.disabled = true;
    btnDraft.innerText = "Drafting Content...";
    log("info", `Drafting first version of "${contentType}" using style guide and past lessons...`);

    try {
      const res = await fetch(`${API_BASE}/api/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType })
      });
      const data = await res.json();
      if (data.success) {
        log("success", "First draft created. Saved to draft-first.md.");
        document.getElementById("refinement-draft-content").innerText = data.draft;
        
        // Transition to Council
        setTimeout(() => {
          document.querySelector('[data-tab="council"]').click();
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Drafting failed: ${err.message}`);
    } finally {
      btnDraft.disabled = false;
      btnDraft.innerText = "Draft First Version";
    }
  });
}

async function loadRefinementData() {
  try {
    const resStyle = await fetch(`${API_BASE}/api/file/style-guide.md`);
    const dataStyle = await resStyle.json();
    if (dataStyle.success) {
      document.getElementById("style-guide-box").innerText = dataStyle.content;
    }

    const resLessons = await fetch(`${API_BASE}/api/file/content-lessons.md`);
    const dataLessons = await resLessons.json();
    if (dataLessons.success && dataLessons.content.trim() !== "") {
      document.getElementById("lessons-box").innerText = dataLessons.content;
    }
  } catch (err) {
    // Ignore error
  }
}

async function loadCurrentDraft() {
  try {
    const res = await fetch(`${API_BASE}/api/file/draft-current.md`);
    const data = await res.json();
    if (data.success && data.content.trim() !== "") {
      document.getElementById("refinement-draft-content").innerText = data.content;
    }
  } catch (err) {
    // Ignore error
  }
}

// ==========================================
// STEP 7: WRITER'S COUNCIL TAB
// ==========================================
function initCouncilTab() {
  const btnReview = document.getElementById("btn-council-review");
  const btnTab = document.querySelector('[data-tab="council"]');

  btnTab.addEventListener("click", loadRevisionLogs);

  btnReview.addEventListener("click", async () => {
    const contentType = document.getElementById("refine-content-type").value;
    btnReview.disabled = true;
    btnReview.innerText = "Conveening & Revising Loop...";
    log("info", "Conveening 6 expert reviewers to score and revise draft in background...");

    try {
      const res = await fetch(`${API_BASE}/api/council`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType })
      });
      const data = await res.json();
      if (data.success) {
        log("success", `Revision loop finished! Final Council Score: ${data.finalScore.toFixed(1)}/10 after ${data.iterationsCount} iterations.`);
        renderCouncilReview(data.iterations[data.iterations.length - 1]);
        renderRevisionTimeline(data.iterations);
        
        // Move to Repurposing
        setTimeout(() => {
          document.querySelector('[data-tab="repurpose"]').click();
        }, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Writer's council failed: ${err.message}`);
    } finally {
      btnReview.disabled = false;
      btnReview.innerText = "Convene Council & Revise";
    }
  });
}

function renderCouncilReview(lastIteration) {
  const scoresGrid = document.getElementById("council-scores-grid");
  const listEditorial = document.getElementById("council-fixes-editorial");
  const listGaps = document.getElementById("council-fixes-gaps");

  // Render scores
  scoresGrid.innerHTML = "";
  lastIteration.reviews.forEach(rev => {
    const card = document.createElement("div");
    card.className = "reviewer-card";
    card.innerHTML = `
      <h4>${rev.name}</h4>
      <div class="reviewer-score">${rev.score}<span>/10</span></div>
      <p class="reviewer-comment" title="${rev.feedback}">${rev.feedback}</p>
    `;
    scoresGrid.appendChild(card);
  });

  // Add overall average
  const avgCard = document.createElement("div");
  avgCard.className = "reviewer-card";
  avgCard.style.borderColor = "var(--accent-purple)";
  avgCard.innerHTML = `
    <h4 style="color: var(--accent-purple)">Average Score</h4>
    <div class="reviewer-score" style="color: var(--accent-purple); font-size: 28px;">${lastIteration.score.toFixed(1)}<span>/10</span></div>
    <p class="reviewer-comment">Council Target: 9.0+</p>
  `;
  scoresGrid.appendChild(avgCard);

  // Render fixes
  listEditorial.innerHTML = lastIteration.editorialFixes.map(f => `<li>${f}</li>`).join("") || "<li>None</li>";
  listGaps.innerHTML = lastIteration.infoGaps.map(g => `<li>${g}</li>`).join("") || "<li>None (Draft ready for sign-off)</li>";
}

function renderRevisionTimeline(iterations) {
  const container = document.getElementById("revision-history-list");
  container.innerHTML = "";

  iterations.forEach(iter => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-header">
        <span>Iteration #${iter.iteration}</span>
        <span>Average Score: ${iter.score.toFixed(1)}/10</span>
      </div>
      <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">
        Editorial Fixes applied: ${iter.editorialFixes.length} | Information Gaps: ${iter.infoGaps.length}
      </p>
      <div style="font-size: 11.5px; border-left: 2px solid var(--border-color); padding-left: 8px; font-style: italic; max-height: 80px; overflow-y: auto;">
        ${iter.draft.substring(0, 180)}...
      </div>
    `;
    container.appendChild(item);
  });
}

function loadRevisionLogs() {
  // Can be empty on startup
}

// ==========================================
// STEP 8: REPURPOSING TAB
// ==========================================
function initRepurposingTab() {
  const btnGenerate = document.getElementById("btn-repurpose-generate");
  const tabs = document.getElementById("repurpose-tabs");
  const contentBox = document.getElementById("repurpose-content-box");
  const btnTab = document.querySelector('[data-tab="repurpose"]');

  btnTab.addEventListener("click", loadRepurposedContent);

  btnGenerate.addEventListener("click", async () => {
    btnGenerate.disabled = true;
    btnGenerate.innerText = "Repurposing to 5 channels...";
    log("info", "Generating platform-native derivatives (Twitter thread, LinkedIn, Newsletter, etc.)...");

    try {
      const res = await fetch(`${API_BASE}/api/repurpose`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        log("success", "Repurposing Engine completed successfully.");
        currentDerivatives = data.derivatives;
        renderRepurposeTabs();
        
        // Move to Revision Tab
        setTimeout(() => {
          document.querySelector('[data-tab="revision"]').click();
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Repurposing failed: ${err.message}`);
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.innerText = "Generate 5 Derivatives";
    }
  });
}

async function loadRepurposedContent() {
  try {
    const res = await fetch(`${API_BASE}/api/file/derivatives.json`);
    const data = await res.json();
    if (data.success && data.content.trim() !== "") {
      currentDerivatives = JSON.parse(data.content);
      renderRepurposeTabs();
    }
  } catch (err) {
    // Ignore error
  }
}

function renderRepurposeTabs() {
  const tabs = document.getElementById("repurpose-tabs");
  const contentBox = document.getElementById("repurpose-content-box");
  tabs.innerHTML = "";

  if (currentDerivatives.length === 0) return;

  currentDerivatives.forEach((d, index) => {
    const tab = document.createElement("button");
    tab.className = `repurpose-tab ${index === 0 ? 'active' : ''}`;
    tab.innerText = d.platform;
    tab.addEventListener("click", () => {
      document.querySelectorAll(".repurpose-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      contentBox.innerText = d.content;
    });
    tabs.appendChild(tab);
  });

  // Display first tab by default
  contentBox.innerText = currentDerivatives[0].content;
}

// ==========================================
// STEP 9: FINAL REVISION TAB
// ==========================================
function initRevisionTab() {
  const btnLoad = document.getElementById("btn-load-current-draft");
  const btnApprove = document.getElementById("btn-approve-signoff");
  const editor = document.getElementById("final-editor-textarea");
  const btnTab = document.querySelector('[data-tab="revision"]');

  btnTab.addEventListener("click", loadCurrentDraftToEditor);
  btnLoad.addEventListener("click", loadCurrentDraftToEditor);

  btnApprove.addEventListener("click", async () => {
    const text = editor.value.trim();
    if (text === "") {
      alert("Editor cannot be empty.");
      return;
    }

    btnApprove.disabled = true;
    btnApprove.innerText = "Saving & Triggering Learning Loop...";
    log("info", "Creator approved draft. Compiling edits & extracting lessons...");

    try {
      const res = await fetch(`${API_BASE}/api/learning-loop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalApprovedText: text })
      });
      const data = await res.json();
      if (data.success) {
        log("success", "Learning Loop complete! Lessons saved to content-lessons.md.");
        
        // Render Learning Loop tab
        renderDiff(data.newLessons);
        
        // Go to Learning Loop Tab
        document.querySelector('[data-tab="learning"]').click();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      log("error", `Learning loop analysis failed: ${err.message}`);
    } finally {
      btnApprove.disabled = false;
      btnApprove.innerText = "Approve & Save (Sign-Off)";
    }
  });
}

async function loadCurrentDraftToEditor() {
  try {
    const res = await fetch(`${API_BASE}/api/file/draft-current.md`);
    const data = await res.json();
    if (data.success && data.content.trim() !== "") {
      document.getElementById("final-editor-textarea").value = data.content;
      log("info", "Current draft loaded into editor.");
    }
  } catch (err) {
    // Ignore error
  }
}

// ==========================================
// STEP 10: LEARNING LOOP TAB
// ==========================================
function initLearningTab() {
  const btnTab = document.querySelector('[data-tab="learning"]');
  btnTab.addEventListener("click", loadLearningLogs);
}

async function loadLearningLogs() {
  try {
    // Fetch first draft, final draft, and lessons
    const resFirst = await fetch(`${API_BASE}/api/file/draft-first.md`);
    const first = await resFirst.json();

    const resFinal = await fetch(`${API_BASE}/api/file/draft-final-approved.md`);
    const final = await resFinal.json();

    const resLessons = await fetch(`${API_BASE}/api/file/content-lessons.md`);
    const lessons = await resLessons.json();

    if (first.success && final.success) {
      const diffHtml = generateSimpleDiff(first.content, final.content);
      document.getElementById("diff-viewer-content").innerHTML = diffHtml;
    }

    if (lessons.success) {
      renderMarkdown("lessons-learned-content", lessons.content);
    }
  } catch (err) {
    // Ignore
  }
}

function renderDiff(newLessons) {
  // Simple rendering on transition
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateSimpleDiff(text1, text2) {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");
  let html = "";
  
  const maxLines = Math.max(lines1.length, lines2.length);
  for (let i = 0; i < maxLines; i++) {
    const l1 = lines1[i];
    const l2 = lines2[i];
    if (l1 === l2) {
      html += `<div>  ${escapeHtml(l1 || "")}</div>`;
    } else {
      if (l1 !== undefined) {
        html += `<div class="diff-removed">- ${escapeHtml(l1)}</div>`;
      }
      if (l2 !== undefined) {
        html += `<div class="diff-added">+ ${escapeHtml(l2)}</div>`;
      }
    }
  }
  return html;
}

// ==========================================
// SETTINGS TAB
// ==========================================
function initSettingsTab() {
  const btnSave = document.getElementById("btn-save-settings");
  const editor = document.getElementById("style-guide-editor");
  const banner = document.getElementById("api-status-text");

  // Load style guide when opening
  document.querySelector('[data-tab="settings"]').addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE}/api/file/style-guide.md`);
      const data = await res.json();
      if (data.success) {
        editor.value = data.content;
      }
    } catch (e) {}

    try {
      const resStatus = await fetch(`${API_BASE}/api/settings/status`);
      const dataStatus = await resStatus.json();
      if (dataStatus.success) {
        banner.innerText = dataStatus.message;
        if (dataStatus.hasApiKey) {
          banner.className = "status-banner success";
        } else {
          banner.className = "status-banner info";
        }
      }
    } catch (e) {}
  });

  btnSave.addEventListener("click", async () => {
    btnSave.disabled = true;
    log("info", "Saving updated Style Guide...");

    try {
      // We will write the style guide directly
      const content = editor.value;
      const res = await fetch(`${API_BASE}/api/settings/save-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        log("success", "Style Guide saved.");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      // Fallback endpoint or handle directly
      log("error", `Failed to save: ${err.message}`);
    } finally {
      btnSave.disabled = false;
    }
  });
}

// ==========================================
// UTILITY: MARKDOWN PARSER (Super basic MVP)
// ==========================================
function renderMarkdown(elementId, markdownText) {
  const container = document.getElementById(elementId);
  if (!container) return;

  // Extremely basic markdown compiler for titles, lists, blocks, etc.
  let html = markdownText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<p></p>')
    .replace(/\n/g, '<br>');

  // Wrap list items
  // Since we did a simple replace, we should clean up LI tags that aren't wrapped in UL
  container.innerHTML = html;
}
