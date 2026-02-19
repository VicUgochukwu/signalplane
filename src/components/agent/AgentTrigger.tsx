import { useEffect, useState } from 'react';
import { useAgent } from '@/contexts/AgentContext';

function SignalPlaneAIIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized radar/signal icon */}
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.9" />
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
      />
      <path
        d="M8.46 8.46a5 5 0 0 1 7.08 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M15.54 15.54a5 5 0 0 1-7.08 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M5.64 5.64a9 9 0 0 1 12.73 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M18.36 18.36a9 9 0 0 1-12.73 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

export { SignalPlaneAIIcon };

export function AgentTrigger() {
  const { isOpen, open } = useAgent();
  const [isMac, setIsMac] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform?.toLowerCase().includes('mac') ?? true);
  }, []);

  if (isOpen) return null;

  return (
    <button
      onClick={open}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2.5 text-foreground shadow-md transition-all duration-200 hover:shadow-lg hover:border-primary/40 hover:bg-card group"
      aria-label="Open AI assistant"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 transition-colors group-hover:bg-primary/25">
        <SignalPlaneAIIcon className="h-4 w-4 text-primary" />
      </div>
      <span
        className="text-[13px] font-medium text-foreground/80 transition-colors group-hover:text-foreground overflow-hidden whitespace-nowrap"
        style={{
          maxWidth: hovered ? '120px' : '0px',
          opacity: hovered ? 1 : 0,
          transition: 'max-width 250ms ease, opacity 200ms ease',
        }}
      >
        Ask AI
      </span>
      <kbd className="flex items-center gap-0.5 rounded-[5px] border border-border/50 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
        {isMac ? '\u2318' : '\u2303'}K
      </kbd>
    </button>
  );
}
