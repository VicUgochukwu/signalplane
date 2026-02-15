import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  ObjectionLibraryVersion,
  SwipeFileVersion,
  BattlecardVersion,
  MaturityModelVersion
} from '@/types/artifacts';
import { useDemo } from '@/contexts/DemoContext';
import { useAuth } from './useAuth';

/** De-duplicate artifacts: prefer personalized over generic for the same week */
function deduplicateByWeek<T extends { week_start?: string; week_end?: string; user_id?: string | null; is_personalized?: boolean }>(rows: T[]): T[] {
  const personalizedWeeks = new Set(
    rows
      .filter(r => r.user_id && r.is_personalized)
      .map(r => `${r.week_start}_${r.week_end}`)
  );
  return rows.filter(r => {
    if (r.user_id) return true;
    const weekKey = `${r.week_start}_${r.week_end}`;
    return !personalizedWeeks.has(weekKey);
  });
}

export const useObjectionLibrary = () => {
  const demo = useDemo();
  const { user } = useAuth();

  return useQuery({
    queryKey: demo?.isDemo
      ? ['demo-objection-library', demo.sectorSlug]
      : ['objection-library', user?.id],
    queryFn: async (): Promise<ObjectionLibraryVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const schema = demo?.isDemo ? 'demo' : 'gtm_artifacts';
      let query = supabase
        .schema(schema as any)
        .from('objection_library_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (demo?.isDemo) {
        query = query.eq('sector_slug', demo.sectorSlug);
      } else if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch objection library:', error.message);
        return [];
      }

      const filtered = deduplicateByWeek(data || []);

      return filtered.map(row => ({
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
  const demo = useDemo();
  const { user } = useAuth();

  return useQuery({
    queryKey: demo?.isDemo
      ? ['demo-swipe-file', demo.sectorSlug]
      : ['swipe-file', user?.id],
    queryFn: async (): Promise<SwipeFileVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const schema = demo?.isDemo ? 'demo' : 'gtm_artifacts';
      let query = supabase
        .schema(schema as any)
        .from('swipe_file_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (demo?.isDemo) {
        query = query.eq('sector_slug', demo.sectorSlug);
      } else if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch swipe file:', error.message);
        return [];
      }

      const filtered = deduplicateByWeek(data || []);

      return filtered.map(row => ({
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
  const demo = useDemo();
  const { user } = useAuth();

  return useQuery({
    queryKey: demo?.isDemo
      ? ['demo-battlecards', demo.sectorSlug]
      : ['battlecards', user?.id],
    queryFn: async (): Promise<BattlecardVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const schema = demo?.isDemo ? 'demo' : 'gtm_artifacts';
      let query = supabase
        .schema(schema as any)
        .from('battlecard_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (demo?.isDemo) {
        query = query.eq('sector_slug', demo.sectorSlug);
      } else if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch battlecards:', error.message);
        return [];
      }

      // For battlecards, deduplicate by competitor + week (prefer personalized)
      const personalizedKeys = new Set(
        (data || [])
          .filter((r: any) => r.user_id && r.is_personalized)
          .map((r: any) => `${r.competitor_name}_${r.week_start}_${r.week_end}`)
      );
      const filtered = (data || []).filter((r: any) => {
        if (r.user_id) return true;
        const key = `${r.competitor_name}_${r.week_start}_${r.week_end}`;
        return !personalizedKeys.has(key);
      });

      return filtered.map((row: any) => ({
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

export const useMaturityModel = () => {
  const demo = useDemo();

  return useQuery({
    queryKey: demo?.isDemo
      ? ['demo-maturity-model', demo.sectorSlug]
      : ['maturity-model'],
    queryFn: async (): Promise<MaturityModelVersion[]> => {
      if (!supabase) {
        console.warn('Supabase not configured');
        return [];
      }

      const schema = demo?.isDemo ? 'demo' : 'gtm_artifacts';
      let query = supabase
        .schema(schema as any)
        .from('maturity_model_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (demo?.isDemo) {
        query = query.eq('sector_slug', demo.sectorSlug);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch maturity model:', error.message);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        week_start: row.week_start,
        week_end: row.week_end,
        packet_id: row.packet_id,
        content_json: row.content_json || {
          title: '',
          dimensions: [],
          competitor_mapping: [],
          generation_metadata: { signal_count: 0, objection_count: 0, swipe_phrase_count: 0 }
        },
        content_md: row.content_md || '',
        included_signal_ids: row.included_signal_ids || [],
        dimension_count: row.dimension_count || 0,
        created_at: row.created_at,
      }));
    },
  });
};
