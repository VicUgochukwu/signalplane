import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useActionBoard } from '@/hooks/useActionBoard';
import { useExecutionKit } from '@/hooks/useExecutionKit';
import { useDemo } from '@/contexts/DemoContext';
import { ActionBoardCard, BoardColumn, BOARD_COLUMNS } from '@/types/actionBoard';
import { BoardColumn as BoardColumnComponent } from './BoardColumn';
import { BoardCard } from './BoardCard';
import { CardDetail } from './CardDetail';
import { BoardFilters } from './BoardFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Kanban } from 'lucide-react';

export function BoardView() {
  const { cards, cardsByColumn, isLoading, moveCard, updateCard, archiveCard, isMoving } = useActionBoard();
  const { generateKit } = useExecutionKit();
  const demo = useDemo();
  const [activeCard, setActiveCard] = useState<ActionBoardCard | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Derive the selected card from live data so it updates after mutations
  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) || null : null;
  const [filters, setFilters] = useState<{ search: string; decisionType: string | null; ownerTeam: string | null; priority: string | null }>({
    search: '',
    decisionType: null,
    ownerTeam: null,
    priority: null,
  });

  // Track which column the dragged card is currently hovering over
  const overColumnRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Column keys as a Set for fast lookup
  const columnKeys = new Set(BOARD_COLUMNS.map(c => c.key));

  /** Given an over.id (could be a column key or a card ID), resolve to the column key */
  const resolveColumn = useCallback((overId: string | number): string | null => {
    const id = String(overId);
    if (columnKeys.has(id as BoardColumn)) return id;

    // Look through current cards data to find which column this card is in
    const card = cards.find(c => c.id === id);
    return card?.column_status || null;
  }, [cards]);

  // Filter cards
  const filteredCardsByColumn = Object.fromEntries(
    BOARD_COLUMNS.map(({ key }) => {
      let colCards = cardsByColumn[key] || [];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        colCards = colCards.filter(c => c.action_text.toLowerCase().includes(q) || c.competitor_name?.toLowerCase().includes(q));
      }
      if (filters.decisionType) colCards = colCards.filter(c => c.decision_type === filters.decisionType);
      if (filters.ownerTeam) colCards = colCards.filter(c => c.owner_team === filters.ownerTeam);
      if (filters.priority) colCards = colCards.filter(c => c.priority === filters.priority);
      return [key, colCards];
    })
  ) as Record<BoardColumn, ActionBoardCard[]>;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
    overColumnRef.current = null;
  }, [cards]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      overColumnRef.current = resolveColumn(over.id);
    }
  }, [resolveColumn]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      overColumnRef.current = null;
      return;
    }

    const cardId = String(active.id);
    const targetColumn = resolveColumn(over.id) || overColumnRef.current;
    overColumnRef.current = null;

    if (!targetColumn) return;

    // Find the source card from the current cards array (reflects optimistic state)
    const sourceCard = cards.find(c => c.id === cardId);
    if (!sourceCard) return;

    // Allow same-column drops — skip only if nothing changed
    if (sourceCard.column_status === targetColumn) return;

    const targetCards = cardsByColumn[targetColumn as BoardColumn] || [];
    const newOrder = targetCards.length;

    moveCard(cardId, targetColumn, newOrder);

    // Auto-generate execution kit when card moves to this_week and has no kit
    if (targetColumn === 'this_week' && !sourceCard.execution_kit && !demo?.isDemo) {
      setTimeout(() => generateKit(cardId), 500);
    }
  }, [cards, cardsByColumn, moveCard, generateKit, demo?.isDemo, resolveColumn]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-96 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Kanban className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Action Board</h2>
        </div>
      </div>

      {/* Filters */}
      <BoardFilters filters={filters} onFiltersChange={setFilters} cardsByColumn={cardsByColumn} />

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[500px]">
          {BOARD_COLUMNS.map(({ key, label, color }) => (
            <BoardColumnComponent
              key={key}
              columnKey={key}
              label={label}
              color={color}
              cards={filteredCardsByColumn[key] || []}
              onCardClick={(card) => setSelectedCardId(card.id)}
              onArchive={(cardId) => archiveCard(cardId)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <BoardCard card={activeCard} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card Detail Sheet */}
      <CardDetail
        card={selectedCard}
        onClose={() => setSelectedCardId(null)}
        onUpdateNotes={(cardId, notes) => updateCard(cardId, notes)}
        onArchive={(cardId) => { archiveCard(cardId); setSelectedCardId(null); }}
        onMoveCard={moveCard}
      />
    </div>
  );
}
