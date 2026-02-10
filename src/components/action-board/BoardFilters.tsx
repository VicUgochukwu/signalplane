import { ActionBoardCard, BoardColumn, KitDecisionType } from '@/types/actionBoard';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  search: string;
  decisionType: string | null;
  ownerTeam: string | null;
  priority: string | null;
}

interface BoardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  cardsByColumn: Record<BoardColumn, ActionBoardCard[]>;
}

export function BoardFilters({ filters, onFiltersChange, cardsByColumn }: BoardFiltersProps) {
  const allCards = Object.values(cardsByColumn).flat();

  // Extract unique filter values from cards
  const decisionTypes = [...new Set(allCards.map(c => c.decision_type).filter(Boolean))] as string[];
  const ownerTeams = [...new Set(allCards.map(c => c.owner_team).filter(Boolean))] as string[];
  const priorities = [...new Set(allCards.map(c => c.priority).filter(Boolean))] as string[];

  const hasActiveFilters = filters.search || filters.decisionType || filters.ownerTeam || filters.priority;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Search actions..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full h-8 pl-9 pr-3 rounded-lg border border-border/50 bg-muted/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Decision Type Filter */}
      {decisionTypes.length > 0 && (
        <select
          value={filters.decisionType || ''}
          onChange={(e) => onFiltersChange({ ...filters, decisionType: e.target.value || null })}
          className="h-8 px-2 rounded-lg border border-border/50 bg-muted/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All types</option>
          {decisionTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
        </select>
      )}

      {/* Owner Team Filter */}
      {ownerTeams.length > 0 && (
        <select
          value={filters.ownerTeam || ''}
          onChange={(e) => onFiltersChange({ ...filters, ownerTeam: e.target.value || null })}
          className="h-8 px-2 rounded-lg border border-border/50 bg-muted/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All teams</option>
          {ownerTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}

      {/* Priority Filter */}
      {priorities.length > 0 && (
        <select
          value={filters.priority || ''}
          onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value || null })}
          className="h-8 px-2 rounded-lg border border-border/50 bg-muted/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onFiltersChange({ search: '', decisionType: null, ownerTeam: null, priority: null })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
