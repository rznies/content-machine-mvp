import { useEffect, useState, useMemo } from 'react';
import { useApp, ThemeMode } from './context/AppContext';
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
import { StatusPill } from './components/StatusPill';
import { ThemeToggle } from './components/ThemeToggle';
import { ActivityPanel } from './components/ActivityPanel';

import { 
  Lightning, 
  Gear, 
  Bell, 
  Lock, 
  Check, 
  User,
  Dot,
  MagnifyingGlass,
  List,
  X
} from '@phosphor-icons/react';
import { clsx } from "clsx";

import { HomeScreen } from './components/HomeScreen';

const PHASES = [
  {
    name: 'FIND',
    label: 'Find and pick an idea',
    steps: ['oracle', 'vault']
  },
  {
    name: 'BUILD',
    label: 'Research, gather, draft',
    steps: ['researcher', 'interview', 'production', 'refinement']
  },
  {
    name: 'PUBLISH & LEARN',
    label: 'Polish, post, edit, learn',
    steps: ['council', 'repurpose', 'revision', 'learning']
  }
];

const STEP_DETAILS: Record<string, { title: string; desc: string; index: number }> = {
  home: { title: "Dashboard", desc: "Welcome to your Content Machine dashboard.", index: 0 },
  oracle: { title: "Find ideas", desc: "Scan messages, notes, and feeds for things worth writing about.", index: 1 },
  vault: { title: "Pick an idea", desc: "Choose the one you want to turn into a post.", index: 2 },
  researcher: { title: "Research", desc: "Get the facts, sources, and quotes.", index: 3 },
  interview: { title: "Answer questions", desc: "We ask, you talk. We pull out your real stories.", index: 4 },
  production: { title: "Gather material", desc: "Pull out the best quotes, numbers, and moments.", index: 5 },
  refinement: { title: "Write first draft", desc: "We draft it in your voice. You approve or redo.", index: 6 },
  council: { title: "Polish draft", desc: "6 expert reviewers grade it. We revise until it's strong.", index: 7 },
  repurpose: { title: "Post to platforms", desc: "Pick where you want it to appear.", index: 8 },
  revision: { title: "Final edit", desc: "Your last changes before publishing.", index: 9 },
  learning: { title: "What we learned", desc: "Style rules we picked up from this run.", index: 10 },
  settings: { title: "Settings", desc: "System configuration & API connections.", index: 11 }
};

function App() {
  const {
    activeTab,
    setActiveTab,
    activeIdea,
    setActiveIdea,
    logs,
    addLog,
    isActivityOpen,
    setIsActivityOpen,
    isPinned,
    setIsPinned,
    unreadLogsCount,
    theme,
    setTheme
  } = useApp();

  // Keyboard Shortcuts & Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  interface CommandItem {
    id: string;
    title: string;
    shortcut?: string;
    action: () => void;
    disabled?: boolean;
  }

  const isStepLocked = (stepKey: string) => {
    if (stepKey === 'oracle' || stepKey === 'vault' || stepKey === 'settings' || stepKey === 'home') return false;
    return !activeIdea;
  };

  const filteredCommands = useMemo<CommandItem[]>(() => {
    const commands: CommandItem[] = [
      {
        id: 'toggle-activity',
        title: 'Toggle Activity Panel',
        shortcut: 'Cmd+.',
        action: () => {
          setIsPinned(!isPinned);
          setIsCommandPaletteOpen(false);
        }
      },
      {
        id: 'theme-light',
        title: 'Switch to Light Mode',
        action: () => {
          document.documentElement.classList.add('light');
          localStorage.setItem('theme', 'light');
          setIsCommandPaletteOpen(false);
        }
      },
      {
        id: 'theme-dark',
        title: 'Switch to Dark Mode',
        action: () => {
          document.documentElement.classList.remove('light');
          localStorage.setItem('theme', 'dark');
          setIsCommandPaletteOpen(false);
        }
      },
      {
        id: 'theme-auto',
        title: 'Switch to System Auto Theme',
        action: () => {
          localStorage.removeItem('theme');
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (systemDark) {
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
          }
          setIsCommandPaletteOpen(false);
        }
      },
      {
        id: 'start-new',
        title: 'Start a New Content Idea',
        action: () => {
          setActiveIdea(null);
          setActiveTab('oracle');
          setIsCommandPaletteOpen(false);
        }
      },
      ...Object.entries(STEP_DETAILS).map(([key, details]) => {
        const locked = isStepLocked(key);
        return {
          id: `go-${key}`,
          title: `Go to Step: ${details.title}`,
          shortcut: key === 'home' ? 'H' : key === 'settings' ? 'S' : String(details.index % 10),
          disabled: locked,
          action: () => {
            setActiveTab(key);
            setIsCommandPaletteOpen(false);
          }
        };
      })
    ];

    if (!searchQuery.trim()) return commands;
    const query = searchQuery.toLowerCase();
    return commands.filter(cmd => cmd.title.toLowerCase().includes(query));
  }, [searchQuery, activeIdea, isPinned, theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = 
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => {
          if (!prev) {
            setSearchQuery('');
            setSelectedIndex(0);
          }
          return !prev;
        });
        return;
      }

      if (isCommandPaletteOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const targetCmd = filteredCommands[selectedIndex];
          if (targetCmd && !targetCmd.disabled) {
            targetCmd.action();
          }
          return;
        }
        return;
      }

      if (!isTyping) {
        const stepKeys = ['oracle', 'vault', 'researcher', 'interview', 'production', 'refinement', 'council', 'repurpose', 'revision', 'learning'];
        if (e.key >= '1' && e.key <= '9') {
          const idx = parseInt(e.key) - 1;
          const target = stepKeys[idx];
          if (target && !isStepLocked(target)) {
            e.preventDefault();
            setActiveTab(target);
          }
        } else if (e.key === '0') {
          const target = stepKeys[9];
          if (target && !isStepLocked(target)) {
            e.preventDefault();
            setActiveTab(target);
          }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === '.') {
          e.preventDefault();
          setIsPinned(prev => !prev);
        }

        // Theme cycle keyboard shortcut (Cmd+Shift+T)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
          e.preventDefault();
          let nextTheme: ThemeMode = 'auto';
          if (theme === 'auto') {
            nextTheme = 'light';
          } else if (theme === 'light') {
            nextTheme = 'dark';
          } else if (theme === 'dark') {
            nextTheme = 'auto';
          }
          setTheme(nextTheme);
          addLog('info', `Theme changed to ${nextTheme} via keyboard shortcut.`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, selectedIndex, filteredCommands, activeIdea, isPinned, theme]);

  const getStepStatusIcon = (stepKey: string, isSelected: boolean) => {
    const isLocked = isStepLocked(stepKey);
    const details = STEP_DETAILS[stepKey];
    const currentActiveDetails = STEP_DETAILS[activeTab];

    if (isLocked) {
      return <Lock size={12} className="text-zinc-600 dark:text-zinc-700" />;
    }

    if (isSelected) {
      return (
        <span className="flex h-4 w-4 items-center justify-center relative">
          <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
        </span>
      );
    }

    // Done status logic (if an active idea is selected, finding and picking is done)
    if (activeIdea) {
      if (details.index < currentActiveDetails.index) {
        return <Check size={12} className="text-emerald-500 font-bold" />;
      }
    }

    return <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 dark:bg-zinc-700"></span>;
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'oracle': return <OracleTab onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'vault': return <VaultTab activeIdea={activeIdea} onActiveIdeaChange={setActiveIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'researcher': return <ResearcherTab activeIdea={activeIdea} onLog={addLog} />;
      case 'interview': return <InterviewTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'production': return <ProductionTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'refinement': return <RefinementTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'council': return <CouncilTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'repurpose': return <RepurposeTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'revision': return <RevisionTab activeIdea={activeIdea} onLog={addLog} onNavigateToTab={setActiveTab} />;
      case 'learning': return <LearningTab />;
      case 'settings': return <SettingsTab />;
      default: return <div className="text-zinc-400">Under Construction</div>;
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-canvas text-ink font-sans antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      
      {/* Sidebar Navigation Drawer Backdrop on Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={clsx(
        "border-r border-hairline/10 bg-surface-dark flex flex-col shrink-0 select-none text-on-dark-soft transition-all duration-300",
        // Desktop Layout: persistent 60w sidebar
        "md:w-60 md:flex md:relative md:inset-auto md:translate-x-0 h-full",
        // Mobile Layout: slide-out overlay drawer
        "fixed inset-y-0 left-0 w-64 z-50 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        
        {/* Brand logo & Close Button */}
        <div className="flex items-center justify-between p-5 border-b border-hairline/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-transparent">
              {/* Anthropic radial-spike mark */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-primary" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.5c-.2 4.2-2.8 6.8-7 7 4.2.2 6.8 2.8 7 7 .2-4.2 2.8-6.8 7-7-4.2-.2-6.8-2.8-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xs font-semibold tracking-tight text-on-dark uppercase">Content Machine</h1>
              <p className="text-[8px] text-on-dark-soft font-mono tracking-widest uppercase">Media Pipeline</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 hover:text-on-dark hover:bg-surface-dark-soft text-on-dark-soft rounded-md transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto custom-scroll px-3 py-4 space-y-5">
          {PHASES.map((phase) => (
            <div key={phase.name} className="space-y-1.5">
              <div className="px-2">
                <span className="text-[9px] font-mono font-bold text-on-dark-soft/40 tracking-widest block uppercase">
                  {phase.name}
                </span>
                <span className="text-[8px] text-on-dark-soft/60 block tracking-wide mt-0.5">
                  {phase.label}
                </span>
              </div>

              <div className="space-y-0.5">
                {phase.steps.map((stepKey) => {
                  const isSelected = activeTab === stepKey;
                  const isLocked = isStepLocked(stepKey);
                  const step = STEP_DETAILS[stepKey];
                  const stepNumber = String(step.index).padStart(2, '0');

                  return (
                    <button
                      key={stepKey}
                      onClick={() => {
                        if (!isLocked) {
                          setActiveTab(stepKey);
                          setIsSidebarOpen(false);
                        }
                      }}
                      disabled={isLocked}
                      title={isLocked ? "Pick an idea in the Vault first to unlock this step." : step.desc}
                      className={clsx(
                        "w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-all text-xs font-medium relative group",
                        isSelected
                          ? "bg-surface-dark-elevated text-on-dark border border-hairline/10 shadow-sm"
                          : "text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-soft/40 border border-transparent",
                        isLocked && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          {getStepStatusIcon(stepKey, isSelected)}
                        </span>
                        <span className="font-mono text-[10px] opacity-40 group-hover:opacity-70 transition-opacity">
                          {stepNumber}
                        </span>
                        <span className="truncate">{step.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-canvas">
        
        {/* Top Bar Navigation */}
        <header className="h-14 border-b border-hairline bg-canvas/80 px-4 md:px-6 flex items-center justify-between select-none shrink-0 backdrop-blur-md sticky top-0 z-10">
          {/* Left - Hamburger & Active Idea */}
          <div className="flex items-center gap-2.5 max-w-[40%]">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md hover:bg-surface-soft text-muted hover:text-ink cursor-pointer active:scale-95 transition-all"
              title="Open menu"
            >
              <List size={18} weight="bold" />
            </button>
            <div className="hidden sm:flex items-center gap-2 truncate">
              <span className="text-[10px] text-muted font-mono tracking-widest uppercase">Idea:</span>
              <div 
                title={activeIdea ? activeIdea.title : "No active run"}
                className={clsx(
                  "text-xs leading-none font-medium truncate max-w-[120px] md:max-w-xs",
                  activeIdea ? "text-primary hover:underline cursor-pointer" : "text-muted italic"
                )}
                onClick={() => activeIdea && setActiveTab('vault')}
              >
                {activeIdea ? activeIdea.title : 'None'}
              </div>
            </div>
          </div>

          {/* Center - Active Tab Title */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-semibold tracking-tight text-ink font-serif truncate max-w-[100px] sm:max-w-none">
              {STEP_DETAILS[activeTab]?.title}
            </span>
            <StatusPill />
          </div>

          {/* Right - Global Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Gear */}
            <button
              onClick={() => setActiveTab('settings')}
              title="Settings"
              className={clsx(
                "p-2 border rounded-md transition-all duration-200 active:scale-95",
                activeTab === 'settings'
                  ? "bg-surface-card text-ink border-hairline shadow-sm"
                  : "text-muted hover:text-ink border-transparent hover:bg-surface-soft hover:border-hairline"
              )}
            >
              <Gear size={16} weight={activeTab === 'settings' ? 'fill' : 'bold'} />
            </button>

            {/* Activity Panel Bell */}
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              title="Activity log"
              className={clsx(
                "p-2 border rounded-md transition-all duration-200 active:scale-95 relative",
                isActivityOpen
                  ? "bg-surface-card text-ink border-hairline shadow-sm"
                  : "text-muted hover:text-ink border-transparent hover:bg-surface-soft hover:border-hairline"
              )}
            >
              <Bell size={16} weight={isActivityOpen ? 'fill' : 'bold'} />
              {unreadLogsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-on-primary scale-90 border border-canvas">
                  {unreadLogsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar (decorative) */}
            <div className="hidden sm:flex h-8 w-8 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-muted cursor-pointer hover:bg-surface-soft transition-colors ml-1">
              <User size={14} weight="bold" />
            </div>
          </div>
        </header>

        {/* Content Workspace Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scroll min-w-0 relative">
          
          {/* Section Breadcrumb/Header */}
          {activeTab !== 'home' && activeTab !== 'settings' && (
            <div className="mb-6 select-none pb-4 border-b border-hairline/80">
              <h2 className="text-lg font-serif tracking-tight text-ink flex items-center gap-2">
                <span>Step {STEP_DETAILS[activeTab]?.index}: {STEP_DETAILS[activeTab]?.title}</span>
              </h2>
              <p className="text-xs text-muted mt-1 max-w-[70ch] leading-relaxed">
                {STEP_DETAILS[activeTab]?.desc}
              </p>
            </div>
          )}

          {/* Active Tab View */}
          <div className="relative min-w-0">
            {renderActiveTabContent()}
          </div>
        </div>

      </main>

      {/* Activity Panel */}
      <ActivityPanel />

      {/* Command Palette Overlay */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-surface-dark/70 backdrop-blur-sm z-50 flex items-start justify-center pt-[15dvh] px-4 animate-in fade-in duration-150">
          <div className="bg-surface-dark border border-hairline/25 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[400px] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-hairline/15 flex items-center gap-3">
              <MagnifyingGlass size={16} className="text-on-dark-soft" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search actions and steps... (Esc to close)"
                className="flex-1 bg-transparent border-0 outline-none text-xs text-on-dark placeholder-on-dark-soft/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-2 bg-surface-dark-soft/20">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    disabled={cmd.disabled}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={clsx(
                      "w-full text-left py-2 px-3 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer",
                      idx === selectedIndex ? "bg-primary text-on-primary shadow-sm" : "text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-soft/60",
                      cmd.disabled && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <span>{cmd.title}</span>
                    {cmd.shortcut && (
                      <kbd className={clsx(
                        "font-mono text-[9px] px-1.5 py-0.5 rounded border leading-none font-bold uppercase",
                        idx === selectedIndex ? "border-on-primary/20 bg-on-primary/10 text-on-primary" : "border-hairline/20 bg-surface-dark text-on-dark-soft"
                      )}>
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-xs text-on-dark-soft italic text-center py-6">No commands found.</p>
              )}
            </div>
            
            <div className="p-3 bg-surface-dark-elevated border-t border-hairline/15 text-[9px] text-on-dark-soft font-medium flex justify-between items-center px-4">
              <span>Use &uarr;&darr; to navigate, Enter to select</span>
              <span>Esc to exit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
