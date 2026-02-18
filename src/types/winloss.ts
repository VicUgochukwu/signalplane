// âââ Win/Loss Intelligence Types âââââââââââââââââââââââââââââââââââââââââââââ

export type IndicatorType = 'win' | 'loss' | 'switch';

export type PatternTrend = 'rising' | 'stable' | 'falling';

export type SourcePlatformWL =
  | 'g2'
  | 'capterra'
  | 'trustradius'
  | 'reddit'
  | 'hackernews'
  | 'stackoverflow'
  | 'twitter'
  | 'linkedin'
  | 'other';

// âââ Core Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface WinLossIndicator {
  id: string;
  indicator_type: IndicatorType;
  company_name: string;
  company_id: string | null;
  reason: string;
  source_url: string;
  source_platform: string;
  sentiment_score: number;
  raw_snippet: string | null;
  detected_at: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface WinLossPattern {
  id: string;
  pattern_type: IndicatorType;
  company_name: string;
  company_id: string | null;
  description: string;
  frequency: number;
  trend: PatternTrend;
  confidence: number;
  first_seen: string;
  last_seen: string;
  indicator_ids: string[] | null;
  tags: string[] | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WinLossReport {
  id: string;
  report_month: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  indicator_count: number;
  pattern_count: number;
  companies_analyzed: string[] | null;
  created_at: string;
}

export interface WinLossDecisionMap {
  id: string;
  quarter: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  decision_criteria: DecisionCriterion[];
  unmet_needs: UnmetNeed[];
  created_at: string;
}

export interface DecisionCriterion {
  criterion: string;
  rank: number;
  frequency: number;
  owned_by: string[];         // company names that own this criterion
  shifting: boolean;          // is this criterion shifting?
  trend: 'rising' | 'stable' | 'falling';
}

export interface UnmetNeed {
  need: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
  sources: string[];          // source platforms where this was found
}

export interface TopPattern {
  company_name: string;
  description: string;
  frequency: number;
  trend: PatternTrend;
}

export interface RecentIndicator {
  id: string;
  indicator_type: IndicatorType;
  company_name: string;
  reason: string;
  source_platform: string;
  detected_at: string;
}

export interface WinLossOverview {
  indicators_30d: number;
  indicators_90d: number;
  win_count: number;
  loss_count: number;
  switch_count: number;
  active_patterns: number;
  rising_patterns: number;
  top_win_patterns: TopPattern[];
  top_loss_patterns: TopPattern[];
  top_switch_patterns: TopPattern[];
  recent_indicators: RecentIndicator[];
  companies_tracked: string[];
  latest_report_month: string | null;
  latest_decision_map_quarter: string | null;
}

export interface ChurnSignal {
  id: string;
  indicator_type: IndicatorType;
  company_name: string;
  reason: string;
  source_url: string;
  source_platform: string;
  sentiment_score: number;
  detected_at: string;
}

// âââ Config Objects ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const INDICATOR_TYPE_CONFIG: Record<
  IndicatorType,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  win: {
    label: 'Win',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: 'ThumbsUp',
  },
  loss: {
    label: 'Loss',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: 'ThumbsDown',
  },
  switch: {
    label: 'Switch',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: 'ArrowRightLeft',
  },
};

export const PATTERN_TREND_CONFIG: Record<
  PatternTrend,
  { label: string; color: string; icon: string }
> = {
  rising: { label: 'Rising', color: 'text-red-400', icon: 'TrendingUp' },
  stable: { label: 'Stable', color: 'text-blue-400', icon: 'Minus' },
  falling: { label: 'Falling', color: 'text-emerald-400', icon: 'TrendingDown' },
};

export const SOURCE_PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  g2: { label: 'G2', color: 'text-orange-400' },
  capterra: { label: 'Capterra', color: 'text-blue-400' },
  trustradius: { label: 'TrustRadius', color: 'text-cyan-400' },
  reddit: { label: 'Reddit', color: 'text-orange-500' },
  hackernews: { label: 'Hacker News', color: 'text-amber-400' },
  stackoverflow: { label: 'Stack Overflow', color: 'text-amber-500' },
  twitter: { label: 'Twitter/X', color: 'text-sky-400' },
  linkedin: { label: 'LinkedIn', color: 'text-blue-500' },
  other: { label: 'Other', color: 'text-gray-400' },
};
