export type BoardColumn = 'inbox' | 'this_week' | 'in_progress' | 'done';
export type ArchiveReason = 'user_archived' | 'stale_auto' | 'dismissed';
export type KitDecisionType = 'positioning' | 'packaging' | 'distribution' | 'proof' | 'enablement' | 'risk' | 'hiring' | 'launch';

export interface ActionBoardCard {
  id: string;
  packet_id: string;
  action_text: string;
  signal_headline: string | null;
  decision_type: KitDecisionType | null;
  owner_team: string | null;
  priority: string;
  severity: number;
  competitor_name: string | null;
  signal_ids: string[];
  evidence_urls: string[];
  column_status: BoardColumn | 'archived';
  column_order: number;
  assigned_to: string | null;
  assigned_at: string | null;
  notes: string | null;
  moved_to_inbox_at: string;
  moved_to_this_week_at: string | null;
  moved_to_in_progress_at: string | null;
  moved_to_done_at: string | null;
  execution_kit: ExecutionKit | null;
  kit_generated_at: string | null;
  outcome: 'positive' | 'neutral' | 'negative' | null;
  outcome_notes: string | null;
  outcome_recorded_at: string | null;
  packet_title: string;
  packet_week_start: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionKit {
  type: KitDecisionType;
  generated_at: string;
  components: ExecutionKitComponent[];
}

export interface ExecutionKitComponent {
  title: string;
  content: string;
  copyable: boolean;
}

export interface KitTemplate {
  components: string[];
  artifacts: ('battlecard' | 'objection_library' | 'swipe_file' | 'market_winners')[];
}

export const KIT_TEMPLATES: Record<KitDecisionType, KitTemplate> = {
  positioning: {
    components: ['Copy Diff', 'Internal Brief', 'Leadership Summary', 'Slide-Ready Block'],
    artifacts: ['battlecard', 'swipe_file'],
  },
  packaging: {
    components: ['Pricing Comparison Table', 'Value Reframe Script', 'Internal Impact Brief', 'Packaging Counter-Move Options'],
    artifacts: ['battlecard'],
  },
  distribution: {
    components: ['Channel Gap Analysis', 'Integration Priority Brief', 'Partnership Outreach Draft', 'GTM Co-Marketing Angle'],
    artifacts: ['market_winners'],
  },
  proof: {
    components: ['Proof Gap Audit', 'Customer Story Prompt', 'Counter-Proof Talking Points', 'Review Site Response Plan'],
    artifacts: ['swipe_file', 'market_winners'],
  },
  enablement: {
    components: ['Battlecard Section Update', 'Objection Rebuttal', 'Discovery Question Set', 'Win/Loss Talking Points'],
    artifacts: ['battlecard', 'objection_library'],
  },
  risk: {
    components: ['Risk Severity Assessment', 'Customer Retention Playbook', 'Internal Escalation Brief', 'Defensive Positioning Moves'],
    artifacts: ['objection_library', 'battlecard'],
  },
  hiring: {
    components: ['Strategic Read', 'Competitive Timeline Estimate', 'Preemptive Moves Brief', 'Internal Briefing Slide'],
    artifacts: [],
  },
  launch: {
    components: ['Launch Impact Assessment', 'Rapid Response Draft', 'Sales Talking Points', 'Counter-Narrative Angles'],
    artifacts: ['swipe_file', 'market_winners'],
  },
};

export const BOARD_COLUMNS: { key: BoardColumn; label: string; color: string }[] = [
  { key: 'inbox', label: 'Inbox', color: 'text-muted-foreground' },
  { key: 'this_week', label: 'This Week', color: 'text-sky-400' },
  { key: 'in_progress', label: 'In Progress', color: 'text-amber-400' },
  { key: 'done', label: 'Done', color: 'text-emerald-400' },
];

export const KIT_TYPE_COLORS: Record<KitDecisionType, string> = {
  positioning: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  packaging: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  distribution: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  proof: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  enablement: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  risk: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  hiring: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  launch: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-rose-400 bg-rose-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-muted-foreground bg-muted/30',
};
