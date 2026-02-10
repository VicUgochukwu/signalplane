import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';
import { ActionBoardCard, BoardColumn } from '@/types/actionBoard';
import { DEMO_BOARD_CARDS } from '@/data/demoBoardCards';

/**
 * Main hook for the Action Board.
 * Fetches cards, provides mutations for move/update/archive.
 * In demo mode, returns per-sector synthetic data with local state.
 */
export function useActionBoard() {
  const { user } = useAuth();
  const demo = useDemo();
  const queryClient = useQueryClient();

  const isDemo = !!demo?.isDemo;

  const queryKey = isDemo
    ? ['demo-action-board', demo.sectorSlug]
    : ['action-board-cards', user?.id];

  const { data: cards = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<ActionBoardCard[]> => {
      if (isDemo) {
        // Return a deep copy so optimistic mutations don't mutate the source
        const source = DEMO_BOARD_CARDS[demo.sectorSlug] || DEMO_BOARD_CARDS['developer-tools'];
        return JSON.parse(JSON.stringify(source));
      }

      if (!user) return [];

      const { data, error: rpcError } = await supabase
        .rpc('get_action_board_cards');

      if (rpcError) {
        console.error('Error fetching board cards:', rpcError);
        return [];
      }

      return (data || []).map((row: any) => ({
        ...row,
        signal_ids: row.signal_ids || [],
        evidence_urls: row.evidence_urls || [],
      }));
    },
    enabled: !!user || isDemo,
    staleTime: isDemo ? Infinity : 2 * 60 * 1000, // Never go stale in demo
  });

  // Move card between columns
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, newColumn, newOrder }: { cardId: string; newColumn: string; newOrder: number }) => {
      if (isDemo) return; // No RPC call in demo — the optimistic update is the truth

      const { error } = await supabase.rpc('move_board_card', {
        p_card_id: cardId,
        p_new_column: newColumn,
        p_new_order: newOrder,
      });

      if (error) throw error;
    },
    onMutate: async ({ cardId, newColumn, newOrder }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ActionBoardCard[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<ActionBoardCard[]>(queryKey, (old = []) =>
        old.map((card) =>
          card.id === cardId
            ? {
                ...card,
                column_status: newColumn as BoardColumn,
                column_order: newOrder,
                updated_at: new Date().toISOString(),
                ...(newColumn === 'this_week' && !card.moved_to_this_week_at && { moved_to_this_week_at: new Date().toISOString() }),
                ...(newColumn === 'in_progress' && !card.moved_to_in_progress_at && { moved_to_in_progress_at: new Date().toISOString() }),
                ...(newColumn === 'done' && !card.moved_to_done_at && { moved_to_done_at: new Date().toISOString() }),
              }
            : card
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      // In demo mode, DO NOT invalidate — the optimistic state IS the state
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  // Update card notes/assignment
  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, notes, assignedTo }: { cardId: string; notes?: string; assignedTo?: string }) => {
      if (isDemo) return;

      const { error } = await supabase.rpc('update_board_card', {
        p_card_id: cardId,
        p_notes: notes ?? null,
        p_assigned_to: assignedTo ?? null,
      });

      if (error) throw error;
    },
    onMutate: async ({ cardId, notes, assignedTo }) => {
      // Optimistic update for notes too — makes it feel instant
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ActionBoardCard[]>(queryKey);

      queryClient.setQueryData<ActionBoardCard[]>(queryKey, (old = []) =>
        old.map((card) =>
          card.id === cardId
            ? {
                ...card,
                ...(notes !== undefined && { notes }),
                ...(assignedTo !== undefined && { assigned_to: assignedTo }),
                updated_at: new Date().toISOString(),
              }
            : card
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  // Archive card
  const archiveCardMutation = useMutation({
    mutationFn: async ({ cardId, reason }: { cardId: string; reason?: string }) => {
      if (isDemo) return;

      const { error } = await supabase.rpc('archive_board_card', {
        p_card_id: cardId,
        p_reason: reason || 'user_archived',
      });

      if (error) throw error;
    },
    onMutate: async ({ cardId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ActionBoardCard[]>(queryKey);

      // Optimistic removal from board
      queryClient.setQueryData<ActionBoardCard[]>(queryKey, (old = []) =>
        old.filter((card) => card.id !== cardId)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  // Helper: group cards by column
  const cardsByColumn = (cards || []).reduce<Record<BoardColumn, ActionBoardCard[]>>(
    (acc, card) => {
      const col = card.column_status as BoardColumn;
      if (col !== 'archived' && acc[col]) {
        acc[col].push(card);
      }
      return acc;
    },
    { inbox: [], this_week: [], in_progress: [], done: [] }
  );

  // Sort each column by column_order
  Object.keys(cardsByColumn).forEach((col) => {
    cardsByColumn[col as BoardColumn].sort((a, b) => a.column_order - b.column_order);
  });

  return {
    cards,
    cardsByColumn,
    isLoading,
    error,
    moveCard: (cardId: string, newColumn: string, newOrder: number) =>
      moveCardMutation.mutate({ cardId, newColumn, newOrder }),
    updateCard: (cardId: string, notes?: string, assignedTo?: string) =>
      updateCardMutation.mutate({ cardId, notes, assignedTo }),
    archiveCard: (cardId: string, reason?: string) =>
      archiveCardMutation.mutate({ cardId, reason }),
    isMoving: moveCardMutation.isPending,
    refetch,
  };
}
