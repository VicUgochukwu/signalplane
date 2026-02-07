import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IntelPacket, IntelSection, Bet, Prediction, ActionMapping } from '@/types/report';
import { mockReports } from '@/data/mockReports';

// Helper to safely parse JSON fields from Supabase
const parseIntelSection = (data: unknown): IntelSection => {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    return {
      summary: typeof obj.summary === 'string' ? obj.summary : '',
      highlights: Array.isArray(obj.highlights) ? obj.highlights : [],
      action_items: Array.isArray(obj.action_items) ? obj.action_items : [],
    };
  }
  return { summary: '', highlights: [], action_items: [] };
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

const parsePredictions = (data: unknown): Prediction[] => {
  if (!Array.isArray(data)) return [];
  return data.map((pred) => {
    const p = pred as Record<string, unknown>;
    return {
      prediction: typeof p.prediction === 'string' ? p.prediction : '',
      timeframe: typeof p.timeframe === 'string' ? p.timeframe : '',
      confidence: typeof p.confidence === 'number' ? p.confidence : 0,
      signals: Array.isArray(p.signals) ? p.signals : [],
    };
  });
};

const parseActionMapping = (data: unknown): ActionMapping => {
  const defaultMapping: ActionMapping = { this_week: [], monitor: [] };
  if (typeof data !== 'object' || data === null) return defaultMapping;

  const obj = data as Record<string, unknown>;

  return {
    this_week: Array.isArray(obj.this_week)
      ? obj.this_week.map((item) => {
          const i = item as Record<string, unknown>;
          return {
            action: typeof i.action === 'string' ? i.action : '',
            owner: typeof i.owner === 'string' ? i.owner : '',
            priority: typeof i.priority === 'string' ? i.priority : '',
          };
        })
      : [],
    monitor: Array.isArray(obj.monitor)
      ? obj.monitor.map((item) => {
          const i = item as Record<string, unknown>;
          return {
            signal: typeof i.signal === 'string' ? i.signal : '',
            trigger: typeof i.trigger === 'string' ? i.trigger : '',
            action: typeof i.action === 'string' ? i.action : '',
          };
        })
      : [],
  };
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

const parseMarketWinners = (data: unknown): IntelPacket['market_winners'] => {
  if (typeof data !== 'object' || data === null) return undefined;
  const obj = data as Record<string, unknown>;

  const parseWinners = (arr: unknown) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((w) => {
      const winner = w as Record<string, unknown>;
      return {
        pattern_label: typeof winner.pattern_label === 'string' ? winner.pattern_label : '',
        category: (typeof winner.category === 'string' ? winner.category : 'packaging') as 'packaging' | 'conversion' | 'proof' | 'positioning' | 'distribution',
        what_changed: typeof winner.what_changed === 'string' ? winner.what_changed : '',
        where_seen: Array.isArray(winner.where_seen) ? winner.where_seen : [],
        survival_weeks: typeof winner.survival_weeks === 'number' ? winner.survival_weeks : 0,
        propagation_count: typeof winner.propagation_count === 'number' ? winner.propagation_count : 0,
        why_it_matters: typeof winner.why_it_matters === 'string' ? winner.why_it_matters : '',
        implementation_guidance: typeof winner.implementation_guidance === 'string' ? winner.implementation_guidance : '',
      };
    });
  };

  return {
    proven: parseWinners(obj.proven),
    emerging: parseWinners(obj.emerging),
  };
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
        
        // Handle date fields with fallbacks
        const weekStart = row.week_start || row.date || new Date().toISOString().split('T')[0];
        const weekEnd = row.week_end || weekStart;

        return {
          id: row.id,
          week_start: weekStart,
          week_end: weekEnd,
          packet_title: row.packet_title || row.headline || 'Untitled Packet',
          exec_summary: row.exec_summary || [],
          sections: {
            messaging: parseIntelSection(sections.messaging || sections.competitive_intel),
            narrative: parseIntelSection(sections.narrative || sections.market_intel),
            icp: parseIntelSection(sections.icp),
            horizon: parseIntelSection(sections.horizon),
            objection: parseIntelSection(sections.objection || sections.pipeline_intel),
          },
          key_questions: row.key_questions || [],
          bets: parseBets(row.bets),
          predictions: parsePredictions(row.predictions),
          action_mapping: parseActionMapping(row.action_mapping),
          market_winners: parseMarketWinners(row.market_winners),
          status: 'published',
          created_at: row.created_at,
          metrics: parseMetrics(sections.metrics),
        };
      });
    },
  });
};
