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
  ToggleRight
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
    setIsAdvancedMode 
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

  const loadSettings = async () => {
    setLoading(true);
    try {
      const resStatus = await api.getSettingsStatus();
      setStatus(resStatus);
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
    <div className="space-y-6 max-w-3xl mx-auto py-4 select-none animate-in fade-in duration-300">
      
      {/* SECTION 1: Your Voice */}
      <section className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950/20 space-y-4">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">Section 1 — Your Voice</h4>
          <p className="text-[11px] text-zinc-600 mt-0.5">Define your brand tone, slop words to avoid, and sample outputs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <FileText size={15} />
              </span>
              <h5 className="text-xs font-semibold text-foreground">Style Guide</h5>
              <p className="text-[10px] text-zinc-500 leading-normal">
                How we write like you. Core grammar rules and editorial frameworks.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveFile('style-guide.md');
                setIsAdvancedSectionExpanded(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-foreground text-[10px] font-semibold transition-colors active:scale-95 border border-zinc-850 cursor-pointer"
            >
              Configure Guide
            </button>
          </div>

          <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-500">
                <ShieldWarning size={15} />
              </span>
              <h5 className="text-xs font-semibold text-foreground">Anti-Slop Rules</h5>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Words and phrases we avoid by default. Kept out of drafts automatically.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveFile('anti-slop.json');
                setIsAdvancedSectionExpanded(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-foreground text-[10px] font-semibold transition-colors active:scale-95 border border-zinc-850 cursor-pointer"
            >
              Edit Anti-Slop
            </button>
          </div>

          <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-500">
                <Sparkle size={15} />
              </span>
              <h5 className="text-xs font-semibold text-foreground">Golden Examples</h5>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Posts we should try to sound like. Past examples used for in-context styling.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveFile('golden-examples.json');
                setIsAdvancedSectionExpanded(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-foreground text-[10px] font-semibold transition-colors active:scale-95 border border-zinc-850 cursor-pointer"
            >
              Manage Examples
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Connections */}
      <section className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950/20 space-y-4">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">Section 2 — Connections</h4>
          <p className="text-[11px] text-zinc-600 mt-0.5">Monitor connection keys and dynamic research parameters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Gemini */}
          <div className="p-3 border border-zinc-850 rounded-xl bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                <Key size={15} />
              </span>
              <div>
                <h5 className="text-xs font-semibold text-foreground">Gemini API Key</h5>
                <p className="text-[9px] text-zinc-600 mt-0.5">Stored in .env key mappings</p>
              </div>
            </div>
            <span className={clsx(
              "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
              status?.hasGeminiKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            )}>
              {status?.hasGeminiKey ? 'Connected' : 'Missing'}
            </span>
          </div>

          {/* Tavily */}
          <div className="p-3 border border-zinc-850 rounded-xl bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                <Key size={15} />
              </span>
              <div>
                <h5 className="text-xs font-semibold text-foreground">Tavily Key</h5>
                <p className="text-[9px] text-zinc-600 mt-0.5">Used for google grounding search</p>
              </div>
            </div>
            <span className={clsx(
              "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
              status?.hasTavilyKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            )}>
              {status?.hasTavilyKey ? 'Connected' : 'Missing'}
            </span>
          </div>

          {/* Firecrawl */}
          <div className="p-3 border border-zinc-850 rounded-xl bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                <Key size={15} />
              </span>
              <div>
                <h5 className="text-xs font-semibold text-foreground">Firecrawl Key</h5>
                <p className="text-[9px] text-zinc-600 mt-0.5">Scrapes content reference details</p>
              </div>
            </div>
            <span className={clsx(
              "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
              status?.hasFirecrawlKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            )}>
              {status?.hasFirecrawlKey ? 'Connected' : 'Missing'}
            </span>
          </div>

          {/* Slack Bot Token */}
          <div className="p-3 border border-zinc-850 rounded-xl bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                <Key size={15} />
              </span>
              <div>
                <h5 className="text-xs font-semibold text-foreground">Slack Bot Token</h5>
                <p className="text-[9px] text-zinc-600 mt-0.5">Ingests internal Slack posts</p>
              </div>
            </div>
            <span className={clsx(
              "px-2 py-0.5 text-[9px] font-semibold font-mono rounded border uppercase",
              status?.hasSlackToken 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-zinc-900 text-zinc-500 border-zinc-850'
            )}>
              {status?.hasSlackToken ? 'Connected' : 'Mocked'}
            </span>
          </div>
        </div>

        {/* Research Mode block */}
        <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
          <div className="space-y-0.5">
            <h5 className="text-xs font-semibold text-foreground">Research Mode Mode</h5>
            <p className="text-[10px] text-zinc-500">Dynamically detected depending on config keys.</p>
          </div>
          <span className="px-3 py-1 text-xs font-mono font-bold text-primary border border-primary/20 bg-primary/5 rounded-lg uppercase tracking-wider">
            {status?.researchMode === 'tavily+firecrawl' ? 'Tavily + Firecrawl' : 'Google Grounding'}
          </span>
        </div>
      </section>

      {/* SECTION 3: Advanced */}
      <section className="glass-panel rounded-2xl border border-zinc-800 bg-zinc-950/20 overflow-hidden">
        {/* Accordion toggle header */}
        <button
          onClick={() => setIsAdvancedSectionExpanded(!isAdvancedSectionExpanded)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">Section 3 — Advanced Settings</h4>
            <p className="text-[11px] text-zinc-600 mt-0.5">Collapsed raw files JSON editor and logging decay variables.</p>
          </div>
          <span className="text-xs font-semibold text-primary hover:underline cursor-pointer">
            {isAdvancedSectionExpanded ? 'Hide' : 'Show'}
          </span>
        </button>

        {isAdvancedSectionExpanded && (
          <div className="p-6 pt-0 border-t border-zinc-900/60 mt-4 space-y-6">
            
            {/* Split Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-900">
              
              {/* Technical Log Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-850 bg-zinc-950/40">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <TerminalWindow size={14} className="text-zinc-500" />
                    <span>Show Technical Log</span>
                  </h5>
                  <p className="text-[10px] text-zinc-500 max-w-[200px] leading-normal">
                    Splits the Activity panel to show raw logs event stream.
                  </p>
                </div>
                <button
                  onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                  className="text-primary focus:outline-none transition-transform"
                >
                  {isAdvancedMode ? <ToggleRight size={36} weight="fill" /> : <ToggleLeft size={36} className="text-zinc-600" />}
                </button>
              </div>

              {/* Decay Configuration */}
              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sliders size={14} className="text-zinc-500" />
                    <span>Decay Threshold Settings</span>
                  </h5>
                  <p className="text-[10px] text-zinc-500 max-w-[200px] leading-normal">
                    Rules older than this are auto-deleted. (90-day default).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={decayDays}
                    onChange={(e) => setDecayDays(Number(e.target.value))}
                    className="w-16 bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-center text-xs text-foreground outline-none"
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
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileCode size={14} className="text-zinc-500" />
                  <span>Raw Configuration Editor</span>
                </h5>
              </div>

              {/* File selector tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-zinc-900 pb-2">
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
                        "flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                        isSelected 
                          ? 'bg-primary/10 border-primary/20 text-primary' 
                          : 'bg-zinc-950/20 border-zinc-850 hover:border-zinc-800 text-zinc-500 hover:text-zinc-400'
                      )}
                    >
                      <Icon size={12} />
                      <span>{file.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Description line */}
              <div className="text-zinc-500 text-[10px] leading-normal font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="font-semibold text-zinc-400">Target: </span>
                <span className="text-primary">{activeFile}</span>
                <p className="text-[9px] text-zinc-500 mt-1 font-sans font-normal leading-normal">{activeFileConfig?.desc}</p>
              </div>

              {/* Textarea Editor */}
              <div className="relative border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/40 h-80">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 z-10">
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
                  className="w-full h-full bg-transparent border-0 outline-none p-4 text-[11px] font-mono text-zinc-300 leading-relaxed resize-none placeholder-zinc-800 custom-scroll"
                />
              </div>

              {/* Validations & Save */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  {jsonError ? (
                    <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                      <WarningCircle size={12} />
                      <span>JSON Syntax Error: {jsonError}</span>
                    </span>
                  ) : activeFile.endsWith('.json') && filesContent[activeFile] ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle size={12} />
                      <span>JSON Format Valid</span>
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || loading || !!jsonError}
                  className="flex items-center justify-center gap-1.5 py-2 px-5 rounded-lg bg-primary hover:bg-primary/95 disabled:opacity-40 text-white font-semibold text-xs transition-colors shadow-md shadow-primary/20 active:scale-95 shrink-0 w-full sm:w-auto cursor-pointer"
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
