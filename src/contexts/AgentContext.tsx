import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgentChat } from '@/hooks/useAgentChat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export interface PageContext {
  page: string;
  path: string;
  params: Record<string, string>;
  label: string;
}

interface AgentContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: AgentMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  pageContext: PageContext;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  abortStream: () => void;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// ─── Route → Page mapping ─────────────────────────────────────────────────────

const ROUTE_MAP: Array<{ pattern: RegExp; page: string; label: string; paramKeys?: string[] }> = [
  { pattern: /^\/control-plane\/packet\/(.+)$/, page: 'intel-packets', label: 'Intel Packets', paramKeys: ['packetId'] },
  { pattern: /^\/control-plane\/artifacts$/, page: 'artifacts', label: 'Artifacts' },
  { pattern: /^\/messaging-diff$/, page: 'messaging-diff', label: 'Messaging Diff' },
  { pattern: /^\/control-plane\/submit$/, page: 'submit-signal', label: 'Submit Signal' },
  { pattern: /^\/control-plane\/upload$/, page: 'bulk-upload', label: 'Bulk Upload' },
  { pattern: /^\/control-plane\/board$/, page: 'action-board', label: 'Action Board' },
  { pattern: /^\/control-plane\/team$/, page: 'team', label: 'Team Settings' },
  { pattern: /^\/control-plane\/deals$/, page: 'deals', label: 'Deal Logger' },
  { pattern: /^\/control-plane\/enablement$/, page: 'enablement', label: 'Enablement' },
  { pattern: /^\/control-plane\/launches\/(.+)$/, page: 'launches', label: 'Launch Ops', paramKeys: ['launchId'] },
  { pattern: /^\/control-plane\/launches$/, page: 'launches', label: 'Launch Ops' },
  { pattern: /^\/control-plane\/win-loss$/, page: 'win-loss', label: 'Win/Loss Intelligence' },
  { pattern: /^\/control-plane\/voc-research$/, page: 'voc-research', label: 'VoC Research' },
  { pattern: /^\/control-plane\/positioning$/, page: 'positioning', label: 'Positioning Health' },
  { pattern: /^\/control-plane\/packaging$/, page: 'packaging', label: 'Packaging Intelligence' },
  { pattern: /^\/my-pages$/, page: 'my-pages', label: 'Tracked Pages' },
  { pattern: /^\/settings$/, page: 'settings', label: 'Settings' },
  { pattern: /^\/control-plane$/, page: 'intel-packets', label: 'Intel Packets' },
];

function derivePageContext(pathname: string): PageContext {
  for (const route of ROUTE_MAP) {
    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      if (route.paramKeys) {
        route.paramKeys.forEach((key, i) => {
          if (match[i + 1]) params[key] = match[i + 1];
        });
      }
      return { page: route.page, path: pathname, params, label: route.label };
    }
  }
  return { page: 'unknown', path: pathname, params: {}, label: 'Control Plane' };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AgentProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const pageContext = derivePageContext(location.pathname);

  // Wire up the streaming hook
  useAgentChat({ setMessages, setIsLoading, setIsStreaming, abortRef });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const clearMessages = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const abortStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: AgentMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
      };

      const assistantMsg: AgentMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setIsStreaming(true);

      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const event = new CustomEvent('agent-send', {
        detail: {
          messages: allMessages,
          context: {
            page: pageContext.page,
            path: pageContext.path,
            params: pageContext.params,
          },
          assistantMsgId: assistantMsg.id,
        },
      });
      window.dispatchEvent(event);
    },
    [messages, isLoading, pageContext],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return (
    <AgentContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        messages,
        isLoading,
        isStreaming,
        pageContext,
        sendMessage,
        clearMessages,
        abortStream,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
