import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { MarkdownViewer } from './MarkdownViewer';
import { BookOpen, ArrowsClockwise, PaperPlaneRight } from '@phosphor-icons/react';

interface ResearcherTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
}

export const ResearcherTab: React.FC<ResearcherTabProps> = ({ activeIdea, onLog }) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Report Status: Pending');

  const loadReport = async () => {
    try {
      const res = await api.getFile('research-report.md');
      if (res.success && res.content.trim() !== '') {
        setReport(res.content);
        setStatusText('Report Status: Loaded from research-report.md');
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeIdea]);

  const handleResearch = async () => {
    if (!activeIdea) {
      onLog('warning', 'Choose an idea in The Vault first.');
      alert('Please choose an idea from The Vault first.');
      return;
    }

    setLoading(true);
    setStatusText('Report Status: AI Running...');
    setReport('');
    onLog('info', `Running Google Search Grounded Research for idea: "${activeIdea.title}"...`);

    try {
      const res = await api.runResearch();
      if (res.success) {
        onLog('success', 'Sourced Research Report generated successfully.');
        setStatusText('Report Status: Compiled & Saved to research-report.md');
        setReport(res.report);
      }
    } catch (err: any) {
      onLog('error', `Research generation failed: ${err.message || err}`);
      setStatusText('Report Status: Failed');
      setReport(`### Error Running Research\n\n${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-400" />
            <span>Research & Sourcing Agent</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Conducts real-time Google search analyses to outline conventional wisdom, contrarian angles, and structure interviews.
          </p>
        </div>

        <button
          onClick={handleResearch}
          disabled={loading || !activeIdea}
          className="flex items-center justify-center gap-2 py-2 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-sm transition-colors shadow-md shadow-primary-500/10 active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          {loading ? (
            <>
              <ArrowsClockwise className="w-4 h-4 animate-spin" />
              <span>Researching Google...</span>
            </>
          ) : (
            <>
              <PaperPlaneRight className="w-4 h-4" />
              <span>Generate Sourced Report</span>
            </>
          )}
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-gray-800">
        <div className={`p-4 font-semibold text-xs border-b border-gray-800 tracking-wide uppercase ${
          statusText.includes('AI Running')
            ? 'bg-primary-950/20 text-primary-400 border-primary-900/40 animate-pulse'
            : statusText.includes('Failed')
            ? 'bg-rose-950/20 text-rose-400 border-rose-900/40'
            : report
            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40'
            : 'bg-gray-950/40 text-gray-400'
        }`}>
          {statusText}
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto custom-scroll min-h-[300px]">
          {report ? (
            <MarkdownViewer content={report} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-sm text-gray-500 italic max-w-sm">
                {!activeIdea 
                  ? 'No active seed idea selected. Choose an idea from The Vault to start.'
                  : 'Sourced research report pending. Click "Generate Sourced Report" to scrape google and assemble facts.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
