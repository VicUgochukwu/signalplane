import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IntelPacket, IntelSection, Bet, Prediction, PredictionOutcome, ActionMapping, JudgmentLoopData, JudgmentLoopStats } from '@/types/report';
import { mockReports } from '@/data/mockReports';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';

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
    // Support both { hypothesis, confidence (number), signal_ids } and { bet, confidence (string), rationale }
    const label = typeof b.hypothesis === 'string' ? b.hypothesis : (typeof b.bet === 'string' ? b.bet : '');
    const confMap: Record<string, number> = { high: 85, medium: 60, low: 35 };
    const conf = typeof b.confidence === 'number' ? b.confidence : (typeof b.confidence === 'string' ? (confMap[b.confidence.toLowerCase()] || 50) : 0);
    return {
      hypothesis: label,
      confidence: conf,
      signal_ids: Array.isArray(b.signal_ids) ? b.signal_ids : [],
    };
  });
};

const VALID_OUTCOMES: PredictionOutcome[] = ['correct', 'incorrect', 'partial', 'pending'];

const parsePredictions = (data: unknown): Prediction[] => {
  if (!Array.isArray(data)) return [];
  return data.map((pred) => {
    const p = pred as Record<string, unknown>;
    const outcome = typeof p.outcome === 'string' && VALID_OUTCOMES.includes(p.outcome as PredictionOutcome)
      ? (p.outcome as PredictionOutcome)
      : undefined;
    return {
      prediction: typeof p.prediction === 'string' ? p.prediction : '',
      timeframe: typeof p.timeframe === 'string' ? p.timeframe : '',
      confidence: typeof p.confidence === 'number' ? p.confidence : 0,
      signals: Array.isArray(p.signals) ? p.signals : [],
      outcome,
      outcome_notes: typeof p.outcome_notes === 'string' ? p.outcome_notes : undefined,
      scored_at: typeof p.scored_at === 'string' ? p.scored_at : undefined,
    };
  });
};

const parseJudgmentLoop = (data: unknown): JudgmentLoopData | undefined => {
  if (typeof data !== 'object' || data === null) return undefined;
  const obj = data as Record<string, unknown>;

  const parseStats = (s: unknown): JudgmentLoopStats => {
    const defaults: JudgmentLoopStats = {
      total_predictions: 0, scored: 0, correct: 0, incorrect: 0, partial: 0, pending: 0,
      accuracy_rate: 0, confidence_calibration: 0,
    };
    if (typeof s !== 'object' || s === null) return defaults;
    const st = s as Record<string, unknown>;
    return {
      total_predictions: typeof st.total_predictions === 'number' ? st.total_predictions : 0,
      scored: typeof st.scored === 'number' ? st.scored : 0,
      correct: typeof st.correct === 'number' ? st.correct : 0,
      incorrect: typeof st.incorrect === 'number' ? st.incorrect : 0,
      partial: typeof st.partial === 'number' ? st.partial : 0,
      pending: typeof st.pending === 'number' ? st.pending : 0,
      accuracy_rate: typeof st.accuracy_rate === 'number' ? st.accuracy_rate : 0,
      confidence_calibration: typeof st.confidence_calibration === 'number' ? st.confidence_calibration : 0,
    };
  };

  const parseHistory = (h: unknown) => {
    if (!Array.isArray(h)) return [];
    return h.map((entry) => {
      const e = entry as Record<string, unknown>;
      return {
        week_start: typeof e.week_start === 'string' ? e.week_start : '',
        predictions_made: typeof e.predictions_made === 'number' ? e.predictions_made : 0,
        scored: typeof e.scored === 'number' ? e.scored : 0,
        correct: typeof e.correct === 'number' ? e.correct : 0,
        accuracy_rate: typeof e.accuracy_rate === 'number' ? e.accuracy_rate : 0,
      };
    });
  };

  return {
    current_stats: parseStats(obj.current_stats),
    history: parseHistory(obj.history),
  };
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
        trend: typeof winner.trend === 'string' ? winner.trend as 'accelerating' | 'stable' | 'fading' : undefined,
        your_gap: typeof winner.your_gap === 'string' ? winner.your_gap : undefined,
        implementation_guidance: typeof winner.implementation_guidance === 'string' ? winner.implementation_guidance : undefined,
      };
    });
  };

  return {
    proven: parseWinners(obj.proven),
    emerging: parseWinners(obj.emerging),
  };
};

// Shared row → IntelPacket mapper
const mapRowToPacket = (row: Record<string, any>): IntelPacket => {
  const sections = row.sections as Record<string, unknown> || {};
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
      social: parseIntelSection(sections.social),
      enablement: parseIntelSection(sections.enablement),
    },
    key_questions: row.key_questions || [],
    bets: parseBets(row.bets),
    predictions: parsePredictions(row.predictions),
    action_mapping: parseActionMapping(row.action_mapping),
    market_winners: parseMarketWinners(row.market_winners),
    judgment_loop: parseJudgmentLoop(row.judgment_loop),
    status: 'published',
    created_at: row.created_at,
    metrics: parseMetrics(sections.metrics),
    is_personalized: row.is_personalized || false,
    user_company_name: row.user_company_name || null,
  };
};

export const useReports = () => {
  const { user } = useAuth();
  const demo = useDemo();

  return useQuery({
    queryKey: demo?.isDemo
      ? ['demo-packets', demo.sectorSlug]
      : ['intel-packets', user?.id],
    queryFn: async (): Promise<IntelPacket[]> => {
      if (!supabase) {
        console.info('Supabase not configured, using mock data');
        return mockReports;
      }

      // Demo mode: query demo schema filtered by sector
      if (demo?.isDemo) {
        const { data, error } = await supabase
          .schema('demo' as any)
          .from('packets')
          .select('*')
          .eq('sector_slug', demo.sectorSlug)
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          console.info('No demo data for sector, using mock data');
          return mockReports;
        }

        return data.map(mapRowToPacket);
      }

      // Normal mode: fetch from public.packets (limit to 50 most recent)
      let query = supabase
        .from('packets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to fetch from Supabase:', error.message);
        // Only fall back to mock data for unauthenticated visitors (marketing demo)
        return user ? [] : mockReports;
      }

      if (!data || data.length === 0) {
        console.info('No packets in Supabase');
        // Authenticated users see empty state; visitors see mock demo
        return user ? [] : mockReports;
      }

      // De-duplicate: if a personalized packet exists for a given week, hide the generic one
      const personalizedWeeks = new Set(
        data
          .filter((row: any) => row.user_id && row.is_personalized)
          .map((row: any) => `${row.week_start}_${row.week_end}`)
      );
      const filtered = data.filter((row: any) => {
        if (row.user_id) return true; // always show personalized packets
        // Hide generic packet if a personalized one exists for the same week
        const weekKey = `${row.week_start}_${row.week_end}`;
        return !personalizedWeeks.has(weekKey);
      });

      return filtered.map(mapRowToPacket);
    },
  });
};
