import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { JudgmentLoopData, Prediction } from '@/types/report';

interface JudgmentLoopCardProps {
  judgmentLoop: JudgmentLoopData;
  predictions: Prediction[];
}

const getAccuracyColor = (rate: number) => {
  if (rate >= 75) return { text: 'text-emerald-400', ring: 'stroke-emerald-400', bg: 'bg-emerald-500/10' };
  if (rate >= 50) return { text: 'text-amber-400', ring: 'stroke-amber-400', bg: 'bg-amber-500/10' };
  return { text: 'text-rose-400', ring: 'stroke-rose-400', bg: 'bg-rose-500/10' };
};

const getAccuracyLabel = (rate: number) => {
  if (rate >= 80) return 'Excellent';
  if (rate >= 70) return 'Strong';
  if (rate >= 55) return 'Fair';
  return 'Improving';
};

/** SVG donut ring for accuracy score */
function AccuracyRing({ rate }: { rate: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (rate / 100) * circumference;
  const colors = getAccuracyColor(rate);

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6"
          className="stroke-muted/30" />
        {/* Filled arc */}
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6"
          strokeLinecap="round"
          className={colors.ring}
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>{rate}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
          accuracy
        </span>
      </div>
    </div>
  );
}

/** A single week dot in the streak row */
function WeekDot({ entry }: { entry: JudgmentLoopData['history'][number] }) {
  // Not yet scored
  if (entry.scored === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600" title="Awaiting results" />
        <span className="text-[9px] text-muted-foreground/60 tabular-nums">
          {entry.week_start.slice(5)}
        </span>
      </div>
    );
  }

  // All correct
  if (entry.accuracy_rate >= 75) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-400" title={`${entry.accuracy_rate}% accuracy`} />
        <span className="text-[9px] text-muted-foreground/60 tabular-nums">
          {entry.week_start.slice(5)}
        </span>
      </div>
    );
  }

  // Mixed
  if (entry.accuracy_rate >= 40) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-amber-400" title={`${entry.accuracy_rate}% accuracy`} />
        <span className="text-[9px] text-muted-foreground/60 tabular-nums">
          {entry.week_start.slice(5)}
        </span>
      </div>
    );
  }

  // Mostly wrong
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-rose-400" title={`${entry.accuracy_rate}% accuracy`} />
      <span className="text-[9px] text-muted-foreground/60 tabular-nums">
        {entry.week_start.slice(5)}
      </span>
    </div>
  );
}

export function JudgmentLoopCard({ judgmentLoop }: JudgmentLoopCardProps) {
  const { current_stats, history } = judgmentLoop;
  const colors = getAccuracyColor(current_stats.accuracy_rate);

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          Judgment Loop
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-6">
          {/* Accuracy Ring */}
          <AccuracyRing rate={current_stats.accuracy_rate} />

          {/* Right side — narrative + stats */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* One-liner narrative */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className={`font-semibold ${colors.text}`}>{getAccuracyLabel(current_stats.accuracy_rate)}</span>
              {' — '}
              {current_stats.correct} of {current_stats.scored} scored prediction{current_stats.scored !== 1 ? 's' : ''} confirmed.
              {current_stats.pending > 0 && (
                <span className="text-zinc-500"> {current_stats.pending} still awaiting outcome.</span>
              )}
            </p>

            {/* Compact outcome counts */}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {current_stats.correct} correct
              </span>
              {current_stats.partial > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {current_stats.partial} partial
                </span>
              )}
              {current_stats.incorrect > 0 && (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="h-3.5 w-3.5" />
                  {current_stats.incorrect} miss{current_stats.incorrect !== 1 ? 'es' : ''}
                </span>
              )}
              {current_stats.pending > 0 && (
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  {current_stats.pending} pending
                </span>
              )}
            </div>

            {/* Week streak dots */}
            {history.length > 0 && (
              <div className="pt-1">
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">
                  Weekly streak
                </div>
                <div className="flex items-center gap-2.5">
                  {history.map((entry, i) => (
                    <WeekDot key={i} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
