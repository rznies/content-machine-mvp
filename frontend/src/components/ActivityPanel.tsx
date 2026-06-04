import React, { useEffect, useRef } from 'react';
import { useApp, LogLine } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash, TerminalWindow, PushPin, ArrowUpRight } from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface ParsedActivity {
  actor: string;
  action: string;
  stepLink?: string;
  stepLabel?: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  rawMessage: string;
}

export const ActivityPanel: React.FC = () => {
  const {
    logs,
    clearLogs,
    isActivityOpen,
    setIsActivityOpen,
    isPinned,
    setIsPinned,
    resetUnreadLogsCount,
    activeTab,
    setActiveTab,
    isAdvancedMode,
    setIsAdvancedMode
  } = useApp();

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Parse raw log message into clean actor/action
  const parseLog = (log: LogLine): ParsedActivity => {
    const msg = log.message;
    let actor = 'System';
    let action = msg;
    let stepLink: string | undefined;
    let stepLabel: string | undefined;

    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('oracle') || lowerMsg.includes('mining') || lowerMsg.includes('feed')) {
      actor = 'Oracle';
      stepLink = 'oracle';
      stepLabel = 'Find ideas';
    } else if (lowerMsg.includes('vault') || lowerMsg.includes('loaded:') || lowerMsg.includes('selected:')) {
      actor = 'Vault';
      stepLink = 'vault';
      stepLabel = 'Pick an idea';
    } else if (lowerMsg.includes('research')) {
      actor = 'Researcher';
      stepLink = 'researcher';
      stepLabel = 'Research';
    } else if (lowerMsg.includes('interview') || lowerMsg.includes('question') || lowerMsg.includes('answer')) {
      actor = 'Interviewer';
      stepLink = 'interview';
      stepLabel = 'Answer questions';
    } else if (lowerMsg.includes('production') || lowerMsg.includes('compile')) {
      actor = 'Compiler';
      stepLink = 'production';
      stepLabel = 'Gather material';
    } else if (lowerMsg.includes('refine') || lowerMsg.includes('draft') || lowerMsg.includes('voice')) {
      actor = 'Writer';
      stepLink = 'refinement';
      stepLabel = 'Write first draft';
    } else if (lowerMsg.includes('council') || lowerMsg.includes('review') || lowerMsg.includes('shaan') || lowerMsg.includes('score')) {
      actor = 'Council';
      stepLink = 'council';
      stepLabel = 'Polish draft';
    } else if (lowerMsg.includes('repurpose') || lowerMsg.includes('platforms')) {
      actor = 'Repurposer';
      stepLink = 'repurpose';
      stepLabel = 'Post to platforms';
    } else if (lowerMsg.includes('revision') || lowerMsg.includes('edit')) {
      actor = 'Editor';
      stepLink = 'revision';
      stepLabel = 'Final edit';
    } else if (lowerMsg.includes('learning') || lowerMsg.includes('lessons') || lowerMsg.includes('loop')) {
      actor = 'Coach';
      stepLink = 'learning';
      stepLabel = 'What we learned';
    }

    // Clean up internal jargon for friendly tone
    if (lowerMsg.includes('oracle mining pass initiated')) {
      action = 'Looking through your messages and notes for things worth writing about.';
    } else if (lowerMsg.includes('oracle identified')) {
      action = msg.replace('Oracle identified', 'Found');
    } else if (lowerMsg.includes('council revision loop started')) {
      action = '6 expert reviewers are reading your draft. This usually takes about a minute.';
    } else if (lowerMsg.includes('revision loop finished')) {
      action = msg.replace('Revision loop finished, final score', 'Nice work. Reviewers finished grading. Final score:');
    }

    return {
      actor,
      action,
      stepLink,
      stepLabel,
      timestamp: log.time,
      type: log.type,
      rawMessage: msg
    };
  };

  // Reset unread count when panel opens
  useEffect(() => {
    if (isActivityOpen) {
      resetUnreadLogsCount();
    }
  }, [isActivityOpen, resetUnreadLogsCount]);

  // Scroll to bottom of technical logs when they load
  useEffect(() => {
    if (isActivityOpen && isAdvancedMode) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isActivityOpen, isAdvancedMode]);

  const sortedActivities = [...logs].reverse().map(parseLog);

  const panelContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Unpin panel" : "Pin panel"}
            className={clsx(
              "p-1.5 rounded-md transition-colors hover:bg-zinc-900 cursor-pointer",
              isPinned ? "text-primary" : "text-zinc-500 hover:text-zinc-350"
            )}
          >
            <PushPin size={15} weight={isPinned ? "fill" : "bold"} />
          </button>

          <button
            onClick={clearLogs}
            title="Clear history"
            className="p-1.5 hover:text-rose-400 text-zinc-500 rounded-md transition-colors hover:bg-zinc-900 cursor-pointer"
          >
            <Trash size={15} />
          </button>
          <button
            onClick={() => setIsActivityOpen(false)}
            className="p-1.5 hover:text-foreground text-zinc-500 rounded-md transition-colors hover:bg-zinc-900 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Event Stack */}
        <div className={clsx(
          "flex-1 overflow-y-auto p-4 space-y-3 custom-scroll select-none",
          isAdvancedMode ? "h-1/2" : "h-full"
        )}>
          {sortedActivities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs py-8 italic">
              No activity recorded yet.
            </div>
          ) : (
            sortedActivities.map((act, idx) => (
              <div
                key={idx}
                className={clsx(
                  "p-3 rounded-xl border transition-all duration-200 bg-zinc-900/40 hover:bg-zinc-900/70",
                  act.type === 'error' ? 'border-rose-500/20' : 'border-zinc-900'
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-mono text-zinc-600 tracking-wider">
                    {act.timestamp}
                  </span>
                  <span className={clsx(
                    "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md font-semibold tracking-wider",
                    act.type === 'success' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10',
                    act.type === 'error' && 'bg-rose-500/10 text-rose-400 border border-rose-500/10',
                    act.type === 'warning' && 'bg-amber-500/10 text-amber-400 border border-amber-500/10',
                    act.type === 'info' && 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  )}>
                    {act.actor}
                  </span>
                </div>
                <p className="text-xs text-zinc-350 leading-normal mt-2 select-text font-normal">
                  {act.action}
                </p>
                {act.stepLink && (
                  <button
                    onClick={() => {
                      setActiveTab(act.stepLink!);
                      setIsActivityOpen(false);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-primary font-medium hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    <span>Go to {act.stepLabel}</span>
                    <ArrowUpRight size={10} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Technical Log (Console Terminal Split) */}
        {isAdvancedMode && (
          <div className="h-1/2 border-t border-zinc-800 flex flex-col min-h-0 bg-black">
            <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-950 flex items-center gap-2 select-none text-[10px] font-mono font-semibold tracking-widest text-zinc-500">
              <TerminalWindow size={12} />
              <span>RAW EVENTS</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-zinc-400 custom-scroll select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-700 italic select-none">Console empty.</div>
              ) : (
                logs.map((log, idx) => {
                  let color = 'text-zinc-500';
                  if (log.type === 'success') color = 'text-emerald-500';
                  if (log.type === 'warning') color = 'text-amber-500';
                  if (log.type === 'error') color = 'text-rose-500';
                  return (
                    <div key={idx} className="flex gap-2 py-0.5 hover:bg-white/5 transition-colors">
                      <span className="text-zinc-700 shrink-0 select-none">{log.time}</span>
                      <span className={clsx(color, "shrink-0 select-none uppercase font-bold w-[6ch]")}>
                        {log.type}
                      </span>
                      <span className="text-zinc-300 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Control */}
      <div className="p-3 border-t border-zinc-800 shrink-0 bg-zinc-900/50 flex justify-between items-center select-none">
        <button
          onClick={() => setIsAdvancedMode(!isAdvancedMode)}
          className={clsx(
            "px-3 py-1 text-[10px] font-mono rounded-md border transition-all active:scale-[0.98] cursor-pointer",
            isAdvancedMode
              ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-400"
          )}
        >
          {isAdvancedMode ? 'Hide Technical Log' : 'Show Technical Log'}
        </button>
        <div className="text-[10px] text-zinc-650 font-mono tracking-wider">
          Press Cmd+. to toggle
        </div>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {isActivityOpen && (
        <>
          {/* Overlay Backdrop - only when not pinned */}
          {!isPinned && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActivityOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
          )}

          {/* Panel Container */}
          {isPinned ? (
            <div
              className="w-80 h-full border-l border-zinc-800 bg-zinc-950/95 flex flex-col overflow-hidden shrink-0 z-20"
            >
              {panelContent}
            </div>
          ) : (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-80 h-[85vh] mr-4 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md"
            >
              {panelContent}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
