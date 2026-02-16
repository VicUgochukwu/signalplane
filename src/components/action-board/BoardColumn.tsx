import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ActionBoardCard, BoardColumn as BoardColumnType } from '@/types/actionBoard';
import { BoardCard } from './BoardCard';
import { cn } from '@/lib/utils';
import { Inbox, Calendar, Play, CheckCircle2 } from 'lucide-react';

const COLUMN_ICONS: Record<BoardColumnType, React.ElementType> = {
  inbox: Inbox,
  this_week: Calendar,
  in_progress: Play,
  done: CheckCircle2,
};

const COLUMN_BG: Record<BoardColumnType, string> = {
  inbox: 'bg-muted/10',
  this_week: 'bg-sky-500/5',
  in_progress: 'bg-amber-500/5',
  done: 'bg-emerald-500/5',
};

interface BoardColumnProps {
  columnKey: BoardColumnType;
  label: string;
  color: string;
  cards: ActionBoardCard[];
  onCardClick: (card: ActionBoardCard) => void;
  onArchive: (cardId: string) => void;
}

export function BoardColumn({ columnKey, label, color, cards, onCardClick, onArchive }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey });
  const Icon = COLUMN_ICONS[columnKey];

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 flex flex-col min-h-[400px] transition-colors',
        COLUMN_BG[columnKey],
        isOver && 'border-[hsl(var(--accent-signal)/0.50)] bg-[hsl(var(--accent-signal)/0.05)] ring-2 ring-[hsl(var(--accent-signal)/0.20)]'
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', color, 'bg-muted/30')}>
          {cards.length}
        </span>
      </div>

      {/* Cards — the entire content area is the droppable */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 overflow-y-auto"
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[100px]">
            {cards.map((card) => (
              <BoardCard
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
                onArchive={() => onArchive(card.id)}
              />
            ))}
            {cards.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground/50">
                {columnKey === 'inbox' ? 'No new actions' : 'Drag cards here'}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
