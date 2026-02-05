export type PacketStatus = 'live' | 'published' | 'draft' | 'archived';

export interface IntelSection {
  summary: string;
  highlights: string[];
}

export interface Bet {
  hypothesis: string;
  confidence: number; // 0-100
  signal_ids: string[];
}

export interface IntelPacket {
  id: string;
  date: string; // ISO date "2026-01-26"
  headline: string; // "Week of Jan 20: AI Positioning Wars Heat Up"
  exec_summary: string[];
  competitive_intel: IntelSection;
  pipeline_intel: IntelSection;
  market_intel: IntelSection;
  key_questions: string[];
  bets: Bet[];
  status: PacketStatus;
  created_at: string;
  metrics?: {
    signals_detected?: number;
    confidence_score?: number;
    impact_score?: number;
  };
}
