import { useKnowledgeLedger } from '@/hooks/useKnowledgeLedger';
import { useCompoundingMetrics } from '@/hooks/useCompoundingMetrics';
import { usePilot } from '@/hooks/usePilot';
import { useTierGate } from '@/hooks/useTierGate';
import { useDemo } from '@/contexts/DemoContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, Zap, Target, TrendingUp, CheckCircle2,
  PenLine, Layers, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified Intelligence Overview — replaces KnowledgeLedgerCard + CompoundingDashboard.
 *
 * Design: Single compact card with a hero score on the left,
 * inline metrics strip, and optional accuracy sparkline.
 * YC-style: dense information, no wasted space, clear hierarchy.
 */
export function IntelligenceOverview() {
  const { metrics: knowledge, isLoading: knowledgeLoading } = useKnowledgeLedger();
  const { metrics: compounding, isLoading: compoundingLoading } = useCompoundingMetrics();
  const { isPilot, daysElapsed, daysRemaining } = usePilot();
  const { canUse } = useTierGate();
  const demo = useDemo();

  const isLoading = knowledgeLoading || compoundingLoading;
  const showCompounding = (demo?.isDemo || canUse('compounding_dashboard')) && compounding;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-6">
          <Skeleton className="h-16 w-24 bg-muted rounded-lg shrink-0" />
          <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!knowledge) return null;

  // Derived values
  const score = compounding?.compounding_score ?? 0;
  const weeksAge = compounding?.weeks_of_data ?? 0;
  const adoptionRate = compounding && compounding.recommendations_total > 0
    ? Math.round((compounding.recommendations_adopted / compounding.recommendations_total) * 100)
    : 0;
  const latestAccuracy = compounding?.prediction_accuracy_trend?.length
    ? compounding.prediction_accuracy_trend[compounding.prediction_accuracy_trend.length - 1]
    : knowledge.predictions_scored > 0 ? knowledge.prediction_accuracy : null;
  const calibrations = compounding
    ? compounding.velocity_baselines_active + compounding.source_calibrations_active
    : 0;

  const scoreColor = score >= 60 ? 'text-emerald-400' : score >= 30 ? 'text-amber-400' : 'text-muted-foreground';
  const scoreBg = score >= 60 ? 'bg-emerald-400' : score >= 30 ? 'bg-amber-400' : 'bg-muted-foreground';
  const growth = knowledge.weekly_signal_growth;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Hero: Compounding Score */}
        {showCompounding && score > 0 ? (
          <div className="flex items-center gap-4 p-4 md:pr-0 md:border-r border-border/30 shrink-0">
            <div className="relative">
              {/* Circular score indicator */}
              <div className="h-14 w-14 rounded-full flex items-center justify-center relative">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                  <circle
                    cx="28" cy="28" r="24" fill="none" strokeWidth="3"
                    className={cn(score >= 60 ? 'stroke-emerald-400' : score >= 30 ? 'stroke-amber-400' : 'stroke-muted-foreground')}
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 150.8} 150.8`}
                  />
                </svg>
                <span className={cn('absolute text-lg font-bold tabular-nums', scoreColor)}>
                  {score}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Intelligence</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Brain className="h-3 w-3 text-violet-400 shrink-0" />
                <span className="text-xs text-muted-foreground">{weeksAge}w old</span>
                {growth > 0 && (
                  <>
                    <span className="text-muted-foreground/30 mx-0.5">·</span>
                    <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-400">+{growth}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 md:pr-0 md:border-r border-border/30 shrink-0">
            <div className="p-2.5 rounded-lg bg-[hsl(var(--accent-signal)/0.1)]">
              <Activity className="h-5 w-5 text-accent-signal" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Intelligence</div>
              {growth > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">+{growth}% this week</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics strip */}
        <div className="flex-1 grid grid-cols-3 md:grid-cols-6 divide-x divide-border/20">
          <MetricCell
            icon={<Zap className="h-3 w-3 text-sky-400" />}
            value={knowledge.total_signals_processed}
            label="Signals"
          />
          <MetricCell
            icon={<Target className="h-3 w-3 text-accent-signal" />}
            value={knowledge.competitors_monitored}
            label="Competitors"
          />
          <MetricCell
            icon={<Activity className="h-3 w-3 text-amber-400" />}
            value={latestAccuracy !== null ? `${Math.round(latestAccuracy)}%` : '--'}
            label="Accuracy"
            sparkline={compounding?.prediction_accuracy_trend}
          />
          {showCompounding ? (
            <MetricCell
              icon={<CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              value={compounding!.recommendations_adopted}
              label={adoptionRate > 0 ? `Adopted · ${adoptionRate}%` : 'Adopted'}
            />
          ) : (
            <MetricCell
              icon={<CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              value={knowledge.total_packets}
              label="Packets"
            />
          )}
          {showCompounding ? (
            <MetricCell
              icon={<PenLine className="h-3 w-3 text-rose-400" />}
              value={compounding!.artifact_edits_total}
              label="Edits"
            />
          ) : (
            <MetricCell
              icon={<PenLine className="h-3 w-3 text-violet-400" />}
              value={knowledge.total_knowledge_objects}
              label="Objects"
            />
          )}
          {showCompounding ? (
            <MetricCell
              icon={<Layers className="h-3 w-3 text-sky-400" />}
              value={calibrations}
              label="Calibrations"
            />
          ) : (
            <MetricCell
              icon={<Layers className="h-3 w-3 text-sky-400" />}
              value={knowledge.pages_tracked}
              label="Pages"
            />
          )}
        </div>
      </div>

      {/* Pilot progress — thin bar at bottom */}
      {isPilot && (
        <div className="px-4 pb-2 pt-0">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Pilot · Day {daysElapsed}</span>
            <span>{daysRemaining}d left</span>
          </div>
          <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-signal/60 transition-all"
              style={{ width: `${Math.min(100, (daysElapsed / 60) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact metric cell for the inline strip */
function MetricCell({ icon, value, label, sparkline }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sparkline?: number[];
}) {
  return (
    <div className="flex flex-col justify-center px-3 py-3 md:py-4 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-base font-bold text-foreground tabular-nums truncate">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground truncate leading-tight">{label}</div>
      {/* Tiny sparkline */}
      {sparkline && sparkline.length > 1 && (
        <div className="flex items-end gap-px h-2 mt-1.5">
          {sparkline.slice(-8).map((val, i) => (
            <div
              key={i}
              className="flex-1 bg-amber-400/50 rounded-t-sm min-w-[2px]"
              style={{ height: `${Math.max(15, val)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
