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

    // Headings
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-primary-400 mt-6 mb-3 tracking-tight border-b border-gray-800 pb-2">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-primary-300 mt-5 mb-2.5">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-primary-200 mt-4 mb-2">$1</h3>');

    // Bullet points
    // We match lines starting with * or - and space
    html = html.replace(/^\* (.*$)/gim, '<li class="text-gray-300 ml-4 list-disc my-1">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="text-gray-300 ml-4 list-disc my-1">$1</li>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-800/80 text-primary-300 border border-gray-700/50 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>');

    // Line breaks
    html = html.replace(/\n\n/g, '<p class="my-3 text-gray-300 leading-relaxed"></p>');
    html = html.replace(/\n/g, '<br class="my-0.5" />');

    return html;
  };

  const parsedHtml = parseMarkdown(content);

  return (
    <div 
      className={`prose prose-invert max-w-none text-gray-300 leading-relaxed select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};
