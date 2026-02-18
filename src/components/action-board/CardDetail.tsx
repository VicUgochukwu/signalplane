import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionBoardCard, KIT_TYPE_COLORS, PRIORITY_COLORS, BOARD_COLUMNS, KitDecisionType, BoardColumn } from '@/types/actionBoard';
import { ExecutionKitPanel } from './ExecutionKitPanel';
import { useExecutionKit } from '@/hooks/useExecutionKit';
import { useDemo } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';
import {
  Archive, ExternalLink, FileText, Clock, CheckCircle2,
  Calendar, Inbox, Play, ArrowRight, Sparkles, Loader2,
  ThumbsUp, Minus, ThumbsDown,
} from 'lucide-react';

const OUTCOME_DISPLAY: Record<string, { label: string; icon: typeof ThumbsUp; cls: string }> = {
  positive: { label: 'Positive outcome', icon: ThumbsUp, cls: 'text-emerald-400' },
  neutral: { label: 'Neutral outcome', icon: Minus, cls: 'text-muted-foreground' },
  negative: { label: 'Negative outcome', icon: ThumbsDown, cls: 'text-rose-400' },
};

interface CardDetailProps {
  card: ActionBoardCard | null;
  onClose: () => void;
  onUpdateNotes: (cardId: string, notes: string) => void;
  onArchive: (cardId: string) => void;
  onMoveCard: (cardId: string, newColumn: string, newOrder: number) => void;
  onRecordOutcome?: (cardId: string, outcome: string, outcomeNotes: string) => void;
}

export function CardDetail({ card, onClose, onUpdateNotes, onArchive, onMoveCard, onRecordOutcome }: CardDetailProps) {
  const [notes, setNotes] = useState('');
  const { generateKit, isGenerating, reset: resetKit } = useExecutionKit();
  const demo = useDemo();

  useEffect(() => {
    if (card) {
      setNotes(card.notes || '');
      resetKit();
    }
  }, [card?.id]);

  if (!card) return null;

  const statusTimestamps = [
    { label: 'Added to Inbox', time: card.moved_to_inbox_at, icon: Inbox },
    { label: 'Moved to This Week', time: card.moved_to_this_week_at, icon: Calendar },
    { label: 'Started', time: card.moved_to_in_progress_at, icon: Play },
    { label: 'Completed', time: card.moved_to_done_at, icon: CheckCircle2 },
  ].filter(s => s.time);

  // Determine next column for quick-move button
  const columnOrder: BoardColumn[] = ['inbox', 'this_week', 'in_progress', 'done'];
  const currentIdx = columnOrder.indexOf(card.column_status as BoardColumn);
  const nextColumn = currentIdx >= 0 && currentIdx < columnOrder.length - 1 ? columnOrder[currentIdx + 1] : null;
  const nextColumnLabel = nextColumn ? BOARD_COLUMNS.find(c => c.key === nextColumn)?.label : null;

  const outcomeInfo = card.outcome ? OUTCOME_DISPLAY[card.outcome] : null;

  return (
    <Sheet open={!!card} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-base leading-snug pr-8">
            {card.action_text}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {card.decision_type && (
              <Badge variant="outline" className={cn(
                'text-xs border',
                KIT_TYPE_COLORS[card.decision_type as KitDecisionType] || ''
              )}>
                {card.decision_type}
              </Badge>
            )}
            {card.priority && (
              <Badge variant="outline" className={cn('text-xs', PRIORITY_COLORS[card.priority] || '')}>
                {card.priority} priority
              </Badge>
            )}
            {card.owner_team && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {card.owner_team}
              </Badge>
            )}
            {card.competitor_name && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                vs {card.competitor_name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground/70">
              sev {card.severity}/5
            </Badge>
          </div>

          {/* Outcome display (if already recorded) */}
          {outcomeInfo && (
            <div className={cn('flex items-center gap-2 text-sm', outcomeInfo.cls)}>
              <outcomeInfo.icon className="h-4 w-4" />
              <span className="font-medium">{outcomeInfo.label}</span>
              {card.outcome_notes && (
                <span className="text-xs text-muted-foreground ml-1">— {card.outcome_notes}</span>
              )}
            </div>
          )}

          {/* Record outcome button (if in done column and no outcome yet) */}
          {card.column_status === 'done' && !card.outcome && onRecordOutcome && (
            <div className="flex gap-2">
              {(['positive', 'neutral', 'negative'] as const).map((o) => {
                const info = OUTCOME_DISPLAY[o];
                const Icon = info.icon;
                return (
                  <button
                    key={o}
                    onClick={() => onRecordOutcome(card.id, o, '')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border/30 text-xs font-medium transition-colors hover:border-border',
                      info.cls
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick move button */}
          {nextColumn && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onMoveCard(card.id, nextColumn, 0)}
            >
              Move to {nextColumnLabel}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          )}

          {/* Packet source */}
          {card.packet_title && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>From: {card.packet_title} ({card.packet_week_start})</span>
            </div>
          )}

          {/* Evidence URLs */}
          {card.evidence_urls && card.evidence_urls.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence</p>
              {card.evidence_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-accent-signal hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  {url.length > 60 ? url.slice(0, 60) + '...' : url}
                </a>
              ))}
            </div>
          )}

          {/* Execution Kit */}
          {card.execution_kit ? (
            <ExecutionKitPanel kit={card.execution_kit} />
          ) : isGenerating ? (
            <div className="rounded-lg border border-[hsl(var(--accent-signal)/0.20)] bg-[hsl(var(--accent-signal)/0.05)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-accent-signal animate-spin" />
                <p className="text-sm font-medium text-accent-signal">Generating execution kit...</p>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-[hsl(var(--accent-signal)/0.10)]" />
                <Skeleton className="h-4 w-3/4 bg-[hsl(var(--accent-signal)/0.10)]" />
                <Skeleton className="h-4 w-5/6 bg-[hsl(var(--accent-signal)/0.10)]" />
              </div>
              <p className="text-xs text-muted-foreground">
                Analyzing signals, artifacts, and context to build tailored {card.decision_type || 'execution'} materials...
              </p>
            </div>
          ) : card.column_status !== 'inbox' && !demo?.isDemo ? (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center space-y-3">
              <Sparkles className="h-5 w-5 text-[hsl(var(--accent-signal)/0.40)] mx-auto" />
              <p className="text-xs text-muted-foreground">
                {card.decision_type
                  ? `Generate a ${card.decision_type} execution kit with tailored materials`
                  : 'Generate an execution kit with tailored response materials'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateKit(card.id)}
                className="text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate Execution Kit
              </Button>
            </div>
          ) : card.column_status === 'inbox' ? null : (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
              <Sparkles className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Execution kit preview (demo)</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (card.notes || '')) {
                  onUpdateNotes(card.id, notes);
                }
              }}
              placeholder="Add notes..."
              className="w-full min-h-[80px] rounded-lg border border-border/50 bg-muted/10 p-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent-signal)/0.50)]"
            />
          </div>

          {/* Status Timeline */}
          {statusTimestamps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timeline</p>
              <div className="space-y-2">
                {statusTimestamps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <s.icon className="h-3.5 w-3.5" />
                    <span>{s.label}</span>
                    <span className="text-muted-foreground/50">
                      {new Date(s.time!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archive button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-rose-400"
            onClick={() => onArchive(card.id)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive card
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
