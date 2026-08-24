'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMarkdown({ content, compact = false }) {
  const headingSize = compact ? 'text-sm' : 'text-base md:text-lg';

  return (
    <div className={`min-w-0 break-words text-left text-white ${compact ? 'text-sm' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={`${headingSize} mt-4 mb-2 first:mt-0 font-bold text-white`}>{children}</h1>,
          h2: ({ children }) => <h2 className={`${headingSize} mt-4 mb-2 first:mt-0 font-bold text-blue-200`}>{children}</h2>,
          h3: ({ children }) => <h3 className="mt-3 mb-2 first:mt-0 font-semibold text-blue-200">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 ml-5 list-outside list-disc space-y-1.5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-5 list-outside list-decimal space-y-1.5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed marker:text-blue-300">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-300 underline decoration-blue-300/50 underline-offset-2 hover:text-blue-200"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-blue-400/60 pl-3 text-gray-200">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[0.9em] text-blue-100">{children}</code>
          ),
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-white/15">
              <table className="w-full min-w-[32rem] border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-r border-white/15 bg-white/10 px-3 py-2 font-semibold last:border-r-0">{children}</th>,
          td: ({ children }) => <td className="border-b border-r border-white/10 px-3 py-2 align-top last:border-r-0">{children}</td>,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
