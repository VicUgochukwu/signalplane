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

/* No generic/public artifacts allowed — every authenticated user only sees their own data */

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
        // Only show this user's artifacts — never show generic/other users' data
        query = query.eq('user_id', user.id);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch objection library:', error.message);
        return [];
      }

      const filtered = data || [];

      return filtered.map(row => {
        const raw = row.content_json || { objections: [], total_count: 0, new_this_week_count: 0, categories: [] };
        // Normalize objections: ensure all required fields exist on each objection
        if (Array.isArray(raw.objections)) {
          raw.objections = raw.objections.map((o: any, idx: number) => ({
            ...o,
            id: o.id || `obj-${row.id}-${idx}`,
            objection_text: o.objection_text || '',
            category: o.category || 'General',
            frequency: o.frequency || 'medium',
            personas: o.personas || [],
            rebuttal: {
              acknowledge: '',
              reframe: '',
              proof: '',
              talk_track: '',
              ...(o.rebuttal || {}),
            },
            is_new_this_week: o.is_new_this_week ?? false,
          }));
        }
        return {
          id: row.id,
          week_start: row.week_start,
          week_end: row.week_end,
          packet_id: row.packet_id,
          content_json: raw,
          content_md: row.content_md || '',
          included_signal_ids: row.included_signal_ids || [],
          objection_count: row.objection_count || 0,
          created_at: row.created_at,
        };
      });
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
        // Only show this user's artifacts — never show generic/other users' data
        query = query.eq('user_id', user.id);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch swipe file:', error.message);
        return [];
      }

      const filtered = data || [];

      return filtered.map(row => {
        const raw = row.content_json || { phrases: [], total_count: 0, by_persona: {}, by_category: {} };
        // Normalize phrases: map 'text' → 'phrase' and ensure all required fields
        if (Array.isArray(raw.phrases)) {
          raw.phrases = raw.phrases.map((p: any, idx: number) => ({
            ...p,
            id: p.id || `phrase-${row.id}-${idx}`,
            phrase: p.phrase || p.text || '',
            persona: p.persona || 'General',
            category: p.category || 'Uncategorized',
            trend: p.trend || 'stable',
            is_new_this_week: p.is_new_this_week ?? false,
          }));
        }
        return {
          id: row.id,
          week_start: row.week_start,
          week_end: row.week_end,
          packet_id: row.packet_id,
          content_json: raw,
          content_md: row.content_md || '',
          included_signal_ids: row.included_signal_ids || [],
          phrase_count: row.phrase_count || 0,
          created_at: row.created_at,
        };
      });
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
        // Only show this user's battlecards — never show generic/other users' data
        query = query.eq('user_id', user.id);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch battlecards:', error.message);
        return [];
      }

      const filtered = data || [];

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
