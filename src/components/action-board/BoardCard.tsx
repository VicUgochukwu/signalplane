import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionBoardCard, KIT_TYPE_COLORS, PRIORITY_COLORS, KitDecisionType } from '@/types/actionBoard';
import { cn } from '@/lib/utils';
import { GripVertical, Archive, Sparkles, AlertTriangle, Zap, Clock } from 'lucide-react';

/** Severity → left-border color for instant visual triage */
const SEVERITY_BORDER: Record<number, string> = {
  5: 'border-l-rose-500',
  4: 'border-l-rose-500',
  3: 'border-l-amber-500',
  2: 'border-l-amber-500',
  1: 'border-l-border',
};

/** Calculate human-readable time-in-column */
function timeInColumn(card: ActionBoardCard): string | null {
  let enteredAt: string | null = null;
  switch (card.column_status) {
    case 'inbox': enteredAt = card.moved_to_inbox_at; break;
    case 'this_week': enteredAt = card.moved_to_this_week_at; break;
    case 'in_progress': enteredAt = card.moved_to_in_progress_at; break;
    case 'done': enteredAt = card.moved_to_done_at; break;
    default: return null;
  }
  if (!enteredAt) return null;
  const days = Math.floor((Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return '<1d';
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

/** Calculate inbox age opacity (progressive dimming) */
function inboxOpacity(card: ActionBoardCard): string {
  if (card.column_status !== 'inbox' || !card.moved_to_inbox_at) return '';
  const days = Math.floor((Date.now() - new Date(card.moved_to_inbox_at).getTime()) / (1000 * 60 * 60 * 24));
  if (days >= 14) return 'opacity-50';
  if (days >= 7) return 'opacity-70';
  return '';
}

interface BoardCardProps {
  card: ActionBoardCard;
  onClick?: () => void;
  onArchive?: () => void;
  isOverlay?: boolean;
}

export function BoardCard({ card, onClick, onArchive, isOverlay = false }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if stale (in inbox for 2+ weeks)
  const isStale = card.column_status === 'inbox' && card.moved_to_inbox_at &&
    (Date.now() - new Date(card.moved_to_inbox_at).getTime()) > 14 * 24 * 60 * 60 * 1000;

  const hasKit = !!card.execution_kit;
  const tic = timeInColumn(card);
  const ageOpacity = inboxOpacity(card);
  const severityBorder = SEVERITY_BORDER[card.severity] || 'border-l-border';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group rounded-lg border border-border/40 bg-card p-3 transition-all hover:border-border/80 hover:shadow-sm touch-none',
        // Severity heat strip — 3px left border
        'border-l-[3px]',
        severityBorder,
        isDragging && 'opacity-30 scale-[0.98]',
        isOverlay && 'shadow-lg border-primary/30 rotate-[2deg]',
        // Inbox age gradient (progressive dimming)
        !isDragging && !isOverlay && ageOpacity,
        !isDragging && !isOverlay && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={(e) => {
        // Only fire click if it wasn't a drag (PointerSensor handles the distance threshold)
        if (onClick && !isDragging) {
          onClick();
        }
      }}
    >
      <div className="flex items-start gap-2">
        {/* Drag grip indicator */}
        <div className="mt-0.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Action text */}
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {card.action_text}
          </p>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {card.decision_type && (
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                KIT_TYPE_COLORS[card.decision_type as KitDecisionType] || 'text-muted-foreground bg-muted/30'
              )}>
                {card.decision_type}
              </span>
            )}

            {card.priority && card.priority !== 'medium' && (
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded',
                PRIORITY_COLORS[card.priority] || ''
              )}>
                {card.priority}
              </span>
            )}

            {card.competitor_name && (
              <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                {card.competitor_name}
              </span>
            )}

            {card.owner_team && (
              <span className="text-[10px] text-muted-foreground/70">
                {card.owner_team}
              </span>
            )}
          </div>

          {/* Status indicators row */}
          <div className="flex items-center gap-2 mt-1.5">
            {/* Kit indicator badge */}
            {hasKit && (
              <span className="flex items-center gap-0.5 text-[10px] text-primary">
                <Zap className="h-3 w-3" />
                Kit
              </span>
            )}
            {/* Stale indicator */}
            {isStale && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Stale
              </span>
            )}
            {/* Time-in-column badge */}
            {tic && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                <Clock className="h-2.5 w-2.5" />
                {tic}
              </span>
            )}
          </div>
        </div>

        {/* Archive button (visible on hover) */}
        {onArchive && card.column_status === 'inbox' && (
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onArchive(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
            title="Archive"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
