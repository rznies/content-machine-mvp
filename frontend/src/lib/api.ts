export interface Idea {
  id: string;
  title: string;
  description: string;
  source: string;
  score: number;
  rationale: string;
  status: string;
  createdAt: string;
}

export interface QuestionAnswer {
  interviewer: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface InterviewState {
  ideaId: string;
  title: string;
  questionsAsked: QuestionAnswer[];
  currentInterviewer: string;
  currentQuestion: string;
  completed: boolean;
  maxQuestions: number;
}

export interface ReviewerScore {
  name: string;
  score: number;
  feedback: string;
}

export interface Iteration {
  iteration: number;
  draft: string;
  reviews: ReviewerScore[];
  score: number;
  editorialFixes: string[];
  infoGaps: string[];
}

export interface Derivative {
  platform: string;
  content: string;
}

export interface SettingsStatus {
  success: boolean;
  hasApiKey: boolean;
  hasGeminiKey: boolean;
  hasTavilyKey: boolean;
  hasFirecrawlKey: boolean;
  hasSlackToken: boolean;
  hasGmailToken?: boolean;
  hasNotionToken?: boolean;
  hasRssConfig?: boolean;
  researchMode: string;
  message: string;
  geminiApiKey?: string;
  tavilyApiKey?: string;
  firecrawlApiKey?: string;
  slackBotToken?: string;
}

// Fetch helper that handles proxy endpoints
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed.error || parsed.message || errorMsg;
    } catch {
      // Use standard status code message
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Oracle
  mineOracle: () => 
    request<{ success: boolean; minedCount: number; vault: Idea[] }>('/api/oracle/mine', { method: 'POST' }),

  // Vault
  getVault: () => 
    request<{ success: boolean; vault: Idea[] }>('/api/vault'),

  addIdea: (title: string, description: string, source: string) =>
    request<{ success: boolean; vault: Idea[] }>('/api/vault/add', {
      method: 'POST',
      body: JSON.stringify({ title, description, source }),
    }),

  selectIdea: (ideaId: string) =>
    request<{ success: boolean; selected: Idea }>('/api/vault/select', {
      method: 'POST',
      body: JSON.stringify({ ideaId }),
    }),

  getActiveIdea: () =>
    request<{ success: boolean; active: Idea | null }>('/api/vault/active'),

  // Researcher
  runResearch: () =>
    request<{ success: boolean; report: string }>('/api/research', { method: 'POST' }),

  // Interview
  startInterview: () =>
    request<{ success: boolean; state: InterviewState }>('/api/interview/start', { method: 'POST' }),

  getInterviewStatus: () =>
    request<{ success: boolean; state: InterviewState | null }>('/api/interview/status'),

  sendInterviewAnswer: (answer: string) =>
    request<{
      success: boolean;
      advance: boolean;
      state: InterviewState;
      evaluation: { score: number; feedback: string };
    }>('/api/interview/answer', {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  // Production
  compileProduction: () =>
    request<{ success: boolean; productionRaw: string }>('/api/production', { method: 'POST' }),

  // Refinement
  draftFirstVersion: (contentType: string) =>
    request<{ success: boolean; draft: string }>('/api/refine', {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),

  // Council
  conveneCouncil: (contentType: string) =>
    request<{
      success: boolean;
      finalScore: number;
      iterationsCount: number;
      iterations: Iteration[];
      finalDraft: string;
    }>('/api/council', {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),

  // Repurpose
  repurposeContent: () =>
    request<{ success: boolean; derivatives: Derivative[] }>('/api/repurpose', { method: 'POST' }),

  // Learning Loop
  submitLearningLoop: (finalApprovedText: string) =>
    request<{ success: boolean; newLessons: string; allLessons: string }>('/api/learning-loop', {
      method: 'POST',
      body: JSON.stringify({ finalApprovedText }),
    }),

  getLearningLoopMetrics: () =>
    request<{
      success: boolean;
      totalLessons: number;
      averageScoreHistory: number[];
      topCategories: string[];
      staleLessons: number;
    }>('/api/learning-loop/metrics'),

  // Files
  getFile: (name: string) =>
    request<{ success: boolean; content: string }>(`/api/file/${name}`),

  // Settings
  saveStyleGuide: (content: string) =>
    request<{ success: boolean }>('/api/settings/save-style', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  saveFile: (name: string, content: string) =>
    request<{ success: boolean }>('/api/settings/save-file', {
      method: 'POST',
      body: JSON.stringify({ name, content }),
    }),

  saveKeys: (keys: { geminiApiKey?: string; tavilyApiKey?: string; firecrawlApiKey?: string; slackBotToken?: string }) =>
    request<{ success: boolean }>('/api/settings/save-keys', {
      method: 'POST',
      body: JSON.stringify(keys),
    }),

  getSettingsStatus: () =>
    request<SettingsStatus>('/api/settings/status'),
};
