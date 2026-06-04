import React, { useState, useEffect } from 'react';
import { api, SettingsStatus } from '../lib/api';
import { 
  Gear, 
  FloppyDisk, 
  WarningCircle, 
  CheckCircle,
  FileCode,
  FileText,
  ShieldWarning,
  Sparkle
} from '@phosphor-icons/react';

interface SettingsTabProps {
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

const FILES_CONFIG = [
  { name: 'style-guide.md', label: 'Markdown Guide', icon: FileText, desc: 'Legacy human-readable voice style guidelines.' },
  { name: 'style-system.json', label: 'Structured JSON Style', icon: FileCode, desc: 'Structured, AI-operable settings rules and platform limits.' },
  { name: 'anti-slop.json', label: 'Anti-Slop Guidelines', icon: ShieldWarning, desc: 'Vocabulary blocklist and standard phrase replacements.' },
  { name: 'golden-examples.json', label: 'Golden Examples', icon: Sparkle, desc: 'Curated list of high-performing anchor content posts.' }
];

export const SettingsTab: React.FC<SettingsTabProps> = ({ onLog }) => {
  const [activeFile, setActiveFile] = useState('style-system.json');
  const [filesContent, setFilesContent] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const resStatus = await api.getSettingsStatus();
      setStatus(resStatus);
    } catch (err: any) {
      onLog('error', `Failed to check settings status: ${err.message || err}`);
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

    // Perform real-time JSON validation
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
    
    // Extra validation step before saving JSON
    if (activeFile.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (err: any) {
        setJsonError(err.message);
        onLog('error', `Cannot save ${activeFile}: Invalid JSON format.`);
        return;
      }
    }

    setSaving(true);
    onLog('info', `Saving updated config: ${activeFile}...`);
    try {
      const res = await api.saveFile(activeFile, content);
      if (res.success) {
        onLog('success', `${activeFile} saved successfully.`);
        // Reload settings status in case of API updates (e.g. key triggers)
        const resStatus = await api.getSettingsStatus();
        setStatus(resStatus);
      }
    } catch (err: any) {
      onLog('error', `Failed to save ${activeFile}: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const activeFileConfig = FILES_CONFIG.find(f => f.name === activeFile);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Configuration Status Card */}
      <div className="glass-panel p-6 rounded-xl border border-gray-800 space-y-4">
        <div className="flex items-center gap-2">
          <Gear className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-bold text-white">System API Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Gemini API Key */}
          <div className={`p-4 rounded-lg border flex flex-col justify-between h-24 ${
            status?.hasGeminiKey 
              ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-400'
              : 'bg-rose-950/10 border-rose-900/40 text-rose-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Gemini Pro/Flash</span>
              {status?.hasGeminiKey ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <WarningCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <div className="text-xs font-semibold mt-2">
              {status?.hasGeminiKey ? 'Active Key Loaded' : 'Key Missing (.env)'}
            </div>
          </div>

          {/* Tavily API Key */}
          <div className={`p-4 rounded-lg border flex flex-col justify-between h-24 ${
            status?.hasTavilyKey 
              ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-400'
              : 'bg-amber-950/10 border-amber-900/40 text-amber-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Tavily (Search)</span>
              {status?.hasTavilyKey ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <WarningCircle className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="text-xs font-semibold mt-2">
              {status?.hasTavilyKey ? 'Active Key Loaded (Free/Pro)' : 'Key Missing (.env)'}
            </div>
          </div>

          {/* Firecrawl API Key */}
          <div className={`p-4 rounded-lg border flex flex-col justify-between h-24 ${
            status?.hasFirecrawlKey 
              ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-400'
              : 'bg-amber-950/10 border-amber-900/40 text-amber-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Firecrawl (Scraper)</span>
              {status?.hasFirecrawlKey ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <WarningCircle className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="text-xs font-semibold mt-2">
              {status?.hasFirecrawlKey ? 'Active Key Loaded' : 'Key Missing (.env)'}
            </div>
          </div>

          {/* Research Mode */}
          <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/30 text-zinc-400 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Research Mode</span>
            <div className="text-xs font-mono font-bold text-primary-400 mt-2">
              {status?.researchMode === 'tavily+firecrawl' ? 'TAVILY + FIRECRAWL' : 'GOOGLE GROUNDING'}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Panel with multi-file tabs */}
      <div className="glass-panel p-6 rounded-xl border border-gray-800 space-y-4">
        {/* Tab selector */}
        <div className="flex flex-wrap gap-2 border-b border-gray-900 pb-3">
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
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                  isSelected 
                    ? 'bg-primary-600/10 border-primary-500/30 text-primary-400' 
                    : 'bg-zinc-950/30 border-gray-900 hover:border-gray-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{file.label}</span>
              </button>
            );
          })}
        </div>

        {/* Info label */}
        <div className="text-zinc-400 text-xs">
          <span className="font-semibold text-white">File: </span>
          <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] text-primary-400">{activeFile}</span>
          <p className="text-[11px] text-zinc-500 mt-1">{activeFileConfig?.desc}</p>
        </div>

        {/* Editor Box */}
        <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-gray-950/40 h-96">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 z-10">
              <svg className="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
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
            className="w-full h-full bg-transparent border-0 outline-none p-4 text-xs font-mono text-zinc-300 leading-relaxed resize-none placeholder-zinc-800 custom-scroll"
          />
        </div>

        {/* Validation & Actions Footer */}
        <div className="pt-2 border-t border-gray-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left w-full sm:w-auto">
            {jsonError ? (
              <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <WarningCircle className="w-3.5 h-3.5" />
                <span>JSON Syntax Error: {jsonError}</span>
              </span>
            ) : activeFile.endsWith('.json') && filesContent[activeFile] ? (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>JSON Format Valid</span>
              </span>
            ) : null}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading || !!jsonError}
            className="flex items-center justify-center gap-1.5 py-2 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors shadow-md shadow-primary-500/10 active:scale-95 shrink-0 w-full sm:w-auto"
          >
            <FloppyDisk className="w-3.5 h-3.5" />
            <span>Save active file</span>
          </button>
        </div>
      </div>
    </div>
  );
};
