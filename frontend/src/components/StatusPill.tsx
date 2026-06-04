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
          className: 'bg-success/10 text-success border-success/20'
        };
      case 'working':
        return {
          text: 'Working…',
          className: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20 animate-pulse'
        };
      case 'needs_you':
        return {
          text: 'Needs you',
          className: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
        };
      case 'error':
        return {
          text: 'Something went wrong',
          className: 'bg-error/10 text-error border-error/20'
        };
      case 'done':
        return {
          text: 'Done!',
          className: 'bg-success/15 text-success border-success/35'
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
