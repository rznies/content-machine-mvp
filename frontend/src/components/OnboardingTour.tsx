import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Brain, 
  Database, 
  Chats, 
  FileText, 
  Compass,
  CheckCircle,
  Key,
  ShieldCheck
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

export const OnboardingTour: React.FC = () => {
  const { showOnboarding, setShowOnboarding } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showOnboarding) return null;

  const slides = [
    {
      title: "Welcome to the Content Machine",
      subtitle: "A Human-AI 'Centaur' Media Pipeline",
      icon: <Brain size={48} className="text-primary animate-pulse" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm leading-relaxed text-body">
          <p>
            Welcome! The <strong>Content Machine</strong> is not a generic AI writer. It is built as a co-authoring system that respects your specific tone, style, and authentic stories.
          </p>
          <p>
            The system works on the <strong>Centaur Philosophy</strong>:
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-hairline bg-canvas/30 text-center">
              <span className="font-bold text-primary block text-xs">First Mile</span>
              <span className="text-[10px] text-muted">You provide raw stories & context</span>
            </div>
            <div className="p-3 rounded-lg border border-hairline bg-canvas/30 text-center">
              <span className="font-bold text-primary block text-xs">Middle Mile</span>
              <span className="text-[10px] text-muted">AI automates research & drafts</span>
            </div>
            <div className="p-3 rounded-lg border border-hairline bg-canvas/30 text-center">
              <span className="font-bold text-primary block text-xs">Last Mile</span>
              <span className="text-[10px] text-muted">You edit; AI learns your rules</span>
            </div>
          </div>
          <p className="text-muted text-[11px] mt-3">
            Since mock data fallbacks have been removed, the app now uses real connections to fetch your insights. Let's look at how the pipeline functions.
          </p>
        </div>
      )
    },
    {
      title: "01. Find and Pick Ideas",
      subtitle: "Steps 1 & 2: Ingestion & Vault",
      icon: <Database size={48} className="text-primary" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm leading-relaxed text-body">
          <p>
            Every great piece of content starts with a genuine spark of insight.
          </p>
          <ul className="space-y-2.5 list-none pl-0">
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">1</span>
              <div>
                <strong className="text-ink">Step 01: Find Ideas (The Oracle)</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  Scan your real messaging channels and workspaces. The Oracle pulls messages, Notion transcripts, Gmail newsletters, or RSS feeds to find topics worth writing about.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">2</span>
              <div>
                <strong className="text-ink">Step 02: Pick an Idea (The Vault)</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  Select a candidate concept from the database and elevate it to start a new co-authoring run.
                </p>
              </div>
            </li>
          </ul>
          <p className="text-[11px] text-warning bg-warning/5 border border-warning/10 p-2.5 rounded-lg font-mono">
            ⚠️ Connection Keys (Slack, Gmail, Notion) are configured in Settings. If not configured, you can paste ideas directly in the Vault to begin!
          </p>
        </div>
      )
    },
    {
      title: "02. Build and Verify",
      subtitle: "Steps 3 to 6: Research, Q&A, and Compilation",
      icon: <Chats size={48} className="text-primary" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm leading-relaxed text-body">
          <p>
            Once an idea is active, the system helps you ground it with evidence and pull out your personal expertise.
          </p>
          <ul className="space-y-2.5 list-none pl-0">
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">3</span>
              <div>
                <strong className="text-ink">Step 03: Research</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  Tavily and Firecrawl (or Gemini's built-in Google Grounding) query the live web to check facts, find links, and assemble a solid research report.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">4</span>
              <div>
                <strong className="text-ink">Step 04: Answer Questions (The Interview)</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  The machine holds a short Q&A. You talk, it listens. If your answer lacks specifics, metrics, or stories, the AI scoring gate rejects the answer and asks a follow-up.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">5</span>
              <div>
                <strong className="text-ink">Step 05 & 06: Production & Refinement</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  We compile your raw inputs and write a first draft structured by your custom Style Guide and Anti-Slop dictionary.
                </p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "03. Polish, Repurpose, and Learn",
      subtitle: "Steps 7 to 10: Editorial Review & Learning Loops",
      icon: <FileText size={48} className="text-primary" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm leading-relaxed text-body">
          <p>
            The last mile ensures the draft is polished, distributed, and improved based on feedback.
          </p>
          <ul className="space-y-2.5 list-none pl-0">
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">7</span>
              <div>
                <strong className="text-ink">Step 07: Polish Draft (Writer's Council)</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  Six expert AI personas (YC partners, creators, authors) score the draft. If the combined score falls under 9/10, the editor executes an auto-revision loop.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">8</span>
              <div>
                <strong className="text-ink">Step 08: Post to Platforms (Repurpose)</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  Format the draft into 8 platform-native styles (LinkedIn, X threads, newsletters, etc.), each checked by a dedicated Quality evaluation gate.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-bold">9</span>
              <div>
                <strong className="text-ink">Step 09 & 10: Revision & Learning Loop</strong>
                <p className="text-[11px] text-muted mt-0.5">
                  Make your final edits. The system calculates a line-by-line diff and semantically extracts lessons to update your global rules, preventing AI slop next time.
                </p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Let's Get Started!",
      subtitle: "Setup Checklist",
      icon: <CheckCircle size={48} className="text-emerald-500" />,
      content: (
        <div className="space-y-4 text-xs md:text-sm leading-relaxed text-body">
          <p>
            You are ready to leverage the Content Machine. Follow this quick checklist to unlock the full potential:
          </p>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-hairline bg-background/50">
              <Key size={18} className="text-primary shrink-0" />
              <div>
                <strong className="text-ink text-xs block">Set your Gemini API Key</strong>
                <span className="text-[10px] text-muted block mt-0.5">Required for running any AI steps (Oracle, Writer's Council, Repurposer).</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-hairline bg-background/50">
              <Compass size={18} className="text-primary shrink-0" />
              <div>
                <strong className="text-ink text-xs block">Configure External Connections</strong>
                <span className="text-[10px] text-muted block mt-0.5">Enter credentials inside the Settings tab to link live Slack, Gmail, or Notion workspaces.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-hairline bg-background/50">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <div>
                <strong className="text-ink text-xs block">Runs Locally & Serverless</strong>
                <span className="text-[10px] text-muted block mt-0.5">Your keys are saved locally or processed in memory; your content is fully secure.</span>
              </div>
            </div>
          </div>
          <p className="text-muted text-[11px] text-center pt-2 font-mono">
            You can rerun this guide at any time by clicking "Educational Tour" in Settings.
          </p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="bg-surface-card border border-hairline w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline/60">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              Guide
            </span>
            <span className="text-[10px] text-muted font-mono font-medium">
              Step {currentStep + 1} of {slides.length}
            </span>
          </div>
          <button 
            onClick={() => setShowOnboarding(false)}
            className="p-1 text-muted hover:text-ink hover:bg-surface-soft rounded-md transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 md:p-8 flex flex-col items-center md:items-start text-center md:text-left gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
            <div className="p-4 rounded-2xl bg-surface-soft border border-hairline/80 shadow-inner flex items-center justify-center shrink-0">
              {slides[currentStep].icon}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-serif text-ink font-bold tracking-tight">
                {slides[currentStep].title}
              </h2>
              <p className="text-xs text-primary font-mono font-semibold uppercase tracking-wider">
                {slides[currentStep].subtitle}
              </p>
            </div>
          </div>

          <div className="w-full border-t border-hairline/60 pt-4">
            {slides[currentStep].content}
          </div>
        </div>

        {/* Action Panel Footer */}
        <div className="px-6 py-4 bg-background/50 border-t border-hairline/60 flex items-center justify-between shrink-0">
          
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <span 
                key={idx}
                className={clsx(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-body hover:text-ink hover:bg-surface-soft border border-hairline rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOnboarding(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:underline transition-all cursor-pointer"
              >
                Skip Tour
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-on-primary bg-primary border border-primary/20 rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <span>{currentStep === slides.length - 1 ? "Get Started" : "Next"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
