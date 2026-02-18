import { Progress } from '@/components/ui/progress';
import type { ReadinessBreakdown } from '@/types/launchOps';

// âââ ReadinessGauge âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Visual score gauge (0-100) with color transitions + 5-dimension breakdown

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function barColor(score: number): string {
  if (score >= 80) return '[&>div]:bg-emerald-500';
  if (score >= 60) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-rose-500';
}

const DIMENSION_LABELS: Record<string, string> = {
  competitor_landscape: 'Competitor Landscape',
  messaging_readiness: 'Messaging Readiness',
  market_timing: 'Market Timing',
  objection_coverage: 'Objection Coverage',
  battlecard_freshness: 'Battlecard Freshness',
};

interface ReadinessGaugeProps {
  score: number;
  breakdown?: ReadinessBreakdown;
  compact?: boolean;
}

export function ReadinessGauge({ score, breakdown, compact = false }: ReadinessGaugeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`text-sm font-bold tabular-nums ${scoreColor(score)}`}>
          {score}
        </div>
        <Progress value={score} className={`h-1.5 w-16 ${barColor(score)}`} />
      </div>
    );
  }

  const dimensions = breakdown
    ? Object.entries(breakdown).filter(([, v]) => v != null)
    : [];

  return (
    <div className="space-y-3">
      {/* Main score */}
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-bold tabular-nums ${scoreColor(score)}`}>
          {score}
        </div>
        <div className="flex-1 space-y-1">
          <Progress value={score} className={`h-2.5 ${barColor(score)}`} />
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Not Ready</span>
            <span className="text-xs text-muted-foreground">Launch Ready</span>
          </div>
        </div>
      </div>

      {/* Dimension breakdown */}
      {dimensions.length > 0 && (
        <div className="space-y-2 pt-1">
          {dimensions.map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-40 shrink-0">
                {DIMENSION_LABELS[key] || key}
              </span>
              <Progress
                value={value as number}
                className={`h-1.5 flex-1 ${barColor(value as number)}`}
              />
              <span className={`text-xs font-medium tabular-nums w-8 text-right ${scoreColor(value as number)}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
