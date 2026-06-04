import React, { useState, useEffect } from 'react';
import { api, Idea, Derivative } from '../lib/api';
import { Stack, ArrowsClockwise, ClipboardText, Check } from '@phosphor-icons/react';

interface RepurposeTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const RepurposeTab: React.FC<RepurposeTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const [derivatives, setDerivatives] = useState<Derivative[]>([]);
  const [activePlatform, setActivePlatform] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadDerivatives = async () => {
    try {
      const res = await api.getFile('derivatives.json');
      if (res.success && res.content.trim() !== '') {
        const parsed = JSON.parse(res.content) as Derivative[];
        setDerivatives(parsed);
        if (parsed.length > 0) {
          setActivePlatform(parsed[0].platform);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadDerivatives();
  }, [activeIdea]);

  const handleGenerate = async () => {
    setLoading(true);
    onLog('info', 'Generating 8 platform-native derivatives (Twitter/X thread, LinkedIn, Newsletter, Short Script, Quote graphics, SEO Blog, etc.) and running Quality Gate review...');

    try {
      const res = await api.repurposeContent();
      if (res.success) {
        onLog('success', 'Repurposing Engine completed successfully. Saved to derivatives.json.');
        setDerivatives(res.derivatives);
        if (res.derivatives.length > 0) {
          setActivePlatform(res.derivatives[0].platform);
        }
        setTimeout(() => {
          onNavigateToTab('revision');
        }, 1500);
      }
    } catch (err: any) {
      onLog('error', `Repurposing failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const activeData = derivatives.find((d) => d.platform === activePlatform);
    if (!activeData) return;
    navigator.clipboard.writeText(activeData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeContent = derivatives.find((d) => d.platform === activePlatform)?.content || '';

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="glass-panel p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Stack className="w-5 h-5 text-primary-400" />
            <span>Repurposing Engine</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Recompiles the approved anchor copy into 8 platform-native derivatives with automated quality gate checks.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium text-sm transition-colors shadow-md active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          {loading ? (
            <>
              <ArrowsClockwise className="w-4 h-4 animate-spin" />
              <span>Generating Derivatives...</span>
            </>
          ) : (
            <>
              <Stack className="w-4 h-4" />
              <span>Generate 8 Derivatives</span>
            </>
          )}
        </button>
      </div>

      {derivatives.length > 0 ? (
        <div className="glass-panel rounded-xl overflow-hidden border border-gray-800 flex flex-col min-h-[400px] animate-in fade-in duration-300">
          {/* Navigation Platform Tabs */}
          <div className="border-b border-gray-800 bg-gray-950/40 px-4 py-2 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {derivatives.map((d) => (
                <button
                  key={d.platform}
                  onClick={() => setActivePlatform(d.platform)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activePlatform === d.platform
                      ? 'bg-primary-600 text-white shadow shadow-primary-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
                  }`}
                >
                  {d.platform}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="py-1 px-2.5 rounded border border-gray-800 hover:border-gray-700 hover:bg-gray-900 text-gray-400 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardText className="w-3.5 h-3.5" />
                  <span>Copy Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 bg-gray-950/10 flex-1 overflow-y-auto custom-scroll max-h-[420px]">
            <pre className="text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-wrap select-text">
              {activeContent}
            </pre>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="glass-panel p-12 rounded-xl border border-gray-800 text-center max-w-md mx-auto">
            <Stack className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-1 text-sm">Derivatives Pending</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Complete the Writer's Council loop, then click "Generate 8 Derivatives" to compile structured posts for X, X Thread, LinkedIn, Newsletter, Instagram, Short Video script, Quotes, and SEO blog post.
            </p>
          </div>
        )
      )}
    </div>
  );
};
