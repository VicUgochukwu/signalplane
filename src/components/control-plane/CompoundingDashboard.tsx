import { useCompoundingMetrics } from '@/hooks/useCompoundingMetrics';
import { useTierGate } from '@/hooks/useTierGate';
import { useDemo } from '@/contexts/DemoContext';
import { IconCompounding, IconKnowledgeLedger, IconJudgmentLoop, IconSignalCount } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Brain, Gauge, Layers, PenLine, CheckCircle2 } from 'lucide-react';

/**
 * Compounding Intelligence Dashboard card.
 * Shows how the system's intelligence improves over time through
 * calibration loops, artifact edits, and recommendation adoption.
 */
export function CompoundingDashboard() {
  const { metrics, isLoading } = useCompoundingMetrics();
  const { canUse } = useTierGate();
  const demo = useDemo();

  // Show in demo mode, or for Growth+ tiers
  if (!demo?.isDemo && !canUse('compounding_dashboard')) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <Skeleton className="h-5 w-48 bg-muted mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const scoreColor =
    metrics.compounding_score >= 60 ? 'text-emerald-400' :
    metrics.compounding_score >= 30 ? 'text-amber-400' :
    'text-muted-foreground';

  const adoptionRate = metrics.recommendations_total > 0
    ? Math.round((metrics.recommendations_adopted / metrics.recommendations_total) * 100)
    : 0;

  // Latest accuracy from trend
  const latestAccuracy = metrics.prediction_accuracy_trend.length > 0
    ? metrics.prediction_accuracy_trend[metrics.prediction_accuracy_trend.length - 1]
    : null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconCompounding className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Compounding Intelligence
          </h3>
        </div>
        {metrics.compounding_score > 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${scoreColor}`}>
            <TrendingUp className="h-3 w-3" />
            Score: {metrics.compounding_score.toFixed(0)}/100
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Intelligence Age */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.weeks_of_data}w
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Intelligence Age</div>
        </div>

        {/* Compounding Score */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Gauge className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className={`text-xl font-bold tabular-nums ${scoreColor}`}>
            {metrics.compounding_score.toFixed(0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Compounding Score</div>
          {/* Mini progress bar */}
          <div className="mt-1.5 h-1 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, metrics.compounding_score)}%` }}
            />
          </div>
        </div>

        {/* Calibrations Active */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.velocity_baselines_active + metrics.source_calibrations_active}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Calibrations Active</div>
        </div>

        {/* Prediction Accuracy */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <IconJudgmentLoop className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {latestAccuracy !== null ? `${latestAccuracy.toFixed(0)}%` : '--'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Prediction Accuracy</div>
          {/* Mini sparkline using accuracy trend */}
          {metrics.prediction_accuracy_trend.length > 1 && (
            <div className="mt-1.5 flex items-end gap-px h-3">
              {metrics.prediction_accuracy_trend.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-amber-400/60 rounded-t-sm"
                  style={{ height: `${Math.max(10, val)}%` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recommendations Adopted */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.recommendations_adopted}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Adopted {adoptionRate > 0 ? `(${adoptionRate}%)` : ''}
          </div>
        </div>

        {/* Artifact Edits */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <PenLine className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.artifact_edits_total}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Artifact Edits</div>
        </div>
      </div>
    </div>
  );
}
