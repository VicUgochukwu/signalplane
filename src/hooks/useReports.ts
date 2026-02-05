import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IntelPacket, IntelSection, Bet } from '@/types/report';
import { mockReports } from '@/data/mockReports';

// Helper to safely parse JSON fields from Supabase
const parseIntelSection = (data: unknown): IntelSection => {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    return {
      summary: typeof obj.summary === 'string' ? obj.summary : '',
      highlights: Array.isArray(obj.highlights) ? obj.highlights : [],
    };
  }
  return { summary: '', highlights: [] };
};

const parseBets = (data: unknown): Bet[] => {
  if (!Array.isArray(data)) return [];
  return data.map((bet) => {
    const b = bet as Record<string, unknown>;
    return {
      hypothesis: typeof b.hypothesis === 'string' ? b.hypothesis : '',
      confidence: typeof b.confidence === 'number' ? b.confidence : 0,
      signal_ids: Array.isArray(b.signal_ids) ? b.signal_ids : [],
    };
  });
};

const parseMetrics = (data: unknown): IntelPacket['metrics'] => {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    return {
      signals_detected: typeof obj.signals_detected === 'number' ? obj.signals_detected : undefined,
      confidence_score: typeof obj.confidence_score === 'number' ? obj.confidence_score : undefined,
      impact_score: typeof obj.impact_score === 'number' ? obj.impact_score : undefined,
    };
  }
  return undefined;
};

export const useReports = () => {
  return useQuery({
    queryKey: ['intel-packets'],
    queryFn: async (): Promise<IntelPacket[]> => {
      // Return mock data if Supabase isn't configured
      if (!supabase) {
        console.info('Supabase not configured, using mock data');
        return mockReports;
      }

      const { data, error } = await supabase
        .from('packets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch from Supabase, using mock data:', error.message);
        return mockReports;
      }

      if (!data || data.length === 0) {
        console.info('No data in Supabase, using mock data');
        return mockReports;
      }

      // Map database columns to IntelPacket type
      return data.map((row): IntelPacket => {
        const sections = row.sections as Record<string, unknown> || {};
        
        return {
          id: row.id,
          date: row.week_start, // Use week_start as the primary date
          headline: row.packet_title,
          exec_summary: row.exec_summary || [],
          competitive_intel: parseIntelSection(sections.competitive_intel),
          pipeline_intel: parseIntelSection(sections.pipeline_intel),
          market_intel: parseIntelSection(sections.market_intel),
          key_questions: row.key_questions || [],
          bets: parseBets(row.bets),
          status: 'published', // Default status since column doesn't exist
          created_at: row.created_at,
          metrics: parseMetrics(sections.metrics),
        };
      });
    },
  });
};
