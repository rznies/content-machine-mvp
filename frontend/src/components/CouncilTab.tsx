import React, { useState } from 'react';
import { api, Idea, Iteration } from '../lib/api';
import { ShieldCheck, ArrowsClockwise, Warning, PenNib } from '@phosphor-icons/react';

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
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    // Get target type from style state or select element
    // For convenience we fetch target content type from local storage or default it
    const refineSelect = document.getElementById('refine-content-type') as HTMLSelectElement | null;
    const contentType = refineSelect?.value || 'LinkedIn Post';

    setLoading(true);
    setIterations([]);
    setFinalScore(null);
    onLog('info', 'Convening 6 expert reviewers to score and revise draft in background...');

    try {
      const res = await api.conveneCouncil(contentType);
      if (res.success) {
        setFinalScore(res.finalScore);
        setIterations(res.iterations);
        onLog('success', `Revision loop finished! Final Council Score: ${res.finalScore.toFixed(1)}/10 after ${res.iterationsCount} iterations.`);
        
        // Auto navigate to repurpose after 2.5 seconds
        setTimeout(() => {
          onNavigateToTab('repurpose');
        }, 2500);
      }
    } catch (err: any) {
      onLog('error', `Writer's Council process failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const lastIteration = iterations[iterations.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="glass-panel p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-400" />
            <span>Writer's Council & Revision Loop</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Convenes 6 expert reviewer personas. Automatically edits, evaluates, and revision-loops the draft until it scores &ge; 9/10.
          </p>
        </div>

        <button
          onClick={handleReview}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium text-sm transition-colors shadow-md active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          {loading ? (
            <>
              <ArrowsClockwise className="w-4 h-4 animate-spin" />
              <span>Running Loop...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Convene Council & Revise</span>
            </>
          )}
        </button>
      </div>

      {iterations.length > 0 && lastIteration && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Main Feedback area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reviews Score Grid */}
            <div className="glass-panel p-5 rounded-xl border border-gray-800">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Council Feedback (Final Pass)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lastIteration.reviews.map((rev) => (
                  <div key={rev.name} className="p-3 bg-gray-950/40 border border-gray-900 rounded-lg flex flex-col justify-between">
                    <div>
                      <h5 className="font-semibold text-xs text-white truncate">{rev.name}</h5>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-snug" title={rev.feedback}>
                        "{rev.feedback}"
                      </p>
                    </div>
                    <div className="text-right mt-3">
                      <span className="text-sm font-extrabold text-primary-400">{rev.score}</span>
                      <span className="text-[10px] text-gray-600">/10</span>
                    </div>
                  </div>
                ))}

                {/* Average Score */}
                <div className="p-3 bg-primary-950/10 border border-primary-900/40 rounded-lg flex flex-col justify-between items-center text-center">
                  <h5 className="font-bold text-xs text-primary-300">Avg Score</h5>
                  <div className="my-1">
                    <span className="text-2xl font-extrabold text-primary-400">{lastIteration.score.toFixed(1)}</span>
                    <span className="text-xs text-primary-600 font-bold">/10</span>
                  </div>
                  <span className="text-[9px] text-primary-500 font-semibold tracking-wide uppercase">Target: 9.0+</span>
                </div>
              </div>
            </div>

            {/* Split Fixes and Gaps layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Editorial Fixes */}
              <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PenNib className="w-3.5 h-3.5 text-primary-400" />
                  <span>Auto-Revised Fixes</span>
                </h4>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scroll text-xs text-gray-400 pl-4 list-disc leading-relaxed">
                  {lastIteration.editorialFixes.length > 0 ? (
                    lastIteration.editorialFixes.map((fix, idx) => <li key={idx}>{fix}</li>)
                  ) : (
                    <li className="list-none text-gray-600 italic pl-0">No automated editorial revisions made.</li>
                  )}
                </ul>
              </div>

              {/* Info Gaps */}
              <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Warning className="w-3.5 h-3.5 text-amber-500" />
                  <span>Creator Gaps Detected</span>
                </h4>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scroll text-xs text-gray-400 pl-4 list-disc leading-relaxed">
                  {lastIteration.infoGaps.length > 0 ? (
                    lastIteration.infoGaps.map((gap, idx) => <li key={idx} className="text-amber-200/90">{gap}</li>)
                  ) : (
                    <li className="list-none text-emerald-400 italic pl-0">None. Draft is fully aligned with raw metrics.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-5 rounded-xl border border-gray-800 h-full flex flex-col min-h-[350px]">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 border-b border-gray-850 pb-2">
                Revision Loop History
              </h4>

              <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1 max-h-[360px]">
                {iterations.map((iter) => (
                  <div key={iter.iteration} className="p-3 bg-gray-950/40 border border-gray-900 hover:border-gray-850 rounded-lg space-y-2 transition-all">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>Iteration #{iter.iteration}</span>
                      <span className="text-primary-400 font-bold">{iter.score.toFixed(1)}/10</span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Applied Fixes: {iter.editorialFixes.length} | Gaps: {iter.infoGaps.length}
                    </p>
                    <div className="text-[10px] text-gray-400 font-mono italic p-2 bg-gray-950/60 border border-gray-900 rounded max-h-16 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                      {iter.draft}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {iterations.length === 0 && !loading && (
        <div className="glass-panel p-12 rounded-xl border border-gray-800 text-center max-w-md mx-auto">
          <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-1 text-sm">Council Pending</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Click "Convene Council & Revise" to trigger the background evaluator loops. Shaan Puri, Morgan Housel, David Perell, Paul Graham, Ali Abdaal, and Alex Hormozi will score and edit your first draft draft.
          </p>
        </div>
      )}
    </div>
  );
};
