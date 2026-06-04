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
    <div className="max-w-2xl mx-auto py-12 px-4 select-none animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* Welcome Card */}
      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 bg-zinc-950/40 text-center space-y-6 shadow-xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-2">
            <Sparkle size={20} weight="fill" className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {activeIdea ? 'Ready to keep going?' : 'Welcome to Content Machine'}
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            {activeIdea 
              ? "You've got an in-progress pipeline run. Continue writing or start something fresh."
              : "We'll walk you through turning raw notes and chats into high-impact publication drafts."}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto pt-2 relative">
          {activeIdea ? (
            <>
              {/* Primary Continue Button */}
              <button
                onClick={() => setActiveTab('researcher')} // Start with Step 3 since Step 1 & 2 are done
                className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group cursor-pointer"
              >
                <span>Continue "{activeIdea.title}"</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Secondary Start New Button */}
              <button
                onClick={handleStartNew}
                className="w-full py-3 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 font-semibold text-xs border border-zinc-850 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Start a new idea</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary Start New Button */}
              <button
                onClick={handleStartNew}
                className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group cursor-pointer"
              >
                <span>Start with a new idea</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          {/* Tertiary Vault Button */}
          <button
            onClick={() => setActiveTab('vault')}
            className="w-full py-3 px-6 rounded-xl bg-transparent hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-400 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-zinc-900"
          >
            <FolderOpen size={14} />
            <span>Browse Vault ({vaultCount} Ideas)</span>
          </button>
        </div>

        {/* Nudge Info Line */}
        {vaultCount > 0 && (
          <div className="pt-4 border-t border-zinc-900/60 flex items-center justify-center gap-4 text-[10px] text-zinc-500 font-mono tracking-wide relative">
            <div>
              <span className="font-semibold text-zinc-400">{vaultCount}</span> Qualified Ideas
            </div>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <div>
              <span className="font-semibold text-zinc-400">{metrics?.totalLessons || 0}</span> Style Rules Learned
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
