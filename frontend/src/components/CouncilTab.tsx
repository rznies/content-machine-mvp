import React, { useState, useEffect, useRef } from 'react';
import { api, Idea, Iteration, ReviewerScore } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ArrowsClockwise, 
  Warning, 
  PenNib, 
  ArrowRight,
  Sparkle,
  Quotes,
  CheckCircle,
  ClockCounterClockwise
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface CouncilTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const CouncilTab: React.FC<CouncilTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const { setStatus, contentType } = useApp();
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleReviewerCount, setVisibleReviewerCount] = useState<number>(0);
  const [revealFinished, setRevealFinished] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleReview = async () => {
    if (finalScore !== null && revealFinished) {
      onNavigateToTab('repurpose');
      return;
    }

    setLoading(true);
    setIterations([]);
    setFinalScore(null);
    setVisibleReviewerCount(0);
    setRevealFinished(false);
    setStatus('working');
    onLog('info', 'Convening 6 expert reviewers to score and revise draft in background...');

    try {
      const res = await api.conveneCouncil(contentType); // Target type from global state
      if (res.success) {
        setFinalScore(res.finalScore);
        setIterations(res.iterations);
        onLog('success', `Revision loop finished! Convening timeline is starting...`);
        
        // Start sequential review reveal
        let count = 0;
        setVisibleReviewerCount(0);
        
        timerRef.current = setInterval(() => {
          count++;
          setVisibleReviewerCount(count);
          if (count >= 6) {
            if (timerRef.current) clearInterval(timerRef.current);
            setRevealFinished(true);
            setStatus('ready');
            onLog('success', `All reviewer reports compiled. Average score: ${res.finalScore.toFixed(1)}/10.`);
          }
        }, 800); // 800ms between each reviewer reveal
      }
    } catch (err: any) {
      onLog('error', `Writer's Council process failed: ${err.message || err}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const lastIteration = iterations[iterations.length - 1];
  const firstIteration = iterations[0];

  const renderDiff = (draft1: string, draft2: string) => {
    if (!draft1 || !draft2) return null;
    const lines1 = draft1.split('\n');
    const lines2 = draft2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const diffNodes: React.ReactNode[] = [];

    for (let i = 0; i < maxLines; i++) {
      const l1 = lines1[i];
      const l2 = lines2[i];

      if (l1 === l2) {
        if (l1 !== undefined && l1.trim() !== '') {
          diffNodes.push(
            <div key={`same-${i}`} className="font-mono text-[10.5px] text-zinc-500 py-0.5 px-3 whitespace-pre-wrap leading-relaxed select-text">
              &nbsp;&nbsp;{l1}
            </div>
          );
        }
      } else {
        if (l1 !== undefined && l1.trim() !== '') {
          diffNodes.push(
            <div key={`rem-${i}`} className="font-mono text-[10.5px] py-0.5 px-3 bg-rose-950/20 text-rose-400/90 border-l-2 border-rose-500/80 whitespace-pre-wrap leading-relaxed select-text">
              -&nbsp;{l1}
            </div>
          );
        }
        if (l2 !== undefined && l2.trim() !== '') {
          diffNodes.push(
            <div key={`add-${i}`} className="font-mono text-[10.5px] py-0.5 px-3 bg-emerald-950/20 text-emerald-400/90 border-l-2 border-emerald-500/80 whitespace-pre-wrap leading-relaxed select-text">
              +&nbsp;{l2}
            </div>
          );
        }
      }
    }

    return <div className="space-y-0.5 py-2 max-h-64 overflow-y-auto custom-scroll border border-zinc-850/60 rounded-xl bg-zinc-950/20">{diffNodes}</div>;
  };

  // Helper to get reviewer's mock role
  const getReviewerRole = (name: string) => {
    const roles: Record<string, string> = {
      'Paul Graham': 'Founder, YC & Essayist',
      'Morgan Housel': 'Author, Psychology of Money',
      'David Perell': 'Writing Coach & Essayist',
      'Shaan Puri': 'Host, My First Million',
      'Ali Abdaal': 'Content Creator & Author',
      'Alex Hormozi': 'Founder, Acquisition.com'
    };
    return roles[name] || 'Expert Reviewer';
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Control Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Polish draft</span>
          </h3>
          <p className="text-xs text-zinc-500 max-w-[65ch] leading-relaxed">
            Convenes 6 expert reviewer personas. Automatically edits, evaluates, and revision-loops the draft until it scores &ge; 9/10.
          </p>
        </div>

        <button
          onClick={handleReview}
          disabled={loading || (finalScore !== null && !revealFinished)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/95 disabled:opacity-40 text-white font-semibold text-xs transition-colors shadow-md shadow-primary/20 active:scale-95 whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          {loading ? (
            <>
              <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
              <span>Running loops...</span>
            </>
          ) : finalScore !== null && revealFinished ? (
            <>
              <span>Continue to posting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Convene Council & Revise</span>
            </>
          )}
        </button>
      </div>

      {/* Review Timeline & Progress Indicator */}
      {(loading || (iterations.length > 0 && !revealFinished)) && (
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 text-center space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            6 expert reviewers are reading your draft.
          </h4>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const active = visibleReviewerCount > idx;
              const current = visibleReviewerCount === idx;
              return (
                <div 
                  key={idx} 
                  className={clsx(
                    "h-1.5 w-10 rounded-full transition-all duration-300",
                    active ? "bg-primary" : current ? "bg-primary/50 animate-pulse" : "bg-zinc-800"
                  )}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Results Area */}
      {iterations.length > 0 && visibleReviewerCount > 0 && lastIteration && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-550">
          
          {/* Left Columns - Scores and Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Reviews Cards */}
            <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40">
              <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-4">
                Reviewer Evaluation Breakdown
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lastIteration.reviews.slice(0, visibleReviewerCount).map((rev) => (
                  <div 
                    key={rev.name} 
                    className="p-4 bg-zinc-950 border border-zinc-850/50 rounded-xl flex flex-col justify-between h-32 hover:border-zinc-800 transition-colors animate-in zoom-in-95 duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground truncate">{rev.name}</span>
                        <span className="text-[10px] font-bold text-primary">{rev.score}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{getReviewerRole(rev.name)}</span>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed italic">
                        "{rev.feedback}"
                      </p>
                    </div>
                  </div>
                ))}

                {/* Final Score Card */}
                {revealFinished && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col justify-between items-center text-center h-32 animate-in zoom-in-95 duration-300">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Average Score</span>
                    <div className="my-auto">
                      <span className="text-3xl font-black text-primary">{lastIteration.score.toFixed(1)}</span>
                      <span className="text-xs text-primary/60 font-bold"> / 10</span>
                    </div>
                    <span className="text-[8px] text-zinc-500 font-medium">Goal score reached (&ge; 9.0)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diffs & Fixes (Only when animation finishes) */}
            {revealFinished && (
              <>
                {/* Diff Viewer Card */}
                <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                      Here's what changed in revision {lastIteration.iteration}
                    </h4>
                    <span className="text-[9px] text-zinc-500 font-mono">Iteration 1 &rarr; {lastIteration.iteration}</span>
                  </div>
                  {renderDiff(firstIteration?.draft, lastIteration?.draft)}
                </div>

                {/* Auto revised lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Revisions made */}
                  <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-3">
                    <h4 className="font-bold text-[10px] text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                      <PenNib className="w-3.5 h-3.5 text-primary" />
                      <span>Auto-Revised Fixes</span>
                    </h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto custom-scroll text-[11px] text-zinc-400 pl-4 list-disc leading-relaxed">
                      {lastIteration.editorialFixes.length > 0 ? (
                        lastIteration.editorialFixes.map((fix, idx) => <li key={idx}>{fix}</li>)
                      ) : (
                        <li className="list-none text-zinc-500 italic pl-0">No automated editorial revisions made.</li>
                      )}
                    </ul>
                  </div>

                  {/* Info Gaps */}
                  <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-3">
                    <h4 className="font-bold text-[10px] text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                      <Warning className="w-3.5 h-3.5 text-amber-500" />
                      <span>Creator Gaps Detected</span>
                    </h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto custom-scroll text-[11px] text-zinc-400 pl-4 list-disc leading-relaxed">
                      {lastIteration.infoGaps.length > 0 ? (
                        lastIteration.infoGaps.map((gap, idx) => <li key={idx} className="text-amber-200/90">{gap}</li>)
                      ) : (
                        <li className="list-none text-emerald-500 italic pl-0">None. Draft is fully aligned with raw metrics.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Right Column - Revision History Timeline */}
          {revealFinished && (
            <div className="lg:col-span-1">
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 h-full flex flex-col min-h-[350px] shadow-lg">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-4 border-b border-zinc-850 pb-2 flex items-center gap-1.5">
                  <ClockCounterClockwise size={13} />
                  <span>Revision Loop History</span>
                </h4>

                <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1 max-h-[380px]">
                  {iterations.map((iter) => (
                    <div 
                      key={iter.iteration} 
                      className="p-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-xl space-y-2 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span>Iteration #{iter.iteration}</span>
                        <span className="text-primary font-bold">{iter.score.toFixed(1)}/10</span>
                      </div>
                      <p className="text-[9px] text-zinc-500">
                        Revisions: {iter.editorialFixes.length} | Gaps: {iter.infoGaps.length}
                      </p>
                      <div className="text-[10px] text-zinc-400 font-mono italic p-2 bg-zinc-950/60 border border-zinc-850 rounded-lg max-h-16 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                        {iter.draft}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {iterations.length === 0 && !loading && (
        <div className="glass-panel p-12 rounded-2xl border border-zinc-800 bg-zinc-950/40 text-center max-w-md mx-auto shadow-lg animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <ShieldCheck size={26} />
          </div>
          <h4 className="text-foreground font-bold mb-1 text-sm">Council Pending</h4>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Click "Convene Council & Revise" to trigger the background evaluator loops. Shaan Puri, Morgan Housel, David Perell, Paul Graham, Ali Abdaal, and Alex Hormozi will score and edit your first draft.
          </p>
        </div>
      )}
    </div>
  );
};
