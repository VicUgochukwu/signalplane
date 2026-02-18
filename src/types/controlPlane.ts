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
  | 'packaging'
  // External source types
  | 'social'       // Twitter/X, LinkedIn mentions
  | 'review'       // G2, App Store, Product Hunt reviews
  | 'video'        // YouTube videos/transcripts
  | 'code'         // GitHub repos, Stack Overflow
  | 'launch'       // Product Hunt launches
  | 'community'    // Reddit, forums
  | 'funding'      // Crunchbase funding/M&A
  | 'talent'       // LinkedIn, Glassdoor headcount/culture
  | 'patent'       // Patent filings
  | 'crm_intel';   // CRM win/loss data

// External source platforms
export type SourcePlatform =
  | 'twitter'
  | 'youtube'
  | 'github'
  | 'app_store'
  | 'product_hunt'
  | 'linkedin'
  | 'reddit'
  | 'g2'
  | 'stack_overflow'
  | 'crunchbase'
  | 'glassdoor'
  | 'google_patents'
  | 'hubspot'
  | 'salesforce'
  | 'job_board';

export interface ExternalSourceConfig {
  id: string;
  user_id: string;
  platform: SourcePlatform;
  config: Record<string, unknown>;
  enabled: boolean;
  last_polled_at: string | null;
  created_at: string;
  updated_at: string;
}

// Market Winners
export type WinnerCategory = 
  | 'packaging'
  | 'conversion'
  | 'proof'
  | 'positioning'
  | 'distribution';

export type WinnerTrend = 'accelerating' | 'stable' | 'fading';

export interface MarketWinner {
  pattern_label: string;
  category: WinnerCategory;
  what_changed: string;
  where_seen: string[]; // company names
  survival_weeks: number;
  propagation_count: number;
  why_it_matters: string;
  trend?: WinnerTrend;           // is this pattern accelerating, stable, or fading?
  your_gap?: string;             // "3 of 5 competitors do this. You don't."
  // Deprecated: kept for backward compat with existing seed data
  implementation_guidance?: string;
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
  social: {
    label: 'Social',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/30',
    icon: 'Twitter',
  },
  review: {
    label: 'Review',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: 'Star',
  },
  video: {
    label: 'Video',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: 'Play',
  },
  code: {
    label: 'Code',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    icon: 'Code',
  },
  launch: {
    label: 'Launch',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: 'Rocket',
  },
  community: {
    label: 'Community',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    icon: 'Users',
  },
  funding: {
    label: 'Funding',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    icon: 'Banknote',
  },
  talent: {
    label: 'Talent',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    icon: 'UserPlus',
  },
  patent: {
    label: 'Patent',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/20',
    borderColor: 'border-lime-500/30',
    icon: 'FileText',
  },
  crm_intel: {
    label: 'CRM Intel',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/30',
    icon: 'Database',
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
