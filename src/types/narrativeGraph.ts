export type EvidenceWeight = 'high' | 'medium' | 'low';
export type CorroborationScore = 'strong' | 'moderate' | 'weak';
export type ConfidenceLevel = 'high' | 'moderate-high' | 'moderate' | 'low';

export interface NarrativeArcEdge {
  edge_id: string;
  signal_source: 'narrative_drift' | 'classified_change' | 'category_drift';
  source_id: string;
  week_start_date: string;
  edge_label: 'origin' | 'escalation' | 'reinforcement' | 'pivot';
  llm_reasoning: string | null;
  evidence_weight: EvidenceWeight;
  page_type: string | null;
}

export interface NarrativeArc {
  arc_id: string;
  company_id: string;
  company_name: string;
  arc_title: string;
  arc_theme: string;
  arc_status: 'building' | 'escalating' | 'peaked' | 'fading';
  first_seen_week: string;
  last_seen_week: string;
  weeks_active: number;
  escalation_count: number;
  trajectory: 'accelerating' | 'steady' | 'decelerating';
  current_severity: number;
  strategic_summary: string | null;
  corroboration_score: CorroborationScore;
  page_type_diversity: number;
  alternative_explanation: string | null;
  confidence_level: ConfidenceLevel;
  edges: NarrativeArcEdge[];
}

export interface Convergence {
  convergence_id: string;
  convergence_theme: string;
  week_detected: string;
  company_ids: string[];
  company_names: string[];
  arc_ids: string[];
  severity: number;
  summary: string | null;
  corroboration_score: CorroborationScore;
  alternative_explanation: string | null;
  confidence_level: ConfidenceLevel;
}
