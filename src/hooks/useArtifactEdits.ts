import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ArtifactType =
  | 'battlecard_talk_track'
  | 'battlecard_landmine'
  | 'objection_rebuttal'
  | 'swipe_phrase';

export type EditType = 'modify' | 'delete' | 'add';

/**
 * Mutation to record an artifact edit for compounding intelligence.
 * Called when a user edits a battlecard talk track, landmine, or objection rebuttal.
 */
export function useRecordArtifactEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      artifactType: ArtifactType;
      artifactVersionId: string;
      sectionKey: string;
      originalContent: string;
      editedContent: string;
      editType?: EditType;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('record_artifact_edit', {
          p_user_id: user.id,
          p_artifact_type: params.artifactType,
          p_artifact_version_id: params.artifactVersionId,
          p_section_key: params.sectionKey,
          p_original_content: params.originalContent,
          p_edited_content: params.editedContent,
          p_edit_type: params.editType || 'modify',
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['compounding-metrics'],
      });
      toast({
        title: 'Edit saved',
        description: 'Your customization has been recorded for intelligence calibration',
      });
    },
    onError: (error) => {
      console.error('Failed to record artifact edit:', error);
      toast({
        title: 'Failed to save edit',
        variant: 'destructive',
      });
    },
  });
}
