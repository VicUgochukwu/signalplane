import { useKnowledgeLedger } from '@/hooks/useKnowledgeLedger';
import { usePilot } from '@/hooks/usePilot';
import { useDemo } from '@/contexts/DemoContext';
import {
  IconKnowledgeLedger, IconSignalCount, IconPacket,
  IconJudgmentLoop, IconCompany, IconPilotTimer
} from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

const DEMO_METRICS = {
  total_knowledge_objects: 247,
  total_signals_processed: 1_832,
  total_packets: 12,
  prediction_accuracy: 74,
  predictions_scored: 18,
  predictions_total: 26,
  competitors_monitored: 5,
  weekly_signal_growth: 12,
};

/**
 * Knowledge Ledger card for the Control Plane dashboard.
 * Shows compounding metrics: knowledge objects, signals, packets,
 * prediction accuracy, and pilot progress.
 */
export function KnowledgeLedgerCard() {
  const demo = useDemo();
  const { metrics: liveMetrics, isLoading } = useKnowledgeLedger();
  const { isPilot, daysElapsed, daysRemaining } = usePilot();

  const metrics = demo?.isDemo ? DEMO_METRICS : liveMetrics;

  if (!demo?.isDemo && isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <Skeleton className="h-5 w-40 bg-muted mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const growth = metrics.weekly_signal_growth;
  const growthIsPositive = growth > 0;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconKnowledgeLedger className="h-4 w-4 text-accent-signal" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Knowledge Ledger
          </h3>
        </div>
        {growth !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${growthIsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {growthIsPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(growth).toFixed(0)}% this week
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Knowledge Objects */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <IconKnowledgeLedger className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.total_knowledge_objects}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Knowledge Objects</div>
        </div>

        {/* Signals Processed */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <IconSignalCount className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.total_signals_processed}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Signals Processed</div>
        </div>

        {/* Packets */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <IconPacket className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.total_packets}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Packets</div>
        </div>

        {/* Prediction Accuracy */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <IconJudgmentLoop className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.predictions_scored > 0 ? `${metrics.prediction_accuracy.toFixed(0)}%` : '--'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Accuracy ({metrics.predictions_scored}/{metrics.predictions_total})
          </div>
        </div>

        {/* Competitors */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <IconCompany className="h-3.5 w-3.5 text-accent-signal" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {metrics.competitors_monitored}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Competitors</div>
        </div>

        {/* Pilot Progress */}
        {isPilot && (
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              <IconPilotTimer className="h-3.5 w-3.5 text-accent-signal" />
            </div>
            <div className="text-xl font-bold text-foreground tabular-nums">
              Day {daysElapsed}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {daysRemaining}d remaining
            </div>
            {/* Mini progress bar */}
            <div className="mt-1.5 h-1 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-signal transition-all"
                style={{ width: `${Math.min(100, (daysElapsed / 60) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
