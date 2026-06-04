import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { useApp } from '../context/AppContext';
import { Plus, Check, Star, FolderOpen, X, CaretDown, CaretUp, ArrowRight, Chats, ArrowsClockwise } from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface VaultTabProps {
  activeIdea: Idea | null;
  onActiveIdeaChange: (idea: Idea | null) => void;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const VaultTab: React.FC<VaultTabProps> = ({
  activeIdea,
  onActiveIdeaChange,
  onLog,
  onNavigateToTab,
}) => {
  const { setStatus } = useApp();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'newest' | 'manual'>('recommended');
  const [expandedRationaleId, setExpandedRationaleId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');

  const loadVault = async () => {
    setLoading(true);
    try {
      const res = await api.getVault();
      if (res.success) {
        setIdeas(res.vault);
      }
    } catch (err: any) {
      onLog('error', `Failed to load Vault: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVault();
  }, [activeIdea]);

  const handleSelectIdea = async (idea: Idea) => {
    setStatus('working');
    onLog('info', `Selecting active runway concept: "${idea.title}"...`);
    try {
      const res = await api.selectIdea(idea.id);
      if (res.success) {
        onActiveIdeaChange(res.selected);
        onLog('success', `Active pipeline idea selected: "${res.selected.title}"`);
        setStatus('ready');
        onNavigateToTab('researcher');
      }
    } catch (err: any) {
      onLog('error', `Failed to select idea: ${err.message || err}`);
      setStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    onLog('info', `Manually adding new content idea: "${title}"...`);

    try {
      const res = await api.addIdea(title, description, source || 'Manually added');
      if (res.success) {
        onLog('success', 'New idea saved to Vault.');
        setIdeas(res.vault);
        setTitle('');
        setDescription('');
        setSource('');
        setModalOpen(false);
      }
    } catch (err: any) {
      onLog('error', `Failed to save idea: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStrengthConfig = (score: number) => {
    if (score >= 7.5) {
      return { label: 'Strong fit', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    } else if (score >= 5.0) {
      return { label: 'Possible', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    } else {
      return { label: 'Stretch', className: 'bg-zinc-800 text-zinc-400 border-zinc-750' };
    }
  };

  const getProcessedIdeas = () => {
    let result = [...ideas];
    
    if (sortBy === 'manual') {
      result = result.filter(i => i.source === 'Manually added');
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Recommended: sort by score descending
      result.sort((a, b) => b.score - a.score);
    }
    
    return result;
  };

  const sortedIdeas = getProcessedIdeas();

  return (
    <div className="space-y-6 relative select-none">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-4">
        {/* Sorting selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-zinc-300 outline-none cursor-pointer transition-colors"
          >
            <option value="recommended">AI Recommendation</option>
            <option value="newest">Newest First</option>
            <option value="manual">Manually Added</option>
          </select>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs transition-colors active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add idea manually</span>
        </button>
      </div>

      {loading && ideas.length === 0 ? (
        <div className="text-center py-16 animate-in fade-in duration-300">
          <ArrowsClockwise size={28} className="animate-spin text-primary mx-auto" />
          <p className="text-xs text-zinc-500 mt-4">Loading your vault database...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center max-w-sm mx-auto border border-zinc-850 bg-zinc-950/20 space-y-6 animate-in fade-in duration-300">
          <FolderOpen size={36} className="text-zinc-650 mx-auto" />
          <div className="space-y-2">
            <h4 className="text-foreground font-semibold text-sm">Nothing here yet</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Nothing here yet. Run a scan to find some, or add one yourself.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-semibold text-xs transition-colors border border-zinc-800"
          >
            Add idea manually
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedIdeas.map((idea, index) => {
            const isSelected = activeIdea && activeIdea.id === idea.id;
            const isTopRecommended = sortBy === 'recommended' && index === 0;
            const strength = getStrengthConfig(idea.score);
            const isRationaleExpanded = expandedRationaleId === idea.id;

            return (
              <div
                key={idea.id}
                className={clsx(
                  "p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden bg-zinc-950/40",
                  isSelected
                    ? 'border-primary shadow-lg shadow-primary/5'
                    : 'border-zinc-850 hover:border-zinc-800'
                )}
              >
                {/* suggested-for-you decoration badge (Von Restorff effect) */}
                {isTopRecommended && (
                  <div className="absolute top-0 right-0 bg-primary text-[8px] font-mono tracking-widest text-white px-2 py-0.5 rounded-bl-lg uppercase">
                    Suggested
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      title={`Oracle Score: ${idea.score.toFixed(1)}/10`}
                      className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 cursor-help"
                    >
                      <Star size={10} weight="fill" />
                      <span>{idea.score.toFixed(1)}</span>
                    </span>
                    <span className={clsx("text-[9px] px-2 py-0.5 rounded-full border", strength.className)}>
                      {strength.label}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-850">
                      {idea.source}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground text-xs leading-snug">{idea.title}</h4>
                    <p className="text-zinc-400 text-[10.5px] mt-1.5 line-clamp-3 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  {idea.rationale && (
                    <div className="pt-2">
                      <button
                        onClick={() => setExpandedRationaleId(isRationaleExpanded ? null : idea.id)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Chats size={11} />
                        <span>{isRationaleExpanded ? 'Hide Oracle Rationale' : 'Show Oracle Rationale'}</span>
                        {isRationaleExpanded ? <CaretUp size={10} /> : <CaretDown size={10} />}
                      </button>
                      {isRationaleExpanded && (
                        <div className="mt-2 p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">{idea.rationale}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900/60 flex justify-end">
                  <button
                    onClick={() => handleSelectIdea(idea)}
                    className={clsx(
                      "py-1.5 px-4 rounded-xl text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer",
                      isSelected
                        ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none'
                        : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 hover:border-zinc-750 active:scale-95'
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check size={12} className="font-bold" />
                        <span>Active runway</span>
                      </>
                    ) : (
                      <>
                        <span>Use this idea</span>
                        <ArrowRight size={10} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Input Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 animate-in fade-in zoom-in-95 duration-200 bg-zinc-950">
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-900/20">
              <h3 className="text-sm font-bold text-foreground">Add New Concept</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Concept Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stop Paraphrasing in AI Writing"
                  className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-2.5 text-xs text-foreground placeholder-zinc-700 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Description / Direct Context</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the core argument, target audience, and key spike trigger..."
                  className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-2.5 text-xs text-foreground placeholder-zinc-700 transition-all outline-none resize-none custom-scroll leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Source Reference (Optional)</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Sync notes with CEO, Slack channel conversation"
                  className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-2.5 text-xs text-foreground placeholder-zinc-700 transition-all outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-semibold text-xs border border-zinc-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold transition-colors text-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Idea to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
