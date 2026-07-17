'use client';

import { Bot } from 'lucide-react';

export default function AgentResponseIndicator({
  agentName = 'The agent',
  accentColor = '#f46530',
  variant = 'dark',
  compact = false,
}) {
  const isDark = variant === 'dark';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${agentName} received your message and is preparing a response`}
      className={`flex ${compact ? 'gap-3' : 'gap-4'} items-start`}
    >
      <div
        className={`${compact ? 'w-8 h-8 rounded-full' : 'w-10 h-10 rounded-2xl'} flex flex-shrink-0 items-center justify-center border animate-pulse motion-reduce:animate-none`}
        style={{
          color: accentColor,
          backgroundColor: `${accentColor}1a`,
          borderColor: `${accentColor}40`,
        }}
        aria-hidden="true"
      >
        <Bot className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      </div>

      <div
        className={`${compact ? 'rounded-2xl rounded-tl-sm px-4 py-3' : 'rounded-2xl px-5 py-3'} border shadow-sm`}
        style={isDark
          ? {
              color: '#ffffff',
              backgroundColor: `${accentColor}12`,
              borderColor: `${accentColor}33`,
              boxShadow: `0 0 20px ${accentColor}14`,
            }
          : {
              color: '#374151',
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
            }}
      >
        <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold uppercase tracking-widest opacity-60`}>
          Message received
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
            Preparing a response
          </span>
          <span className="flex items-end gap-1" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full animate-bounce motion-reduce:animate-none"
                style={{
                  backgroundColor: accentColor,
                  animationDelay: `${index * 140}ms`,
                  animationDuration: '850ms',
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
