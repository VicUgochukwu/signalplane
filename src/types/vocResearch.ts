// âââ VoC Research Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export type VocDimension = 'pain' | 'desire' | 'language' | 'criteria';

export type FunnelStage = 'awareness' | 'consideration' | 'decision' | 'retention';

export type VocTrend = 'rising' | 'stable' | 'fading';

// âââ Core Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface VocEntry {
  id: string;
  dimension: VocDimension;
  text: string;
  source_url: string;
  source_platform: string;
  persona: string | null;
  funnel_stage: FunnelStage | null;
  industry: string | null;
  company_size: string | null;
  trend: VocTrend;
  frequency: number;
  first_seen: string;
  last_seen: string;
  raw_snippet: string | null;
  tags: string[] | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface PersonaReport {
  id: string;
  persona: string;
  report_month: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  entry_count: number;
  dimension_breakdown: DimensionBreakdown;
  language_shifts: LanguageShift[];
  created_at: string;
}

export interface MarketPulse {
  id: string;
  report_month: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  top_pains: RankedEntry[];
  emerging_desires: RankedEntry[];
  language_shifts: LanguageShift[];
  criteria_shifts: CriteriaShift[];
  created_at: string;
}

// âââ Sub-types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface DimensionBreakdown {
  pain: number;
  desire: number;
  language: number;
  criteria: number;
}

export interface LanguageShift {
  term: string;
  previous_term: string | null;
  direction: 'emerging' | 'fading' | 'replacing';
  persona: string | null;
  first_seen: string | null;
}

export interface CriteriaShift {
  criterion: string;
  direction: 'rising' | 'falling' | 'new';
  previous_rank: number | null;
  current_rank: number | null;
  evidence_count: number;
}

export interface RankedEntry {
  text: string;
  frequency: number;
  trend: VocTrend;
  persona: string | null;
}

export interface TopVocEntry {
  text: string;
  persona: string | null;
  frequency: number;
  trend: VocTrend;
}

export interface RecentVocEntry {
  id: string;
  dimension: VocDimension;
  text: string;
  persona: string | null;
  source_platform: string;
  trend: VocTrend;
  first_seen: string;
}

export interface VocOverview {
  total_entries: number;
  entries_30d: number;
  entries_90d: number;
  pain_count: number;
  desire_count: number;
  language_count: number;
  criteria_count: number;
  rising_entries: number;
  fading_entries: number;
  top_pains: TopVocEntry[];
  top_desires: TopVocEntry[];
  top_language: TopVocEntry[];
  top_criteria: TopVocEntry[];
  recent_entries: RecentVocEntry[];
  personas_tracked: string[];
  latest_persona_report_month: string | null;
  latest_market_pulse_month: string | null;
}

export interface DimensionTrendSummary {
  dimension: VocDimension;
  total: number;
  rising: number;
  fading: number;
  stable: number;
}

export interface PersonaTrendSummary {
  persona: string;
  total: number;
  rising: number;
  fading: number;
}

export interface TrendEntry {
  dimension: VocDimension;
  text: string;
  persona: string | null;
  frequency: number;
  first_seen: string;
}

export interface VocTrends {
  rising_by_dimension: TrendEntry[];
  fading_by_dimension: TrendEntry[];
  new_entries_this_period: number;
  dimension_summary: DimensionTrendSummary[];
  persona_summary: PersonaTrendSummary[];
}

// âââ Config Objects ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const VOC_DIMENSION_CONFIG: Record<
  VocDimension,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  pain: {
    label: 'Pain',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: 'AlertTriangle',
  },
  desire: {
    label: 'Desire',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: 'Heart',
  },
  language: {
    label: 'Language',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: 'MessageSquare',
  },
  criteria: {
    label: 'Criteria',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: 'ListChecks',
  },
};

export const FUNNEL_STAGE_CONFIG: Record<
  FunnelStage,
  { label: string; color: string }
> = {
  awareness: { label: 'Awareness', color: 'text-sky-400' },
  consideration: { label: 'Consideration', color: 'text-violet-400' },
  decision: { label: 'Decision', color: 'text-amber-400' },
  retention: { label: 'Retention', color: 'text-emerald-400' },
};

export const VOC_TREND_CONFIG: Record<
  VocTrend,
  { label: string; color: string; icon: string }
> = {
  rising: { label: 'Rising', color: 'text-red-400', icon: 'TrendingUp' },
  stable: { label: 'Stable', color: 'text-blue-400', icon: 'Minus' },
  fading: { label: 'Fading', color: 'text-emerald-400', icon: 'TrendingDown' },
};

// Re-export from winloss for shared platform config
export { SOURCE_PLATFORM_CONFIG } from './winloss';
