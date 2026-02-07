import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShipStatus {
  ship_name: string;
  last_signal_at: string | null;
  signal_count_7d: number | null;
  status: 'healthy' | 'ok' | 'stale' | 'missing';
  hours_since_last_signal: number | null;
}

export const useShipStatus = () => {
  return useQuery({
    queryKey: ['ship-status'],
    queryFn: async (): Promise<ShipStatus[]> => {
      const { data, error } = await supabase
        .schema('ops')
        .from('ship_status')
        .select('*');

      if (error) {
        console.error('Error fetching ship status:', error);
        throw error;
      }

      return (data || []).map((row): ShipStatus => ({
        ship_name: row.ship_name || 'Unknown',
        last_signal_at: row.last_signal_at,
        signal_count_7d: row.signal_count_7d ?? 0,
        status: row.status || 'missing',
        hours_since_last_signal: row.hours_since_last_signal,
      }));
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
