import { MarketWinner } from './controlPlane';

export type PacketStatus = 'live' | 'published' | 'draft' | 'archived';

export interface IntelSection {
  summary: string;
  highlights: string[];
  action_items: string[];
}

export interface Bet {
  hypothesis: string;
  confidence: number; // 0-100
  signal_ids: string[];
}

export type PredictionOutcome = 'correct' | 'incorrect' | 'partial' | 'pending';

export interface Prediction {
  prediction: string;
  timeframe: string;
  confidence: number;
  signals: string[];
  // Judgment Loop outcome tracking
  outcome?: PredictionOutcome;
  outcome_notes?: string;
  scored_at?: string; // ISO date when outcome was evaluated
}

export interface JudgmentLoopStats {
  total_predictions: number;
  scored: number;
  correct: number;
  incorrect: number;
  partial: number;
  pending: number;
  accuracy_rate: number; // 0-100, calculated from scored predictions
  confidence_calibration: number; // how well confidence matches actual accuracy
}

export interface JudgmentLoopData {
  current_stats: JudgmentLoopStats;
  history: Array<{
    week_start: string;
    predictions_made: number;
    scored: number;
    correct: number;
    accuracy_rate: number;
  }>;
}

export interface ActionItem {
  action: string;
  owner: string;
  priority: string;
}

export interface MonitorItem {
  signal: string;
  trigger: string;
  action: string;
}

export interface ActionMapping {
  this_week: ActionItem[];
  monitor: MonitorItem[];
}

export interface MarketWinnersData {
  proven: MarketWinner[];
  emerging: MarketWinner[];
}

export interface IntelPacket {
  id: string;
  week_start: string; // DATE
  week_end: string; // DATE
  packet_title: string;
  exec_summary: string[];
  sections: {
    messaging: IntelSection;
    narrative: IntelSection;
    icp: IntelSection;
    horizon: IntelSection;
    objection: IntelSection;
    social: IntelSection;
    enablement: IntelSection;
  };
  key_questions: string[];
  bets: Bet[];
  predictions: Prediction[];
  action_mapping: ActionMapping;
  market_winners?: MarketWinnersData;
  judgment_loop?: JudgmentLoopData;
  status: PacketStatus;
  created_at: string;
  metrics?: {
    signals_detected?: number;
    confidence_score?: number;
    impact_score?: number;
  };
  // Company-aware fields
  is_personalized?: boolean;
  user_company_name?: string | null;
}

// Section configuration for display
export type SectionKey = keyof IntelPacket['sections'];

export interface SectionConfig {
  key: SectionKey;
  title: string;
  color: string;
}
