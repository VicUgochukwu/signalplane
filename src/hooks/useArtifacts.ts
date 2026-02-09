import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ObjectionLibraryVersion, 
  SwipeFileVersion, 
  BattlecardVersion 
} from '@/types/artifacts';

export const useObjectionLibrary = () => {
  return useQuery({
    queryKey: ['objection-library'],
    queryFn: async (): Promise<ObjectionLibraryVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .schema('gtm_artifacts' as any)
        .from('objection_library_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch objection library:', error.message);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        week_start: row.week_start,
        week_end: row.week_end,
        packet_id: row.packet_id,
        content_json: row.content_json || { objections: [], total_count: 0, new_this_week_count: 0, categories: [] },
        content_md: row.content_md || '',
        included_signal_ids: row.included_signal_ids || [],
        objection_count: row.objection_count || 0,
        created_at: row.created_at,
      }));
    },
  });
};

export const useSwipeFile = () => {
  return useQuery({
    queryKey: ['swipe-file'],
    queryFn: async (): Promise<SwipeFileVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .schema('gtm_artifacts' as any)
        .from('swipe_file_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch swipe file:', error.message);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        week_start: row.week_start,
        week_end: row.week_end,
        packet_id: row.packet_id,
        content_json: row.content_json || { phrases: [], total_count: 0, by_persona: {}, by_category: {} },
        content_md: row.content_md || '',
        included_signal_ids: row.included_signal_ids || [],
        phrase_count: row.phrase_count || 0,
        created_at: row.created_at,
      }));
    },
  });
};

export const useBattlecards = () => {
  return useQuery({
    queryKey: ['battlecards'],
    queryFn: async (): Promise<BattlecardVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .schema('gtm_artifacts' as any)
        .from('battlecard_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch battlecards:', error.message);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        competitor_name: row.competitor_name,
        week_start: row.week_start,
        week_end: row.week_end,
        packet_id: row.packet_id,
        content_json: row.content_json || { 
          competitor_name: row.competitor_name,
          what_changed_this_week: [],
          talk_tracks: [],
          landmines: [],
          win_themes: [],
          lose_themes: []
        },
        content_md: row.content_md || '',
        included_signal_ids: row.included_signal_ids || [],
        created_at: row.created_at,
      }));
    },
  });
};
