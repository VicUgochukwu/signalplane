// âââ Positioning Health Monitor Types ââââââââââââââââââââââââââââââââââââââââ

export type HealthDimension = 'buyer_alignment' | 'differentiation' | 'narrative_fit';

export type DriftSeverity = 'high' | 'medium' | 'low';

export type DriftDirection = 'deliberate' | 'gradual' | 'regression';

export type ScoreTrend = 'improving' | 'stable' | 'declining';

export type PageType = 'homepage' | 'pricing' | 'product' | 'comparison' | 'about';

// âââ Core Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface OwnMessaging {
  id: string;
  page_url: string;
  page_type: PageType;
  page_title: string | null;
  snapshot_hash: string | null;
  captured_at: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface HealthScore {
  id: string;
  score_month: string;
  total_score: number;
  buyer_alignment_score: number;
  differentiation_score: number;
  narrative_fit_score: number;
  dimensions_available: string[];
  breakdown: Record<string, unknown>;
  trend_vs_prior: ScoreTrend;
  prior_total_score: number | null;
  created_at: string;
}

export interface PositioningAudit {
  id: string;
  quarter: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  claim_count: number;
  recommendations: AuditRecommendation[];
  created_at: string;
}

export interface DriftEvent {
  id: string;
  page_url: string;
  page_type: PageType;
  change_description: string;
  severity: DriftSeverity;
  drift_direction: DriftDirection;
  detected_at: string;
  evidence_urls: string[];
  resolved: boolean;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface AuditRecommendation {
  claim: string;
  action: 'hold' | 'adjust' | 'retire' | 'create';
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  evidence_count: number;
}

export interface ScoreBreakdown {
  dimension: HealthDimension;
  score: number;
  max_score: number;
  contributing_factors: string[];
  detracting_factors: string[];
}

export interface ClaimMapping {
  claim: string;
  page_url: string;
  page_type: PageType;
  supported_by: string[];    // evidence sources
  contradicted_by: string[]; // counter-evidence
  status: 'strong' | 'weakening' | 'unsupported';
}

// âââ Overview Type ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface ScoreTrendEntry {
  score_month: string;
  total_score: number;
  buyer_alignment_score: number;
  differentiation_score: number;
  narrative_fit_score: number;
  trend_vs_prior: ScoreTrend;
}

export interface RecentDriftEvent {
  id: string;
  page_url: string;
  page_type: PageType;
  change_description: string;
  severity: DriftSeverity;
  drift_direction: DriftDirection;
  detected_at: string;
  resolved: boolean;
}

export interface PositioningOverview {
  latest_score: {
    total_score: number;
    buyer_alignment_score: number;
    differentiation_score: number;
    narrative_fit_score: number;
    dimensions_available: string[];
    score_month: string;
    trend_vs_prior: ScoreTrend;
    prior_total_score: number | null;
  } | null;
  score_trend: ScoreTrendEntry[];
  drift_events_count: number;
  active_drift_alerts: number;
  high_severity_drifts: number;
  own_pages_tracked: number;
  latest_audit_quarter: string | null;
  recent_drift_events: RecentDriftEvent[];
}

// âââ Config Objects ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const HEALTH_DIMENSION_CONFIG: Record<
  HealthDimension,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string; maxScore: number; description: string }
> = {
  buyer_alignment: {
    label: 'Buyer Alignment',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: 'Users',
    maxScore: 33,
    description: 'Does your language match buyer language?',
  },
  differentiation: {
    label: 'Differentiation',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    icon: 'Fingerprint',
    maxScore: 33,
    description: 'Are your claims still unique vs competitors?',
  },
  narrative_fit: {
    label: 'Narrative Fit',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: 'TrendingUp',
    maxScore: 33,
    description: 'Is your messaging aligned with rising narratives?',
  },
};

export const DRIFT_SEVERITY_CONFIG: Record<
  DriftSeverity,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  high: {
    label: 'High',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  low: {
    label: 'Low',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
};

export const DRIFT_DIRECTION_CONFIG: Record<
  DriftDirection,
  { label: string; color: string; icon: string; description: string }
> = {
  deliberate: {
    label: 'Deliberate',
    color: 'text-emerald-400',
    icon: 'CheckCircle',
    description: 'Intentional repositioning',
  },
  gradual: {
    label: 'Gradual',
    color: 'text-amber-400',
    icon: 'Clock',
    description: 'Slow shift over time',
  },
  regression: {
    label: 'Regression',
    color: 'text-red-400',
    icon: 'AlertTriangle',
    description: 'Unintended rollback',
  },
};

export const SCORE_TREND_CONFIG: Record<
  ScoreTrend,
  { label: string; color: string; icon: string }
> = {
  improving: { label: 'Improving', color: 'text-emerald-400', icon: 'TrendingUp' },
  stable: { label: 'Stable', color: 'text-blue-400', icon: 'Minus' },
  declining: { label: 'Declining', color: 'text-red-400', icon: 'TrendingDown' },
};

export const PAGE_TYPE_CONFIG: Record<
  PageType,
  { label: string; color: string; icon: string }
> = {
  homepage: { label: 'Homepage', color: 'text-blue-400', icon: 'Home' },
  pricing: { label: 'Pricing', color: 'text-emerald-400', icon: 'DollarSign' },
  product: { label: 'Product', color: 'text-purple-400', icon: 'Package' },
  comparison: { label: 'Comparison', color: 'text-amber-400', icon: 'GitCompare' },
  about: { label: 'About', color: 'text-cyan-400', icon: 'Info' },
};
