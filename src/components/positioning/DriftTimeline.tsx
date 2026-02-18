import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  ExternalLink,
  Filter,
  Loader2,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDriftEvents } from '@/hooks/usePositioningHealth';
import {
  DRIFT_SEVERITY_CONFIG,
  DRIFT_DIRECTION_CONFIG,
  PAGE_TYPE_CONFIG,
  type DriftEvent,
  type DriftSeverity,
  type DriftDirection,
  type PageType,
} from '@/types/positioningHealth';

// âââ DriftTimeline âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function DriftTimeline() {
  const { data: events = [], isLoading } = useDriftEvents(180);
  const [severityFilter, setSeverityFilter] = useState<DriftSeverity | 'all'>('all');
  const [pageTypeFilter, setPageTypeFilter] = useState<PageType | 'all'>('all');
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (pageTypeFilter !== 'all' && e.page_type !== pageTypeFilter) return false;
      if (resolvedFilter === 'unresolved' && e.resolved) return false;
      if (resolvedFilter === 'resolved' && !e.resolved) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          e.change_description.toLowerCase().includes(s) ||
          e.page_url.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [events, severityFilter, pageTypeFilter, resolvedFilter, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No drift events</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Drift events are detected when your own messaging pages change.
          Add pages to track and the monitor will detect positioning shifts.
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
          placeholder="Search drift events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 text-sm"
        />

        {/* Severity filter */}
        <div className="flex gap-1">
          <FilterButton
            active={severityFilter === 'all'}
            onClick={() => setSeverityFilter('all')}
            label="All"
          />
          {(Object.keys(DRIFT_SEVERITY_CONFIG) as DriftSeverity[]).map((sev) => (
            <FilterButton
              key={sev}
              active={severityFilter === sev}
              onClick={() => setSeverityFilter(sev)}
              label={DRIFT_SEVERITY_CONFIG[sev].label}
              color={DRIFT_SEVERITY_CONFIG[sev].color}
            />
          ))}
        </div>

        {/* Resolved filter */}
        <div className="flex gap-1">
          <FilterButton
            active={resolvedFilter === 'all'}
            onClick={() => setResolvedFilter('all')}
            label="All"
          />
          <FilterButton
            active={resolvedFilter === 'unresolved'}
            onClick={() => setResolvedFilter('unresolved')}
            label="Unresolved"
          />
          <FilterButton
            active={resolvedFilter === 'resolved'}
            onClick={() => setResolvedFilter('resolved')}
            label="Resolved"
          />
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {events.length} events
        </span>
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {filtered.map((event) => (
          <DriftEventCard key={event.id} event={event} />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No events match your filters
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

function DriftEventCard({ event }: { event: DriftEvent }) {
  const severityConfig = DRIFT_SEVERITY_CONFIG[event.severity];
  const directionConfig = DRIFT_DIRECTION_CONFIG[event.drift_direction];
  const pageConfig = PAGE_TYPE_CONFIG[event.page_type as PageType] || { label: event.page_type, color: 'text-gray-400' };

  const DirectionIcon =
    event.drift_direction === 'deliberate'
      ? CheckCircle
      : event.drift_direction === 'regression'
      ? AlertTriangle
      : Clock;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-3">
          {/* Severity badge */}
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${severityConfig.color} ${severityConfig.bgColor} border-transparent mt-0.5`}
          >
            {severityConfig.label}
          </Badge>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground">{event.change_description}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`text-xs ${pageConfig.color}`}>{pageConfig.label}</span>
              <a
                href={event.page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[200px] flex items-center gap-1"
              >
                {new URL(event.page_url).hostname}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              {event.evidence_urls.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {event.evidence_urls.length} evidence link{event.evidence_urls.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Direction + status */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs ${directionConfig.color} border-transparent`}>
              <DirectionIcon className="h-3 w-3 mr-1" />
              {directionConfig.label}
            </Badge>
            {event.resolved && (
              <Badge variant="outline" className="text-xs text-emerald-400 border-transparent">
                Resolved
              </Badge>
            )}
          </div>

          {/* Date */}
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(event.detected_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
