import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CaretDown, CaretUp, MagnifyingGlass, Lightning } from '@phosphor-icons/react';

interface OracleTabProps {
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

interface MockData {
  slack: Array<{ channel: string; author: string; text: string }>;
  gmail: Array<{ subject: string; body: string }>;
  transcripts: Array<{ title: string; content: string }>;
  x_feed: Array<{ author: string; text: string }>;
}

export const OracleTab: React.FC<OracleTabProps> = ({ onLog, onNavigateToTab }) => {
  const [loading, setLoading] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [mockData, setMockData] = useState<MockData | null>(null);

  useEffect(() => {
    // Load mock inputs preview on mount
    fetch('/db/mock-inputs.json')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setMockData(data))
      .catch(() => {
        // Fallback mock values
        setMockData({
          slack: [{ channel: '#product-ideas', author: 'Alice', text: 'AI voice is ruined by academic paraphrasing...' }],
          gmail: [{ subject: 'Sync Notes', body: 'Linked essay drove 80% pipeline growth...' }],
          transcripts: [{ title: 'Founder Sync', content: "CEO: 'Interview builders, extract raw stories...'" }],
          x_feed: [{ author: '@levie', text: "Centaur software integrates human stories..." }],
        });
      });
  }, []);

  const handleMine = async () => {
    setLoading(true);
    onLog('info', 'Starting Oracle Mining pass across Slack, Gmail, X, and Notion logs...');

    try {
      const res = await api.mineOracle();
      if (res.success) {
        onLog('success', `Oracle identified & qualified ${res.minedCount} new content ideas from data feeds!`);
        setTimeout(() => {
          setLoading(false);
          // Redirect to Vault
          onNavigateToTab('vault');
        }, 1500);
      } else {
        throw new Error('API reported failure');
      }
    } catch (err: any) {
      onLog('error', `Oracle mining failed: ${err.message || err}`);
      setLoading(false);
    }
  };

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Accordion Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-2">Sources & Communications Feeds</h3>
          <p className="text-sm text-gray-400 mb-6">
            Preview of communications channels containing raw ideas, synced chats, and feeds.
          </p>

          <div className="space-y-3">
            {/* Slack */}
            <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/30">
              <button
                onClick={() => toggleAccordion('slack')}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-200 hover:bg-gray-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">💬</span> Slack (#general, #product-ideas)
                </span>
                {activeAccordion === 'slack' ? <CaretUp className="w-4 h-4 text-gray-400" /> : <CaretDown className="w-4 h-4 text-gray-400" />}
              </button>
              {activeAccordion === 'slack' && (
                <div className="p-4 border-t border-gray-800 bg-gray-950/60 font-mono text-xs text-gray-400 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scroll">
                  {mockData?.slack
                    ? mockData.slack.map((s, i) => `[${s.channel}] ${s.author}: "${s.text}"`).join('\n\n')
                    : 'Loading feeds preview...'}
                </div>
              )}
            </div>

            {/* Gmail */}
            <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/30">
              <button
                onClick={() => toggleAccordion('gmail')}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-200 hover:bg-gray-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sky-400">📧</span> Gmail (partner@tenex_labs.com)
                </span>
                {activeAccordion === 'gmail' ? <CaretUp className="w-4 h-4 text-gray-400" /> : <CaretDown className="w-4 h-4 text-gray-400" />}
              </button>
              {activeAccordion === 'gmail' && (
                <div className="p-4 border-t border-gray-800 bg-gray-950/60 font-mono text-xs text-gray-400 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scroll">
                  {mockData?.gmail
                    ? mockData.gmail.map((g, i) => `Subject: ${g.subject}\nBody: ${g.body}`).join('\n\n')
                    : 'Loading feeds preview...'}
                </div>
              )}
            </div>

            {/* Notion */}
            <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/30">
              <button
                onClick={() => toggleAccordion('notion')}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-200 hover:bg-gray-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">🎙️</span> Call Transcripts (Founder Sync)
                </span>
                {activeAccordion === 'notion' ? <CaretUp className="w-4 h-4 text-gray-400" /> : <CaretDown className="w-4 h-4 text-gray-400" />}
              </button>
              {activeAccordion === 'notion' && (
                <div className="p-4 border-t border-gray-800 bg-gray-950/60 font-mono text-xs text-gray-400 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scroll">
                  {mockData?.transcripts
                    ? mockData.transcripts.map((t, i) => `${t.title}:\n${t.content}`).join('\n\n')
                    : 'Loading feeds preview...'}
                </div>
              )}
            </div>

            {/* X Feeds */}
            <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/30">
              <button
                onClick={() => toggleAccordion('x')}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-200 hover:bg-gray-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-gray-400">🐦</span> X/Twitter Feed Curation (@levie, etc)
                </span>
                {activeAccordion === 'x' ? <CaretUp className="w-4 h-4 text-gray-400" /> : <CaretDown className="w-4 h-4 text-gray-400" />}
              </button>
              {activeAccordion === 'x' && (
                <div className="p-4 border-t border-gray-800 bg-gray-950/60 font-mono text-xs text-gray-400 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scroll">
                  {mockData?.x_feed
                    ? mockData.x_feed.map((x, i) => `${x.author}: "${x.text}"`).join('\n\n')
                    : 'Loading feeds preview...'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Column */}
      <div className="flex flex-col">
        <div className="glass-panel p-6 rounded-xl flex-grow flex flex-col justify-between text-center items-center">
          <div className="my-auto space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-3xl mx-auto shadow-inner shadow-primary-500/10 text-primary-400">
              <MagnifyingGlass className="w-10 h-10 animate-pulse-slow" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Scan & Mine for Spikes</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                The Oracle runs an AI evaluation pass across your communication histories, extracting spikes where valuable thoughts occur and scoring them &ge; 6/10.
              </p>
            </div>
          </div>

          <button
            onClick={handleMine}
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none glow-button`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Mining Feeds (Running Oracle)...</span>
              </>
            ) : (
              <>
                <Lightning className="w-5 h-5" />
                <span>Start Mining Pass</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
