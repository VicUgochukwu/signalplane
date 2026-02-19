import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AgentMessage } from '@/contexts/AgentContext';

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';

// ─── Token helper ─────────────────────────────────────────────────────────────

async function getValidToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Please log in to continue');
  }

  const expiresAt = session.expires_at ?? 0;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (expiresAt - nowSeconds < 60) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session?.access_token) {
      throw new Error('Session expired. Please log in again.');
    }
    return refreshed.session.access_token;
  }

  return session.access_token;
}

// ─── SSE Parser ───────────────────────────────────────────────────────────────

interface SSEEvent {
  event?: string;
  data: string;
}

function parseSSEChunk(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split('\n');
  let currentEvent: Partial<SSEEvent> = {};

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent.event = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      currentEvent.data = line.slice(6);
      events.push({ event: currentEvent.event, data: currentEvent.data });
      currentEvent = {};
    } else if (line === '') {
      currentEvent = {};
    }
  }

  return events;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAgentChatOptions {
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  setIsLoading: (v: boolean) => void;
  setIsStreaming: (v: boolean) => void;
  abortRef: React.MutableRefObject<AbortController | null>;
}

/**
 * Listens for `agent-send` CustomEvents from AgentContext and handles
 * the streaming fetch to the edge function. Updates messages via the
 * provided setMessages dispatcher.
 */
export function useAgentChat({ setMessages, setIsLoading, setIsStreaming, abortRef }: UseAgentChatOptions) {
  const processingRef = useRef(false);

  const handleSend = useCallback(
    async (detail: { messages: Array<{ role: string; content: string }>; context: any; assistantMsgId: string }) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let token = await getValidToken();

        const doFetch = async (t: string) => {
          return fetch(`${SUPABASE_URL}/functions/v1/ai-agent-chat`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${t}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: detail.messages,
              context: detail.context,
            }),
            signal: controller.signal,
          });
        };

        let response = await doFetch(token);

        // Retry once on 401
        if (response.status === 401) {
          const { data: refreshed, error } = await supabase.auth.refreshSession();
          if (error || !refreshed.session?.access_token) {
            throw new Error('Session expired. Please log in again.');
          }
          token = refreshed.session.access_token;
          response = await doFetch(token);
        }

        if (!response.ok) {
          const errBody = await response.text();
          let errorMsg = 'Something went wrong. Please try again.';
          try {
            const parsed = JSON.parse(errBody);
            errorMsg = parsed.error || errorMsg;
          } catch {
            // use default
          }
          throw new Error(errorMsg);
        }

        // Stream the response
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events from buffer
          const eventBoundary = buffer.lastIndexOf('\n\n');
          if (eventBoundary === -1) continue;

          const processable = buffer.slice(0, eventBoundary + 2);
          buffer = buffer.slice(eventBoundary + 2);

          const events = parseSSEChunk(processable);

          for (const event of events) {
            // Check for done sentinel
            if (event.data === '[DONE]') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === detail.assistantMsgId ? { ...m, isStreaming: false } : m,
                ),
              );
              setIsLoading(false);
              setIsStreaming(false);
              processingRef.current = false;
              return;
            }

            // Parse Anthropic SSE event
            try {
              const parsed = JSON.parse(event.data);

              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                const text = parsed.delta.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === detail.assistantMsgId ? { ...m, content: m.content + text } : m,
                  ),
                );
              }

              // Handle message_stop
              if (parsed.type === 'message_stop') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === detail.assistantMsgId ? { ...m, isStreaming: false } : m,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // If we exit the loop without [DONE], mark as done
        setMessages((prev) =>
          prev.map((m) =>
            m.id === detail.assistantMsgId ? { ...m, isStreaming: false } : m,
          ),
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User cancelled
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === detail.assistantMsgId
                ? { ...m, content: `\u26a0\ufe0f ${err.message || 'Something went wrong. Please try again.'}`, isStreaming: false }
                : m,
            ),
          );
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        processingRef.current = false;
        abortRef.current = null;
      }
    },
    [setMessages, setIsLoading, setIsStreaming, abortRef],
  );

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      handleSend(detail);
    };

    window.addEventListener('agent-send', listener);
    return () => window.removeEventListener('agent-send', listener);
  }, [handleSend]);
}
