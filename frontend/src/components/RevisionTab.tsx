import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle, 
  ArrowCounterClockwise, 
  FloppyDisk,
  FileText,
  FileCode,
  Sparkle,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface RevisionTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const RevisionTab: React.FC<RevisionTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const { setStatus } = useApp();
  const [aiDraft, setAiDraft] = useState('');
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);

  const loadDrafts = async () => {
    setLoading(true);
    setStatus('working');
    try {
      const resFirst = await api.getFile('draft-first.md');
      if (resFirst.success) {
        setAiDraft(resFirst.content);
      }

      const resCurrent = await api.getFile('draft-current.md');
      if (resCurrent.success && resCurrent.content.trim() !== '') {
        setDraftText(resCurrent.content);
        onLog('info', 'Polish workbench active. Current draft loaded.');
      } else if (resFirst.success) {
        setDraftText(resFirst.content);
      }
      setStatus('ready');
    } catch (err: any) {
      onLog('error', `Failed to load drafts: ${err.message}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [activeIdea]);

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    onLog('info', 'Saving working copy draft to pipeline server...');
    try {
      const res = await api.saveFile('draft-current.md', draftText);
      if (res.success) {
        onLog('success', 'Working copy draft saved successfully.');
      }
    } catch (err: any) {
      onLog('error', `Failed to save working draft: ${err.message}`);
    } finally {
      setDraftSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draftText.trim()) {
      onLog('warning', 'Draft editor cannot be empty.');
      return;
    }

    setSaving(true);
    setStatus('working');
    onLog('info', 'Approving content: triggering system learning feedback analyzer...');

    try {
      const res = await api.submitLearningLoop(draftText);
      if (res.success) {
        onLog('success', 'Sign-off complete. Content approved and style feedback saved.');
        setStatus('ready');
        onNavigateToTab('learning');
      }
    } catch (err: any) {
      onLog('error', `Sign-off analysis failed: ${err.message || err}`);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-zinc-800/40 pb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Final Revision & Sign-off</h3>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-[65ch]">
            Polish the copy to make it perfect. Saving changes triggers the AI loop to extract style rules from your manual edits.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadDrafts}
            disabled={loading || saving}
            className="flex items-center gap-1.5 py-2 px-3 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 rounded-xl text-xs font-semibold text-zinc-400 hover:text-foreground transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <ArrowCounterClockwise size={13} />
            <span>Reset Draft</span>
          </button>
          
          <button
            onClick={handleSaveDraft}
            disabled={draftSaving || saving || loading}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-zinc-800 hover:border-zinc-750 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-foreground font-semibold text-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {draftSaving ? (
              <ArrowsClockwise size={13} className="animate-spin text-zinc-500" />
            ) : (
              <FloppyDisk size={13} />
            )}
            <span>Save as Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={saving || loading || !draftText.trim()}
            className="flex items-center gap-1.5 py-2 px-5 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 shrink-0 cursor-pointer"
          >
            {saving ? (
              <>
                <ArrowsClockwise size={13} className="animate-spin text-white" />
                <span>Running Learning Loop...</span>
              </>
            ) : (
              <>
                <CheckCircle size={13} />
                <span>Save & Publish (Sign-Off)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[460px]">
        
        {/* Left Side: Original Draft (Read only) */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/30 flex flex-col h-full shadow-lg">
          <div className="p-4 border-b border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Original AI Draft</span>
            </div>
            <span className="text-[9px] text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">Read-Only</span>
          </div>

          <div className="p-5 flex-1 overflow-y-auto custom-scroll bg-zinc-950/10 max-h-[380px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <ArrowsClockwise size={24} className="text-zinc-500 animate-spin" />
              </div>
            ) : aiDraft ? (
              <div className="text-xs text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap select-text max-w-[65ch]">
                {aiDraft}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic text-center py-20">Original draft not found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Your Draft (Editable Textarea) */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/40 flex flex-col h-full shadow-lg">
          <div className="p-4 border-b border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Your Final Polish</span>
            </div>
            <span className="text-[9px] text-primary/75 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">Interactive Editor</span>
          </div>

          <div className="flex-1 bg-zinc-950/10 max-h-[380px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/30">
                <ArrowsClockwise size={24} className="text-zinc-500 animate-spin" />
              </div>
            ) : null}
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={saving || loading}
              placeholder="Polishing editor window. Double click lines to rewrite or draft freely..."
              className="w-full h-full bg-transparent border-0 outline-none p-5 text-xs text-zinc-300 font-sans leading-relaxed select-text resize-none placeholder-zinc-700"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
