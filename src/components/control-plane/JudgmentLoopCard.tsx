import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Orbit, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { JudgmentLoopData, Prediction } from '@/types/report';

interface JudgmentLoopCardProps {
  judgmentLoop: JudgmentLoopData;
  predictions: Prediction[];
}

const getAccuracyColor = (rate: number) => {
  if (rate >= 75) return { text: 'text-emerald-400', ring: 'stroke-emerald-400' };
  if (rate >= 50) return { text: 'text-amber-400', ring: 'stroke-amber-400' };
  return { text: 'text-rose-400', ring: 'stroke-rose-400' };
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
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6"
          className="stroke-muted/30" />
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6"
          strokeLinecap="round"
          className={colors.ring}
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
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
  if (entry.scored === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-muted border border-border" title="Awaiting results" />
        <span className="text-[9px] text-muted-foreground/60 tabular-nums">
          {entry.week_start.slice(5)}
        </span>
      </div>
    );
  }
  const bg = entry.accuracy_rate >= 75
    ? 'bg-emerald-400'
    : entry.accuracy_rate >= 40
      ? 'bg-amber-400'
      : 'bg-rose-400';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${bg}`} title={`${entry.accuracy_rate}% accuracy`} />
      <span className="text-[9px] text-muted-foreground/60 tabular-nums">
        {entry.week_start.slice(5)}
      </span>
    </div>
  );
}

/** Derive stats from the actual predictions array the user can see */
function computeStats(predictions: Prediction[]) {
  const total = predictions.length;
  const correct = predictions.filter(p => p.outcome === 'correct').length;
  const incorrect = predictions.filter(p => p.outcome === 'incorrect').length;
  const partial = predictions.filter(p => p.outcome === 'partial').length;
  const pending = predictions.filter(p => !p.outcome || p.outcome === 'pending').length;
  const scored = correct + incorrect + partial;
  const accuracy = scored > 0 ? Math.round((correct / scored) * 100) : 0;
  return { total, correct, incorrect, partial, pending, scored, accuracy };
}

export function JudgmentLoopCard({ judgmentLoop, predictions }: JudgmentLoopCardProps) {
  const { history } = judgmentLoop;
  // Derive stats from actual predictions — every number maps to something visible
  const stats = computeStats(predictions);
  const colors = getAccuracyColor(stats.accuracy);

  // Don't render if there are no scored predictions at all
  if (stats.scored === 0 && history.length === 0) return null;

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Orbit className="h-4 w-4 text-violet-400" />
          Judgment Loop
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-6">
          {/* Accuracy Ring — only if we have scored predictions */}
          {stats.scored > 0 ? (
            <AccuracyRing rate={stats.accuracy} />
          ) : (
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={40} fill="none" strokeWidth="6" className="stroke-muted/30" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  pending
                </span>
              </div>
            </div>
          )}

          {/* Right side — narrative + stats */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* One-liner narrative */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stats.scored > 0 ? (
                <>
                  <span className={`font-semibold ${colors.text}`}>{getAccuracyLabel(stats.accuracy)}</span>
                  {' — '}
                  {stats.scored} of {stats.total} prediction{stats.total !== 1 ? 's' : ''} scored
                  {stats.correct > 0 && <>, <span className="text-emerald-400 font-medium">{stats.correct} correct</span></>}
                  {stats.partial > 0 && <>, <span className="text-amber-400 font-medium">{stats.partial} partial</span></>}
                  {stats.incorrect > 0 && <>, <span className="text-rose-400 font-medium">{stats.incorrect} miss{stats.incorrect !== 1 ? 'es' : ''}</span></>}.
                  {stats.pending > 0 && (
                    <span className="text-muted-foreground"> {stats.pending} awaiting outcome.</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {stats.total} prediction{stats.total !== 1 ? 's' : ''} made this week — outcomes pending.
                </span>
              )}
            </p>

            {/* Compact outcome counts — only show if there's something scored */}
            {stats.scored > 0 && (
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {stats.correct} correct
                </span>
                {stats.partial > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {stats.partial} partial
                  </span>
                )}
                {stats.incorrect > 0 && (
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <XCircle className="h-3.5 w-3.5" />
                    {stats.incorrect} miss{stats.incorrect !== 1 ? 'es' : ''}
                  </span>
                )}
                {stats.pending > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {stats.pending} pending
                  </span>
                )}
              </div>
            )}

            {/* Week streak dots — historical context from prior weeks */}
            {history.length > 0 && (
              <div className="pt-1">
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">
                  Weekly track record
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
