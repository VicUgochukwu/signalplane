import {
  Crosshair,
  Users,
  Fingerprint,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Activity,
  Loader2,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePositioningHealth } from '@/hooks/usePositioningHealth';
import {
  HEALTH_DIMENSION_CONFIG,
  DRIFT_SEVERITY_CONFIG,
  DRIFT_DIRECTION_CONFIG,
  SCORE_TREND_CONFIG,
  type HealthDimension,
  type RecentDriftEvent,
} from '@/types/positioningHealth';

// âââ PositioningOverview âââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function PositioningOverview() {
  const { overview, isLoading } = usePositioningHealth();

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
        <Crosshair className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No data yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Positioning health scores will appear here once you add your own pages to track
          and the health scoring workflows run their first analysis.
        </p>
      </div>
    );
  }

  const hasScore = overview.latest_score !== null;

  return (
    <div className="space-y-6">
      {/* Composite score gauge */}
      {hasScore && overview.latest_score ? (
        <CompositeScoreCard score={overview.latest_score} />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
          <Crosshair className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No health score computed yet. Scores are generated monthly.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pages Tracked"
          value={overview.own_pages_tracked}
          sublabel="own pages"
          icon={<Globe className="h-4 w-4" />}
          color="text-blue-400"
        />
        <StatCard
          label="Drift Events"
          value={overview.drift_events_count}
          sublabel="90 days"
          icon={<Activity className="h-4 w-4" />}
          color="text-amber-400"
        />
        <StatCard
          label="Active Alerts"
          value={overview.active_drift_alerts}
          sublabel="unresolved"
          icon={<AlertTriangle className="h-4 w-4" />}
          color={overview.high_severity_drifts > 0 ? 'text-red-400' : 'text-emerald-400'}
        />
        <StatCard
          label="High Severity"
          value={overview.high_severity_drifts}
          sublabel="open"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-red-400"
        />
      </div>

      {/* 3 dimension score cards */}
      {hasScore && overview.latest_score && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(HEALTH_DIMENSION_CONFIG) as HealthDimension[]).map((dim) => {
            const config = HEALTH_DIMENSION_CONFIG[dim];
            const score =
              dim === 'buyer_alignment'
                ? overview.latest_score!.buyer_alignment_score
                : dim === 'differentiation'
                ? overview.latest_score!.differentiation_score
                : overview.latest_score!.narrative_fit_score;
            const available = overview.latest_score!.dimensions_available.includes(dim);

            return (
              <DimensionCard
                key={dim}
                label={config.label}
                description={config.description}
                score={score}
                maxScore={config.maxScore}
                color={config.color}
                available={available}
              />
            );
          })}
        </div>
      )}

      {/* Recent drift events feed */}
      {overview.recent_drift_events.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Drift Events</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {overview.recent_drift_events.map((event) => (
                <DriftEventRow key={event.id} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score trend */}
      {overview.score_trend.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Score Trend (Last 3 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {overview.score_trend.map((entry, idx) => {
                const trendConfig = SCORE_TREND_CONFIG[entry.trend_vs_prior];
                const TrendIcon =
                  entry.trend_vs_prior === 'improving'
                    ? TrendingUp
                    : entry.trend_vs_prior === 'declining'
                    ? TrendingDown
                    : Minus;
                return (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground w-24">
                      {new Date(entry.score_month + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex-1">
                      <Progress value={entry.total_score} className="h-2" />
                    </div>
                    <span className="text-sm font-mono tabular-nums w-10 text-right">
                      {entry.total_score}
                    </span>
                    <div className={`flex items-center gap-1 ${trendConfig.color}`}>
                      <TrendIcon className="h-3 w-3" />
                      <span className="text-xs">{trendConfig.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function CompositeScoreCard({
  score,
}: {
  score: NonNullable<import('@/types/positioningHealth').PositioningOverview['latest_score']>;
}) {
  const trendConfig = SCORE_TREND_CONFIG[score.trend_vs_prior];
  const TrendIcon =
    score.trend_vs_prior === 'improving'
      ? TrendingUp
      : score.trend_vs_prior === 'declining'
      ? TrendingDown
      : Minus;

  const scoreColor =
    score.total_score >= 70
      ? 'text-emerald-400'
      : score.total_score >= 40
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Positioning Health Score
            </div>
            <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
              {score.total_score}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              out of 100 â¢{' '}
              {new Date(score.score_month + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 ${trendConfig.color}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{trendConfig.label}</span>
            </div>
            {score.prior_total_score !== null && (
              <div className="text-xs text-muted-foreground mt-1">
                Prior: {score.prior_total_score}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {score.dimensions_available.length}/3 dimensions scored
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={score.total_score} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}

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

function DimensionCard({
  label,
  description,
  score,
  maxScore,
  color,
  available,
}: {
  label: string;
  description: string;
  score: number;
  maxScore: number;
  color: string;
  available: boolean;
}) {
  const pct = Math.round((score / maxScore) * 100);

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-semibold ${color}`}>{label}</span>
          {!available && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-muted">
              Unavailable
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mb-3">{description}</div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={pct} className="h-2" />
          </div>
          <span className={`text-lg font-bold tabular-nums ${color}`}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/ {maxScore}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DriftEventRow({ event }: { event: RecentDriftEvent }) {
  const severityConfig = DRIFT_SEVERITY_CONFIG[event.severity];
  const directionConfig = DRIFT_DIRECTION_CONFIG[event.drift_direction];

  return (
    <div className="flex items-center gap-3 py-1.5">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${severityConfig.color} ${severityConfig.bgColor} border-transparent`}
      >
        {severityConfig.label}
      </Badge>
      <span className="text-sm text-foreground truncate flex-1">{event.change_description}</span>
      <Badge variant="outline" className={`text-xs shrink-0 ${directionConfig.color} border-transparent`}>
        {directionConfig.label}
      </Badge>
      {event.resolved && (
        <Badge variant="outline" className="text-xs text-emerald-400 border-transparent">
          Resolved
        </Badge>
      )}
      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(event.detected_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </div>
  );
}
