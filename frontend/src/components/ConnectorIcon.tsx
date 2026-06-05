import React from 'react';

type ConnectorType = 
  | 'slack' 
  | 'gmail' 
  | 'notion' 
  | 'transcripts' 
  | 'x' 
  | 'rss' 
  | 'x_feed'
  | 'gemini'
  | 'tavily'
  | 'firecrawl';

interface ConnectorIconProps {
  type: ConnectorType;
  size?: number; // Target render size, e.g. 20
  className?: string;
  color?: string; // Optional override color
}

export const ConnectorIcon: React.FC<ConnectorIconProps> = ({ 
  type, 
  size = 20, 
  className,
  color = 'currentColor'
}) => {
  // Normalize types
  const normalizedType = (() => {
    const t = type.toLowerCase();
    if (t === 'slack') return 'slack';
    if (t === 'gmail') return 'gmail';
    if (t === 'notion' || t === 'transcripts') return 'notion';
    if (t === 'x' || t === 'x_feed') return 'x';
    if (t === 'rss') return 'rss';
    if (t === 'gemini') return 'gemini';
    if (t === 'tavily') return 'tavily';
    if (t === 'firecrawl') return 'firecrawl';
    return 'slack';
  })();

  // Map each icon to its sliced viewBox in the 120 x 123.6 sprite sheet
  const viewBoxMap: Record<string, string> = {
    slack: '0 0 30 30',
    gemini: '45 0 30 30',
    gmail: '90 0 30 30',
    tavily: '0 45 30 30',
    notion: '45 45 30 30',
    firecrawl: '90 45 30 30',
    x: '0 93.6 30 30',
    rss: '90 93.6 30 30'
  };

  const viewBox = viewBoxMap[normalizedType] || '0 0 30 30';

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      style={{ 
        color, 
        fill: 'currentColor', 
        overflow: 'hidden',
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    >
      {/* 
        The unified Quiver Sprite Sheet.
        Contains Slack, Gemini, Gmail, Tavily, Notion, Firecrawl, X, and RSS in a 3x3 layout.
      */}
      
      {/* Row 1: Slack, Gemini, Gmail */}
      {/* Slack: 0 0 30 30 */}
      <g transform="translate(3, 3)">
        <path 
          d="M6 14.5a2.5 2.5 0 1 0 2.5 2.5v-2.5H6zm0-10a2.5 2.5 0 0 0 0 5h5v-5H6zm8.5 0a2.5 2.5 0 1 0 2.5 2.5v-2.5h-2.5zm-10 10a2.5 2.5 0 0 0 5 0v-5h-5v5zm10-5a2.5 2.5 0 0 0 0-5h-5v5h5zm5 5a2.5 2.5 0 1 0-2.5-2.5v2.5h2.5zm-10 0a2.5 2.5 0 0 0-5 0v5h5v-5zm0-10a2.5 2.5 0 0 0 0 5h5v-5h-5z"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Gemini: 45 0 30 30 */}
      <g transform="translate(45, 0)">
        {/* Large sparkle */}
        <path 
          d="M15 4a1 1 0 0 1 1 1 10 10 0 0 0 10 10 1 1 0 0 1 0 2 10 10 0 0 0-10 10 1 1 0 0 1-2 0 10 10 0 0 0-10-10 1 1 0 0 1 0-2 10 10 0 0 0 10-10 1 1 0 0 1 1-1z"
          vectorEffect="non-scaling-stroke"
        />
        {/* Small sparkle offset */}
        <path 
          d="M8.5 7.5a.5.5 0 0 1 .5.5A4.5 4.5 0 0 0 13.5 12.5a.5.5 0 0 1 0 1A4.5 4.5 0 0 0 9 18a.5.5 0 0 1-1 0 4.5 4.5 0 0 0-4.5-4.5.5.5 0 0 1 0-1A4.5 4.5 0 0 0 8 8a.5.5 0 0 1 .5-.5z" 
          opacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Gmail: 90 0 30 30 */}
      <g transform="translate(90, 0)">
        <path 
          d="M5 6h20c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zm0 2.5v13.5h3V11l7 5 7-5v11h3V8.5L15 14 5 8.5z"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Row 2: Tavily, Notion, Firecrawl */}
      {/* Tavily: 0 45 30 30 */}
      <g transform="translate(0, 45)">
        <circle cx="15" cy="15" r="9" stroke="currentColor" strokeWidth="1.25" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M6 15h18M15 6v18M15 6a15.7 15.7 0 0 1 4 9 15.7 15.7 0 0 1-4 9 15.7 15.7 0 0 1-4-9 15.7 15.7 0 0 1 4-9z" stroke="currentColor" strokeWidth="1.25" fill="none" vectorEffect="non-scaling-stroke" />
        <circle cx="21" cy="21" r="3.5" fill="var(--canvas)" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
        <line x1="23.5" y1="23.5" x2="26" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Notion: 45 45 30 30 */}
      <g transform="translate(45, 45)">
        <path 
          d="M6 5h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3 3.5v13l3.5-1.5V11l5.5 8.5L21.5 17V7.5l-3.5 1.5V15L12.5 7 9 8.5z"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Firecrawl: 90 45 30 30 */}
      <g transform="translate(90, 45)">
        <path d="M15 5l8.66 5v10L15 25l-8.66-5v-10z" stroke="currentColor" strokeWidth="1.25" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M15 9l5.2 3v6l-5.2 3-5.2-3v-6z" stroke="currentColor" strokeWidth="1.25" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
        <line x1="15" y1="5" x2="15" y2="25" stroke="currentColor" strokeWidth="1.25" opacity="0.4" vectorEffect="non-scaling-stroke" />
        <line x1="6.34" y1="10" x2="23.66" y2="20" stroke="currentColor" strokeWidth="1.25" opacity="0.4" vectorEffect="non-scaling-stroke" />
        <line x1="6.34" y1="20" x2="23.66" y2="10" stroke="currentColor" strokeWidth="1.25" opacity="0.4" vectorEffect="non-scaling-stroke" />
        <circle cx="15" cy="15" r="2.5" fill="currentColor" />
      </g>

      {/* Row 3: X, [empty], RSS */}
      {/* X: 0 93.6 30 30 */}
      <g transform="translate(0, 93.6)">
        <path 
          d="M19.2 5h2.8l-6.1 7 7.2 9.5H17.5l-4.4-5.8L8.6 21.5H5.8l6.5-7.4L5.5 5h5.7l4 5.3L19.2 5zm-1 14.8h1.5L10.3 6.6H8.7L18.2 19.8z"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* RSS: 90 93.6 30 30 */}
      <g transform="translate(90, 93.6)">
        <circle cx="7" cy="23" r="2.5" vectorEffect="non-scaling-stroke" />
        <path d="M5 13.5A9.5 9.5 0 0 1 14.5 23h2.5A12 12 0 0 0 5 11v2.5z" vectorEffect="non-scaling-stroke" />
        <path d="M5 7A16 16 0 0 1 21 23h2.5A18.5 18.5 0 0 0 5 4.5V7z" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
};
