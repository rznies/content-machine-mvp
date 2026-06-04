import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { CheckCircle, ArrowCounterClockwise } from '@phosphor-icons/react';

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
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDraft = async () => {
    setLoading(true);
    try {
      const res = await api.getFile('draft-current.md');
      if (res.success && res.content.trim() !== '') {
        setDraftText(res.content);
        onLog('info', 'Current draft loaded into editor.');
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, [activeIdea]);

  const handleApprove = async () => {
    if (!draftText.trim()) {
      alert('Editor cannot be empty.');
      return;
    }

    setSaving(true);
    onLog('info', 'Creator approved draft. Compiling edits & extracting lessons...');

    try {
      const res = await api.submitLearningLoop(draftText);
      if (res.success) {
        onLog('success', 'Learning Loop complete! Lessons saved to content-lessons.md.');
        setTimeout(() => {
          onNavigateToTab('learning');
        }, 1500);
      }
    } catch (err: any) {
      onLog('error', `Learning loop analysis failed: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[520px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-white">Final Revision & Sign-off</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Review layout details, fix specific items, and add personal reflections before final sign-off.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadDraft}
            disabled={loading || saving}
            className="flex items-center gap-1 py-1.5 px-3 border border-gray-800 hover:border-gray-700 bg-gray-900/60 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all active:scale-95 disabled:opacity-40"
          >
            <ArrowCounterClockwise className="w-3.5 h-3.5" />
            <span>Load Current Draft</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={saving || !draftText.trim()}
            className="flex items-center gap-1 py-1.5 px-4.5 bg-primary-650 hover:bg-primary-750 text-white font-semibold text-xs rounded-lg transition-colors active:scale-95 shadow-md disabled:opacity-40 bg-primary-600 hover:bg-primary-750 shrink-0"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Triggering Learning Loop...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve & Save (Sign-Off)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] border border-gray-800 rounded-xl overflow-hidden bg-gray-950/20 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/45">
            <svg className="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : null}
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          disabled={saving}
          placeholder="Draft editor window. Manually edit details here..."
          className="w-full h-full bg-transparent border-0 outline-none p-5 text-sm text-gray-300 font-sans leading-relaxed select-text resize-none placeholder-gray-700"
        />
      </div>
    </div>
  );
};
