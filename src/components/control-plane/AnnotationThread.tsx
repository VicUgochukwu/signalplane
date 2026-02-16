import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useTierGate } from '@/hooks/useTierGate';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { TeamAnnotation } from '@/types/teams';

interface AnnotationThreadProps {
  targetType: 'signal' | 'packet' | 'prediction';
  targetId: string;
}

/**
 * Team annotation thread for signals, packets, or predictions.
 * Only visible to Growth+ tier users who have a team.
 */
export function AnnotationThread({ targetType, targetId }: AnnotationThreadProps) {
  const { user } = useAuth();
  const { team, hasTeam } = useTeam();
  const { canUse } = useTierGate();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const canAnnotate = canUse('annotations') && hasTeam;

  const { data: annotations, isLoading } = useQuery({
    queryKey: ['annotations', targetType, targetId],
    queryFn: async (): Promise<TeamAnnotation[]> => {
      if (!team) return [];

      const { data, error } = await supabase
        .from('team_annotations')
        .select('*')
        .eq('team_id', team.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching annotations:', error);
        return [];
      }

      return (data || []) as TeamAnnotation[];
    },
    enabled: canAnnotate && !!team,
  });

  const addAnnotation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !team) throw new Error('Missing user or team');

      const { error } = await supabase
        .from('team_annotations')
        .insert({
          team_id: team.id,
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', targetType, targetId] });
      setNewComment('');
    },
  });

  if (!canAnnotate) return null;

  return (
    <div className="pt-4 border-t border-border/30">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Team Notes
      </h4>

      {/* Existing annotations */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading notes...
        </div>
      ) : (annotations || []).length > 0 ? (
        <div className="space-y-2 mb-3">
          {(annotations || []).map((annotation) => (
            <div
              key={annotation.id}
              className="p-2.5 rounded-lg bg-muted/20 text-sm"
            >
              <p className="text-foreground">{annotation.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {annotation.user_email || 'Team member'} &middot;{' '}
                {new Date(annotation.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Add annotation */}
      <div className="flex items-start gap-2">
        <Textarea
          placeholder="Add a note for your team..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[48px] text-xs bg-background/50 border-border/50 flex-1"
        />
        <Button
          size="sm"
          onClick={() => newComment.trim() && addAnnotation.mutate(newComment.trim())}
          disabled={!newComment.trim() || addAnnotation.isPending}
          className="bg-accent-signal hover:bg-accent-signal/90 text-white text-xs rounded-lg shrink-0"
        >
          {addAnnotation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Add'
          )}
        </Button>
      </div>
    </div>
  );
}
