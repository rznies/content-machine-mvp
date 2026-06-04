import React, { useState, useEffect, useRef } from 'react';
import { api, Idea, InterviewState, QuestionAnswer } from '../lib/api';
import { PaperPlaneRight, Play, CheckCircle, ChatTeardropText, WarningCircle } from '@phosphor-icons/react';

interface InterviewTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const INTERVIEWERS = [
  { name: "Michael Barbaro", role: "The Daily Host", avatar: "🎙️" },
  { name: "Joe Rogan", role: "Raw & Practical", avatar: "🥋" },
  { name: "Howard Stern", role: "Direct & Honest", avatar: "🕶️" },
  { name: "Terry Gross", role: "Empathetic Reflections", avatar: "📻" },
  { name: "Lex Fridman", role: "Philosophical Systems", avatar: "🤖" },
  { name: "Oprah Winfrey", role: "Deep Aha! Insights", avatar: "👑" }
];

export const InterviewTab: React.FC<InterviewTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab
}) => {
  const [state, setState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadStatus = async () => {
    try {
      const res = await api.getInterviewStatus();
      if (res.success && res.state) {
        setState(res.state);
      }
    } catch (err: any) {
      onLog('error', `Failed to load interview status: ${err.message || err}`);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [activeIdea]);

  useEffect(() => {
    // Scroll chat to bottom whenever chat log updates
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state]);

  const handleStart = async () => {
    if (!activeIdea) {
      onLog('warning', 'Select an idea in The Vault first.');
      return;
    }
    setStarting(true);
    onLog('info', 'Starting interview panel with 6 world-class reviewers...');

    try {
      const res = await api.startInterview();
      if (res.success) {
        setState(res.state);
        onLog('success', `${res.state.currentInterviewer} opened the panel.`);
      }
    } catch (err: any) {
      onLog('error', `Interview failed to start: ${err.message || err}`);
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async () => {
    if (!answer.trim() || !state || loading) return;

    setLoading(true);
    const sentAnswer = answer.trim();
    onLog('info', `Sending response to Interview Panel...`);

    try {
      const res = await api.sendInterviewAnswer(sentAnswer);
      if (res.success) {
        setState(res.state);
        setAnswer('');
        
        const score = res.evaluation.score;
        if (score < 6) {
          onLog('warning', `Interviewer score: ${score}/10. Follow-up: ${res.evaluation.feedback}`);
        } else {
          onLog('success', `Approved. Score ${score}/10. ${res.evaluation.feedback}`);
        }

        if (res.state.completed) {
          onLog('success', 'Interview finished! Transitioning to Production step...');
          setTimeout(() => {
            onNavigateToTab('production');
          }, 2000);
        }
      }
    } catch (err: any) {
      onLog('error', `Failed to send answer: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const getInterviewerAvatar = (name: string) => {
    const matched = INTERVIEWERS.find(i => i.name === name);
    return matched ? matched.avatar : "🎙️";
  };

  const getInterviewerRole = (name: string) => {
    const matched = INTERVIEWERS.find(i => i.name === name);
    return matched ? matched.role : "Reviewer";
  };

  const answeredCount = state?.questionsAsked.length || 0;
  const maxQuestions = state?.maxQuestions || 6;
  const progressPct = (answeredCount / maxQuestions) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Sidebar - Panel Members */}
      <div className="glass-panel p-5 rounded-xl border border-gray-800 flex flex-col justify-between h-full lg:col-span-1">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Interview Status</h3>
            <p className="text-xs text-gray-500 mt-1">6-stage creator probe</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="font-mono text-gray-300 font-bold">{answeredCount} / {maxQuestions}</span>
            </div>
            <div className="w-full bg-gray-900 border border-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-900/60 overflow-y-auto max-h-[350px] custom-scroll">
            {INTERVIEWERS.map((interviewer) => {
              const isCurrent = state && state.currentInterviewer === interviewer.name && !state.completed;
              const hasInterviewed = state?.questionsAsked.some(q => q.interviewer === interviewer.name);
              return (
                <div
                  key={interviewer.name}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-950/20 shadow-md shadow-primary-500/5'
                      : hasInterviewed
                      ? 'border-emerald-950/40 bg-emerald-950/5 text-gray-400 opacity-60'
                      : 'border-gray-900 bg-gray-950/25 text-gray-500'
                  }`}
                >
                  <span className="text-xl">{interviewer.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                      {interviewer.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 truncate">{interviewer.role}</p>
                  </div>
                  {hasInterviewed && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {(!state || state.completed) && (
          <button
            onClick={handleStart}
            disabled={starting || !activeIdea}
            className="w-full py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-primary-500/10 mt-4"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{state?.completed ? 'Restart Interview' : 'Start Interview'}</span>
          </button>
        )}
      </div>

      {/* Main Chat Component */}
      <div className="glass-panel rounded-xl border border-gray-800 flex flex-col h-full lg:col-span-3 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {state && !state.completed ? getInterviewerAvatar(state.currentInterviewer) : "⚡"}
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">
                {state && !state.completed ? state.currentInterviewer : "System Panel"}
              </h3>
              <p className="text-[10px] text-gray-500">
                {state && !state.completed ? getInterviewerRole(state.currentInterviewer) : "Waiting to start..."}
              </p>
            </div>
          </div>
          {state && !state.completed && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVE</span>
            </span>
          )}
        </div>

        {/* Chat Timeline */}
        <div className="flex-1 p-5 overflow-y-auto custom-scroll space-y-4 bg-gray-950/10">
          {!state ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <ChatTeardropText className="w-10 h-10 text-gray-700" />
              <p className="text-xs text-gray-500 max-w-xs">
                To begin the dialogue panel, select an active seed concept and click the **Start Interview** trigger in the panel sidebar.
              </p>
            </div>
          ) : (
            <>
              {state.questionsAsked.map((q, idx) => (
                <div key={idx} className="space-y-4">
                  {/* Interviewer Question */}
                  <div className="flex gap-3 max-w-[85%]">
                    <span className="text-xl shrink-0 w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">
                      {getInterviewerAvatar(q.interviewer)}
                    </span>
                    <div className="p-3 bg-gray-900/60 border border-gray-800/80 rounded-xl rounded-tl-none">
                      <p className="text-[10px] font-bold text-primary-400 uppercase mb-0.5">{q.interviewer}</p>
                      <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">{q.question}</p>
                    </div>
                  </div>

                  {/* User Answer */}
                  <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
                    <div className="p-3 bg-primary-650 bg-primary-600/20 border border-primary-500/20 rounded-xl rounded-tr-none text-right">
                      <p className="text-[10px] font-bold text-primary-300 uppercase mb-0.5">Creator (You)</p>
                      <p className="text-xs text-gray-200 leading-relaxed text-left whitespace-pre-line">{q.answer}</p>
                    </div>
                    <span className="text-xl shrink-0 w-8 h-8 rounded-lg bg-primary-950 border border-primary-800/40 flex items-center justify-center">
                      ✍️
                    </span>
                  </div>

                  {/* Inline Score Log */}
                  <div className="flex items-center gap-2 max-w-md mx-auto py-2 px-3 border border-gray-900/60 bg-gray-950/60 rounded-lg text-[10px] text-gray-400 leading-relaxed justify-center">
                    <WarningCircle className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span>
                      <strong>{q.interviewer} Evaluator:</strong> Score {q.score}/10. {q.feedback}
                    </span>
                  </div>
                </div>
              ))}

              {/* Current Question */}
              {!state.completed ? (
                <div className="flex gap-3 max-w-[85%] pt-2 animate-in slide-in-from-bottom duration-200">
                  <span className="text-xl shrink-0 w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">
                    {getInterviewerAvatar(state.currentInterviewer)}
                  </span>
                  <div className="p-3 bg-gray-900 border border-primary-950/40 rounded-xl rounded-tl-none">
                    <p className="text-[10px] font-bold text-primary-400 uppercase mb-0.5">{state.currentInterviewer}</p>
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">{state.currentQuestion}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 max-w-sm mx-auto py-3 px-4 border border-emerald-900/40 bg-emerald-950/15 rounded-lg text-xs text-emerald-400 justify-center">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Dialogue Panel Complete!</strong> Proceed to the Production Markdown compilation.
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-850 bg-gray-950/40 flex gap-3 items-end">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!state || state.completed || loading}
            placeholder={
              !state
                ? "Dialogue inactive..."
                : state.completed
                ? "Panel closed."
                : "Type your detailed answer (incorporate specific figures, raw stories, emotional context)..."
            }
            rows={2}
            className="flex-1 bg-gray-950/70 border border-gray-850 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2 text-xs text-white placeholder-gray-600 transition-all outline-none resize-none disabled:opacity-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!state || state.completed || loading || !answer.trim()}
            className="py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-md shadow-primary-500/10 active:scale-95 self-stretch"
          >
            {loading ? (
              <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <PaperPlaneRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
