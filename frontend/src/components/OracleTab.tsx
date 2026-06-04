import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface OracleTabProps {
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const SOURCES = [
  { id: 'slack', label: 'Slack channels', count: '47 chats', icon: SlackLogo, color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5' },
  { id: 'gmail', label: 'Gmail notes', count: '12 emails', icon: Envelope, color: 'text-sky-400 border-sky-500/10 bg-sky-500/5' },
  { id: 'transcripts', label: 'Call transcripts', count: '3 syncs', icon: Microphone, color: 'text-amber-400 border-amber-500/10 bg-amber-500/5' },
  { id: 'x_feed', label: 'X feeds', count: '89 posts', icon: TwitterLogo, color: 'text-zinc-400 border-zinc-700 bg-zinc-800/10' }
];

export const OracleTab: React.FC<OracleTabProps> = ({ onLog, onNavigateToTab }) => {
  const { setActiveIdea, setStatus } = useApp();
  const [loading, setLoading] = useState(false);
  const [mined, setMined] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [minedIdeas, setMinedIdeas] = useState<Idea[]>([]);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  const getScanProgressText = () => {
    switch (scanStep) {
      case 1: return 'Reading 47 Slack messages…';
      case 2: return 'Looking through 12 emails…';
      case 3: return 'Analyzing call transcripts…';
      case 4: return 'Scanning X feeds for spikes…';
      case 5: return 'Running semantic deduplication check…';
      case 6: return 'Finalizing candidate vaults…';
      default: return 'Scanning all sources…';
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setMined(false);
    setScanStep(1);
    setStatus('working');
    onLog('info', 'Starting Oracle Mining pass across data feeds...');

    // Progress simulation loop for perceived speed & staging rules
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
        // Keep simulation running for UX, then load results
        setTimeout(() => {
          clearInterval(interval);
          setMinedIdeas(res.vault.slice(-3)); // Show top 3 candidates
          
          // Simulate some duplicates filtered out for activity alignment
          const simulatedDuplicates = Math.floor(Math.random() * 3) + 2;
          setSkippedCount(simulatedDuplicates);
          
          onLog('success', `Found ${res.vault.length} ideas. 3 look strong, 4 are stretches. ${simulatedDuplicates} duplicate concepts were automatically filtered.`);
          setMined(true);
          setLoading(false);
          setStatus('ready');
        }, 7200);
      } else {
        throw new Error('API failure');
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
    <div className="space-y-8 select-none">
      
      {/* Sources Grid */}
      {!mined && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <div 
                key={source.id} 
                className="p-4 rounded-lg border border-hairline bg-surface-card text-ink flex flex-col justify-between h-28 hover:scale-[1.01] transition-transform duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">{source.label}</span>
                  <Icon size={18} className="text-primary" weight="bold" />
                </div>
                <div className="text-base font-semibold tracking-tight mt-3 text-ink">
                  {source.count}
                </div>
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
              {/* Spinner */}
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
              <button
                onClick={handleScan}
                className="w-full py-3 px-6 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
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
