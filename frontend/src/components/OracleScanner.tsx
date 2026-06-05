import React from 'react';

interface OracleScannerProps {
  size?: number; // e.g. 48 or 80
  className?: string;
}

export const OracleScanner: React.FC<OracleScannerProps> = ({ size = 48, className }) => {
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <style>{`
        @keyframes scanner-ripple-anim {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .scanner-ripple {
          transform-origin: 50% 50%;
          animation: scanner-ripple-anim 3s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
        }
        .scanner-ripple-1 {
          animation-delay: 0s;
        }
        .scanner-ripple-2 {
          animation-delay: 1s;
        }
        .scanner-ripple-3 {
          animation-delay: 2s;
        }
      `}</style>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Static Background Grid Lines (Low contrast) */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="var(--hairline)" strokeWidth="0.75" opacity="0.3" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--hairline)" strokeWidth="0.75" opacity="0.3" vectorEffect="non-scaling-stroke" />
        
        {/* Concentric Static Structural Circles */}
        <circle cx="50" cy="50" r="15" fill="none" stroke="var(--hairline)" strokeWidth="1" opacity="0.3" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="var(--hairline)" strokeWidth="1" opacity="0.2" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--hairline)" strokeWidth="1" opacity="0.1" vectorEffect="non-scaling-stroke" />
        
        {/* Animated Ripple Circles */}
        <circle cx="50" cy="50" r="20" fill="none" stroke="var(--primary)" strokeWidth="0.75" className="scanner-ripple scanner-ripple-1" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="var(--primary)" strokeWidth="0.75" className="scanner-ripple scanner-ripple-2" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="var(--primary)" strokeWidth="0.75" className="scanner-ripple scanner-ripple-3" vectorEffect="non-scaling-stroke" />
        
        {/* Center Target Core */}
        <circle cx="50" cy="50" r="2.5" fill="var(--primary)" opacity="0.8" />
      </svg>
    </div>
  );
};
