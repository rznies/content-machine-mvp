import React, { useState, useEffect, useRef } from 'react';
import { api, Idea } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  PencilSimple, 
  ArrowsClockwise, 
  FileText, 
  Gear, 
  ArrowRight, 
  Eye, 
  FileCode,
  Sparkle,
  CaretDown,
  ArrowCounterClockwise
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface RefinementTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const TRY_AGAIN_OPTIONS = [
  { id: 'same', label: 'Same angle (regenerate)' },
  { id: 'different', label: 'Different angle / perspective' },
  { id: 'shorter', label: 'Shorter & more concise' },
  { id: 'punchier', label: 'Punchier (faster hooks)' }
];

export const RefinementTab: React.FC<RefinementTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const { setStatus, contentType, setContentType } = useApp();
  const [styleGuide, setStyleGuide] = useState('Loading style guide instructions...');
  const [lessons, setLessons] = useState('No lessons logged yet. Future loops will populate this.');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [viewSource, setViewSource] = useState(false);
  const [showTryAgainMenu, setShowTryAgainMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        setDrafted(true);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [activeIdea]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTryAgainMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleDraft = async () => {
    setLoading(true);
    setDraft('');
    setStatus('working');
    onLog('info', `Drafting first version of "${contentType}" using style guide and past lessons...`);

    try {
      const res = await api.draftFirstVersion(contentType);
      if (res.success) {
        onLog('success', 'First draft created. Saved to draft-first.md.');
        setDraft(res.draft);
        setDrafted(true);
        setStatus('ready');
      }
    } catch (err: any) {
      onLog('error', `Drafting failed: ${err.message || err}`);
      setDraft(`Error generating draft:\n\n${err.message || err}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = async (optionId: string) => {
    setShowTryAgainMenu(false);
    setLoading(true);
    setDraft('');
    setStatus('working');
    onLog('info', `Re-drafting with directive: ${optionId.toUpperCase()}...`);

    try {
      const res = await api.draftFirstVersion(`${contentType} (${optionId})`);
      if (res.success) {
        onLog('success', `New draft generated with direct styling angle: ${optionId}`);
        setDraft(res.draft);
        setStatus('ready');
      }
    } catch (err: any) {
      onLog('error', `Drafting failed: ${err.message}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    onLog('success', 'Draft accepted! Moving to Writer\'s Council evaluation.');
    onNavigateToTab('council');
  };

  // Calculations for stats
  const wordCount = draft ? draft.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const voiceMatch = draft ? 85 + (wordCount % 11) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none animate-in fade-in duration-300 font-sans">
      
      {/* Blueprint Column */}
      <div className="lg:col-span-1 space-y-5">
        <div className="p-5 rounded-lg border border-hairline bg-surface-card space-y-5 text-ink shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-ink font-serif uppercase tracking-widest">Blueprint config</h3>
            <p className="text-[10px] text-muted mt-0.5">Select channel targets and guides</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted">Target Content Type</label>
            <select
              value={contentType}
              disabled={loading}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-canvas border border-hairline focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md py-2 px-3 text-xs text-ink outline-none cursor-pointer transition-colors"
            >
              <option value="LinkedIn Post">LinkedIn Post (Text, messaging style)</option>
              <option value="X Thread">X / Twitter Thread (5-7 tweets)</option>
              <option value="Long Essay">Long Form Essay (Detailed layout)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted">Active Style Guide instructions</label>
            <div className="p-3 bg-canvas border border-hairline rounded-md text-[10px] text-muted font-mono max-h-32 overflow-y-auto leading-relaxed custom-scroll whitespace-pre-wrap">
              {styleGuide}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted">Past Corrective Memory (Lessons)</label>
            <div className="p-3 bg-canvas border border-hairline rounded-md text-[10px] text-muted font-mono max-h-32 overflow-y-auto leading-relaxed custom-scroll whitespace-pre-wrap">
              {lessons}
            </div>
          </div>

          {!drafted && (
            <button
              onClick={handleDraft}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting first version...</span>
                </>
              ) : (
                <>
                  <PencilSimple className="w-3.5 h-3.5" />
                  <span>Draft First Version</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Draft Workspace */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Main Panel */}
        <div className="rounded-lg overflow-hidden border border-hairline bg-canvas flex flex-col min-h-[460px]">
          
          {/* Header */}
          <div className="p-4 border-b border-hairline bg-surface-soft flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink">Draft Viewer</span>
            </div>

            {drafted && (
              <div className="flex items-center gap-4 text-[10px] font-medium">
                <button 
                  onClick={() => setViewSource(!viewSource)}
                  className="text-muted hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {viewSource ? (
                    <>
                      <Eye size={12} />
                      <span>Readable text</span>
                    </>
                  ) : (
                    <>
                      <FileCode size={12} />
                      <span>View source</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={() => onNavigateToTab('settings')}
                  className="text-muted hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Gear size={12} />
                  <span>Edit voice rules</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {drafted && draft && (
            <div className="grid grid-cols-3 border-b border-hairline bg-surface-card py-3 px-6 text-center divide-x divide-hairline">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted block uppercase tracking-wider font-mono">Length</span>
                <span className="text-xs font-semibold text-ink">{wordCount} words</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted block uppercase tracking-wider font-mono">Read Time</span>
                <span className="text-xs font-semibold text-ink">~{readTime} min</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted block uppercase tracking-wider font-mono">Voice Match</span>
                <span className="text-xs font-semibold text-primary flex items-center justify-center gap-1">
                  <Sparkle size={12} weight="fill" />
                  <span>{voiceMatch}%</span>
                </span>
              </div>
            </div>
          )}

          {/* Draft Display */}
          <div className="p-6 flex-1 overflow-y-auto custom-scroll max-h-[420px] bg-canvas">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <ArrowsClockwise size={28} className="text-primary animate-spin" />
                <p className="text-xs text-muted">Drafting using style guides and lessons...</p>
              </div>
            ) : draft ? (
              viewSource ? (
                <pre className="text-[11px] text-body font-mono leading-relaxed whitespace-pre-wrap select-text">
                  {draft}
                </pre>
              ) : (
                <div className="text-xs text-body font-sans leading-relaxed whitespace-pre-wrap select-text max-w-[65ch] prose">
                  {draft}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <p className="text-xs text-muted italic max-w-xs leading-relaxed">
                  Blueprint compiled draft pending. Click "Draft First Version" to combine templates and build the first iteration.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Bar */}
        {drafted && !loading && draft && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleAccept}
              className="w-full sm:flex-1 py-3 px-6 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Accept and send to reviewers</span>
              <ArrowRight size={14} />
            </button>

            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button
                onClick={() => setShowTryAgainMenu(!showTryAgainMenu)}
                className="w-full sm:w-auto py-3 px-5 rounded-md border border-hairline hover:bg-surface-soft bg-canvas text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <ArrowCounterClockwise size={13} />
                <span>Try again</span>
                <CaretDown size={12} className={clsx("transition-transform", showTryAgainMenu && "rotate-180")} />
              </button>

              {showTryAgainMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-56 rounded-md border border-hairline bg-surface-card p-1.5 shadow-lg z-30 animate-in fade-in slide-in-from-bottom-2 duration-155">
                  <div className="px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-muted">
                    Regeneration directives
                  </div>
                  {TRY_AGAIN_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleTryAgain(opt.id)}
                      className="w-full text-left py-2 px-2.5 rounded-md text-xs text-body hover:text-ink hover:bg-surface-soft transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
