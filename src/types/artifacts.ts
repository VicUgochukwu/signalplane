// Objection Library Types
export interface EvidenceSnippet {
  text: string;
  source: string;
  date?: string;
}

export interface Objection {
  id: string;
  objection_text: string;
  category: string;
  frequency: 'high' | 'medium' | 'low';
  personas: string[];
  maturity_stage?: 1 | 2 | 3 | 4;
  rebuttal: {
    acknowledge: string;
    reframe: string;
    proof: string;
    talk_track: string;
  };
  is_new_this_week: boolean;
  evidence_urls?: string[];
  evidence_snippets?: EvidenceSnippet[];
}

export interface ObjectionLibraryContent {
  objections: Objection[];
  total_count: number;
  new_this_week_count: number;
  categories: string[];
}

export interface ObjectionLibraryVersion {
  id: string;
  week_start: string;
  week_end: string;
  packet_id: string | null;
  content_json: ObjectionLibraryContent;
  content_md: string;
  included_signal_ids: string[];
  objection_count: number;
  created_at: string;
}

// Swipe File Types
export interface SwipePhrase {
  id: string;
  phrase: string;
  category: string;
  persona: string;
  trend: 'rising' | 'stable' | 'fading';
  maturity_stage?: 1 | 2 | 3 | 4;
  is_new_this_week: boolean;
}

export interface SwipeFileContent {
  phrases: SwipePhrase[];
  total_count: number;
  by_persona: Record<string, number>;
  by_category: Record<string, number>;
}

export interface SwipeFileVersion {
  id: string;
  week_start: string;
  week_end: string;
  packet_id: string | null;
  content_json: SwipeFileContent;
  content_md: string;
  included_signal_ids: string[];
  phrase_count: number;
  created_at: string;
}

// Battlecard Types
export interface BattlecardContent {
  competitor_name: string;
  what_changed_this_week: string[];
  talk_tracks: {
    title: string;
    content: string;
  }[];
  landmines: {
    warning: string;
    context: string;
  }[];
  win_themes: string[];
  lose_themes: string[];
}

export interface BattlecardVersion {
  id: string;
  competitor_name: string;
  week_start: string;
  week_end: string;
  packet_id: string | null;
  content_json: BattlecardContent;
  content_md: string;
  included_signal_ids: string[];
  created_at: string;
}

// Maturity Model Types
export interface MaturityStage {
  stage_number: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  what_works: string;
  what_breaks: string;
  trigger_to_next: string;
  discovery_questions: string[];
  talk_track: string;
  objection_reframes: {
    original_objection: string;
    readiness_reframe: string;
  }[];
  swipe_phrases: string[];
}

export interface MaturityDimension {
  id: string;
  label: string;
  stages: MaturityStage[];
}

export interface CompetitorPosition {
  competitor_name: string;
  dimension_id: string;
  stage_number: number;
  evidence_summary: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface MaturityModelContent {
  title: string;
  dimensions: MaturityDimension[];
  competitor_mapping: CompetitorPosition[];
  generation_metadata: {
    signal_count: number;
    objection_count: number;
    swipe_phrase_count: number;
  };
}

export interface MaturityModelVersion {
  id: string;
  week_start: string;
  week_end: string;
  packet_id: string | null;
  content_json: MaturityModelContent;
  content_md: string;
  included_signal_ids: string[];
  dimension_count: number;
  created_at: string;
}
