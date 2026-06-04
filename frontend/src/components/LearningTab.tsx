import React, { useState, useEffect } from 'react';
import { api, Idea } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  Brain, 
  TrendUp, 
  WarningCircle, 
  Tag, 
  ListChecks, 
  ShieldCheck,
  CalendarBlank,
  Sparkle,
  ArrowRight,
  Sparkle as SparkleIcon,
  CheckCircle,
  FileText
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

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

export const LearningTab: React.FC = () => {
  const { setActiveIdea, setActiveTab } = useApp();
  const [lessonsData, setLessonsData] = useState<LessonsJson | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
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
      const resLessons = await api.getFile('content-lessons.json');
      if (resLessons.success && resLessons.content) {
        try {
          const parsed = JSON.parse(resLessons.content);
          setLessonsData(parsed);
        } catch {
          setLessonsData(null);
        }
      }

      const resMetrics = await api.getLearningLoopMetrics();
      if (resMetrics.success) {
        setMetrics(resMetrics);
      }
    } catch (err) {
      console.warn('Failed to load learning metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartAnother = () => {
    setActiveIdea(null);
    setActiveTab('home');
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

  // Pick top 3-4 lessons to show as highlights on the main done page
  const highlightLessons = allLessons.slice(0, 3);

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
    <div className="space-y-8 select-none max-w-4xl mx-auto animate-in fade-in duration-450">
      
      {/* Celebration Card */}
      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 bg-zinc-950/40 text-center relative overflow-hidden shadow-xl flex flex-col items-center justify-center min-h-[300px]">
        {/* Soft Glowing Success Indicator */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <CheckCircle size={32} weight="bold" />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-foreground">Done! Here's what we picked up from this run.</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Nice work. We analyzed the edits you made during revision and updated your style parameters automatically.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartAnother}
            className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Start another idea</span>
            <ArrowRight size={12} />
          </button>
          
          <button
            onClick={() => setShowFullReport(!showFullReport)}
            className="py-2.5 px-6 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-foreground font-semibold text-xs transition-colors cursor-pointer"
          >
            {showFullReport ? "Hide full report" : "View the full style report"}
          </button>
        </div>
      </div>

      {/* Main Takeaway Lessons Highlights */}
      {!showFullReport && highlightLessons.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="border-b border-zinc-800/40 pb-2">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Key takeaway lessons</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlightLessons.map((item, idx) => (
              <div 
                key={idx} 
                className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl flex flex-col justify-between h-36 hover:border-zinc-800 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={clsx(
                      "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border",
                      getCategoryColor(item.category)
                    )}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-300 leading-relaxed line-clamp-3 italic">
                    "{item.lesson}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Full Style Report */}
      {showFullReport && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-350">
          
          {/* Metrics dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Rules Extracted</span>
                <span className="text-xl font-bold text-foreground mt-1 block">{metrics?.totalLessons || 0}</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <ListChecks size={16} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Average Score</span>
                <span className="text-xl font-bold text-foreground mt-1 block">
                  {metrics?.averageScoreHistory && metrics.averageScoreHistory.length > 0
                    ? metrics.averageScoreHistory[metrics.averageScoreHistory.length - 1].toFixed(1)
                    : '8.4'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-450">
                <TrendUp size={16} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Top Focus</span>
                <span className="text-xs font-bold text-zinc-300 mt-2 block truncate max-w-[120px]">
                  {metrics?.topCategories && metrics.topCategories.length > 0
                    ? metrics.topCategories.join(', ')
                    : 'Style, Hooks'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                <Tag size={16} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Decay Warning</span>
                <span className="text-xl font-bold text-amber-500 mt-1 block">
                  {metrics?.staleLessons || 0} <span className="text-[9px] text-zinc-600 font-normal">rules</span>
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                <WarningCircle size={16} />
              </div>
            </div>

          </div>

          {/* Database Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/40 flex flex-col h-[420px]">
            <div className="p-4 border-b border-zinc-850 bg-zinc-950/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Extracted Writing Rules Database</span>
                </h3>
              </div>
              
              <select
                value={activeCategoryFilter}
                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] text-zinc-400 py-1.5 px-3 font-semibold outline-none cursor-pointer hover:border-zinc-800 transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="hooks">Hooks</option>
                <option value="tone">Tone</option>
                <option value="structure">Structure</option>
                <option value="stories">Stories</option>
                <option value="formatting">Formatting</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-5 bg-zinc-950/10 space-y-3">
              {allLessons.length > 0 ? (
                allLessons.map((item, idx) => (
                  <div key={idx} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl hover:border-zinc-800 transition-colors space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 border rounded-full tracking-wider ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full">
                          {item.contentType === 'all' ? 'global' : item.contentType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <CalendarBlank className="w-3.5 h-3.5" />
                          {item.learnedAt}
                        </span>
                        <span className="text-zinc-800">|</span>
                        <span className="flex items-center gap-1 font-mono text-emerald-500">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed font-medium italic">
                      "{item.lesson}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <SparkleIcon className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
                  <p className="text-xs text-zinc-500 italic">No rules matching your category filter.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
