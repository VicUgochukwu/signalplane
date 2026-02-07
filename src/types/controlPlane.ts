// Control Plane v2 Types

// Signal Types
export type SignalType = 
  | 'pricing'
  | 'proof'
  | 'distribution'
  | 'hiring'
  | 'launch_decay'
  | 'experiment'
  | 'messaging'
  | 'positioning'
  | 'packaging';

// Market Winners
export type WinnerCategory = 
  | 'packaging'
  | 'conversion'
  | 'proof'
  | 'positioning'
  | 'distribution';

export interface MarketWinner {
  pattern_label: string;
  category: WinnerCategory;
  what_changed: string;
  where_seen: string[]; // company names
  survival_weeks: number;
  propagation_count: number;
  why_it_matters: string;
  implementation_guidance: string;
}

export interface MarketWinnersData {
  proven: MarketWinner[];
  emerging: MarketWinner[];
}

// Cost Telemetry
export interface CostEvent {
  id: string;
  week_start: string;
  ship_name: string;
  event_type: string;
  pages_processed: number;
  headless_calls: number;
  llm_calls: number;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

export interface CostSummary {
  week_start: string;
  ship_name: string;
  runs: number;
  total_pages: number;
  total_headless: number;
  total_llm_calls: number;
  total_tokens: number;
}

export interface CostDashboardData {
  summaries: CostSummary[];
  totalPages: number;
  totalLLMCalls: number;
  totalTokens: number;
  estimatedCost: number;
  budgetUsed: number;
  budgetLimit: number;
}

// Signal type configuration
export interface SignalTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const SIGNAL_TYPE_CONFIG: Record<SignalType, SignalTypeConfig> = {
  pricing: {
    label: 'Pricing',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: 'DollarSign',
  },
  proof: {
    label: 'Proof',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: 'Shield',
  },
  distribution: {
    label: 'Distribution',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    icon: 'Share2',
  },
  hiring: {
    label: 'Hiring',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: 'Briefcase',
  },
  launch_decay: {
    label: 'Launch Decay',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: 'TrendingDown',
  },
  experiment: {
    label: 'Experiment',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: 'FlaskConical',
  },
  messaging: {
    label: 'Messaging',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    icon: 'MessageSquare',
  },
  positioning: {
    label: 'Positioning',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/30',
    icon: 'Target',
  },
  packaging: {
    label: 'Packaging',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    icon: 'Package',
  },
};

// Winner category configuration
export const WINNER_CATEGORY_CONFIG: Record<WinnerCategory, { label: string; color: string; bgColor: string }> = {
  packaging: {
    label: 'Packaging',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
  },
  conversion: {
    label: 'Conversion',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  proof: {
    label: 'Proof',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  positioning: {
    label: 'Positioning',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
  },
  distribution: {
    label: 'Distribution',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
};
