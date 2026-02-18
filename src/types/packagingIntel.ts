// âââ Pricing & Packaging Intelligence Types âââââââââââââââââââââââââââââââââ

export type ValueMetric = 'seat' | 'usage' | 'flat' | 'hybrid' | 'unknown';

export type PricingChangeType =
  | 'plan_added'
  | 'plan_removed'
  | 'model_change'
  | 'gating_change'
  | 'limit_change'
  | 'trial_change'
  | 'free_tier_change'
  | 'enterprise_change';

export type StrategicSignal =
  | 'enterprise_push'
  | 'plg_pivot'
  | 'value_metric_shift'
  | 'friction_reduction';

export type Significance = 'major' | 'minor';

// âââ Core Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface TierEntry {
  name: string;
  price?: string;
  position?: string;
  features?: string[];
}

export interface GatingStrategy {
  free_features?: string[];
  paid_gates?: string[];
  enterprise_gates?: string[];
}

export interface PackagingLandscapeEntry {
  id: string;
  company_id: string;
  company_name: string;
  tier_structure: TierEntry[];
  value_metric: ValueMetric;
  gating_strategy: GatingStrategy;
  pricing_url: string | null;
  plan_count: number;
  has_free_tier: boolean;
  has_enterprise: boolean;
  snapshot_date: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface LandscapeMap {
  id: string;
  report_month: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  trends: LandscapeTrend[];
  companies_included: string[];
  created_at: string;
}

export interface LandscapeTrend {
  trend: string;
  direction: 'converging' | 'diverging' | 'stable';
  evidence: string;
}

export interface PackagingBrief {
  id: string;
  company_name: string;
  company_id: string | null;
  change_id: string | null;
  change_type: PricingChangeType;
  strategic_interpretation: string;
  response_recommendations: ResponseRecommendation[];
  severity: Significance;
  change_details: Record<string, unknown>;
  created_at: string;
}

export interface ResponseRecommendation {
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PackagingAudit {
  id: string;
  quarter: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  strengths: SOTEntry[];
  vulnerabilities: SOTEntry[];
  opportunities: SOTEntry[];
  threats: SOTEntry[];
  created_at: string;
}

export interface SOTEntry {
  claim?: string;
  gap?: string;
  position?: string;
  threat?: string;
  evidence_count?: number;
  competitor?: string;
  competitors?: string[];
  severity?: string;
  rationale?: string;
  urgency?: string;
}

export interface PackagingChange {
  id: string;
  company_id: string;
  company_name: string;
  change_type: PricingChangeType;
  change_details: Record<string, unknown>;
  significance: Significance;
  interpretation: string | null;
  strategic_signal: StrategicSignal | null;
  detected_at: string;
  signal_emitted: boolean;
  created_at: string;
}

// âââ Overview ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface RecentBrief {
  id: string;
  company_name: string;
  change_type: PricingChangeType;
  strategic_interpretation: string;
  severity: Significance;
  created_at: string;
}

export interface MetricDistribution {
  value_metric: ValueMetric;
  count: number;
}

export interface PackagingOverview {
  companies_tracked: number;
  recent_changes_count: number;
  major_changes_count: number;
  latest_landscape_month: string | null;
  latest_audit_quarter: string | null;
  landscape_trends: LandscapeTrend[];
  recent_briefs: RecentBrief[];
  value_metric_distribution: MetricDistribution[];
}

// âââ Config Objects ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const VALUE_METRIC_CONFIG: Record<
  ValueMetric,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  seat: { label: 'Per Seat', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: 'Users' },
  usage: { label: 'Usage-Based', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'BarChart3' },
  flat: { label: 'Flat Rate', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'Minus' },
  hybrid: { label: 'Hybrid', color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'Layers' },
  unknown: { label: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: 'HelpCircle' },
};

export const CHANGE_TYPE_CONFIG: Record<
  PricingChangeType,
  { label: string; color: string; bgColor: string }
> = {
  plan_added: { label: 'Plan Added', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  plan_removed: { label: 'Plan Removed', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  model_change: { label: 'Model Change', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  gating_change: { label: 'Gating Change', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  limit_change: { label: 'Limit Change', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  trial_change: { label: 'Trial Change', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  free_tier_change: { label: 'Free Tier', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  enterprise_change: { label: 'Enterprise', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
};

export const STRATEGIC_SIGNAL_CONFIG: Record<
  StrategicSignal,
  { label: string; color: string; icon: string; description: string }
> = {
  enterprise_push: { label: 'Enterprise Push', color: 'text-indigo-400', icon: 'Building2', description: 'Moving upmarket' },
  plg_pivot: { label: 'PLG Pivot', color: 'text-emerald-400', icon: 'Rocket', description: 'Moving to product-led growth' },
  value_metric_shift: { label: 'Metric Shift', color: 'text-purple-400', icon: 'Gauge', description: 'Changing how value is captured' },
  friction_reduction: { label: 'Friction Reduction', color: 'text-cyan-400', icon: 'Zap', description: 'Lowering adoption barriers' },
};

export const SIGNIFICANCE_CONFIG: Record<
  Significance,
  { label: string; color: string; bgColor: string }
> = {
  major: { label: 'Major', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  minor: { label: 'Minor', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
};
