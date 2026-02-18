import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// âââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export type ArtifactType = 'battlecard' | 'objection_library' | 'swipe_file' | 'maturity_model' | 'deal_brief' | 'scorecard';
export type DeliveryChannel = 'slack' | 'email' | 'in_app' | 'notion';
export type GapType = 'missing_battlecard' | 'stale_battlecard' | 'missing_objection' | 'no_competitive_context' | 'missing_talk_track';
export type GapSeverity = 'high' | 'medium' | 'low';

export interface EnablementDelivery {
  id: string;
  artifact_type: ArtifactType;
  artifact_id: string | null;
  competitor_name: string | null;
  channel: DeliveryChannel;
  recipient_team: string | null;
  deal_id: string | null;
  delivered_at: string;
  metadata: Record<string, unknown>;
}

export interface EnablementFeedback {
  id: string;
  artifact_type: string;
  artifact_id: string | null;
  competitor_name: string | null;
  rating: number;
  useful_sections: string[];
  missing_items: string[];
  comments: string | null;
  submitted_at: string;
}

export interface EnablementGap {
  id: string;
  gap_type: GapType;
  description: string;
  severity: GapSeverity;
  competitor_name: string | null;
  deal_id: string | null;
  identified_at: string;
  resolved_at: string | null;
}

export interface EnablementStats {
  deliveries_count: number;
  feedback_count: number;
  avg_rating: number | null;
  views_count: number;
  unique_viewers: number;
  open_gaps: number;
  high_severity_gaps: number;
}

export interface FeedbackSummary {
  artifact_type: string;
  feedback_count: number;
  avg_rating: number;
  top_useful_sections: string[];
  top_missing_items: string[];
}

export interface EnablementScorecard {
  id: string;
  week_start: string;
  week_end: string;
  data: {
    deliveries_count: number;
    artifacts_updated: number;
    feedback_count: number;
    avg_rating: number;
    top_referenced_sections: string[];
    unaddressed_objections: string[];
    coverage_gaps: Array<{ gap_type: string; description: string; severity: string; competitor_name: string | null }>;
    actions_recommended: string[];
    views_count: number;
    unique_viewers: number;
  };
  created_at: string;
}

export interface DealArtifactLink {
  id: string;
  artifact_type: string;
  artifact_id: string | null;
  competitor_name: string | null;
  linked_at: string;
  notes: string | null;
}

// âââ Hook ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function useEnablement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // âââ Stats (weekly snapshot) ââââââââââââââââââââââââââââââââââââââââââââââ
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['enablement-stats', user?.id],
    queryFn: async (): Promise<EnablementStats | null> => {
      if (!user) return null;

      const { data, error } = await (supabase.rpc as any)('get_enablement_stats', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching enablement stats:', error);
        return null;
      }

      const row = Array.isArray(data) ? data[0] : data;
      return row as EnablementStats;
    },
    enabled: !!user,
  });

  // âââ Feedback summary (30-day) ââââââââââââââââââââââââââââââââââââââââââââ
  const { data: feedbackSummary, isLoading: feedbackLoading } = useQuery({
    queryKey: ['enablement-feedback-summary', user?.id],
    queryFn: async (): Promise<FeedbackSummary[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_enablement_feedback_summary', {
        p_user_id: user.id,
        p_days: 30,
      });

      if (error) {
        console.error('Error fetching feedback summary:', error);
        return [];
      }

      return (data || []) as FeedbackSummary[];
    },
    enabled: !!user,
  });

  // âââ Scorecards âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const { data: scorecards, isLoading: scorecardsLoading } = useQuery({
    queryKey: ['enablement-scorecards', user?.id],
    queryFn: async (): Promise<EnablementScorecard[]> => {
      if (!user) return [];

      const { data, error } = await (supabase.rpc as any)('get_enablement_scorecards', {
        p_user_id: user.id,
        p_limit: 12,
      });

      if (error) {
        console.error('Error fetching scorecards:', error);
        return [];
      }

      return (data || []) as EnablementScorecard[];
    },
    enabled: !!user,
  });

  // âââ Log delivery âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const logDelivery = useMutation({
    mutationFn: async (params: {
      artifactType: ArtifactType;
      artifactId?: string;
      competitorName?: string;
      channel: DeliveryChannel;
      recipientTeam?: string;
      recipientIds?: string[];
      dealId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('log_enablement_delivery', {
        p_user_id: user.id,
        p_artifact_type: params.artifactType,
        p_artifact_id: params.artifactId || null,
        p_competitor_name: params.competitorName || null,
        p_channel: params.channel,
        p_recipient_team: params.recipientTeam || null,
        p_recipient_ids: params.recipientIds || null,
        p_deal_id: params.dealId || null,
        p_metadata: params.metadata || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enablement-stats'] });
    },
  });

  // âââ Submit feedback ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const submitFeedback = useMutation({
    mutationFn: async (params: {
      artifactType: string;
      rating: number;
      deliveryId?: string;
      artifactId?: string;
      competitorName?: string;
      usefulSections?: string[];
      missingItems?: string[];
      comments?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('submit_enablement_feedback', {
        p_user_id: user.id,
        p_artifact_type: params.artifactType,
        p_rating: params.rating,
        p_delivery_id: params.deliveryId || null,
        p_artifact_id: params.artifactId || null,
        p_competitor_name: params.competitorName || null,
        p_useful_sections: params.usefulSections || null,
        p_missing_items: params.missingItems || null,
        p_comments: params.comments || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enablement-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-feedback-summary'] });
      toast({ title: 'Feedback submitted', description: 'Thank you for your feedback.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to submit feedback', description: err.message, variant: 'destructive' });
    },
  });

  // âââ Log view âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const logView = useMutation({
    mutationFn: async (params: {
      artifactType: string;
      source: 'slack' | 'email' | 'direct' | 'notification';
      artifactId?: string;
      competitorName?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase.rpc as any)('log_artifact_view', {
        p_user_id: user.id,
        p_viewer_id: user.id,
        p_artifact_type: params.artifactType,
        p_source: params.source,
        p_artifact_id: params.artifactId || null,
        p_competitor_name: params.competitorName || null,
      });

      if (error) {
        console.error('Error logging view:', error);
      }
    },
  });

  // âââ Deal artifact linking ââââââââââââââââââââââââââââââââââââââââââââââââ
  const linkArtifactToDeal = useMutation({
    mutationFn: async (params: {
      dealId: string;
      artifactType: string;
      artifactId?: string;
      competitorName?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('link_deal_artifact', {
        p_user_id: user.id,
        p_deal_id: params.dealId,
        p_artifact_type: params.artifactType,
        p_artifact_id: params.artifactId || null,
        p_competitor_name: params.competitorName || null,
        p_notes: params.notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-artifacts'] });
      toast({ title: 'Artifact linked', description: 'Artifact linked to deal.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to link artifact', description: err.message, variant: 'destructive' });
    },
  });

  const unlinkArtifactFromDeal = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await (supabase.rpc as any)('unlink_deal_artifact', {
        p_link_id: linkId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-artifacts'] });
      toast({ title: 'Artifact unlinked', description: 'Artifact removed from deal.' });
    },
  });

  // âââ Get deal artifacts âââââââââââââââââââââââââââââââââââââââââââââââââââ
  const useDealArtifacts = (dealId: string | null) =>
    useQuery({
      queryKey: ['deal-artifacts', dealId],
      queryFn: async (): Promise<DealArtifactLink[]> => {
        if (!dealId) return [];

        const { data, error } = await (supabase.rpc as any)('get_deal_artifacts', {
          p_deal_id: dealId,
        });

        if (error) {
          console.error('Error fetching deal artifacts:', error);
          return [];
        }

        return (data || []) as DealArtifactLink[];
      },
      enabled: !!dealId,
    });

  return {
    // Data
    stats,
    feedbackSummary: feedbackSummary || [],
    scorecards: scorecards || [],
    isLoading: statsLoading || feedbackLoading || scorecardsLoading,

    // Mutations
    logDelivery,
    submitFeedback,
    logView,
    linkArtifactToDeal,
    unlinkArtifactFromDeal,

    // Sub-queries
    useDealArtifacts,
  };
}
