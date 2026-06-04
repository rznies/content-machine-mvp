import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { 
  Brain, 
  TrendUp, 
  WarningCircle, 
  Tag, 
  ListChecks, 
  ShieldCheck,
  CalendarBlank,
  Sparkle
} from '@phosphor-icons/react';

interface LearningTabProps {
  activeIdea: Idea | null;
}

interface LessonItem {
  lesson: string;
  category: string;
  contentType: string;
  learnedAt: string;
  confidence: number;
}

interface LessonsJson {
  global: LessonItem[];
  byContentType: Record<string, LessonItem[]>;
}

export const LearningTab: React.FC<LearningTabProps> = ({ activeIdea }) => {
  const [firstDraft, setFirstDraft] = useState('');
  const [finalDraft, setFinalDraft] = useState('');
  const [lessonsData, setLessonsData] = useState<LessonsJson | null>(null);
  
  const [metrics, setMetrics] = useState<{
    totalLessons: number;
    averageScoreHistory: number[];
    topCategories: string[];
    staleLessons: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const resFirst = await api.getFile('draft-first.md');
      const resFinal = await api.getFile('draft-final-approved.md');
      const resLessons = await api.getFile('content-lessons.json');

      if (resFirst.success) setFirstDraft(resFirst.content);
      if (resFinal.success) setFinalDraft(resFinal.content);
      
      if (resLessons.success && resLessons.content) {
        try {
          const parsed = JSON.parse(resLessons.content);
          setLessonsData(parsed);
        } catch {
          // Fallback if legacy md
          setLessonsData(null);
        }
      }

      // Fetch dashboard metrics
      const resMetrics = await api.getLearningLoopMetrics();
      if (resMetrics.success) {
        setMetrics(resMetrics);
      }
    } catch (err) {
      console.warn('Failed to load learning loop data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeIdea]);

  const renderDiff = () => {
    if (!firstDraft && !finalDraft) {
      return (
        <div className="flex items-center justify-center h-48 text-center">
          <p className="text-xs text-gray-500 italic max-w-xs">
            Sign off on content in the Final Revision tab to trigger the comparison.
          </p>
        </div>
      );
    }

    const lines1 = firstDraft.split('\n');
    const lines2 = finalDraft.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const diffNodes: React.ReactNode[] = [];

    for (let i = 0; i < maxLines; i++) {
      const l1 = lines1[i];
      const l2 = lines2[i];

      if (l1 === l2) {
        diffNodes.push(
          <div key={`same-${i}`} className="font-mono text-[11px] text-gray-400 py-0.5 px-3 whitespace-pre-wrap leading-relaxed select-text">
            &nbsp;&nbsp;{l1 || ''}
          </div>
        );
      } else {
        if (l1 !== undefined) {
          diffNodes.push(
            <div key={`rem-${i}`} className="font-mono text-[11px] py-0.5 px-3 bg-rose-950/15 text-rose-450 border-l-2 border-rose-500 whitespace-pre-wrap leading-relaxed select-text">
              -&nbsp;{l1}
            </div>
          );
        }
        if (l2 !== undefined) {
          diffNodes.push(
            <div key={`add-${i}`} className="font-mono text-[11px] py-0.5 px-3 bg-emerald-950/15 text-emerald-450 border-l-2 border-emerald-500 whitespace-pre-wrap leading-relaxed select-text">
              +&nbsp;{l2}
            </div>
          );
        }
      }
    }

    return <div className="space-y-0.5 py-2">{diffNodes}</div>;
  };

  // Extract all lessons list
  const getLessonsList = (): LessonItem[] => {
    if (!lessonsData) return [];
    const list: LessonItem[] = [...(lessonsData.global || [])];
    
    Object.entries(lessonsData.byContentType || {}).forEach(([plat, subList]) => {
      if (Array.isArray(subList)) {
        list.push(...subList);
      }
    });

    if (activeCategoryFilter !== 'all') {
      return list.filter(l => l.category === activeCategoryFilter);
    }
    return list;
  };

  const allLessons = getLessonsList();

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'hooks': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'tone': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'structure': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'stories': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'formatting': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning Metrics Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
        {/* Total Lessons */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Lessons Extracted</span>
            <span className="text-2xl font-black text-white mt-1.5 block">{metrics?.totalLessons || 0}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
            <ListChecks className="w-5 h-5 text-primary-400" />
          </div>
        </div>

        {/* Quality Score Trend */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Quality Score Progress</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-lg font-bold text-white">
                {metrics?.averageScoreHistory && metrics.averageScoreHistory.length > 0
                  ? metrics.averageScoreHistory[metrics.averageScoreHistory.length - 1].toFixed(1)
                  : '8.0'}
              </span>
              <span className="text-[9px] text-gray-500 font-mono">
                {metrics?.averageScoreHistory && metrics.averageScoreHistory.length > 1
                  ? `(${metrics.averageScoreHistory.slice(-3).map(s => s.toFixed(1)).join(' → ')})`
                  : ''}
              </span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <TrendUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Top Categories */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Top Focus Areas</span>
            <div className="flex gap-1.5 mt-2">
              {metrics?.topCategories && metrics.topCategories.length > 0 ? (
                metrics.topCategories.map(cat => (
                  <span key={cat} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-800 bg-gray-900 text-gray-400 uppercase">
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-zinc-500">None yet</span>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Tag className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        {/* Stale / Decay warning */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Rules in Decay Warning</span>
            <span className="text-lg font-bold text-amber-400 mt-1 block">
              {metrics?.staleLessons || 0} <span className="text-[9px] text-gray-500 font-normal">(&gt;60 days old)</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <WarningCircle className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Diff & Learnings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diff View Panel */}
        <div className="glass-panel rounded-xl overflow-hidden border border-gray-800 flex flex-col h-[520px]">
          <div className="p-4 border-b border-gray-850 bg-gray-950/30">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Difference Comparison</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Line-by-line: First AI Draft vs Final Approved version</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-4 bg-gray-950/20 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-950/45">
                <svg className="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            {renderDiff()}
          </div>
        </div>

        {/* Writing Learnings Database */}
        <div className="glass-panel rounded-xl overflow-hidden border border-gray-800 flex flex-col h-[520px]">
          <div className="p-4 border-b border-gray-850 bg-gray-950/30 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-primary-400" />
                <span>Extracted Writing Rules</span>
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Categorized rules stored in system brain database</p>
            </div>
            
            {/* Category Filter */}
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-gray-850 rounded text-[10px] text-zinc-400 py-1 px-2 font-semibold outline-none cursor-pointer hover:border-gray-700 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="hooks">Hooks</option>
              <option value="tone">Tone</option>
              <option value="structure">Structure</option>
              <option value="stories">Stories</option>
              <option value="formatting">Formatting</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-4 bg-gray-950/15 space-y-3 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-950/45">
                <svg className="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            
            {allLessons.length > 0 ? (
              allLessons.map((item, idx) => (
                <div key={idx} className="p-3 bg-zinc-900/40 border border-gray-900 rounded-lg hover:border-gray-850 transition-colors space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 border rounded-full tracking-wider ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono bg-zinc-950/80 border border-gray-950 px-1.5 py-0.5 rounded">
                        {item.contentType === 'all' ? 'global' : item.contentType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <CalendarBlank className="w-3.5 h-3.5" />
                        {item.learnedAt}
                      </span>
                      <span className="text-zinc-700">|</span>
                      <span className="flex items-center gap-1 font-mono text-emerald-450">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    "{item.lesson}"
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkle className="w-12 h-12 text-gray-800 mb-3" />
                <p className="text-xs text-gray-500 italic max-w-xs">
                  No rules found for this category filter. Compile lessons on final revision approval.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
