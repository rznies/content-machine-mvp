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
      case 'hooks': return 'bg-accent-teal/10 text-accent-teal border-accent-teal/20';
      case 'tone': return 'bg-primary/10 text-primary border-primary/25';
      case 'structure': return 'bg-accent-amber/10 text-accent-amber border-accent-amber/20';
      case 'stories': return 'bg-primary/10 text-primary border-primary/25';
      case 'formatting': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-surface-soft text-muted border-hairline';
    }
  };

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto animate-in fade-in duration-450">
      
      {/* Celebration Card */}
      <div className="p-8 rounded-lg border border-hairline bg-surface-card text-center relative overflow-hidden shadow-sm flex flex-col items-center justify-center min-h-[300px] text-ink font-sans">
        {/* Soft Glowing Success Indicator */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-150 animate-pulse" />
          <div className="relative w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <CheckCircle size={32} weight="bold" />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold font-serif text-ink">Done! Here's what we picked up from this run.</h2>
          <p className="text-xs text-body leading-relaxed">
            Nice work. We analyzed the edits you made during revision and updated your style parameters automatically.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartAnother}
            className="py-2 px-5 rounded-md bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Start another idea</span>
            <ArrowRight size={12} />
          </button>
          
          <button
            onClick={() => setShowFullReport(!showFullReport)}
            className="py-2 px-5 rounded-md border border-hairline hover:border-muted bg-canvas hover:bg-surface-soft text-body hover:text-ink font-semibold text-xs transition-colors cursor-pointer"
          >
            {showFullReport ? "Hide full report" : "View the full style report"}
          </button>
        </div>
      </div>

      {/* Main Takeaway Lessons Highlights */}
      {!showFullReport && highlightLessons.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300 font-sans">
          <div className="border-b border-hairline/60 pb-2">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Key takeaway lessons</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlightLessons.map((item, idx) => (
              <div 
                key={idx} 
                className="p-5 border border-hairline bg-surface-card rounded-lg flex flex-col justify-between h-36 hover:border-muted transition-colors text-ink"
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
                  <p className="text-[10.5px] text-body leading-relaxed line-clamp-3 italic">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-ink font-sans">
            
            <div className="p-4 rounded-lg border border-hairline bg-surface-card flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest block">Rules Extracted</span>
                <span className="text-xl font-bold text-ink mt-1 block">{metrics?.totalLessons || 0}</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <ListChecks size={16} />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-hairline bg-surface-card flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest block">Average Score</span>
                <span className="text-xl font-bold text-ink mt-1 block font-mono">
                  {metrics?.averageScoreHistory && metrics.averageScoreHistory.length > 0
                    ? metrics.averageScoreHistory[metrics.averageScoreHistory.length - 1].toFixed(1)
                    : '8.4'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center border border-success/20 text-success">
                <TrendUp size={16} />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-hairline bg-surface-card flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest block">Top Focus</span>
                <span className="text-xs font-bold text-body mt-2 block truncate max-w-[120px]">
                  {metrics?.topCategories && metrics.topCategories.length > 0
                    ? metrics.topCategories.join(', ')
                    : 'Style, Hooks'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-accent-teal/10 flex items-center justify-center border border-accent-teal/20 text-accent-teal">
                <Tag size={16} />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-hairline bg-surface-card flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest block">Decay Warning</span>
                <span className="text-xl font-bold text-accent-amber mt-1 block">
                  {metrics?.staleLessons || 0} <span className="text-[9px] text-muted font-normal">rules</span>
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-accent-amber/10 flex items-center justify-center border border-accent-amber/20 text-accent-amber">
                <WarningCircle size={16} />
              </div>
            </div>

          </div>

          {/* Database Grid */}
          <div className="rounded-lg overflow-hidden border border-hairline bg-surface-card flex flex-col h-[420px] text-ink font-sans">
            <div className="p-4 border-b border-hairline/60 bg-surface-soft/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Extracted Writing Rules Database</span>
                </h3>
              </div>
              
              <select
                value={activeCategoryFilter}
                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                className="bg-background border border-hairline rounded-md text-[10px] text-body py-1.5 px-3 font-semibold outline-none cursor-pointer hover:border-muted transition-colors"
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
                  <div key={idx} className="p-4 bg-background border border-hairline/60 rounded-md hover:border-hairline transition-colors space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 border rounded-full tracking-wider ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-[8px] text-muted font-mono bg-surface-soft border border-hairline px-2 py-0.5 rounded-full">
                          {item.contentType === 'all' ? 'global' : item.contentType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] text-muted font-semibold">
                        <span className="flex items-center gap-1">
                          <CalendarBlank className="w-3.5 h-3.5" />
                          {item.learnedAt}
                        </span>
                        <span className="text-hairline">|</span>
                        <span className="flex items-center gap-1 font-mono text-success">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-body leading-relaxed font-medium italic">
                      "{item.lesson}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <SparkleIcon className="w-12 h-12 text-muted mb-3 animate-pulse" />
                  <p className="text-xs text-muted italic">No rules matching your category filter.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
