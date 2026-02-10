export type TeamRole = 'admin' | 'pmm' | 'sales' | 'executive';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type PilotStatus = 'pilot' | 'grace' | 'active' | 'free' | 'churned';
export type Tier = 'pilot' | 'free' | 'growth' | 'enterprise';
export type DealOutcome = 'won' | 'lost' | 'in_progress';

export interface Team {
  id: string;
  name: string;
  company_domain: string | null;
  org_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  // Joined from auth.users for display
  email?: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invite_token: string;
  invited_by: string;
  status: InviteStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface TeamAnnotation {
  id: string;
  team_id: string;
  user_id: string;
  target_type: 'signal' | 'packet' | 'prediction';
  target_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined for display
  user_email?: string;
}

export interface PilotAccount {
  id: string;
  user_id: string;
  team_id: string | null;
  company_domain: string | null;
  pilot_start: string;
  pilot_end: string;
  grace_end: string;
  status: PilotStatus;
  tier: Tier;
  max_competitors: number;
  competitor_fingerprint: string | null;
  conversion_nudges_sent: string[];
  converted_at: string | null;
  downgraded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PilotStatusInfo {
  pilot_start: string;
  pilot_end: string;
  grace_end: string;
  days_remaining: number;
  days_elapsed: number;
  status: PilotStatus;
  tier: Tier;
  max_competitors: number;
  current_competitor_count: number;
}

export interface KnowledgeLedgerMetrics {
  total_knowledge_objects: number;
  total_signals_processed: number;
  total_packets: number;
  prediction_accuracy: number;
  predictions_scored: number;
  predictions_total: number;
  competitors_monitored: number;
  pages_tracked: number;
  pilot_days_remaining: number;
  pilot_days_elapsed: number;
  weekly_signal_growth: number;
}

export interface Deal {
  id: string;
  user_id: string;
  team_id: string | null;
  competitor_company_id: string | null;
  competitor_name: string;
  outcome: DealOutcome;
  deal_name: string | null;
  deal_value: number | null;
  close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Features gated by tier */
export type GatedFeature =
  | 'team'
  | 'judgment_loop'
  | 'win_loss'
  | 'annotations'
  | 'export'
  | 'role_views'
  | 'knowledge_ledger_full';

/** Feature-to-tier mapping: which tiers can use each feature */
export const FEATURE_TIER_MAP: Record<GatedFeature, Tier[]> = {
  team: ['pilot', 'growth', 'enterprise'],
  judgment_loop: ['pilot', 'growth', 'enterprise'],
  win_loss: ['pilot', 'growth', 'enterprise'],
  annotations: ['pilot', 'growth', 'enterprise'],
  export: ['pilot', 'growth', 'enterprise'],
  role_views: ['pilot', 'growth', 'enterprise'],
  knowledge_ledger_full: ['pilot', 'growth', 'enterprise'],
};

/** Competitor limits by tier */
export const TIER_COMPETITOR_LIMITS: Record<Tier, number> = {
  pilot: 99,
  free: 2,
  growth: 5,
  enterprise: 10,
};
