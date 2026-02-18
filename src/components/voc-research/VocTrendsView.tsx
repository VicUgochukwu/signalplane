import { TrendingUp, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useVocTrends } from '@/hooks/useVocResearch';
import {
  VOC_DIMENSION_CONFIG,
  type VocDimension,
  type TrendEntry,
  type DimensionTrendSummary,
  type PersonaTrendSummary,
} from '@/types/vocResearch';

// âââ VocTrendsView âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function VocTrendsView() {
  const { trends, isLoading } = useVocTrends(90);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No trend data yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Trend analysis will appear here once there are enough VoC entries to detect
          rising and fading patterns across dimensions and personas.
        </p>
      </div>
    );
  }

  const hasRising = trends.rising_by_dimension.length > 0;
  const hasFading = trends.fading_by_dimension.length > 0;
  const hasDimensions = trends.dimension_summary.length > 0;
  const hasPersonas = trends.persona_summary.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-red-400" />
          <span className="font-medium text-foreground">{trends.rising_by_dimension.length}</span>
          <span className="text-muted-foreground">rising entries</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4 text-emerald-400" />
          <span className="font-medium text-foreground">{trends.fading_by_dimension.length}</span>
          <span className="text-muted-foreground">fading entries</span>
        </div>
        <div className="text-muted-foreground">
          {trends.new_entries_this_period} new entries this period
        </div>
      </div>

      {/* Dimension breakdown */}
      {hasDimensions && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Dimension Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {trends.dimension_summary.map((dim) => (
                <DimensionRow key={dim.dimension} summary={dim} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rising / Fading columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rising */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-400">
              <TrendingUp className="h-4 w-4" />
              Rising
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!hasRising ? (
              <p className="text-xs text-muted-foreground py-2">No rising entries detected</p>
            ) : (
              <div className="space-y-2">
                {trends.rising_by_dimension.map((entry, idx) => (
                  <TrendEntryRow key={idx} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fading */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <TrendingDown className="h-4 w-4" />
              Fading
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!hasFading ? (
              <p className="text-xs text-muted-foreground py-2">No fading entries detected</p>
            ) : (
              <div className="space-y-2">
                {trends.fading_by_dimension.map((entry, idx) => (
                  <TrendEntryRow key={idx} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Persona summary */}
      {hasPersonas && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Persona Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {trends.persona_summary.map((p) => (
                <PersonaRow key={p.persona} summary={p} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function DimensionRow({ summary }: { summary: DimensionTrendSummary }) {
  const config = VOC_DIMENSION_CONFIG[summary.dimension as VocDimension];
  const maxVal = Math.max(summary.total, 1);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${config.color} ${config.bgColor} border-transparent`}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{summary.total} total</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-red-400">{summary.rising} rising</span>
          <span className="text-blue-400">{summary.stable} stable</span>
          <span className="text-emerald-400">{summary.fading} fading</span>
        </div>
      </div>
      <div className="flex gap-0.5 h-2">
        {summary.rising > 0 && (
          <div
            className="bg-red-500/40 rounded-l-sm"
            style={{ width: `${(summary.rising / maxVal) * 100}%` }}
          />
        )}
        {summary.stable > 0 && (
          <div
            className="bg-blue-500/40"
            style={{ width: `${(summary.stable / maxVal) * 100}%` }}
          />
        )}
        {summary.fading > 0 && (
          <div
            className="bg-emerald-500/40 rounded-r-sm"
            style={{ width: `${(summary.fading / maxVal) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

function TrendEntryRow({ entry }: { entry: TrendEntry }) {
  const config = VOC_DIMENSION_CONFIG[entry.dimension as VocDimension];

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-sm text-foreground truncate">{entry.text}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="outline"
            className={`text-xs ${config.color} border-transparent`}
          >
            {config.label}
          </Badge>
          {entry.persona && (
            <span className="text-xs text-muted-foreground">{entry.persona}</span>
          )}
        </div>
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
        {entry.frequency}x
      </span>
    </div>
  );
}

function PersonaRow({ summary }: { summary: PersonaTrendSummary }) {
  const maxVal = Math.max(summary.total, 1);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{summary.persona}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{summary.total} entries</span>
          <span className="text-red-400">{summary.rising} rising</span>
          <span className="text-emerald-400">{summary.fading} fading</span>
        </div>
      </div>
      <Progress
        value={(summary.rising / maxVal) * 100}
        className="h-1.5"
      />
    </div>
  );
}
