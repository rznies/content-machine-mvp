import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { PencilSimple, ArrowsClockwise, FileText } from '@phosphor-icons/react';

interface RefinementTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const RefinementTab: React.FC<RefinementTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const [contentType, setContentType] = useState('LinkedIn Post');
  const [styleGuide, setStyleGuide] = useState('Loading style guide instructions...');
  const [lessons, setLessons] = useState('No lessons logged yet. Future loops will populate this.');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const resStyle = await api.getFile('style-guide.md');
      if (resStyle.success) {
        setStyleGuide(resStyle.content || 'Style guide is currently empty.');
      }
    } catch {
      // Ignore
    }

    try {
      const resLessons = await api.getFile('content-lessons.md');
      if (resLessons.success && resLessons.content.trim() !== '') {
        setLessons(resLessons.content);
      }
    } catch {
      // Ignore
    }

    try {
      const resDraft = await api.getFile('draft-current.md');
      if (resDraft.success && resDraft.content.trim() !== '') {
        setDraft(resDraft.content);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [activeIdea]);

  const handleDraft = async () => {
    setLoading(true);
    setDraft('');
    onLog('info', `Drafting first version of "${contentType}" using style guide and past lessons...`);

    try {
      const res = await api.draftFirstVersion(contentType);
      if (res.success) {
        onLog('success', 'First draft created. Saved to draft-first.md.');
        setDraft(res.draft);
        setTimeout(() => {
          onNavigateToTab('council');
        }, 1500);
      }
    } catch (err: any) {
      onLog('error', `Drafting failed: ${err.message || err}`);
      setDraft(`Error generating draft:\n\n${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-1 space-y-5">
        <div className="glass-panel p-5 rounded-xl border border-gray-800 space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Refinement Blueprint</h3>
            <p className="text-xs text-gray-500 mt-1">Select channel targets and guides</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Target Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-gray-950/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer transition-all"
            >
              <option value="LinkedIn Post">LinkedIn Post (Text, messaging style)</option>
              <option value="X Thread">X / Twitter Thread (5-7 tweets)</option>
              <option value="Long Essay">Long Form Essay (Detailed layout)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Active Style Guide Instructions</label>
            <div className="p-3 bg-gray-950/60 border border-gray-850 rounded-lg text-[10.5px] text-gray-400 font-mono max-h-40 overflow-y-auto leading-relaxed custom-scroll whitespace-pre-wrap">
              {styleGuide}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Past Corrective Memory (Lessons)</label>
            <div className="p-3 bg-gray-950/60 border border-gray-850 rounded-lg text-[10.5px] text-gray-400 font-mono max-h-40 overflow-y-auto leading-relaxed custom-scroll whitespace-pre-wrap">
              {lessons}
            </div>
          </div>

          <button
            onClick={handleDraft}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-primary-500/10 mt-2"
          >
            {loading ? (
              <>
                <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                <span>Drafting content...</span>
              </>
            ) : (
              <>
                <PencilSimple className="w-3.5 h-3.5" />
                <span>Draft First Version</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Draft Column */}
      <div className="lg:col-span-2">
        <div className="glass-panel rounded-xl overflow-hidden border border-gray-800 flex flex-col h-full min-h-[480px]">
          <div className="p-4 border-b border-gray-850 bg-gray-950/30 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Refinement Draft Viewer</h3>
          </div>

          <div className="p-6 flex-1 bg-gray-950/15 overflow-y-auto custom-scroll max-h-[500px]">
            {draft ? (
              <pre className="text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-wrap select-text">
                {draft}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-xs text-gray-500 italic max-w-xs">
                  Blueprint compiled draft pending. Click "Draft First Version" to combine templates and build the first iteration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
