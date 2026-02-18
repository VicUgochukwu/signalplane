import { useState, useMemo } from 'react';
import {
  Filter,
  Loader2,
  Activity,
  Radio,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePackagingChanges } from '@/hooks/usePackagingIntel';
import {
  CHANGE_TYPE_CONFIG,
  STRATEGIC_SIGNAL_CONFIG,
  SIGNIFICANCE_CONFIG,
  type PackagingChange,
  type PricingChangeType,
  type Significance,
} from '@/types/packagingIntel';

// âââ ChangeEventLog âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function ChangeEventLog() {
  const { data: changes = [], isLoading } = usePackagingChanges(180);
  const [typeFilter, setTypeFilter] = useState<PricingChangeType | 'all'>('all');
  const [significanceFilter, setSignificanceFilter] = useState<Significance | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return changes.filter((c) => {
      if (typeFilter !== 'all' && c.change_type !== typeFilter) return false;
      if (significanceFilter !== 'all' && c.significance !== significanceFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.company_name.toLowerCase().includes(s) ||
          (c.interpretation && c.interpretation.toLowerCase().includes(s)) ||
          JSON.stringify(c.change_details).toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [changes, typeFilter, significanceFilter, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No pricing changes detected</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Changes to competitor pricing pages will appear here once the pricing
          monitor begins tracking and detecting modifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search changes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 text-sm"
        />

        {/* Change type filter */}
        <div className="flex gap-1 flex-wrap">
          <FilterButton
            active={typeFilter === 'all'}
            onClick={() => setTypeFilter('all')}
            label="All Types"
          />
          {(Object.keys(CHANGE_TYPE_CONFIG) as PricingChangeType[]).map((ct) => (
            <FilterButton
              key={ct}
              active={typeFilter === ct}
              onClick={() => setTypeFilter(ct)}
              label={CHANGE_TYPE_CONFIG[ct].label}
              color={CHANGE_TYPE_CONFIG[ct].color}
            />
          ))}
        </div>

        {/* Significance filter */}
        <div className="flex gap-1">
          <FilterButton
            active={significanceFilter === 'all'}
            onClick={() => setSignificanceFilter('all')}
            label="All"
          />
          {(Object.keys(SIGNIFICANCE_CONFIG) as Significance[]).map((sig) => (
            <FilterButton
              key={sig}
              active={significanceFilter === sig}
              onClick={() => setSignificanceFilter(sig)}
              label={SIGNIFICANCE_CONFIG[sig].label}
              color={SIGNIFICANCE_CONFIG[sig].color}
            />
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {changes.length} changes
        </span>
      </div>

      {/* Change list */}
      <div className="space-y-2">
        {filtered.map((change) => (
          <ChangeEventCard key={change.id} change={change} />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No changes match your filters
          </div>
        )}
      </div>
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function FilterButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <Button
      size="sm"
      variant={active ? 'secondary' : 'ghost'}
      onClick={onClick}
      className={`h-7 text-xs ${color || ''}`}
    >
      {label}
    </Button>
  );
}

function ChangeEventCard({ change }: { change: PackagingChange }) {
  const typeConfig = CHANGE_TYPE_CONFIG[change.change_type];
  const sigConfig = SIGNIFICANCE_CONFIG[change.significance];
  const signalConfig = change.strategic_signal
    ? STRATEGIC_SIGNAL_CONFIG[change.strategic_signal]
    : null;

  // Build a short summary from change_details
  const detailsSummary = (() => {
    const entries = Object.entries(change.change_details);
    if (entries.length === 0) return null;
    // Show first 2 key/value pairs as summary
    return entries
      .slice(0, 2)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' | ');
  })();

  return (
    <Card className="border-border/50">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-3">
          {/* Change type badge */}
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${typeConfig.color} ${typeConfig.bgColor} border-transparent mt-0.5`}
          >
            {typeConfig.label}
          </Badge>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground font-medium">{change.company_name}</div>
            {detailsSummary && (
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {detailsSummary}
              </div>
            )}
            {change.interpretation && (
              <div className="text-xs text-muted-foreground/70 mt-1 italic">
                {change.interpretation}
              </div>
            )}
          </div>

          {/* Strategic signal */}
          {signalConfig && (
            <Badge variant="outline" className={`text-xs shrink-0 ${signalConfig.color} border-transparent`}>
              {signalConfig.label}
            </Badge>
          )}

          {/* Significance */}
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${sigConfig.color} ${sigConfig.bgColor} border-transparent`}
          >
            {sigConfig.label}
          </Badge>

          {/* Signal emitted indicator */}
          {change.signal_emitted && (
            <Radio className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
          )}

          {/* Date */}
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(change.detected_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
