import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, Idea } from '../lib/api';
import { ArrowRight, Plus, Sparkle, FolderOpen } from '@phosphor-icons/react';
import { clsx } from 'clsx';

export const HomeScreen: React.FC = () => {
  const { activeIdea, setActiveTab, addLog } = useApp();
  const [vaultCount, setVaultCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<{ totalLessons: number } | null>(null);

  useEffect(() => {
    // Fetch counts for dashboard stats
    api.getVault()
      .then((res) => {
        if (res.success) {
          setVaultCount(res.vault.length);
        }
      })
      .catch(() => {});

    api.getLearningLoopMetrics()
      .then((res) => {
        if (res.success) {
          setMetrics(res);
        }
      })
      .catch(() => {});
  }, [activeIdea]);

  const handleStartNew = async () => {
    addLog('info', 'Starting a new content pipeline run.');
    setActiveTab('oracle');
  };

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-16 px-4 md:px-6 select-none animate-in fade-in slide-in-from-bottom-6 duration-500 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* Left column: Welcome Editorial Headline & Action Buttons */}
        <div className="md:col-span-7 space-y-6 text-left">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Sparkle size={18} weight="fill" className="animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-tight font-medium leading-none">
              {activeIdea ? 'Ready to keep writing?' : 'Your automated thinking partner.'}
            </h2>
            <p className="text-sm text-body leading-relaxed max-w-md">
              {activeIdea 
                ? `You have an active, grounded pipeline run in progress: "${activeIdea.title}". Continue refining it or start something new.`
                : 'Turn your raw ideas, voice transcripts, and reference materials into publication-grade essays, posts, and threads.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {activeIdea ? (
              <>
                <button
                  onClick={() => setActiveTab('researcher')}
                  className="py-2.5 px-5 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/25 transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span>Continue "{activeIdea.title}"</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={handleStartNew}
                  className="py-2.5 px-5 rounded-md bg-canvas hover:bg-surface-soft text-ink font-semibold text-xs border border-hairline transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Start new idea</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStartNew}
                className="py-2.5 px-5 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/25 transition-all active:scale-[0.98] group cursor-pointer"
              >
                <span>Start with a new idea</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <button
              onClick={() => setActiveTab('vault')}
              className="py-2.5 px-5 rounded-md bg-transparent hover:bg-surface-soft/40 text-muted hover:text-ink font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer border border-transparent hover:border-hairline"
            >
              <FolderOpen size={14} />
              <span>Browse Vault ({vaultCount})</span>
            </button>
          </div>
        </div>

        {/* Right column: Premium Feature Card Mockup / Stat Container */}
        <div className="md:col-span-5">
          <div className="relative p-6 rounded-lg border border-hairline bg-surface-card text-ink space-y-6 shadow-sm overflow-hidden min-h-[250px] flex flex-col justify-between">
            {/* Soft decorative background tint */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-hairline/60">
                <span className="text-[10px] font-mono tracking-widest text-muted uppercase font-bold">Pipeline Status</span>
                <span className="flex items-center gap-1.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-[11px] font-mono font-bold text-muted uppercase">QUALIFIED IDEAS</h5>
                  <p className="text-2xl font-serif font-medium text-ink mt-0.5">{vaultCount}</p>
                </div>
                <div>
                  <h5 className="text-[11px] font-mono font-bold text-muted uppercase">STYLE RULES TAUGHT</h5>
                  <p className="text-2xl font-serif font-medium text-ink mt-0.5">{metrics?.totalLessons || 0}</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-muted-soft font-mono leading-relaxed border-t border-hairline/60 pt-4 flex justify-between items-center">
              <span>Status: Grounded Ready</span>
              <span>v1.0.0-alpha</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
