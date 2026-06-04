import React from 'react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  if (!content) return <p className="text-gray-500 italic">No content available.</p>;

  // A basic markdown parser styled with Tailwind
  const parseMarkdown = (text: string) => {
    // Escape HTML first to prevent XSS
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings (Serif displayed Copernicus fallbacks)
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-serif text-ink font-medium mt-6 mb-3 tracking-tight border-b border-hairline pb-2">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-serif text-ink font-medium mt-5 mb-2.5 tracking-tight">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-serif text-ink font-medium mt-4 mb-2 tracking-tight">$1</h3>');

    // Bullet points
    html = html.replace(/^\* (.*$)/gim, '<li class="text-body ml-4 list-disc my-1 font-sans text-sm leading-relaxed">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="text-body ml-4 list-disc my-1 font-sans text-sm leading-relaxed">$1</li>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-body-strong">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-body">$1</em>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-surface-dark-soft/20 text-accent-amber border border-hairline/60 px-1.5 py-0.5 rounded font-mono text-[13px]">$1</code>');

    // Line breaks
    html = html.replace(/\n\n/g, '<p class="my-3 text-body font-sans text-sm leading-relaxed"></p>');
    html = html.replace(/\n/g, '<br class="my-0.5" />');

    return html;
  };

  const parsedHtml = parseMarkdown(content);

  return (
    <div 
      className={`prose max-w-none text-body font-sans text-sm leading-relaxed select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};
