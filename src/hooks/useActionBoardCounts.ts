import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Lightweight hook to fetch action board card counts grouped by packet_id.
 * Used by ReportList/ReportCard to show "X actions" chip.
 * Excludes archived cards.
 */
export function useActionBoardCounts(packetIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['action-board-counts', user?.id, packetIds],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!supabase || !user || packetIds.length === 0) return {};

      const { data, error } = await supabase
        .rpc('get_action_board_cards')
        .select('packet_id, column_status');

      if (error || !data) return {};

      const counts: Record<string, number> = {};
      for (const row of data as { packet_id: string; column_status: string }[]) {
        if (row.column_status === 'archived') continue;
        if (!packetIds.includes(row.packet_id)) continue;
        counts[row.packet_id] = (counts[row.packet_id] || 0) + 1;
      }
      return counts;
    },
    enabled: !!user && packetIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
