import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Send,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEnablement, type EnablementScorecard as ScorecardType, type EnablementStats, type FeedbackSummary } from '@/hooks/useEnablement';
import { ARTIFACT_TYPE_LABELS } from './ArtifactFeedbackForm';

// âââ Stat Card ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// âââ Feedback Summary Card ââââââââââââââââââââââââââââââââââââââââââââââââââââ

function FeedbackSummaryCard({ summary }: { summary: FeedbackSummary }) {
  const type = summary.artifact_type;
  const label = ARTIFACT_TYPE_LABELS[type as keyof typeof ARTIFACT_TYPE_LABELS] || type;

  return (
    <div className="p-3 rounded-lg bg-muted/20 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold tabular-nums">
            {summary.avg_rating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({summary.feedback_count})
          </span>
        </div>
      </div>

      {summary.top_useful_sections.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Most useful:</div>
          <div className="flex flex-wrap gap-1">
            {summary.top_useful_sections.slice(0, 5).map((section) => (
              <Badge
                key={section}
                variant="outline"
                className="text-xs text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
              >
                {section}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {summary.top_missing_items.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Most requested:</div>
          <div className="flex flex-wrap gap-1">
            {summary.top_missing_items.slice(0, 5).map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="text-xs text-amber-400 border-amber-500/20 bg-amber-500/10"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// âââ Weekly Scorecard Detail ââââââââââââââââââââââââââââââââââââââââââââââââââ

function WeeklyScorecardDetail({ scorecard }: { scorecard: ScorecardType }) {
  const [expanded, setExpanded] = useState(false);
  const d = scorecard.data;
  const weekLabel = `${new Date(scorecard.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} â ${new Date(scorecard.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="text-sm font-medium text-foreground">{weekLabel}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{d.deliveries_count} deliveries</span>
              <span>â¢</span>
              <span>{d.feedback_count} feedback</span>
              <span>â¢</span>
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {d.avg_rating?.toFixed(1) || 'â'}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/20">
              <div className="text-lg font-bold tabular-nums">{d.deliveries_count}</div>
              <div className="text-xs text-muted-foreground">Delivered</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20">
              <div className="text-lg font-bold tabular-nums">{d.artifacts_updated}</div>
              <div className="text-xs text-muted-foreground">Updated</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20">
              <div className="text-lg font-bold tabular-nums">{d.views_count}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20">
              <div className="text-lg font-bold tabular-nums">{d.unique_viewers}</div>
              <div className="text-xs text-muted-foreground">Unique Viewers</div>
            </div>
          </div>

          {/* Top Referenced Sections */}
          {d.top_referenced_sections?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Top Referenced Sections
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.top_referenced_sections.map((section) => (
                  <Badge key={section} variant="secondary" className="text-xs">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Unaddressed Objections */}
          {d.unaddressed_objections?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                Unaddressed Objections
              </div>
              <ul className="space-y-1">
                {d.unaddressed_objections.map((obj, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">â¢</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coverage Gaps */}
          {d.coverage_gaps?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                Coverage Gaps
              </div>
              <div className="space-y-1.5">
                {d.coverage_gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        gap.severity === 'high'
                          ? 'text-rose-400 border-rose-500/20 bg-rose-500/10'
                          : gap.severity === 'medium'
                          ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                          : 'text-muted-foreground border-border'
                      }`}
                    >
                      {gap.severity}
                    </Badge>
                    <span className="text-foreground/80">
                      {gap.description}
                      {gap.competitor_name && (
                        <span className="text-muted-foreground"> ({gap.competitor_name})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Recommended */}
          {d.actions_recommended?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Recommended Actions
              </div>
              <ul className="space-y-1">
                {d.actions_recommended.map((action, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">â¢</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// âââ Main Component âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function EnablementDashboard() {
  const { stats, feedbackSummary, scorecards, isLoading } = useEnablement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const safeStats: EnablementStats = stats || {
    deliveries_count: 0,
    feedback_count: 0,
    avg_rating: null,
    views_count: 0,
    unique_viewers: 0,
    open_gaps: 0,
    high_severity_gaps: 0,
  };

  return (
    <div className="space-y-6">
      {/* âââ Stats Grid ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Deliveries"
          value={safeStats.deliveries_count}
          icon={Send}
          color="bg-blue-500/10 text-blue-400"
          subtitle="This week"
        />
        <StatCard
          label="Avg Rating"
          value={safeStats.avg_rating ? safeStats.avg_rating.toFixed(1) : 'â'}
          icon={Star}
          color="bg-amber-500/10 text-amber-400"
          subtitle={`${safeStats.feedback_count} ratings`}
        />
        <StatCard
          label="Views"
          value={safeStats.views_count}
          icon={Eye}
          color="bg-emerald-500/10 text-emerald-400"
          subtitle={`${safeStats.unique_viewers} unique`}
        />
        <StatCard
          label="Open Gaps"
          value={safeStats.open_gaps}
          icon={AlertTriangle}
          color={
            safeStats.high_severity_gaps > 0
              ? 'bg-rose-500/10 text-rose-400'
              : 'bg-muted/20 text-muted-foreground'
          }
          subtitle={
            safeStats.high_severity_gaps > 0
              ? `${safeStats.high_severity_gaps} high severity`
              : undefined
          }
        />
      </div>

      {/* âââ Rating Health Bar ââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {safeStats.avg_rating !== null && (
        <Card className="rounded-xl border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Content Quality Score
              </span>
              <span className="text-sm font-semibold">
                {safeStats.avg_rating.toFixed(1)} / 5.0
              </span>
            </div>
            <Progress
              value={(safeStats.avg_rating / 5) * 100}
              className="h-2"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Needs work</span>
              <span className="text-xs text-muted-foreground">Excellent</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* âââ Feedback Summary (30-day) âââââââââââââââââââââââââââââââââââââââââ */}
      {feedbackSummary.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              Feedback by Artifact (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedbackSummary.map((s) => (
              <FeedbackSummaryCard key={s.artifact_type} summary={s} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* âââ Weekly Scorecards âââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <Card className="rounded-xl border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Weekly Scorecards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scorecards.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No scorecards yet. They generate automatically every week.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Scorecards summarize delivery, feedback, views, gaps, and recommended actions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scorecards.map((sc) => (
                <WeeklyScorecardDetail key={sc.id} scorecard={sc} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
