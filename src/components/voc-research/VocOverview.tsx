import { AlertTriangle, Heart, MessageSquare, ListChecks, TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVocResearch } from '@/hooks/useVocResearch';
import {
  VOC_DIMENSION_CONFIG,
  VOC_TREND_CONFIG,
  SOURCE_PLATFORM_CONFIG,
  type VocDimension,
  type TopVocEntry,
  type RecentVocEntry,
} from '@/types/vocResearch';

// âââ VocOverview âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function VocOverview() {
  const { overview, isLoading } = useVocResearch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No data yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          VoC entries will appear here once the classifier workflows extract buyer
          language from public sources and categorize them by dimension.
        </p>
      </div>
    );
  }

  const hasData = overview.entries_90d > 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pains"
          value={overview.pain_count}
          sublabel="90 days"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-red-400"
        />
        <StatCard
          label="Desires"
          value={overview.desire_count}
          sublabel="90 days"
          icon={<Heart className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <StatCard
          label="Language"
          value={overview.language_count}
          sublabel="90 days"
          icon={<MessageSquare className="h-4 w-4" />}
          color="text-blue-400"
        />
        <StatCard
          label="Criteria"
          value={overview.criteria_count}
          sublabel="90 days"
          icon={<ListChecks className="h-4 w-4" />}
          color="text-amber-400"
        />
      </div>

      {/* Trend indicators */}
      {hasData && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-red-400" />
            <span className="text-muted-foreground">{overview.rising_entries} rising</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-muted-foreground">{overview.fading_entries} fading</span>
          </div>
          <div className="text-muted-foreground">
            {overview.entries_30d} new in last 30d
          </div>
        </div>
      )}

      {/* Top entries per dimension */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopEntriesCard title="Top Pains" entries={overview.top_pains} dimension="pain" />
          <TopEntriesCard title="Top Desires" entries={overview.top_desires} dimension="desire" />
          <TopEntriesCard title="Top Language" entries={overview.top_language} dimension="language" />
          <TopEntriesCard title="Top Criteria" entries={overview.top_criteria} dimension="criteria" />
        </div>
      )}

      {/* Recent entries feed */}
      {overview.recent_entries.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {overview.recent_entries.map((entry) => (
                <RecentEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personas tracked */}
      {overview.personas_tracked.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Personas:</span>
          {overview.personas_tracked.map((persona) => (
            <Badge key={persona} variant="outline" className="text-xs">
              {persona}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function StatCard({
  label,
  value,
  sublabel,
  icon,
  color,
}: {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={color}>{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>
    </div>
  );
}

function TopEntriesCard({
  title,
  entries,
  dimension,
}: {
  title: string;
  entries: TopVocEntry[];
  dimension: VocDimension;
}) {
  const config = VOC_DIMENSION_CONFIG[dimension];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${config.color}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No entries detected yet</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const trendConfig = VOC_TREND_CONFIG[entry.trend];
              return (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">{entry.text}</div>
                    {entry.persona && (
                      <div className="text-xs text-muted-foreground">{entry.persona}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      {entry.frequency}x
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${trendConfig.color} border-transparent`}
                    >
                      {trendConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentEntryRow({ entry }: { entry: RecentVocEntry }) {
  const config = VOC_DIMENSION_CONFIG[entry.dimension];
  const platformConfig = SOURCE_PLATFORM_CONFIG[entry.source_platform] || SOURCE_PLATFORM_CONFIG.other;
  const trendConfig = VOC_TREND_CONFIG[entry.trend];

  return (
    <div className="flex items-center gap-3 py-1.5">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${config.color} ${config.bgColor} border-transparent`}
      >
        {config.label}
      </Badge>
      <span className="text-sm text-foreground truncate flex-1">{entry.text}</span>
      {entry.persona && (
        <span className="text-xs text-muted-foreground shrink-0">{entry.persona}</span>
      )}
      <span className={`text-xs shrink-0 ${platformConfig.color}`}>{platformConfig.label}</span>
      <Badge
        variant="outline"
        className={`text-xs ${trendConfig.color} border-transparent shrink-0`}
      >
        {trendConfig.label}
      </Badge>
      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(entry.first_seen).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </div>
  );
}
