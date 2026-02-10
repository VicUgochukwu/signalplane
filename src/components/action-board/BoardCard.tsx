import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionBoardCard, KIT_TYPE_COLORS, PRIORITY_COLORS, KitDecisionType } from '@/types/actionBoard';
import { cn } from '@/lib/utils';
import { GripVertical, Archive, Sparkles, AlertTriangle } from 'lucide-react';

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group rounded-lg border border-border/40 bg-card p-3 transition-all hover:border-border/80 hover:shadow-sm touch-none',
        isDragging && 'opacity-30 scale-[0.98]',
        isOverlay && 'shadow-lg border-primary/30 rotate-[2deg]',
        isStale && 'opacity-60',
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

          {/* Status indicators */}
          <div className="flex items-center gap-2 mt-1.5">
            {hasKit && (
              <span className="flex items-center gap-0.5 text-[10px] text-primary">
                <Sparkles className="h-3 w-3" />
                Kit ready
              </span>
            )}
            {isStale && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Stale
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
