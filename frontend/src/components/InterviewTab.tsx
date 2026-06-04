import React, { useState, useEffect, useRef } from 'react';
import { api, Idea, InterviewState } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  PaperPlaneRight, 
  Play, 
  CheckCircle, 
  WarningCircle, 
  BookOpen, 
  ArrowRight,
  ListNumbers,
  Quotes,
  Heart,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface ExtractionData {
  emotionalPalette?: Array<{ emotion: string; moment: string; quote: string }>;
  numericInventory?: Array<{ value: string; context: string }>;
  quoteInventory?: string[];
}

export const InterviewTab: React.FC<{ activeIdea: Idea | null; onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void; onNavigateToTab: (tab: string) => void }> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const { setStatus } = useApp();
  const [state, setState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [latestEval, setLatestEval] = useState<{ score: number; feedback: string } | null>(null);
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadStatus = async () => {
    try {
      const res = await api.getInterviewStatus();
      if (res.success && res.state) {
        setState(res.state);
        if (res.state.completed) {
          loadExtraction();
        }
      }
    } catch (err: any) {
      onLog('error', `Failed to load interview status: ${err.message || err}`);
    }
  };

  const loadExtraction = async () => {
    try {
      const res = await api.getFile('interview-extraction.json');
      if (res.success && res.content.trim() !== '') {
        setExtraction(JSON.parse(res.content));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadStatus();
  }, [activeIdea]);

  const handleStart = async () => {
    if (!activeIdea) {
      onLog('warning', 'Select an idea in the Vault first.');
      return;
    }
    setStarting(true);
    setStatus('working');
    onLog('info', 'Convene interview panel: starting questions pass...');

    try {
      const res = await api.startInterview();
      if (res.success) {
        setState(res.state);
        setLatestEval(null);
        onLog('success', `${res.state.currentInterviewer} opened the discussion.`);
        setStatus('ready');
      }
    } catch (err: any) {
      onLog('error', `Interview failed to start: ${err.message || err}`);
      setStatus('error');
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async (bypassText?: string) => {
    const textToSend = bypassText || answer.trim();
    if (!textToSend || !state || loading) return;

    setLoading(true);
    setStatus('working');
    onLog('info', `Submitting answer to ${state.currentInterviewer}...`);

    try {
      const res = await api.sendInterviewAnswer(textToSend);
      if (res.success) {
        setState(res.state);
        setAnswer('');
        setLatestEval(res.evaluation);

        if (res.evaluation.score < 6) {
          onLog('warning', `Interviewer score: ${res.evaluation.score}/10. feedback: ${res.evaluation.feedback}`);
          setStatus('needs_you');
        } else {
          onLog('success', `Approved. Score ${res.evaluation.score}/10. ${res.evaluation.feedback}`);
          setLatestEval(null); // Clear rejection alert if it passed
          setStatus('ready');
        }

        if (res.state.completed) {
          onLog('success', 'Interview finished! Extraction pass complete.');
          loadExtraction();
          setStatus('ready');
        }
      }
    } catch (err: any) {
      onLog('error', `Failed to submit answer: ${err.message || err}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onLog('info', 'Skipping current interviewer question.');
    handleSend("Skip this question to keep draft metrics generic.");
  };

  const answeredCount = state?.questionsAsked.length || 0;
  const maxQuestions = state?.maxQuestions || 6;
  const progressPct = (answeredCount / maxQuestions) * 100;
  const isRejected = latestEval && latestEval.score < 6;

  return (
    <div className="max-w-xl mx-auto py-4 select-none font-sans">
      
      {/* 1. NOT STARTED STATE */}
      {!state && (
        <div className="p-8 rounded-lg border border-hairline bg-surface-card text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <BookOpen size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-ink font-serif tracking-tight">Interview Panel</h3>
            <p className="text-xs text-body max-w-sm mx-auto leading-relaxed">
              We ask, you talk. 6 expert interviewers probe your idea to extract raw stories, specific figures, and emotional pivots.
            </p>
          </div>
          <button
            onClick={handleStart}
            disabled={starting || !activeIdea}
            className="w-full max-w-xs py-3 px-6 rounded-md bg-primary hover:bg-primary-active disabled:opacity-40 disabled:pointer-events-none text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer mx-auto"
          >
            {starting ? <ArrowsClockwise className="w-4 h-4 animate-spin" /> : <Play size={14} weight="fill" />}
            <span>Start interview panel</span>
          </button>
        </div>
      )}

      {/* 2. ACTIVE QUESTIONS STATE */}
      {state && !state.completed && (
        <div className="space-y-6 animate-in fade-in duration-400">
          {/* Progress Bar Header */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-muted uppercase">
              <span>Discussion Progress</span>
              <span>Question {answeredCount + 1} of {maxQuestions}</span>
            </div>
            <div className="w-full bg-surface-soft border border-hairline rounded-md h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-md transition-all duration-300"
                style={{ width: `${((answeredCount + 0.5) / maxQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Centered Question Box */}
          <div className="p-6 rounded-lg border border-hairline bg-surface-card space-y-4 text-center">
            <div className="inline-flex py-1 px-2.5 rounded-pill bg-canvas text-[9px] font-mono font-semibold tracking-wide text-muted border border-hairline">
              Interviewer: {state.currentInterviewer}
            </div>
            <h3 className="text-sm font-semibold text-ink font-serif leading-relaxed max-w-md mx-auto whitespace-pre-line select-text">
              {state.currentQuestion}
            </h3>
          </div>

          {/* Rejection Feedback Alert */}
          {isRejected && latestEval && (
            <div className="p-4 rounded-md border border-accent-amber/20 bg-accent-amber/5 text-accent-amber text-xs space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 font-bold select-none text-[11px] uppercase tracking-wide">
                <WarningCircle size={15} />
                <span>This scored a bit low ({latestEval.score}/10)</span>
              </div>
              <p className="leading-relaxed select-text font-normal text-body">
                Try adding a number, a name, or a specific moment. Long answers with details always score higher.
              </p>
              <div className="pt-2 border-t border-accent-amber/15 text-[10.5px] italic text-accent-amber/85 leading-normal select-text">
                Feedback: "{latestEval.feedback}"
              </div>
            </div>
          )}

          {/* Textarea Input Card */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading}
                placeholder="Type your specific response here..."
                rows={4}
                className="w-full bg-canvas border border-hairline focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md p-4 text-xs text-ink placeholder-muted/50 transition-all outline-none resize-none leading-relaxed custom-scroll"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (answer.trim().length >= 5) handleSend();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 text-[9px] font-mono text-muted-soft">
                {answer.length} chars (aim for &ge; 80)
              </div>
            </div>

            {/* CTAs Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="py-2.5 px-4 rounded-md bg-canvas hover:bg-surface-soft border border-hairline text-muted hover:text-ink text-[10px] font-bold transition-colors active:scale-95 cursor-pointer"
              >
                Skip question
              </button>

              <button
                onClick={() => handleSend()}
                disabled={loading || answer.trim().length < 5}
                className="py-2.5 px-5 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" /> : <PaperPlaneRight size={12} weight="fill" />}
                <span>Submit answer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLETE STATE (SUMMARY) */}
      {state && state.completed && (
        <div className="space-y-6 animate-in fade-in duration-400">
          
          {/* Completion Badge */}
          <div className="p-4 rounded-md border border-success/20 bg-success/5 text-center text-success space-y-2">
            <CheckCircle size={32} className="mx-auto" />
            <h4 className="text-sm font-bold tracking-wide uppercase">Dialogue Panel Complete</h4>
            <p className="text-[10px] text-muted font-sans leading-normal">
              We completed checks and compiled your stories, quotes, and metrics.
            </p>
          </div>

          {/* Summary Card */}
          {extraction && (
            <div className="p-6 rounded-lg border border-hairline bg-surface-card space-y-5">
              <div className="space-y-1 pb-3 border-b border-hairline">
                <h4 className="text-xs font-bold text-ink">
                  Here's what we pulled from you:
                </h4>
                <p className="text-[10px] text-muted leading-normal">
                  {extraction.emotionalPalette?.length || 0} stories, {extraction.numericInventory?.length || 0} numbers, {extraction.quoteInventory?.length || 0} strong opinions. Anything to fix before drafting?
                </p>
              </div>

              {/* Collapsed Inventory Lists */}
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scroll pr-1">
                {/* Quotes */}
                {extraction.quoteInventory && extraction.quoteInventory.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-muted uppercase flex items-center gap-1">
                      <Quotes size={11} />
                      <span>Opinions & Quotes</span>
                    </span>
                    <ul className="pl-3 list-disc text-[10.5px] text-body leading-relaxed space-y-1 font-sans">
                      {extraction.quoteInventory.map((q, i) => <li key={i} className="select-text">"{q}"</li>)}
                    </ul>
                  </div>
                )}

                {/* Numbers */}
                {extraction.numericInventory && extraction.numericInventory.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-hairline">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-muted uppercase flex items-center gap-1">
                      <ListNumbers size={11} />
                      <span>Numeric Inventory</span>
                    </span>
                    <ul className="pl-3 list-disc text-[10.5px] text-body leading-relaxed space-y-1 font-sans">
                      {extraction.numericInventory.map((n, i) => (
                        <li key={i} className="select-text">
                          <strong className="text-primary font-semibold">{n.value}</strong>: {n.context}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Emotional Spikes */}
                {extraction.emotionalPalette && extraction.emotionalPalette.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-hairline">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-muted uppercase flex items-center gap-1">
                      <Heart size={11} />
                      <span>Stories & Spikes</span>
                    </span>
                    <ul className="pl-3 list-disc text-[10.5px] text-body leading-relaxed space-y-1 font-sans">
                      {extraction.emotionalPalette.map((e, i) => (
                        <li key={i} className="select-text">
                          <strong className="text-body-strong font-semibold uppercase text-[9px]">{e.emotion}</strong>: "{e.quote}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto py-2.5 px-4 rounded-md bg-canvas hover:bg-surface-soft border border-hairline text-muted hover:text-ink text-[10px] font-bold transition-colors cursor-pointer"
            >
              Restart interview
            </button>

            <button
              onClick={() => onNavigateToTab('production')}
              className="w-full sm:w-auto py-2.5 px-6 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] group cursor-pointer"
            >
              <span>Continue to material</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
