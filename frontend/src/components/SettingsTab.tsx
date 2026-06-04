import React, { useState, useEffect } from 'react';
import { api, SettingsStatus } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  Gear, 
  FloppyDisk, 
  WarningCircle, 
  CheckCircle,
  FileCode,
  FileText,
  ShieldWarning,
  Sparkle,
  Sliders,
  TerminalWindow,
  Key,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeSlash,
  PencilSimple,
  X
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

const FILES_CONFIG = [
  { name: 'style-guide.md', label: 'Style Guide', icon: FileText, desc: 'Legacy voice style guide containing principles for generating draft copies.' },
  { name: 'style-system.json', label: 'Structured JSON Style', icon: FileCode, desc: 'AI-operable formatting parameters and platform thresholds.' },
  { name: 'anti-slop.json', label: 'Anti-Slop Guidelines', icon: ShieldWarning, desc: 'Avoidance word list and phrase replacements.' },
  { name: 'golden-examples.json', label: 'Golden Examples', icon: Sparkle, desc: 'Curated list of posts representing target brand voice.' }
];

export const SettingsTab: React.FC = () => {
  const { 
    addLog, 
    isAdvancedMode, 
    setIsAdvancedMode,
    setShowOnboarding
  } = useApp();

  const [activeFile, setActiveFile] = useState('style-system.json');
  const [filesContent, setFilesContent] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // Section 3 States
  const [isAdvancedSectionExpanded, setIsAdvancedSectionExpanded] = useState(false);
  const [decayDays, setDecayDays] = useState(90);

  // Section 2 Connections Edit States
  const [isEditingKeys, setIsEditingKeys] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [tavilyKeyInput, setTavilyKeyInput] = useState('');
  const [firecrawlKeyInput, setFirecrawlKeyInput] = useState('');
  const [slackTokenInput, setSlackTokenInput] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    gemini: false,
    tavily: false,
    firecrawl: false,
    slack: false
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const resStatus = await api.getSettingsStatus();
      setStatus(resStatus);
      if (resStatus) {
        setGeminiKeyInput(resStatus.geminiApiKey || '');
        setTavilyKeyInput(resStatus.tavilyApiKey || '');
        setFirecrawlKeyInput(resStatus.firecrawlApiKey || '');
        setSlackTokenInput(resStatus.slackBotToken || '');
      }
    } catch (err: any) {
      addLog('error', `Failed to check settings status: ${err.message || err}`);
    }

    // Load all files content into cache
    const newCache: Record<string, string> = {};
    for (const file of FILES_CONFIG) {
      try {
        const res = await api.getFile(file.name);
        if (res.success) {
          newCache[file.name] = res.content || '';
        }
      } catch (err) {
        console.warn(`Failed to fetch file ${file.name}`);
      }
    }
    setFilesContent(newCache);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveKeys = async () => {
    setIsSavingKeys(true);
    try {
      const res = await api.saveKeys({
        geminiApiKey: geminiKeyInput,
        tavilyApiKey: tavilyKeyInput,
        firecrawlApiKey: firecrawlKeyInput,
        slackBotToken: slackTokenInput
      });
      if (res.success) {
        addLog('success', 'Connection settings and keys updated successfully.');
        setIsEditingKeys(false);
        await loadSettings();
      } else {
        addLog('error', 'Failed to update connection settings.');
      }
    } catch (err: any) {
      addLog('error', `Failed to save keys: ${err.message || err}`);
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleTextChange = (value: string) => {
    setFilesContent(prev => ({
      ...prev,
      [activeFile]: value
    }));

    if (activeFile.endsWith('.json')) {
      try {
        if (value.trim()) {
          JSON.parse(value);
        }
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message);
      }
    } else {
      setJsonError(null);
    }
  };

  const handleSave = async () => {
    const content = filesContent[activeFile] || '';
    
    if (activeFile.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (err: any) {
        setJsonError(err.message);
        addLog('error', `Cannot save ${activeFile}: Invalid JSON format.`);
        return;
      }
    }

    setSaving(true);
    addLog('info', `Saving updated config: ${activeFile}...`);
    try {
      const res = await api.saveFile(activeFile, content);
      if (res.success) {
        addLog('success', `${activeFile} saved successfully.`);
        const resStatus = await api.getSettingsStatus();
        setStatus(resStatus);
      }
    } catch (err: any) {
      addLog('error', `Failed to save ${activeFile}: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const activeFileConfig = FILES_CONFIG.find(f => f.name === activeFile);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4 select-none animate-in fade-in duration-300 font-sans text-ink">
      
      {/* Welcome Banner */}
      <div className="p-5 rounded-lg border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-primary animate-pulse" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.5c-.2 4.2-2.8 6.8-7 7 4.2.2 6.8 2.8 7 7 .2-4.2 2.8-6.8 7-7-4.2-.2-6.8-2.8-7-7z" />
            </svg>
            <span>Learn How Content Machine Works</span>
          </h4>
          <p className="text-xs text-muted max-w-[50ch] leading-relaxed">
            Need a refresher on the co-authoring steps, the Writer's Council loop, or configuring your custom API keys? Take the quick tour.
          </p>
        </div>
        <button
          onClick={() => setShowOnboarding(true)}
          className="px-4 py-2 shrink-0 rounded-lg text-xs font-bold text-on-primary bg-primary hover:bg-primary-active active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          Relaunch Tour
        </button>
      </div>

      {/* SECTION 1: Your Voice */}
      <section className="p-6 rounded-lg border border-hairline bg-surface-card space-y-4 shadow-sm">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-widest text-muted uppercase">Section 1 — Your Voice</h4>
          <p className="text-[11px] text-body mt-0.5">Define your brand tone, slop words to avoid, and sample outputs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-hairline bg-background/50 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <FileText size={15} />
              </span>
              <h5 className="text-xs font-semibold text-ink">Style Guide</h5>
              <p className="text-[10px] text-muted leading-normal">
                How we write like you. Core grammar rules and editorial frameworks.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveFile('style-guide.md');
                setIsAdvancedSectionExpanded(true);
              }}
              className="w-full py-1.5 px-3 rounded-md bg-canvas hover:bg-surface-soft text-body hover:text-ink text-[10px] font-semibold transition-colors active:scale-95 border border-hairline cursor-pointer"
            >
              Configure Guide
            </button>
          </div>

          <div className="p-4 rounded-lg border border-hairline bg-background/50 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <ShieldWarning size={15} />
              </span>
              <h5 className="text-xs font-semibold text-ink">Anti-Slop Rules</h5>
              <p className="text-[10px] text-muted leading-normal">
                Words and phrases we avoid by default. Kept out of drafts automatically.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveFile('anti-slop.json');
                setIsAdvancedSectionExpanded(true);
              }}
              className="w-full py-1.5 px-3 rounded-md bg-canvas hover:bg-surface-soft text-body hover:text-ink text-[10px] font-semibold transition-colors active:scale-95 border border-hairline cursor-pointer"
            >
              Edit Anti-Slop
            </button>
          </div>

          <div className="p-4 rounded-lg border border-hairline bg-background/50 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Sparkle size={15} />
              </span>
              <h5 className="text-xs font-semibold text-ink">Golden Examples</h5>
              <p className="text-[10px] text-muted leading-normal">
                Posts we should try to sound like. Past examples used for in-context styling.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveFile('golden-examples.json');
                setIsAdvancedSectionExpanded(true);
              }}
              className="w-full py-1.5 px-3 rounded-md bg-canvas hover:bg-surface-soft text-body hover:text-ink text-[10px] font-semibold transition-colors active:scale-95 border border-hairline cursor-pointer"
            >
              Manage Examples
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Connections */}
      <section className="p-6 rounded-lg border border-hairline bg-surface-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-muted uppercase">Section 2 — Connections</h4>
            <p className="text-[11px] text-body mt-0.5">Monitor and configure connection keys and dynamic research parameters.</p>
          </div>
          {!isEditingKeys ? (
            <button
              onClick={() => setIsEditingKeys(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hairline bg-canvas hover:bg-surface-soft text-body hover:text-ink text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <PencilSimple size={14} className="text-muted" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditingKeys(false);
                  loadSettings();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hairline bg-canvas hover:bg-surface-soft text-body hover:text-ink text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <X size={14} className="text-muted" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveKeys}
                disabled={isSavingKeys}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-active text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <FloppyDisk size={14} />
                <span>{isSavingKeys ? 'Saving...' : 'Save Keys'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Gemini */}
          <div className="p-4 border border-hairline/60 rounded-lg bg-background/50 flex flex-col justify-between shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-surface-soft flex items-center justify-center border border-hairline text-muted shadow-sm">
                  <Key size={15} />
                </span>
                <div>
                  <h5 className="text-xs font-semibold text-ink">Gemini API Key</h5>
                  <p className="text-[9px] text-muted mt-0.5">Stored in .env key mappings</p>
                </div>
              </div>
              {!isEditingKeys && (
                <span className={clsx(
                  "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
                  status?.hasGeminiKey 
                    ? 'bg-success/10 text-success border-success/20 font-bold' 
                    : 'bg-error/10 text-error border-error/20 font-bold'
                )}>
                  {status?.hasGeminiKey ? 'Connected' : 'Missing'}
                </span>
              )}
            </div>
            {isEditingKeys && (
              <div className="relative mt-2">
                <input
                  type={showKeys.gemini ? "text" : "password"}
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Enter Gemini API Key (AIzaSy...)"
                  className="w-full pl-3 pr-9 py-1.5 text-xs font-mono rounded-md border border-hairline bg-canvas focus:border-primary text-ink placeholder-muted-soft outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer focus:outline-none"
                >
                  {showKeys.gemini ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Tavily */}
          <div className="p-4 border border-hairline/60 rounded-lg bg-background/50 flex flex-col justify-between shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-surface-soft flex items-center justify-center border border-hairline text-muted shadow-sm">
                  <Key size={15} />
                </span>
                <div>
                  <h5 className="text-xs font-semibold text-ink">Tavily Key</h5>
                  <p className="text-[9px] text-muted mt-0.5">Used for Google Grounding search</p>
                </div>
              </div>
              {!isEditingKeys && (
                <span className={clsx(
                  "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
                  status?.hasTavilyKey 
                    ? 'bg-success/10 text-success border-success/20 font-bold' 
                    : 'bg-accent-amber/10 text-accent-amber border-accent-amber/20 font-bold'
                )}>
                  {status?.hasTavilyKey ? 'Connected' : 'Missing'}
                </span>
              )}
            </div>
            {isEditingKeys && (
              <div className="relative mt-2">
                <input
                  type={showKeys.tavily ? "text" : "password"}
                  value={tavilyKeyInput}
                  onChange={(e) => setTavilyKeyInput(e.target.value)}
                  placeholder="Enter Tavily API Key"
                  className="w-full pl-3 pr-9 py-1.5 text-xs font-mono rounded-md border border-hairline bg-canvas focus:border-primary text-ink placeholder-muted-soft outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, tavily: !prev.tavily }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer focus:outline-none"
                >
                  {showKeys.tavily ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Firecrawl */}
          <div className="p-4 border border-hairline/60 rounded-lg bg-background/50 flex flex-col justify-between shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-surface-soft flex items-center justify-center border border-hairline text-muted shadow-sm">
                  <Key size={15} />
                </span>
                <div>
                  <h5 className="text-xs font-semibold text-ink">Firecrawl Key</h5>
                  <p className="text-[9px] text-muted mt-0.5">Scrapes content reference details</p>
                </div>
              </div>
              {!isEditingKeys && (
                <span className={clsx(
                  "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
                  status?.hasFirecrawlKey 
                    ? 'bg-success/10 text-success border-success/20 font-bold' 
                    : 'bg-accent-amber/10 text-accent-amber border-accent-amber/20 font-bold'
                )}>
                  {status?.hasFirecrawlKey ? 'Connected' : 'Missing'}
                </span>
              )}
            </div>
            {isEditingKeys && (
              <div className="relative mt-2">
                <input
                  type={showKeys.firecrawl ? "text" : "password"}
                  value={firecrawlKeyInput}
                  onChange={(e) => setFirecrawlKeyInput(e.target.value)}
                  placeholder="Enter Firecrawl API Key"
                  className="w-full pl-3 pr-9 py-1.5 text-xs font-mono rounded-md border border-hairline bg-canvas focus:border-primary text-ink placeholder-muted-soft outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, firecrawl: !prev.firecrawl }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer focus:outline-none"
                >
                  {showKeys.firecrawl ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Slack Bot Token */}
          <div className="p-4 border border-hairline/60 rounded-lg bg-background/50 flex flex-col justify-between shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-surface-soft flex items-center justify-center border border-hairline text-muted shadow-sm">
                  <Key size={15} />
                </span>
                <div>
                  <h5 className="text-xs font-semibold text-ink">Slack Bot Token</h5>
                  <p className="text-[9px] text-muted mt-0.5">Ingests internal Slack posts</p>
                </div>
              </div>
              {!isEditingKeys && (
                <span className={clsx(
                  "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
                  status?.hasSlackToken 
                    ? 'bg-success/10 text-success border-success/20 font-bold' 
                    : 'bg-surface-soft text-muted border-hairline'
                )}>
                  {status?.hasSlackToken ? 'Connected' : 'Not Connected'}
                </span>
              )}
            </div>
            {isEditingKeys && (
              <div className="relative mt-2">
                <input
                  type={showKeys.slack ? "text" : "password"}
                  value={slackTokenInput}
                  onChange={(e) => setSlackTokenInput(e.target.value)}
                  placeholder="Enter Slack Bot Token (xoxb-...)"
                  className="w-full pl-3 pr-9 py-1.5 text-xs font-mono rounded-md border border-hairline bg-canvas focus:border-primary text-ink placeholder-muted-soft outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, slack: !prev.slack }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer focus:outline-none"
                >
                  {showKeys.slack ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Research Mode block */}
        <div className="p-4 rounded-lg border border-hairline bg-background/50 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <h5 className="text-xs font-semibold text-ink">Research Mode</h5>
            <p className="text-[10px] text-muted">Dynamically detected depending on config keys.</p>
          </div>
          <span className="px-3 py-1 text-xs font-mono font-bold text-primary border border-primary/20 bg-primary/5 rounded-lg uppercase tracking-wider">
            {status?.researchMode === 'tavily+firecrawl' ? 'Tavily + Firecrawl' : status?.researchMode === 'tavily' ? 'Tavily' : 'Google Grounding'}
          </span>
        </div>
      </section>

      {/* SECTION 3: Advanced */}
      <section className="rounded-lg border border-hairline bg-surface-card overflow-hidden shadow-sm">
        {/* Accordion toggle header */}
        <button
          onClick={() => setIsAdvancedSectionExpanded(!isAdvancedSectionExpanded)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-muted uppercase">Section 3 — Advanced Settings</h4>
            <p className="text-[11px] text-body mt-0.5">Collapsed raw files JSON editor and logging decay variables.</p>
          </div>
          <span className="text-xs font-semibold text-primary hover:underline cursor-pointer">
            {isAdvancedSectionExpanded ? 'Hide' : 'Show'}
          </span>
        </button>

        {isAdvancedSectionExpanded && (
          <div className="p-6 pt-0 border-t border-hairline/60 mt-4 space-y-6">
            
            {/* Split Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-hairline/60">
              
              {/* Technical Log Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-hairline bg-background/50 shadow-sm">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <TerminalWindow size={14} className="text-muted" />
                    <span>Show Technical Log</span>
                  </h5>
                  <p className="text-[10px] text-muted max-w-[200px] leading-normal">
                    Splits the Activity panel to show raw logs event stream.
                  </p>
                </div>
                <button
                  onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                  className="text-primary focus:outline-none transition-transform"
                >
                  {isAdvancedMode ? <ToggleRight size={36} weight="fill" /> : <ToggleLeft size={36} className="text-muted" />}
                </button>
              </div>

              {/* Decay Configuration */}
              <div className="p-4 rounded-lg border border-hairline bg-background/50 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Sliders size={14} className="text-muted" />
                    <span>Decay Threshold Settings</span>
                  </h5>
                  <p className="text-[10px] text-muted max-w-[200px] leading-normal">
                    Rules older than this are auto-deleted. (90-day default).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={decayDays}
                    onChange={(e) => setDecayDays(Number(e.target.value))}
                    className="w-16 bg-background border border-hairline rounded-md p-1.5 text-center text-xs text-ink outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => setDecayDays(90)}
                    className="text-[9px] text-primary hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* RAW FILE EDITOR */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <FileCode size={14} className="text-muted" />
                  <span>Raw Configuration Editor</span>
                </h5>
              </div>

              {/* File selector tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-hairline/60 pb-2">
                {FILES_CONFIG.map(file => {
                  const Icon = file.icon;
                  const isSelected = activeFile === file.name;
                  return (
                    <button
                      key={file.name}
                      onClick={() => {
                        setActiveFile(file.name);
                        setJsonError(null);
                      }}
                      className={clsx(
                        "flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[10px] font-semibold border transition-all cursor-pointer",
                        isSelected 
                          ? 'bg-primary/10 border-primary/20 text-primary' 
                          : 'bg-background border-hairline hover:border-muted text-muted hover:text-body'
                      )}
                    >
                      <Icon size={12} />
                      <span>{file.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Description line */}
              <div className="text-muted text-[10px] leading-normal font-mono bg-background p-2.5 rounded-md border border-hairline">
                <span className="font-semibold text-body">Target: </span>
                <span className="text-primary">{activeFile}</span>
                <p className="text-[9px] text-muted mt-1 font-sans font-normal leading-normal">{activeFileConfig?.desc}</p>
              </div>

              {/* Textarea Editor */}
              <div className="relative border border-hairline rounded-md overflow-hidden bg-background h-80 shadow-inner">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                    <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                <textarea
                  value={filesContent[activeFile] || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  disabled={saving || loading}
                  placeholder={`Loading content of ${activeFile}...`}
                  className="w-full h-full bg-transparent border-0 outline-none p-4 text-[11.5px] font-mono text-ink leading-relaxed resize-none placeholder-muted-soft custom-scroll focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Validations & Save */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  {jsonError ? (
                    <span className="text-[10px] text-error font-semibold flex items-center gap-1 font-mono">
                      <WarningCircle size={12} />
                      <span>JSON Syntax Error: {jsonError}</span>
                    </span>
                  ) : activeFile.endsWith('.json') && filesContent[activeFile] ? (
                    <span className="text-[10px] text-success font-semibold flex items-center gap-1 font-mono">
                      <CheckCircle size={12} />
                      <span>JSON Format Valid</span>
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || loading || !!jsonError}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-md bg-primary hover:bg-primary-active disabled:opacity-40 text-on-primary font-semibold text-xs transition-colors shadow-md shadow-primary/20 active:scale-95 shrink-0 w-full sm:w-auto cursor-pointer"
                >
                  <FloppyDisk size={14} />
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
