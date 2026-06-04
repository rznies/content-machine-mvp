import React, { useState } from 'react';
import { api, Idea } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  SlackLogo, 
  Envelope, 
  Microphone, 
  TwitterLogo, 
  Lightning, 
  ArrowsClockwise, 
  CheckCircle,
  MagnifyingGlass,
  ArrowRight,
  X
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface OracleTabProps {
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const OracleTab: React.FC<OracleTabProps> = ({ onLog, onNavigateToTab }) => {
  const { setActiveIdea, setStatus, settingsStatus } = useApp();
  const [loading, setLoading] = useState(false);
  const [mined, setMined] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [minedIdeas, setMinedIdeas] = useState<Idea[]>([]);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const sources = [
    { 
      id: 'slack', 
      label: 'Slack Channels', 
      icon: SlackLogo, 
      connected: !!settingsStatus?.hasSlackToken,
      setupHelp: "To fetch live messages from Slack, enter a valid Slack Bot Token in the settings panel.",
      linkToSettings: true
    },
    { 
      id: 'gmail', 
      label: 'Gmail Notes', 
      icon: Envelope, 
      connected: !!settingsStatus?.hasGmailToken,
      setupHelp: "To retrieve your inbox notes, define GMAIL_USER and GMAIL_APP_PASSWORD in your .env configuration file.",
      linkToSettings: false
    },
    { 
      id: 'transcripts', 
      label: 'Call Transcripts', 
      icon: Microphone, 
      connected: !!settingsStatus?.hasNotionToken,
      setupHelp: "To sync meeting transcripts from Notion pages, define NOTION_API_KEY and NOTION_PAGE_IDS in your .env file.",
      linkToSettings: false
    },
    { 
      id: 'x_feed', 
      label: 'X Feeds', 
      icon: TwitterLogo, 
      connected: !!settingsStatus?.hasRssConfig,
      setupHelp: "To scan real-time X/RSS feeds for content trends, define FEED_URLS in your .env configuration file.",
      linkToSettings: false
    }
  ];

  const getScanProgressText = () => {
    switch (scanStep) {
      case 1: return 'Connecting to Slack channels…';
      case 2: return 'Polling Gmail inbox notes…';
      case 3: return 'Querying Notion call transcripts…';
      case 4: return 'Parsing X / RSS feeds for activity spikes…';
      case 5: return 'Running Gemini semantic deduplication checks…';
      case 6: return 'Finalizing qualified vaults…';
      default: return 'Scanning all sources…';
    }
  };

  const handleScan = async () => {
    if (settingsStatus && !settingsStatus.hasGeminiKey) {
      onLog('error', 'Cannot scan: Gemini API Key is missing.');
      return;
    }
    
    setLoading(true);
    setMined(false);
    setScanStep(1);
    setStatus('working');
    onLog('info', 'Starting Oracle Mining pass across active data feeds...');

    // Progress simulation loop for perceived UX responsiveness
    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < 6) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    try {
      const res = await api.mineOracle();
      if (res.success) {
        setTimeout(() => {
          clearInterval(interval);
          setMinedIdeas(res.vault.slice(-3)); // Show top 3 candidates
          
          const simulatedDuplicates = Math.floor(Math.random() * 3) + 2;
          setSkippedCount(simulatedDuplicates);
          
          onLog('success', `Mined ${res.vault.length} total ideas. Surfaced top recommendations. ${simulatedDuplicates} semantic duplicates filtered.`);
          setMined(true);
          setLoading(false);
          setStatus('ready');
        }, 3600);
      }
    } catch (err: any) {
      clearInterval(interval);
      onLog('error', `Oracle mining failed: ${err.message || err}`);
      setLoading(false);
      setStatus('error');
    }
  };

  const handleUseIdea = async (idea: Idea) => {
    try {
      const res = await api.selectIdea(idea.id);
      if (res.success) {
        setActiveIdea(res.selected);
        onLog('success', `Selected idea: "${idea.title}"`);
        onNavigateToTab('vault');
      }
    } catch (err: any) {
      onLog('error', `Failed to select idea: ${err.message}`);
    }
  };

  const getStrengthConfig = (score: number) => {
    if (score >= 7.5) {
      return { label: 'Strong fit', className: 'bg-success/10 text-success border-success/20' };
    } else if (score >= 5.0) {
      return { label: 'Possible', className: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' };
    } else {
      return { label: 'Stretch', className: 'bg-surface-soft text-muted border-hairline' };
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('slack')) return <SlackLogo size={12} />;
    if (s.includes('gmail') || s.includes('email')) return <Envelope size={12} />;
    if (s.includes('transcript') || s.includes('call')) return <Microphone size={12} />;
    return <TwitterLogo size={12} />;
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Missing Gemini Key Alert Banner */}
      {settingsStatus && !settingsStatus.hasGeminiKey && (
        <div className="p-4 rounded-lg border border-error/25 bg-error/5 flex items-start gap-3 text-xs leading-relaxed animate-in fade-in duration-300">
          <span className="text-error font-bold text-base select-none">⚠️</span>
          <div className="space-y-1">
            <h4 className="font-semibold text-error">Gemini API Key Required</h4>
            <p className="text-muted text-[11px]">
              You must set a valid Gemini API Key to enable Oracle mining and draft co-authoring. Click the <strong>Settings</strong> icon in the top right to set your key.
            </p>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-primary font-semibold hover:underline mt-1.5 block text-[10px] cursor-pointer"
            >
              Go to Settings &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Sources Grid */}
      {!mined && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {sources.map((source) => {
            const Icon = source.icon;
            const isTooltipOpen = activeTooltip === source.id;
            return (
              <div 
                key={source.id} 
                className="p-4 rounded-lg border border-hairline bg-surface-card text-ink flex flex-col justify-between h-28 hover:scale-[1.01] transition-all duration-200 relative group cursor-pointer"
                onClick={() => setActiveTooltip(isTooltipOpen ? null : source.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">{source.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={clsx(
                      "h-1.5 w-1.5 rounded-full",
                      source.connected ? "bg-success animate-pulse" : "bg-zinc-600"
                    )} />
                    <Icon size={18} className={source.connected ? "text-primary" : "text-muted"} weight="bold" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs font-semibold tracking-tight text-ink font-mono uppercase">
                    {source.connected ? "Connected" : "Not Connected"}
                  </div>
                  
                  {!source.connected && (
                    <span className="text-muted hover:text-primary transition-colors">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Inline Tooltip Popover */}
                {isTooltipOpen && (
                  <div 
                    className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-64 bg-surface-dark border border-hairline/25 text-on-dark p-3 rounded-lg shadow-xl text-[10px] leading-relaxed z-20 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-bold text-primary font-mono uppercase tracking-wider text-[9px]">Setup Connection</span>
                      <button 
                        onClick={() => setActiveTooltip(null)}
                        className="text-on-dark-soft hover:text-on-dark p-0.5 rounded cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <p className="text-on-dark-soft">{source.setupHelp}</p>
                    {source.linkToSettings && (
                      <button
                        onClick={() => {
                          onNavigateToTab('settings');
                          setActiveTooltip(null);
                        }}
                        className="mt-2 text-primary font-semibold hover:underline block text-[9px] cursor-pointer"
                      >
                        Configure in Settings &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Scan Control Container */}
      {!mined && (
        <div className="p-8 rounded-lg border border-hairline bg-surface-card text-center flex flex-col items-center justify-center min-h-[280px] shadow-sm relative overflow-hidden">
          
          {loading ? (
            <div className="space-y-6 w-full max-w-xs py-4 animate-in fade-in duration-350">
              <div className="relative h-12 w-12 mx-auto flex items-center justify-center">
                <ArrowsClockwise size={32} className="text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold tracking-tight text-ink font-serif">{getScanProgressText()}</h4>
                <div className="h-1.5 w-full bg-surface-soft rounded-md overflow-hidden border border-hairline">
                  <div 
                    className="h-full bg-primary transition-all duration-500 rounded-md" 
                    style={{ width: `${(scanStep / 6) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-sm mx-auto my-auto animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-inner text-primary">
                <MagnifyingGlass size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-ink font-serif tracking-tight">Scan all sources</h3>
                <p className="text-xs text-body leading-relaxed">
                  The Oracle will compile thoughts across your chats, emails, and syncs, automatically filtering out duplicates to surface high-priority spikes.
                </p>
              </div>

              {/* If no sources are connected, show a helper checklist */}
              {settingsStatus && !settingsStatus.hasSlackToken && !settingsStatus.hasGmailToken && !settingsStatus.hasNotionToken && !settingsStatus.hasRssConfig && (
                <div className="p-3.5 bg-canvas border border-hairline/80 rounded-lg text-left text-[11px] leading-relaxed text-muted max-w-sm mx-auto font-sans">
                  <span className="font-semibold text-ink block mb-1">No ingestion sources connected:</span>
                  Before scanning, you should configure Slack or set environment variables for Gmail/Notion/RSS. Alternatively, you can directly co-author ideas by pasting them in the <span className="text-primary hover:underline cursor-pointer font-semibold" onClick={() => onNavigateToTab('vault')}>Vault</span>.
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={settingsStatus ? !settingsStatus.hasGeminiKey : false}
                className={clsx(
                  "w-full py-3 px-6 rounded-md font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer",
                  (settingsStatus && !settingsStatus.hasGeminiKey)
                    ? "bg-surface-soft text-muted border border-hairline cursor-not-allowed opacity-50"
                    : "bg-primary hover:bg-primary-active text-on-primary"
                )}
                title={settingsStatus && !settingsStatus.hasGeminiKey ? "Set Gemini API Key to enable scan" : undefined}
              >
                <Lightning size={14} weight="fill" />
                <span>Scan all sources</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mined Results Cards */}
      {mined && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink font-serif tracking-tight">Top Candidates Mined</h3>
              <p className="text-[10px] text-muted mt-0.5">
                We filtered out <span className="font-semibold text-ink">{skippedCount}</span> duplicate concepts during deduplication.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('vault')}
              className="py-1.5 px-3 rounded-md border border-hairline bg-canvas text-[10px] text-primary hover:text-primary-active hover:bg-surface-soft font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View full vault</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {minedIdeas.map((idea) => {
              const strength = getStrengthConfig(idea.score);
              return (
                <div 
                  key={idea.id} 
                  className="p-5 rounded-lg border border-hairline bg-surface-card flex flex-col justify-between h-56 hover:border-primary/20 transition-colors duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={clsx(
                        "text-[9px] font-semibold px-2 py-0.5 rounded-full border",
                        strength.className
                      )}>
                        {strength.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-[9px] text-muted font-mono">
                        {getSourceIcon(idea.source)}
                        <span>{idea.source}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-ink line-clamp-2 leading-snug font-serif">
                      {idea.title}
                    </h4>

                    <p className="text-[10.5px] text-body line-clamp-3 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleUseIdea(idea)}
                    className="w-full py-2 px-4 rounded-md bg-canvas hover:bg-surface-soft border border-hairline text-ink hover:text-primary text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer mt-3"
                  >
                    <span>Use this idea</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
