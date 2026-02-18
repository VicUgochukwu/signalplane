// âââ Launch Operations Center Types ââââââââââââââââââââââââââââââââââââââââââ

export type LaunchPhase =
  | 'planning'
  | 'pre_launch'
  | 'launch_day'
  | 'post_launch'
  | 'retrospective'
  | 'completed';

export type LaunchType =
  | 'major_release'
  | 'feature_launch'
  | 'pricing_change'
  | 'market_expansion'
  | 'reposition'
  | 'competitive_response';

export type BriefType = 'intelligence' | 'packet' | 'decay' | 'playbook';

export type MomentumStatus = 'strong' | 'holding' | 'fading' | 'pivoted';

// âââ Core Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface Launch {
  id: string;
  user_id: string;
  launch_name: string;
  product_name: string;
  launch_type: LaunchType;
  description: string | null;
  target_launch_date: string;
  actual_launch_date: string | null;
  phase: LaunchPhase;
  readiness_score: number;
  readiness_breakdown: ReadinessBreakdown;
  competitor_ids: string[] | null;
  competitor_names: string[] | null;
  initial_messaging: Record<string, unknown>;
  initial_positioning: Record<string, unknown>;
  weeks_tracked: number;
  tags: string[] | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReadinessBreakdown {
  competitor_landscape?: number;
  messaging_readiness?: number;
  market_timing?: number;
  objection_coverage?: number;
  battlecard_freshness?: number;
}

export interface LaunchListItem {
  id: string;
  launch_name: string;
  product_name: string;
  launch_type: LaunchType;
  target_launch_date: string;
  actual_launch_date: string | null;
  phase: LaunchPhase;
  readiness_score: number;
  competitor_names: string[] | null;
  tags: string[] | null;
  weeks_tracked: number;
  days_until_launch: number;
  brief_count: number;
  latest_brief_date: string | null;
  decay_week: number | null;
  created_at: string;
  updated_at: string;
}

export interface LaunchBrief {
  id: string;
  launch_id: string;
  brief_type: BriefType;
  brief_date: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  included_signal_ids: string[] | null;
  signal_count: number;
  days_to_launch: number | null;
  created_at: string;
}

export interface ReadinessCheck {
  id: string;
  launch_id: string;
  check_date: string;
  score: number;
  competitor_landscape_score: number;
  messaging_readiness_score: number;
  market_timing_score: number;
  objection_coverage_score: number;
  battlecard_freshness_score: number;
  risk_factors: Array<{ label: string; detail: string; severity: string }>;
  opportunities: Array<{ label: string; detail: string }>;
  recommendations: Array<{ label: string; detail: string; priority: string }>;
  created_at: string;
}

export interface DecayReport {
  id: string;
  launch_id: string;
  report_date: string;
  week_number: number;
  messaging_drift_score: number;
  homepage_change_count: number;
  competitor_response_count: number;
  momentum_status: MomentumStatus;
  competitor_reactions: Array<{ competitor: string; reaction: string; severity: string }>;
  recommendations: Array<{ label: string; detail: string }>;
  created_at: string;
}

export interface LaunchPlaybook {
  id: string;
  launch_id: string;
  title: string;
  content_json: Record<string, unknown>;
  content_md: string;
  total_briefs_generated: number;
  total_signals_consumed: number;
  peak_readiness_score: number;
  final_momentum_status: MomentumStatus | null;
  knowledge_items_created: string[] | null;
  created_at: string;
}

export interface LaunchDetail {
  launch: Launch;
  briefs: LaunchBrief[];
  readiness_checks: ReadinessCheck[];
  decay_reports: DecayReport[];
  playbook: LaunchPlaybook | null;
}

// âââ Config Objects ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const LAUNCH_PHASE_CONFIG: Record<
  LaunchPhase,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  planning: {
    label: 'Planning',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: 'ClipboardList',
  },
  pre_launch: {
    label: 'Pre-Launch',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    icon: 'Clock',
  },
  launch_day: {
    label: 'Launch Day',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    icon: 'Rocket',
  },
  post_launch: {
    label: 'Post-Launch',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: 'TrendingUp',
  },
  retrospective: {
    label: 'Retrospective',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    icon: 'BookOpen',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: 'CheckCircle2',
  },
};

export const LAUNCH_TYPE_CONFIG: Record<
  LaunchType,
  { label: string; icon: string }
> = {
  major_release: { label: 'Major Release', icon: 'Rocket' },
  feature_launch: { label: 'Feature Launch', icon: 'Zap' },
  pricing_change: { label: 'Pricing Change', icon: 'DollarSign' },
  market_expansion: { label: 'Market Expansion', icon: 'Globe' },
  reposition: { label: 'Reposition', icon: 'Target' },
  competitive_response: { label: 'Competitive Response', icon: 'Shield' },
};

export const MOMENTUM_STATUS_CONFIG: Record<
  MomentumStatus,
  { label: string; color: string; bgColor: string }
> = {
  strong: { label: 'Strong', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  holding: { label: 'Holding', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  fading: { label: 'Fading', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  pivoted: { label: 'Pivoted', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

export const BRIEF_TYPE_CONFIG: Record<
  BriefType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  intelligence: { label: 'Intelligence Brief', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'Eye' },
  packet: { label: 'Launch Packet', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: 'Package' },
  decay: { label: 'Decay Report', color: 'text-rose-400', bgColor: 'bg-rose-500/20', icon: 'TrendingDown' },
  playbook: { label: 'Playbook', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'BookOpen' },
};
