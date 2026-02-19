import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, ArrowUp, Square, RotateCcw } from 'lucide-react';
import { Sheet, SheetOverlay, SheetPortal } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgent } from '@/contexts/AgentContext';
import { AgentMessage } from './AgentMessage';
import { SignalPlaneAIIcon } from './AgentTrigger';
import * as SheetPrimitive from '@radix-ui/react-dialog';

// ─── Suggested prompts per page ──────────────────────────────────────────────

const SUGGESTED_PROMPTS: Record<string, Array<{ label: string; prompt: string }>> = {
  'intel-packets': [
    { label: 'Weekly summary', prompt: 'Summarize this week\'s competitive intel' },
    { label: 'Key predictions', prompt: 'What are the most important predictions right now?' },
    { label: 'Priority actions', prompt: 'What should I be acting on first?' },
  ],
  'action-board': [
    { label: 'Board overview', prompt: 'Give me a quick overview of my action board' },
    { label: 'Overdue items', prompt: 'Are there any stale or overdue cards I should address?' },
    { label: 'Next priorities', prompt: 'What should I prioritize next on the board?' },
  ],
  'artifacts': [
    { label: 'Recent changes', prompt: 'What battlecards have changed recently?' },
    { label: 'Top objections', prompt: 'What are the top objections I should prepare for?' },
    { label: 'Freshness check', prompt: 'How fresh are my competitive artifacts?' },
  ],
  'messaging-diff': [
    { label: 'Recent changes', prompt: 'What messaging changes happened recently?' },
    { label: 'Narrative patterns', prompt: 'What are the key narrative patterns emerging?' },
    { label: 'Convergences', prompt: 'Any narrative convergences I should be watching?' },
  ],
  'win-loss': [
    { label: 'Trends', prompt: 'What are the key win/loss trends?' },
    { label: 'Top threats', prompt: 'Which competitor am I losing to the most?' },
    { label: 'Buyer signals', prompt: 'What are recent buyer signals telling us?' },
  ],
  'positioning': [
    { label: 'Score trends', prompt: 'How is my positioning health trending?' },
    { label: 'Drift events', prompt: 'Any positioning drift I should know about?' },
    { label: 'Trajectory', prompt: 'Am I improving or declining overall?' },
  ],
  'packaging': [
    { label: 'Pricing changes', prompt: 'Any recent competitor pricing changes?' },
    { label: 'Landscape', prompt: 'How does my packaging compare to the landscape?' },
    { label: 'Opportunities', prompt: 'Where are the packaging opportunities?' },
  ],
  'deals': [
    { label: 'Recent outcomes', prompt: 'What do recent deal outcomes look like?' },
    { label: 'Win rate', prompt: 'How is my win rate trending?' },
    { label: 'Loss patterns', prompt: 'What patterns do I see in lost deals?' },
  ],
  'enablement': [
    { label: 'Content status', prompt: 'What enablement content is available?' },
    { label: 'Coverage gaps', prompt: 'Are there any gaps in my enablement materials?' },
    { label: 'Battle-ready', prompt: 'Am I battle-ready for upcoming deals?' },
  ],
  'launches': [
    { label: 'Active launches', prompt: 'What launches are active right now?' },
    { label: 'Status check', prompt: 'Give me a launch status overview' },
    { label: 'Milestones', prompt: 'What milestones are coming up?' },
  ],
};

const DEFAULT_PROMPTS = [
  { label: 'What can you do?', prompt: 'What can you help me with in Signal Plane?' },
  { label: 'Weekly overview', prompt: 'Give me a high-level weekly overview of my competitive landscape' },
  { label: 'Navigate', prompt: 'Help me find what I\'m looking for' },
];

// ─── Welcome State ───────────────────────────────────────────────────────────

function WelcomeState({
  pageLabel,
  prompts,
  onPrompt,
}: {
  pageLabel: string;
  prompts: Array<{ label: string; prompt: string }>;
  onPrompt: (p: string) => void;
}) {
  return (
    <div className="flex flex-col h-full px-5 pt-12 pb-4">
      {/* Hero area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4">
          <SignalPlaneAIIcon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-1.5">Signal Plane AI</h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed text-center max-w-[260px]">
          Your competitive intelligence analyst. Ask me anything about your data, competitors, or how to use the platform.
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="mt-auto pt-6">
        <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2.5 px-0.5">
          Suggestions for {pageLabel}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map(({ label, prompt }) => (
            <button
              key={prompt}
              onClick={() => onPrompt(prompt)}
              className="rounded-full border border-border/50 bg-transparent px-3 py-1.5 text-[12px] text-foreground/70 transition-all duration-150 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function AgentPanel() {
  const {
    isOpen,
    close,
    messages,
    isLoading,
    isStreaming,
    pageContext,
    sendMessage,
    clearMessages,
    abortStream,
  } = useAgent();

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prompts = SUGGESTED_PROMPTS[pageContext.page] || DEFAULT_PROMPTS;

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetPortal>
        {/* Subtle overlay */}
        <SheetOverlay className="bg-black/10 backdrop-blur-[1px]" />
        <SheetPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border/40 bg-background shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <SignalPlaneAIIcon className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">Signal Plane AI</span>
              <span className="text-[11px] text-muted-foreground/50 font-normal">&middot;</span>
              <span className="text-[11px] text-muted-foreground/60">{pageContext.label}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                  title="New conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={close}
                className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages / Welcome */}
          <div className="flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <WelcomeState
                pageLabel={pageContext.label}
                prompts={prompts}
                onPrompt={(p) => sendMessage(p)}
              />
            ) : (
              <ScrollArea className="h-full">
                <div className="px-5 py-4">
                  {messages.map((msg, i) => (
                    <div key={msg.id}>
                      {msg.role === 'user' && i > 0 && (
                        <div className="my-4 border-t border-border/20" />
                      )}
                      <AgentMessage message={msg} />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border/20">
            <div className="relative flex items-end gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:bg-muted/30">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="flex-1 resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-h-[22px] max-h-[100px] leading-relaxed"
                rows={1}
                disabled={isLoading && !isStreaming}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = `${Math.min(t.scrollHeight, 100)}px`;
                }}
              />
              {isStreaming ? (
                <button
                  onClick={abortStream}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/20 hover:text-foreground"
                  title="Stop generating"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/30 mt-1.5 text-center">
              Enter to send &middot; Shift+Enter for new line
            </p>
          </div>

          {/* Accessibility */}
          <SheetPrimitive.Title className="sr-only">Signal Plane AI Assistant</SheetPrimitive.Title>
          <SheetPrimitive.Description className="sr-only">
            Chat with the Signal Plane AI assistant for competitive intelligence analysis.
          </SheetPrimitive.Description>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}
