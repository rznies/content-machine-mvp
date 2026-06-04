import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { MarkdownViewer } from './MarkdownViewer';
import { FileArrowDown, ArrowsClockwise } from '@phosphor-icons/react';

interface ProductionTabProps {
  activeIdea: Idea | null;
  onLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  activeIdea,
  onLog,
  onNavigateToTab,
}) => {
  const [productionText, setProductionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [compiled, setCompiled] = useState(false);

  const loadProduction = async () => {
    try {
      const res = await api.getFile('production-raw.md');
      if (res.success && res.content.trim() !== '') {
        setProductionText(res.content);
        setCompiled(true);
      }
    } catch (consts) {
      // Ignore
    }
  };

  useEffect(() => {
    loadProduction();
  }, [activeIdea]);

  const handleCompile = async () => {
    if (compiled) {
      onNavigateToTab('refinement');
      return;
    }

    setLoading(true);
    onLog('info', 'Compiling production transcript to raw reference markdown...');

    try {
      const res = await api.compileProduction();
      if (res.success) {
        onLog('success', 'Production markdown successfully compiled & saved to production-raw.md.');
        setProductionText(res.productionRaw);
        setCompiled(true);
      }
    } catch (err: any) {
      onLog('error', `Production compilation failed: ${err.message || err}`);
      setProductionText(`### Compilation Error\n\n${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileArrowDown className="w-5 h-5 text-primary-400" />
            <span>Production Markdown Builder</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Translates the conversational interview history into a structured index of quotes, raw metrics, and emotional anchors.
          </p>
        </div>

        <button
          onClick={handleCompile}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium text-sm transition-colors shadow-md active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          {loading ? (
            <>
              <ArrowsClockwise className="w-4 h-4 animate-spin" />
              <span>Compiling Raw File...</span>
            </>
          ) : compiled ? (
            <>
              <span>Continue to Write first draft &rarr;</span>
            </>
          ) : (
            <>
              <FileArrowDown className="w-4 h-4" />
              <span>Compile Raw File</span>
            </>
          )}
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-gray-800">
        <div className="p-4 font-semibold text-xs border-b border-gray-800 bg-gray-950/40 text-gray-400 tracking-wide uppercase">
          Compiled File: production-raw.md
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto custom-scroll min-h-[300px]">
          {productionText ? (
            <MarkdownViewer content={productionText} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-sm text-gray-500 italic max-w-sm">
                Production record empty. Complete the Interview Panel step and click "Compile Raw File" to extract insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
