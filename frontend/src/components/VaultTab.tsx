import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { Plus, Check, Star, FolderOpen, X } from '@phosphor-icons/react';

interface VaultTabProps {
  activeIdea: Idea | null;
  onActiveIdeaChange: (idea: Idea) => void;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const VaultTab: React.FC<VaultTabProps> = ({
  activeIdea,
  onActiveIdeaChange,
  onLog,
  onNavigateToTab,
}) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSelectIdea = async (ideaId: string) => {
    onLog('info', 'Selecting active idea...');
    try {
      const res = await api.selectIdea(ideaId);
      if (res.success) {
        onActiveIdeaChange(res.selected);
        onLog('success', `Active pipeline idea selected: "${res.selected.title}"`);
        // Navigate to researcher step
        onNavigateToTab('researcher');
      }
    } catch (err: any) {
      onLog('error', `Failed to select idea: ${err.message || err}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    onLog('info', `Manually adding new content idea: "${title}"...`);

    try {
      const res = await api.addIdea(title, description, source);
      if (res.success) {
        onLog('success', 'New idea saved to Vault.');
        setIdeas(res.vault);
        // Reset form
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

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Qualified Content Ideas Vault</h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose a seed concept to execute or add a manual entry to trigger the creation pipeline.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors text-sm shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Idea</span>
        </button>
      </div>

      {loading && ideas.length === 0 ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-4">Loading your content vault...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center max-w-lg mx-auto border border-dashed border-gray-800">
          <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-white font-semibold text-base mb-1">Vault is Empty</h4>
          <p className="text-sm text-gray-500 mb-6">
            There are no qualified ideas in your database yet. Run the Oracle mining pass or add an idea manually.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors border border-gray-700"
          >
            Create New Seed Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea) => {
            const isSelected = activeIdea && activeIdea.id === idea.id;
            return (
              <div
                key={idea.id}
                className={`glass-panel p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                  isSelected
                    ? 'border-primary-500/50 shadow-lg shadow-primary-500/5 bg-primary-950/5'
                    : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/10'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-950 text-primary-300 border border-primary-800/40">
                      <Star className="w-3 h-3 fill-primary-300/20" />
                      <span>{idea.score.toFixed(1)}/10</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/40">
                      {idea.source}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white text-base leading-snug">{idea.title}</h4>
                    <p className="text-gray-400 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  {idea.rationale && (
                    <div className="p-3 bg-gray-950/50 border border-gray-900 rounded-lg">
                      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Oracle Rationale</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{idea.rationale}</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-900/60 flex justify-end">
                  <button
                    onClick={() => handleSelectIdea(idea.id)}
                    className={`py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20 pointer-events-none'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600 active:scale-95'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Runway</span>
                      </>
                    ) : (
                      <span>Select Concept</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border border-gray-800/80 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950/40">
              <h3 className="text-base font-bold text-white">Add New Seed Idea</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Concept Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stop Paraphrasing in AI Writing"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Description / Direct Context</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the core argument, target audience, and key spike trigger..."
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Source Reference (Optional)</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Sync notes with CEO, Slack channel conversation"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors text-xs disabled:opacity-50"
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
