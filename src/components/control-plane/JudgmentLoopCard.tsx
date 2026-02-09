import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Minus,
  CircleDot,
} from 'lucide-react';
import { JudgmentLoopData, Prediction, PredictionOutcome } from '@/types/report';

interface JudgmentLoopCardProps {
  judgmentLoop: JudgmentLoopData;
  predictions: Prediction[];
}

const outcomeConfig: Record<PredictionOutcome, {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  correct: {
    label: 'Correct',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  incorrect: {
    label: 'Incorrect',
    icon: XCircle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  partial: {
    label: 'Partial',
    icon: Minus,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20',
  },
};

const getAccuracyColor = (rate: number) => {
  if (rate >= 75) return 'text-emerald-400';
  if (rate >= 50) return 'text-amber-400';
  return 'text-rose-400';
};

const getCalibrationLabel = (score: number) => {
  if (score >= 80) return { label: 'Well-Calibrated', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' };
  if (score >= 60) return { label: 'Moderately Calibrated', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
  return { label: 'Under-Calibrated', color: 'text-rose-400', bgColor: 'bg-rose-500/10' };
};

export function JudgmentLoopCard({ judgmentLoop, predictions }: JudgmentLoopCardProps) {
  const { current_stats, history } = judgmentLoop;

  // Get scored predictions for display
  const scoredPredictions = predictions.filter((p) => p.outcome && p.outcome !== 'pending');
  const pendingPredictions = predictions.filter((p) => !p.outcome || p.outcome === 'pending');
  const calibration = getCalibrationLabel(current_stats.confidence_calibration);

  // Calculate the max bar width for the accuracy timeline
  const maxPredictions = Math.max(...history.map((h) => h.predictions_made), 1);

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          Judgment Loop
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Tracks prediction accuracy over time — how well our intelligence calls match reality.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Accuracy Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/20 text-center">
            <div className={`text-2xl font-bold tabular-nums ${getAccuracyColor(current_stats.accuracy_rate)}`}>
              {current_stats.accuracy_rate}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Accuracy Rate</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 text-center">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {current_stats.total_predictions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total Predictions</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 text-center">
            <div className="text-2xl font-bold tabular-nums text-emerald-400">
              {current_stats.correct}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Correct</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 text-center">
            <div className="text-2xl font-bold tabular-nums text-zinc-400">
              {current_stats.pending}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Awaiting</div>
          </div>
        </div>

        {/* Calibration Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-muted-foreground">Confidence Calibration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${calibration.color}`}>
              {current_stats.confidence_calibration}%
            </span>
            <Badge variant="outline" className={`text-xs ${calibration.bgColor} ${calibration.color} border-transparent`}>
              {calibration.label}
            </Badge>
          </div>
        </div>

        {/* Accuracy Timeline */}
        {history.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              Accuracy Timeline
            </h4>
            <div className="space-y-2">
              {history.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                    {entry.week_start}
                  </span>
                  <div className="flex-1 h-5 bg-muted/20 rounded-full overflow-hidden relative">
                    {/* Correct portion */}
                    <div
                      className="absolute left-0 top-0 h-full bg-emerald-500/40 rounded-l-full transition-all duration-500"
                      style={{ width: `${(entry.correct / maxPredictions) * 100}%` }}
                    />
                    {/* Scored but incorrect portion */}
                    {entry.scored > entry.correct && (
                      <div
                        className="absolute top-0 h-full bg-rose-500/30 transition-all duration-500"
                        style={{
                          left: `${(entry.correct / maxPredictions) * 100}%`,
                          width: `${((entry.scored - entry.correct) / maxPredictions) * 100}%`,
                        }}
                      />
                    )}
                    {/* Unscored portion */}
                    {entry.predictions_made > entry.scored && (
                      <div
                        className="absolute top-0 h-full bg-zinc-500/20 transition-all duration-500"
                        style={{
                          left: `${(entry.scored / maxPredictions) * 100}%`,
                          width: `${((entry.predictions_made - entry.scored) / maxPredictions) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className={`text-xs font-medium w-10 text-right tabular-nums ${getAccuracyColor(entry.accuracy_rate)}`}>
                    {entry.scored > 0 ? `${entry.accuracy_rate}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/30" />
                Incorrect
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500/20" />
                Pending
              </span>
            </div>
          </div>
        )}

        {/* Scored Predictions */}
        {scoredPredictions.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Scored Predictions
            </h4>
            <div className="space-y-2">
              {scoredPredictions.map((pred, i) => {
                const config = outcomeConfig[pred.outcome!];
                const Icon = config.icon;
                return (
                  <div key={i} className={`p-3 rounded-xl border ${config.borderColor} ${config.bgColor}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{pred.prediction}</p>
                        {pred.outcome_notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">
                            {pred.outcome_notes}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-transparent`}>
                            {config.label}
                          </Badge>
                          <span>Confidence: {pred.confidence}%</span>
                          {pred.scored_at && <span>Scored: {pred.scored_at}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Predictions */}
        {pendingPredictions.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Awaiting Outcome
            </h4>
            <div className="space-y-2">
              {pendingPredictions.map((pred, i) => (
                <div key={i} className="p-3 rounded-xl border border-zinc-500/20 bg-zinc-500/5">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{pred.prediction}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pred.timeframe}
                        </span>
                        <span>Confidence: {pred.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
