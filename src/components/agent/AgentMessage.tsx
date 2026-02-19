import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentMessage as AgentMessageType } from '@/contexts/AgentContext';
import { SignalPlaneAIIcon } from './AgentTrigger';

interface Props {
  message: AgentMessageType;
}

export function AgentMessage({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="group py-1">
        <p className="text-[13px] leading-relaxed text-foreground">{message.content}</p>
      </div>
    );
  }

  // Assistant — flat, document-native rendering (no bubbles)
  return (
    <div className="group py-1">
      {/* Subtle AI indicator */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <SignalPlaneAIIcon className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-[11px] font-medium text-primary/60 uppercase tracking-wide">Signal Plane AI</span>
      </div>

      {message.content ? (
        <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-[1.7] text-foreground/90 prose-p:my-2 prose-p:leading-[1.7] prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:leading-[1.7] prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-strong:text-foreground prose-strong:font-semibold prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-[1px] prose-code:rounded-[4px] prose-code:text-[12px] prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/30 prose-pre:rounded-lg prose-pre:text-[12px] prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary/30 prose-blockquote:text-foreground/70 prose-hr:border-border/30">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      ) : null}

      {/* Streaming cursor */}
      {message.isStreaming && (
        <span className="inline-block w-[2px] h-[15px] bg-primary/70 rounded-full animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
