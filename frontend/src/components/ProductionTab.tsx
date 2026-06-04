import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  FileArrowDown, 
  ArrowsClockwise, 
  Star, 
  Quotes, 
  ListNumbers, 
  Heart, 
  Warning, 
  ArrowRight,
  Plus
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface ExtractionData {
  emotionalPalette?: Array<{ emotion: string; moment: string; quote: string }>;
  numericInventory?: Array<{ value: string; context: string }>;
  quoteInventory?: string[];
}

export const ProductionTab: React.FC<{ activeIdea: Idea | null; onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void; onNavigateToTab: (tab: string) => void }> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const { setActiveTab, setStatus } = useApp();
  const [productionText, setProductionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [compiled, setCompiled] = useState(false);
  
  // Categorized extraction data
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());

  // Gaps manual inputs
  const [gap1, setGap1] = useState('');
  const [gap2, setGap2] = useState('');
  const [gap3, setGap3] = useState('');
  const [savingGaps, setSavingGaps] = useState(false);

  const loadData = async () => {
    try {
      const resProd = await api.getFile('production-raw.md');
      if (resProd.success && resProd.content.trim() !== '') {
        setProductionText(resProd.content);
        setCompiled(true);
      }
    } catch {
      // Ignore
    }

    try {
      const resExtract = await api.getFile('interview-extraction.json');
      if (resExtract.success && resExtract.content.trim() !== '') {
        setExtraction(JSON.parse(resExtract.content));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [activeIdea]);

  const handleCompile = async () => {
    setLoading(true);
    setStatus('working');
    onLog('info', 'Compiling production transcript to raw reference markdown...');

    try {
      const res = await api.compileProduction();
      if (res.success) {
        onLog('success', 'Production markdown successfully compiled & saved to production-raw.md.');
        setProductionText(res.productionRaw);
        setCompiled(true);
        loadData(); // Load extraction too
        setStatus('ready');
      }
    } catch (err: any) {
      onLog('error', `Production compilation failed: ${err.message || err}`);
      setProductionText(`### Compilation Error\n\n${err.message || err}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = (itemKey: string) => {
    const next = new Set(starredItems);
    if (next.has(itemKey)) {
      next.delete(itemKey);
    } else {
      next.add(itemKey);
    }
    setStarredItems(next);
  };

  const handleSaveGapsAndDraft = async () => {
    // Collect non-empty manual gaps inputs
    const gapsList = [gap1, gap2, gap3].filter(g => g.trim() !== '');
    if (gapsList.length > 0) {
      setSavingGaps(true);
      onLog('info', `Saving ${gapsList.length} manual details to draft inputs...`);
      try {
        // Save to reference style system or metadata files
        const currentData = extraction || {};
        const updated = {
          ...currentData,
          manualGaps: gapsList
        };
        await api.saveFile('interview-extraction.json', JSON.stringify(updated, null, 2));
        onLog('success', 'Manual details saved successfully.');
      } catch (err) {
        onLog('error', 'Failed to save manual gaps.');
      } finally {
        setSavingGaps(false);
      }
    }

    // Go to refinement tab
    setActiveTab('refinement');
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 font-sans">
      
      {/* 1. COMPILE SCREEN */}
      {!compiled && (
        <div className="p-8 rounded-lg border border-hairline bg-surface-card text-center space-y-6 max-w-sm mx-auto my-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <FileArrowDown size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-ink font-serif tracking-tight">Gather Material</h3>
            <p className="text-xs text-muted leading-relaxed">
              Compile your interview transcript into structured cards, cataloging quotes, metrics, and emotional anchors.
            </p>
          </div>
          <button
            onClick={handleCompile}
            disabled={loading}
            className="w-full py-3 px-6 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" /> : <FileArrowDown size={14} />}
            <span>Compile Raw File</span>
          </button>
        </div>
      )}

      {/* 2. CARDS DASHBOARD */}
      {compiled && extraction && (
        <div className="space-y-6 animate-in fade-in duration-400">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quotes Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-hairline pb-2 px-1 text-xs font-bold text-muted font-sans">
                <Quotes size={16} className="text-primary" />
                <span>Quotes</span>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scroll pr-1">
                {extraction.quoteInventory && extraction.quoteInventory.length > 0 ? (
                  extraction.quoteInventory.map((quote, idx) => {
                    const isStarred = starredItems.has(`q-${idx}`);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleStar(`q-${idx}`)}
                        className={clsx(
                          "p-3 rounded-lg border bg-surface-card text-left hover:border-primary/20 transition-all duration-200 cursor-pointer relative group text-ink",
                          isStarred ? "border-primary/45 shadow shadow-primary/5 bg-surface-cream-strong/20" : "border-hairline"
                        )}
                      >
                        <p className="text-[10.5px] leading-relaxed text-body select-text pr-5">
                          "{quote}"
                        </p>
                        <span className="absolute top-2.5 right-2.5 text-muted-soft group-hover:text-accent-amber transition-colors">
                          <Star size={12} weight={isStarred ? 'fill' : 'bold'} className={isStarred ? 'text-accent-amber' : ''} />
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[10px] text-muted italic">No quotes extracted.</div>
                )}
              </div>
            </div>

            {/* Numbers Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-hairline pb-2 px-1 text-xs font-bold text-muted font-sans">
                <ListNumbers size={16} className="text-accent-teal" />
                <span>Numbers & Metrics</span>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scroll pr-1">
                {extraction.numericInventory && extraction.numericInventory.length > 0 ? (
                  extraction.numericInventory.map((num, idx) => {
                    const isStarred = starredItems.has(`n-${idx}`);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleStar(`n-${idx}`)}
                        className={clsx(
                          "p-3 rounded-lg border bg-surface-card text-left hover:border-primary/20 transition-all duration-200 cursor-pointer relative group text-ink",
                          isStarred ? "border-primary/45 shadow shadow-primary/5 bg-surface-cream-strong/20" : "border-hairline"
                        )}
                      >
                        <p className="text-xs font-bold text-ink font-serif">
                          {num.value}
                        </p>
                        <p className="text-[10px] leading-normal text-muted mt-1 select-text pr-5">
                          {num.context}
                        </p>
                        <span className="absolute top-2.5 right-2.5 text-muted-soft group-hover:text-accent-amber transition-colors">
                          <Star size={12} weight={isStarred ? 'fill' : 'bold'} className={isStarred ? 'text-accent-amber' : ''} />
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[10px] text-muted italic">No metrics extracted.</div>
                )}
              </div>
            </div>

            {/* Emotional Moments Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-hairline pb-2 px-1 text-xs font-bold text-muted font-sans">
                <Heart size={16} className="text-rose-500" />
                <span>Emotional Moments</span>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scroll pr-1">
                {extraction.emotionalPalette && extraction.emotionalPalette.length > 0 ? (
                  extraction.emotionalPalette.map((em, idx) => {
                    const isStarred = starredItems.has(`e-${idx}`);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleStar(`e-${idx}`)}
                        className={clsx(
                          "p-3 rounded-lg border bg-surface-card text-left hover:border-primary/20 transition-all duration-200 cursor-pointer relative group text-ink",
                          isStarred ? "border-primary/45 shadow shadow-primary/5 bg-surface-cream-strong/20" : "border-hairline"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                            {em.emotion}
                          </span>
                        </div>
                        <p className="text-[10px] leading-normal text-body mt-2 select-text font-sans">
                          {em.moment}
                        </p>
                        <p className="text-[10px] leading-normal text-muted mt-1 select-text italic pr-5">
                          "{em.quote}"
                        </p>
                        <span className="absolute top-2.5 right-2.5 text-muted-soft group-hover:text-accent-amber transition-colors">
                          <Star size={12} weight={isStarred ? 'fill' : 'bold'} className={isStarred ? 'text-amber-500' : ''} />
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[10px] text-muted italic">No emotional spikes extracted.</div>
                )}
              </div>
            </div>
          </div>

          {/* Things We Couldn't Find (Manual details) */}
          <div className="p-5 rounded-lg border border-hairline bg-surface-card space-y-4 text-ink">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 font-serif tracking-tight">
              <Warning size={14} className="text-accent-amber" />
              <span>3 things we couldn't find</span>
            </h4>
            <p className="text-[10.5px] text-muted leading-normal max-w-xl">
              Add any missing figures, stories, or contexts manually. We will feed these directly into the Anchor Draft revision keys to fill in the gaps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={gap1}
                onChange={(e) => setGap1(e.target.value)}
                placeholder="Missing figure #1 (e.g. 24% signup growth)..."
                className="w-full bg-canvas border border-hairline focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md p-2.5 text-[10.5px] text-ink placeholder-muted/50 transition-colors outline-none"
              />
              <input
                type="text"
                value={gap2}
                onChange={(e) => setGap2(e.target.value)}
                placeholder="Missing context #2 (e.g. Alice disagreed)..."
                className="w-full bg-canvas border border-hairline focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md p-2.5 text-[10.5px] text-ink placeholder-muted/50 transition-colors outline-none"
              />
              <input
                type="text"
                value={gap3}
                onChange={(e) => setGap3(e.target.value)}
                placeholder="Missing story #3 (e.g. client meeting call)..."
                className="w-full bg-canvas border border-hairline focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md p-2.5 text-[10.5px] text-ink placeholder-muted/50 transition-colors outline-none"
              />
            </div>
          </div>

          {/* Action CTAs Footer */}
          <div className="flex items-center justify-between border-t border-hairline pt-5">
            <button
              onClick={handleCompile}
              className="py-2.5 px-4 rounded-md bg-canvas hover:bg-surface-soft border border-hairline text-muted hover:text-ink text-[10px] font-bold transition-colors cursor-pointer"
            >
              Recompile Material
            </button>

            <button
              onClick={handleSaveGapsAndDraft}
              disabled={savingGaps}
              className="py-2.5 px-6 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] group cursor-pointer"
            >
              <span>Looks good — let's draft</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
