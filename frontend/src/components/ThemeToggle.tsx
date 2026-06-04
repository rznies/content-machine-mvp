import React from 'react';
import { useApp, ThemeMode } from '../context/AppContext';
import { Sun, Moon, Monitor } from '@phosphor-icons/react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useApp();

  const cycleTheme = () => {
    let nextTheme: ThemeMode = 'auto';
    if (theme === 'auto') {
      nextTheme = 'light';
    } else if (theme === 'light') {
      nextTheme = 'dark';
    } else if (theme === 'dark') {
      nextTheme = 'auto';
    }
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={18} weight="fill" className="text-amber-500 animate-spin-slow" />;
      case 'dark':
        return <Moon size={18} weight="fill" className="text-indigo-400" />;
      case 'auto':
        return <Monitor size={18} weight="bold" className="text-zinc-400" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light Theme';
      case 'dark': return 'Dark Theme';
      case 'auto': return 'Auto (System)';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${getThemeLabel()} (Click to cycle)`}
      className="p-2 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-xl text-zinc-400 hover:text-foreground transition-all duration-200 active:scale-95"
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {getThemeIcon()}
      </div>
    </button>
  );
};
