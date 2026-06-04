import React from 'react';
import { useApp, AppStatus } from '../context/AppContext';
import { clsx } from 'clsx';

export const StatusPill: React.FC = () => {
  const { status } = useApp();

  const getStatusConfig = (status: AppStatus) => {
    switch (status) {
      case 'ready':
        return {
          text: 'Ready',
          className: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
        };
      case 'working':
        return {
          text: 'Working…',
          className: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20 animate-pulse'
        };
      case 'needs_you':
        return {
          text: 'Needs you',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
      case 'error':
        return {
          text: 'Something went wrong',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        };
      case 'done':
        return {
          text: 'Done!',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={clsx(
      "px-3 py-1 text-xs font-medium border rounded-full transition-all duration-300 select-none tracking-wide",
      config.className
    )}>
      {config.text}
    </div>
  );
};
