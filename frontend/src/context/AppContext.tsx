import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, Idea } from '../lib/api';

export interface LogLine {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  time: string;
}

export type ThemeMode = 'auto' | 'light' | 'dark';
export type AppStatus = 'ready' | 'working' | 'needs_you' | 'error' | 'done';

interface AppContextType {
  activeIdea: Idea | null;
  setActiveIdea: (idea: Idea | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logs: LogLine[];
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  clearLogs: () => void;
  isActivityOpen: boolean;
  setIsActivityOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isPinned: boolean;
  setIsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
  unreadLogsCount: number;
  resetUnreadLogsCount: () => void;
  isAdvancedMode: boolean;
  setIsAdvancedMode: (advanced: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  refreshActiveIdea: () => Promise<void>;
  status: AppStatus;
  setStatus: (status: AppStatus) => void;
  contentType: string;
  setContentType: (contentType: string) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeIdea, setActiveIdeaState] = useState<Idea | null>(null);
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const hash = window.location.hash.substring(1);
    return hash || 'home';
  });
  const [status, setStatus] = useState<AppStatus>('ready');
  const [logs, setLogs] = useState<LogLine[]>([
    { type: 'info', message: 'Ready. Start by scanning all sources or picking an idea.', time: new Date().toLocaleTimeString() }
  ]);
  const [isActivityOpen, setIsActivityOpenState] = useState<boolean>(false);
  const [isPinned, setIsPinnedState] = useState<boolean>(false);
  const [contentType, setContentType] = useState<string>('LinkedIn Post');
  const [unreadLogsCount, setUnreadLogsCount] = useState<number>(0);
  const [showOnboarding, setShowOnboardingState] = useState<boolean>(() => {
    return !localStorage.getItem('cm_onboarding_seen');
  });

  const setShowOnboarding = (show: boolean) => {
    setShowOnboardingState(show);
    if (!show) {
      localStorage.setItem('cm_onboarding_seen', 'true');
    }
  };
  
  // Advanced Mode (Persisted in localStorage)
  const [isAdvancedMode, setIsAdvancedModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('cm_advanced_mode');
    return saved === 'true';
  });

  // Theme Mode (Persisted in localStorage)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cm_theme');
    return (saved as ThemeMode) || 'auto';
  });

  const setActiveIdea = (idea: Idea | null) => {
    setActiveIdeaState(idea);
  };

  const handleTabChange = useCallback((tab: string) => {
    setActiveTabState(tab);
    window.location.hash = tab === 'home' ? '' : tab;
  }, []);

  const setIsActivityOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsActivityOpenState((prev) => {
      const next = typeof open === 'function' ? open(prev) : open;
      if (!next) {
        setIsPinnedState(false);
      }
      return next;
    });
  }, []);

  const setIsPinned = useCallback((pinned: boolean | ((prev: boolean) => boolean)) => {
    setIsPinnedState((prev) => {
      const next = typeof pinned === 'function' ? pinned(prev) : pinned;
      setIsActivityOpenState(next);
      return next;
    });
  }, []);

  // Update hash routing on mount or back navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && hash !== activeTab) {
        setActiveTabState(hash);
      } else if (!hash && activeTab !== 'home') {
        setActiveTabState('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
      setActiveTabState(initialHash);
    } else {
      setActiveTabState('home');
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const addLog = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, time }]);
    
    // Only increment unread count if the drawer is closed
    setIsActivityOpenState((isOpen) => {
      if (!isOpen) {
        setUnreadLogsCount((c) => c + 1);
      }
      return isOpen;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setUnreadLogsCount(0);
  }, []);

  const resetUnreadLogsCount = useCallback(() => {
    setUnreadLogsCount(0);
  }, []);

  const setIsAdvancedMode = (advanced: boolean) => {
    setIsAdvancedModeState(advanced);
    localStorage.setItem('cm_advanced_mode', String(advanced));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('cm_theme', newTheme);
  };

  const refreshActiveIdea = useCallback(async () => {
    try {
      const res = await api.getActiveIdea();
      if (res.success && res.active) {
        setActiveIdeaState(res.active);
      } else {
        setActiveIdeaState(null);
      }
    } catch (err) {
      console.error('Failed to load active idea:', err);
    }
  }, []);

  // Fetch active idea initially
  useEffect(() => {
    refreshActiveIdea();
  }, [refreshActiveIdea]);

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Listen to system theme change if set to Auto
  useEffect(() => {
    if (theme !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        activeIdea,
        setActiveIdea,
        activeTab,
        setActiveTab: handleTabChange,
        logs,
        addLog,
        clearLogs,
        isActivityOpen,
        setIsActivityOpen,
        isPinned,
        setIsPinned,
        unreadLogsCount,
        resetUnreadLogsCount,
        isAdvancedMode,
        setIsAdvancedMode,
        theme,
        setTheme,
        refreshActiveIdea,
        status,
        setStatus,
        contentType,
        setContentType,
        showOnboarding,
        setShowOnboarding
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
