import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useHealthScores } from '@/hooks/usePositioningHealth';
import {
  HEALTH_DIMENSION_CONFIG,
  SCORE_TREND_CONFIG,
  type HealthScore,
  type HealthDimension,
} from '@/types/positioningHealth';

// âââ HealthScoreHistory ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function HealthScoreHistory() {
  const { data: scores = [], isLoading } = useHealthScores();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No scores yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Monthly health scores are computed on the first Monday of each month.
          Scores require VoC data, competitor intelligence, or narrative tracking to be active.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scores.map((score) => (
        <ScoreRow key={score.id} score={score} />
      ))}
    </div>
  );
}

// âââ ScoreRow ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function ScoreRow({ score }: { score: HealthScore }) {
  const [expanded, setExpanded] = useState(false);

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

  const monthLabel = new Date(score.score_month + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-4">
          {/* Month */}
          <div className="w-28 shrink-0">
            <div className="text-sm font-medium text-foreground">{monthLabel}</div>
            <div className="text-xs text-muted-foreground">
              {score.dimensions_available.length}/3 dims
            </div>
          </div>

          {/* Total score with bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>
                {score.total_score}
              </span>
              <Progress value={score.total_score} className="h-2 flex-1" />
            </div>

            {/* 3 dimension mini-bars */}
            <div className="flex items-center gap-4">
              {(Object.keys(HEALTH_DIMENSION_CONFIG) as HealthDimension[]).map((dim) => {
                const config = HEALTH_DIMENSION_CONFIG[dim];
                const dimScore =
                  dim === 'buyer_alignment'
                    ? score.buyer_alignment_score
                    : dim === 'differentiation'
                    ? score.differentiation_score
                    : score.narrative_fit_score;
                const pct = Math.round((dimScore / config.maxScore) * 100);

                return (
                  <div key={dim} className="flex items-center gap-1.5 text-xs">
                    <span className={`${config.color} w-2 h-2 rounded-full inline-block`} />
                    <span className="text-muted-foreground">{dimScore}</span>
                    <div className="w-12">
                      <Progress value={pct} className="h-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trend */}
          <div className={`flex items-center gap-1 ${trendConfig.color} shrink-0`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{trendConfig.label}</span>
          </div>

          {/* Expand */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 p-0 shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Expanded breakdown */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
            {/* Dimension details */}
            {(Object.keys(HEALTH_DIMENSION_CONFIG) as HealthDimension[]).map((dim) => {
              const config = HEALTH_DIMENSION_CONFIG[dim];
              const dimScore =
                dim === 'buyer_alignment'
                  ? score.buyer_alignment_score
                  : dim === 'differentiation'
                  ? score.differentiation_score
                  : score.narrative_fit_score;
              const pct = Math.round((dimScore / config.maxScore) * 100);
              const available = score.dimensions_available.includes(dim);

              return (
                <div key={dim} className="flex items-center gap-3">
                  <span className={`text-sm w-36 shrink-0 ${config.color}`}>{config.label}</span>
                  <div className="flex-1">
                    <Progress value={pct} className="h-2" />
                  </div>
                  <span className={`text-sm font-mono tabular-nums w-10 text-right ${config.color}`}>
                    {dimScore}/{config.maxScore}
                  </span>
                  {!available && (
                    <Badge variant="outline" className="text-xs text-muted-foreground border-muted">
                      N/A
                    </Badge>
                  )}
                </div>
              );
            })}

            {/* Prior score */}
            {score.prior_total_score !== null && (
              <div className="text-xs text-muted-foreground">
                Prior month score: {score.prior_total_score} (
                {score.total_score > score.prior_total_score
                  ? `+${score.total_score - score.prior_total_score}`
                  : score.total_score - score.prior_total_score}
                )
              </div>
            )}

            {/* Breakdown JSON (if available) */}
            {score.breakdown && Object.keys(score.breakdown).length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Scoring Breakdown
                </div>
                {Object.entries(score.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground font-medium w-32 shrink-0">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-foreground/80">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
