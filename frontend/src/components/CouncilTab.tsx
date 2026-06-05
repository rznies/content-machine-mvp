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
import { OracleScanner } from './OracleScanner';

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
            <div key={`same-${i}`} className="font-mono text-[10.5px] text-muted py-0.5 px-3 whitespace-pre-wrap leading-relaxed select-text">
              &nbsp;&nbsp;{l1}
            </div>
          );
        }
      } else {
        if (l1 !== undefined && l1.trim() !== '') {
          diffNodes.push(
            <div key={`rem-${i}`} className="font-mono text-[10.5px] py-0.5 px-3 bg-error/10 text-error border-l-2 border-error whitespace-pre-wrap leading-relaxed select-text">
              -&nbsp;{l1}
            </div>
          );
        }
        if (l2 !== undefined && l2.trim() !== '') {
          diffNodes.push(
            <div key={`add-${i}`} className="font-mono text-[10.5px] py-0.5 px-3 bg-success/10 text-success border-l-2 border-success whitespace-pre-wrap leading-relaxed select-text">
              +&nbsp;{l2}
            </div>
          );
        }
      }
    }

    return <div className="space-y-0.5 py-2 max-h-64 overflow-y-auto custom-scroll border border-hairline rounded-lg bg-surface-soft/40">{diffNodes}</div>;
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

  const consensusMetrics = lastIteration && lastIteration.reviews ? (() => {
    const reviews = lastIteration.reviews;
    const approvedCount = reviews.filter(r => r.score >= 8.0).length;
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    let agreement = 'Low';
    if (avgScore >= 8.5) agreement = 'High';
    else if (avgScore >= 7.0) agreement = 'Moderate';
    
    return {
      approvedCount,
      totalCount: reviews.length,
      agreement,
      avgScore
    };
  })() : null;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 font-sans">
      
      {/* Control Banner */}
      <div className="p-6 rounded-lg border border-hairline bg-surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-ink">
        <div className="space-y-1">
          <h3 className="text-sm font-bold font-serif text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Polish draft</span>
          </h3>
          <p className="text-xs text-body max-w-[65ch] leading-relaxed">
            Convenes 6 expert reviewer personas. Automatically edits, evaluates, and revision-loops the draft until it scores &ge; 9/10.
          </p>
        </div>

        <button
          onClick={handleReview}
          disabled={loading || (finalScore !== null && !revealFinished)}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-primary hover:bg-primary-active disabled:opacity-40 text-on-primary font-semibold text-xs transition-colors shadow-md shadow-primary/20 active:scale-95 whitespace-nowrap self-start md:self-auto cursor-pointer"
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
        <div className="p-6 rounded-lg border border-hairline bg-surface-card text-center space-y-4 text-ink shadow-sm flex flex-col items-center justify-center">
          {loading ? (
            <OracleScanner size={48} className="mx-auto" />
          ) : (
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const active = visibleReviewerCount > idx;
                const current = visibleReviewerCount === idx;
                return (
                  <div 
                    key={idx} 
                    className={clsx(
                      "h-1.5 w-10 rounded-full transition-all duration-300",
                      active ? "bg-primary" : current ? "bg-primary/50 animate-pulse" : "bg-hairline"
                    )}
                  />
                );
              })}
            </div>
          )}
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
            {loading ? "Convening the Writer's Council & revising draft..." : "6 expert reviewers are reading your draft."}
          </h4>
        </div>
      )}

      {/* Results Area */}
      {iterations.length > 0 && visibleReviewerCount > 0 && lastIteration && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          
          {/* Left Columns - Scores and Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Reviews Cards */}
            <div className="p-5 rounded-lg border border-hairline bg-surface-card text-ink shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline/60 pb-3 mb-4">
                <h4 className="font-mono font-bold text-muted text-[10px] uppercase tracking-wider">
                  Reviewer Evaluation Breakdown
                </h4>
                {revealFinished && consensusMetrics && (
                  <div className="flex items-center gap-2 font-mono text-[9px]">
                    <span className="px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary font-bold">
                      Approval: {consensusMetrics.approvedCount} / {consensusMetrics.totalCount} Approved
                    </span>
                    <span className={clsx(
                      "px-2 py-0.5 rounded border font-bold",
                      consensusMetrics.agreement === 'High' && "border-success/20 bg-success/5 text-success",
                      consensusMetrics.agreement === 'Moderate' && "border-accent-amber/20 bg-accent-amber/5 text-accent-amber",
                      consensusMetrics.agreement === 'Low' && "border-error/20 bg-error/5 text-error"
                    )}>
                      Agreement: {consensusMetrics.agreement}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lastIteration.reviews.slice(0, visibleReviewerCount).map((rev) => (
                  <div 
                    key={rev.name} 
                    className="p-4 bg-background border border-hairline/60 rounded-md flex flex-col justify-between h-32 hover:border-hairline transition-colors animate-in zoom-in-95 duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink truncate">{rev.name}</span>
                        <span className="text-[11px] font-mono font-bold text-primary">{rev.score}</span>
                      </div>
                      <span className="text-[9px] text-muted font-mono block mt-0.5">{getReviewerRole(rev.name)}</span>
                      <p className="text-[10px] text-body line-clamp-2 mt-2 leading-relaxed italic">
                        "{rev.feedback}"
                      </p>
                    </div>
                  </div>
                ))}

                {/* Final Score Card */}
                {revealFinished && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-md flex flex-col justify-between items-center text-center h-32 animate-in zoom-in-95 duration-300">
                    <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-wider">Average Score</span>
                    <div className="my-auto">
                      <span className="text-3xl font-serif font-black text-primary">{lastIteration.score.toFixed(1)}</span>
                      <span className="text-xs text-primary/60 font-bold"> / 10</span>
                    </div>
                    <span className="text-[8px] text-muted font-medium">Goal score reached (&ge; 9.0)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revisions & Fixes (Only when animation finishes) */}
            {revealFinished && (
              <>
                {/* Diff Viewer Card */}
                <div className="p-5 rounded-lg border border-hairline bg-surface-card text-ink shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-medium text-ink text-sm">
                      Here's what changed in revision {lastIteration.iteration}
                    </h4>
                    <span className="text-[9px] text-muted font-mono">Iteration 1 &rarr; {lastIteration.iteration}</span>
                  </div>
                  {renderDiff(firstIteration?.draft, lastIteration?.draft)}
                </div>

                {/* Auto revised lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Revisions made */}
                  <div className="p-5 rounded-lg border border-hairline bg-surface-card text-ink shadow-sm space-y-3">
                    <h4 className="font-bold text-[10px] text-ink uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-hairline/60 pb-2">
                      <PenNib className="w-3.5 h-3.5 text-primary" />
                      <span>Auto-Revised Fixes</span>
                    </h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto custom-scroll text-[11px] text-body pl-4 list-disc leading-relaxed">
                      {lastIteration.editorialFixes.length > 0 ? (
                        lastIteration.editorialFixes.map((fix, idx) => <li key={idx}>{fix}</li>)
                      ) : (
                        <li className="list-none text-muted italic pl-0">No automated editorial revisions made.</li>
                      )}
                    </ul>
                  </div>

                  {/* Info Gaps */}
                  <div className="p-5 rounded-lg border border-hairline bg-surface-card text-ink shadow-sm space-y-3">
                    <h4 className="font-bold text-[10px] text-ink uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-hairline/60 pb-2">
                      <Warning className="w-3.5 h-3.5 text-accent-amber" />
                      <span>Creator Gaps Detected</span>
                    </h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto custom-scroll text-[11px] text-body pl-4 list-disc leading-relaxed">
                      {lastIteration.infoGaps.length > 0 ? (
                        lastIteration.infoGaps.map((gap, idx) => <li key={idx} className="text-primary">{gap}</li>)
                      ) : (
                        <li className="list-none text-success italic pl-0">None. Draft is fully aligned with raw metrics.</li>
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
              <div className="p-5 rounded-lg border border-hairline bg-surface-card text-ink h-full flex flex-col min-h-[350px] shadow-sm">
                <h4 className="font-bold text-ink text-[10px] uppercase font-mono tracking-wider mb-4 border-b border-hairline/60 pb-2 flex items-center gap-1.5">
                  <ClockCounterClockwise size={13} />
                  <span>Revision Loop History</span>
                </h4>

                <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1 max-h-[380px]">
                  {iterations.map((iter) => (
                    <div 
                      key={iter.iteration} 
                      className="p-3 bg-background border border-hairline/60 hover:border-hairline rounded-md space-y-2 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-ink">
                        <span>Iteration #{iter.iteration}</span>
                        <span className="text-primary font-mono font-bold">{iter.score.toFixed(1)}/10</span>
                      </div>
                      <p className="text-[9px] text-muted">
                        Revisions: {iter.editorialFixes.length} | Gaps: {iter.infoGaps.length}
                      </p>
                      <div className="text-[10px] text-body font-mono italic p-2 bg-surface-soft/40 border border-hairline/60 rounded-md max-h-16 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed font-sans">
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
        <div className="p-12 rounded-lg border border-hairline bg-surface-card text-ink text-center max-w-md mx-auto shadow-sm animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-lg bg-surface-soft border border-hairline flex items-center justify-center mx-auto mb-4 text-muted">
            <ShieldCheck size={26} />
          </div>
          <h4 className="text-ink font-serif font-bold mb-1 text-base">Council Pending</h4>
          <p className="text-xs text-body leading-relaxed max-w-xs mx-auto">
            Click "Convene Council & Revise" to trigger the background evaluator loops. Shaan Puri, Morgan Housel, David Perell, Paul Graham, Ali Abdaal, and Alex Hormozi will score and edit your first draft.
          </p>
        </div>
      )}
    </div>
  );
};
