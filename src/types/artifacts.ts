// Objection Library Types
export interface Objection {
  id: string;
  objection_text: string;
  category: string;
  frequency: 'high' | 'medium' | 'low';
  personas: string[];
  rebuttal: {
    acknowledge: string;
    reframe: string;
    proof: string;
    talk_track: string;
  };
  is_new_this_week: boolean;
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
