import { Package, TrendingUp, AlertTriangle, FileText, Loader2, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePackagingIntel } from '@/hooks/usePackagingIntel';
import {
  VALUE_METRIC_CONFIG,
  CHANGE_TYPE_CONFIG,
  SIGNIFICANCE_CONFIG,
  type RecentBrief,
  type MetricDistribution,
  type LandscapeTrend,
} from '@/types/packagingIntel';

// âââ PackagingOverview ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function PackagingOverview() {
  const { overview, isLoading } = usePackagingIntel();

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
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No data yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Pricing and packaging intelligence will appear here once the monitor
          workflows begin tracking competitor pricing pages and detecting changes.
        </p>
      </div>
    );
  }

  const activeBriefs = overview.recent_briefs?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Companies Tracked"
          value={overview.companies_tracked}
          sublabel="pricing pages"
          icon={<Package className="h-4 w-4" />}
          color="text-blue-400"
        />
        <StatCard
          label="Recent Changes"
          value={overview.recent_changes_count}
          sublabel="30 days"
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <StatCard
          label="Major Changes"
          value={overview.major_changes_count}
          sublabel="30 days"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-red-400"
        />
        <StatCard
          label="Active Briefs"
          value={activeBriefs}
          sublabel="intelligence"
          icon={<FileText className="h-4 w-4" />}
          color="text-purple-400"
        />
      </div>

      {/* Value metric distribution */}
      {overview.value_metric_distribution && overview.value_metric_distribution.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Value Metric Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 flex-wrap">
              {overview.value_metric_distribution.map((dist) => (
                <MetricBadge key={dist.value_metric} distribution={dist} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Landscape trends */}
      {overview.landscape_trends && overview.landscape_trends.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Landscape Trends
              {overview.latest_landscape_month && (
                <span className="text-xs font-normal text-muted-foreground">
                  {overview.latest_landscape_month}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {overview.landscape_trends.map((trend, idx) => (
                <TrendRow key={idx} trend={trend} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent briefs feed */}
      {overview.recent_briefs && overview.recent_briefs.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Intelligence Briefs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {overview.recent_briefs.slice(0, 5).map((brief) => (
                <RecentBriefRow key={brief.id} brief={brief} />
              ))}
            </div>
          </CardContent>
        </Card>
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

function MetricBadge({ distribution }: { distribution: MetricDistribution }) {
  const config = VALUE_METRIC_CONFIG[distribution.value_metric];

  return (
    <Badge
      variant="outline"
      className={`text-xs ${config.color} ${config.bgColor} border-transparent`}
    >
      {config.label}: {distribution.count}
    </Badge>
  );
}

const TREND_DIRECTION_CONFIG: Record<string, { label: string; color: string }> = {
  converging: { label: 'Converging', color: 'text-amber-400' },
  diverging: { label: 'Diverging', color: 'text-purple-400' },
  stable: { label: 'Stable', color: 'text-emerald-400' },
};

function TrendRow({ trend }: { trend: LandscapeTrend }) {
  const dirConfig = TREND_DIRECTION_CONFIG[trend.direction] || TREND_DIRECTION_CONFIG.stable;

  return (
    <div className="flex items-start gap-3 py-1.5">
      <Badge variant="outline" className={`text-xs shrink-0 ${dirConfig.color} border-transparent mt-0.5`}>
        {dirConfig.label}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground">{trend.trend}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{trend.evidence}</div>
      </div>
    </div>
  );
}

function RecentBriefRow({ brief }: { brief: RecentBrief }) {
  const changeConfig = CHANGE_TYPE_CONFIG[brief.change_type];
  const sevConfig = SIGNIFICANCE_CONFIG[brief.severity];

  return (
    <div className="flex items-center gap-3 py-1.5">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${changeConfig.color} ${changeConfig.bgColor} border-transparent`}
      >
        {changeConfig.label}
      </Badge>
      <span className="text-sm text-foreground truncate flex-1">
        {brief.strategic_interpretation}
      </span>
      <span className="text-xs text-muted-foreground shrink-0">{brief.company_name}</span>
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${sevConfig.color} ${sevConfig.bgColor} border-transparent`}
      >
        {sevConfig.label}
      </Badge>
      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(brief.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </div>
  );
}
