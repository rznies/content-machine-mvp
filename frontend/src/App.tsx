import { useState, useEffect, useRef } from 'react';
import { api, Idea } from './lib/api';
import { OracleTab } from './components/OracleTab';
import { VaultTab } from './components/VaultTab';
import { ResearcherTab } from './components/ResearcherTab';
import { InterviewTab } from './components/InterviewTab';
import { ProductionTab } from './components/ProductionTab';
import { RefinementTab } from './components/RefinementTab';
import { CouncilTab } from './components/CouncilTab';
import { RepurposeTab } from './components/RepurposeTab';
import { RevisionTab } from './components/RevisionTab';
import { LearningTab } from './components/LearningTab';
import { SettingsTab } from './components/SettingsTab';

import { 
  Lightning, 
  Gear, 
  TerminalWindow, 
  Trash,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface LogLine {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  time: string;
}

const STEP_DETAILS: Record<string, { title: string; desc: string; badge: string; badgeType: 'ai' | 'human' | 'hybrid' }> = {
  oracle: { title: "The Oracle", desc: "Mines internal feeds for content spikes.", badge: "AI", badgeType: "ai" },
  vault: { title: "The Vault", desc: "Curated content ideas pipeline.", badge: "Human", badgeType: "human" },
  researcher: { title: "The Researcher", desc: "Sourced research reports.", badge: "AI", badgeType: "ai" },
  interview: { title: "Interview Panel", desc: "Challenge ideas to extract stories.", badge: "AI + Human", badgeType: "hybrid" },
  production: { title: "Production", desc: "Compiles structured Markdown.", badge: "AI", badgeType: "ai" },
  refinement: { title: "Refinement", desc: "Drafts content in your voice.", badge: "AI + Human", badgeType: "hybrid" },
  council: { title: "Writer's Council", desc: "Expert reviewers score your draft.", badge: "AI", badgeType: "ai" },
  repurpose: { title: "Repurposing", desc: "Transforms the finalized anchor post.", badge: "AI", badgeType: "ai" },
  revision: { title: "Final Revision", desc: "Fine-tune the draft manually.", badge: "Human", badgeType: "human" },
  learning: { title: "Learning Loop", desc: "Extracts writing lessons.", badge: "AI", badgeType: "ai" },
  settings: { title: "Settings", desc: "System configuration.", badge: "System", badgeType: "human" }
};

function App() {
  const [activeTab, setActiveTab] = useState<string>('oracle');
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([
    { type: 'info', message: 'Machine initialized. Ready for feed mining.', time: new Date().toLocaleTimeString() }
  ]);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && STEP_DETAILS[hash]) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    window.location.hash = tabName;
  };

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, time }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, terminalExpanded]);

  useEffect(() => {
    api.getActiveIdea()
      .then((res) => {
        if (res.success && res.active) {
          setActiveIdea(res.active);
          addLog('info', `Loaded: "${res.active.title}"`);
        }
      })
      .catch(() => {
        addLog('error', 'Failed to connect to backend.');
      });
  }, []);

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'oracle': return <OracleTab onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'vault': return <VaultTab activeIdea={activeIdea} onActiveIdeaChange={setActiveIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'researcher': return <ResearcherTab activeIdea={activeIdea} onLog={addLog} />;
      case 'interview': return <InterviewTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'production': return <ProductionTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'refinement': return <RefinementTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'council': return <CouncilTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'repurpose': return <RepurposeTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'revision': return <RevisionTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={handleTabChange} />;
      case 'learning': return <LearningTab activeIdea={activeIdea} />;
      case 'settings': return <SettingsTab onLog={addLog} />;
      default: return <div className="text-zinc-400">Under Construction</div>;
    }
  };

  const getBadgeClass = (type: 'ai' | 'human' | 'hybrid') => {
    switch (type) {
      case 'ai': return 'bg-primary/10 text-primary border-primary/20';
      case 'human': return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'hybrid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-zinc-950/30 flex flex-col justify-between shrink-0">
        <div className="flex-1 flex flex-col overflow-y-auto custom-scroll">
          {/* Logo brand */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-white font-bold">
              <Lightning weight="fill" className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Content Machine</h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">Media Co.</p>
            </div>
          </div>

          {/* Active status display card */}
          <div className="px-5 py-4 border-b border-border bg-zinc-950/50">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Active Run</label>
            <div className={twMerge(
              "mt-2 py-2 px-3 rounded-md border text-xs leading-normal truncate",
              activeIdea ? "bg-primary/5 border-primary/20 text-primary font-medium" : "bg-zinc-900/50 border-zinc-800 text-zinc-600 italic"
            )}>
              {activeIdea ? activeIdea.title : 'No idea selected'}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {Object.entries(STEP_DETAILS).map(([key, value], idx) => {
              if (key === 'settings') return null;
              const isSelected = activeTab === key;
              const stepNumber = String(idx + 1).padStart(2, '0');
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={twMerge(
                    "w-full flex items-center justify-between py-2 px-3 rounded-md transition-all active:scale-[0.98] text-xs font-medium",
                    isSelected ? "bg-zinc-900 text-foreground" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={twMerge("text-[10px] font-mono", isSelected ? "text-primary" : "text-zinc-600")}>
                      {stepNumber}
                    </span>
                    <span>{value.title}</span>
                  </span>
                  <span className={twMerge(
                    "text-[9px] px-1.5 py-0.5 rounded border uppercase shrink-0 font-mono font-medium",
                    isSelected ? "bg-primary/10 text-primary border-primary/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  )}>
                    {value.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-zinc-950/80 space-y-3 shrink-0">
          <button
            onClick={() => handleTabChange('settings')}
            className={twMerge(
              "w-full flex items-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all active:scale-[0.98]",
              activeTab === 'settings' ? "bg-zinc-900 text-foreground" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            )}
          >
            <Gear weight="bold" className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Workspace Header */}
        <header className="p-6 border-b border-border bg-zinc-950/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {STEP_DETAILS[activeTab]?.title}
            </h2>
            {STEP_DETAILS[activeTab]?.badge && (
              <span className="text-[10px] font-mono uppercase bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-zinc-800 rounded">
                {STEP_DETAILS[activeTab].badge}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1.5 max-w-[65ch]">
            {STEP_DETAILS[activeTab]?.desc}
          </p>
        </header>

        {/* Tab Workspace content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scroll min-w-0 relative">
          {renderActiveTabContent()}
        </div>

        {/* System Logs console */}
        <div className="border-t border-border bg-zinc-950 shrink-0">
          <div 
            onClick={() => setTerminalExpanded(!terminalExpanded)}
            className="p-3 bg-zinc-950/80 flex items-center justify-between text-[11px] font-medium tracking-wide text-zinc-400 border-b border-border cursor-pointer hover:bg-zinc-900/50 select-none transition-colors"
          >
            <div className="flex items-center gap-2">
              <TerminalWindow weight="bold" className="w-4 h-4 text-zinc-500" />
              <span>SYSTEM LOGS</span>
              <span className="font-mono text-[10px] text-zinc-600 bg-zinc-900 py-0.5 px-1.5 rounded">{logs.length}</span>
            </div>
            
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={clearLogs}
                title="Clear Logs"
                className="p-1 hover:text-rose-400 text-zinc-500 transition-colors"
              >
                <Trash weight="bold" className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setTerminalExpanded(!terminalExpanded)}
                className="p-1 hover:text-foreground text-zinc-500 transition-colors"
              >
                {terminalExpanded ? <CaretDown weight="bold" className="w-4 h-4" /> : <CaretUp weight="bold" className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {terminalExpanded && (
            <div className="h-32 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto bg-black text-zinc-400 custom-scroll select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic select-none">Console empty.</div>
              ) : (
                logs.map((log, idx) => {
                  let colorClass = 'text-zinc-500';
                  if (log.type === 'success') colorClass = 'text-emerald-500';
                  if (log.type === 'warning') colorClass = 'text-amber-500';
                  if (log.type === 'error') colorClass = 'text-rose-500';
                  return (
                    <div key={idx} className="flex gap-3 py-0.5 hover:bg-white/5 transition-colors">
                      <span className="text-zinc-600 shrink-0 select-none">{log.time}</span>
                      <span className={twMerge(colorClass, "shrink-0 select-none uppercase font-bold w-[6ch]")}>
                        {log.type}
                      </span>
                      <span className="text-zinc-300 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
