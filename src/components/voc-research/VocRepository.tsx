import { useState } from 'react';
import { ExternalLink, Filter, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVocEntries } from '@/hooks/useVocResearch';
import {
  VOC_DIMENSION_CONFIG,
  VOC_TREND_CONFIG,
  FUNNEL_STAGE_CONFIG,
  SOURCE_PLATFORM_CONFIG,
  type VocDimension,
  type FunnelStage,
  type VocEntry,
} from '@/types/vocResearch';

// âââ VocRepository âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function VocRepository() {
  const { data: entries = [], isLoading } = useVocEntries();
  const [dimensionFilter, setDimensionFilter] = useState<VocDimension | 'all'>('all');
  const [personaFilter, setPersonaFilter] = useState('');
  const [stageFilter, setStageFilter] = useState<FunnelStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique personas
  const personas = Array.from(
    new Set(entries.map((e) => e.persona).filter(Boolean) as string[]),
  ).sort();

  // Apply filters
  const filtered = entries.filter((entry) => {
    if (dimensionFilter !== 'all' && entry.dimension !== dimensionFilter) return false;
    if (personaFilter && entry.persona !== personaFilter) return false;
    if (stageFilter !== 'all' && entry.funnel_stage !== stageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !entry.text.toLowerCase().includes(q) &&
        !(entry.persona || '').toLowerCase().includes(q) &&
        !entry.source_platform.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No VoC entries yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Buyer voice data will be classified from public sources (reviews, forums, discussions)
          and organized by pains, desires, language patterns, and decision criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Dimension filter */}
        <div className="flex gap-1">
          <FilterButton active={dimensionFilter === 'all'} onClick={() => setDimensionFilter('all')}>
            All ({entries.length})
          </FilterButton>
          {(['pain', 'desire', 'language', 'criteria'] as VocDimension[]).map((dim) => {
            const config = VOC_DIMENSION_CONFIG[dim];
            const count = entries.filter((e) => e.dimension === dim).length;
            return (
              <FilterButton
                key={dim}
                active={dimensionFilter === dim}
                onClick={() => setDimensionFilter(dimensionFilter === dim ? 'all' : dim)}
              >
                <span className={config.color}>{config.label}</span> ({count})
              </FilterButton>
            );
          })}
        </div>

        {/* Funnel stage filter */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as FunnelStage | 'all')}
          className="h-7 text-xs rounded-md border border-border/50 bg-card px-2 text-foreground"
        >
          <option value="all">All stages</option>
          {(['awareness', 'consideration', 'decision', 'retention'] as FunnelStage[]).map((stage) => (
            <option key={stage} value={stage}>{FUNNEL_STAGE_CONFIG[stage].label}</option>
          ))}
        </select>

        {/* Persona filter */}
        {personas.length > 0 && (
          <select
            value={personaFilter}
            onChange={(e) => setPersonaFilter(e.target.value)}
            className="h-7 text-xs rounded-md border border-border/50 bg-card px-2 text-foreground"
          >
            <option value="">All personas</option>
            {personas.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'} found
      </div>

      {/* Entry list */}
      <div className="space-y-1">
        {filtered.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-7 text-xs px-2"
    >
      {children}
    </Button>
  );
}

function EntryRow({ entry }: { entry: VocEntry }) {
  const dimConfig = VOC_DIMENSION_CONFIG[entry.dimension];
  const trendConfig = VOC_TREND_CONFIG[entry.trend];
  const platformConfig =
    SOURCE_PLATFORM_CONFIG[entry.source_platform] || SOURCE_PLATFORM_CONFIG.other;
  const stageConfig = entry.funnel_stage ? FUNNEL_STAGE_CONFIG[entry.funnel_stage] : null;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${dimConfig.color} ${dimConfig.bgColor} border-transparent`}
      >
        {dimConfig.label}
      </Badge>

      <span className="text-sm text-foreground/80 flex-1 truncate">
        {entry.text}
      </span>

      {/* Persona */}
      {entry.persona && (
        <span className="text-xs text-muted-foreground shrink-0 max-w-20 truncate">
          {entry.persona}
        </span>
      )}

      {/* Funnel stage */}
      {stageConfig && (
        <Badge variant="outline" className={`text-xs shrink-0 ${stageConfig.color} border-transparent`}>
          {stageConfig.label}
        </Badge>
      )}

      {/* Frequency */}
      <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
        {entry.frequency}x
      </span>

      {/* Trend */}
      <Badge
        variant="outline"
        className={`text-xs ${trendConfig.color} border-transparent shrink-0`}
      >
        {trendConfig.label}
      </Badge>

      {/* Platform */}
      <span className={`text-xs shrink-0 ${platformConfig.color}`}>
        {platformConfig.label}
      </span>

      {/* Date */}
      <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
        {new Date(entry.first_seen).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>

      {/* Source link */}
      {entry.source_url && (
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
