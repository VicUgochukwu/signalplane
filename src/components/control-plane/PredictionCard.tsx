import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Loader2 } from 'lucide-react';
import { IconPredictionCorrect, IconPredictionIncorrect, IconJudgmentLoop } from '@/components/icons';
import { useScorePrediction, type NormalizedPrediction } from '@/hooks/usePredictions';
import { useTierGate } from '@/hooks/useTierGate';
import type { PredictionOutcome } from '@/types/report';

interface PredictionCardProps {
  prediction: NormalizedPrediction;
  onScored?: () => void;
}

const getConfidenceColor = (confidence: number | null) => {
  if (!confidence) return 'text-muted-foreground';
  if (confidence >= 80) return 'text-emerald-400';
  if (confidence >= 60) return 'text-amber-400';
  return 'text-rose-400';
};

const getConfidenceBg = (confidence: number | null) => {
  if (!confidence) return 'bg-muted/20 border-border/50';
  if (confidence >= 80) return 'bg-emerald-500/5 border-emerald-500/20';
  if (confidence >= 60) return 'bg-amber-500/5 border-amber-500/20';
  return 'bg-rose-500/5 border-rose-500/20';
};

const outcomeBadgeConfig: Record<string, { label: string; cls: string }> = {
  correct: { label: 'Correct', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  incorrect: { label: 'Incorrect', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  partial: { label: 'Partial', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export function PredictionCard({ prediction, onScored }: PredictionCardProps) {
  const { canUse } = useTierGate();
  const canScore = canUse('judgment_loop');
  const scoreMutation = useScorePrediction();
  const [showScoring, setShowScoring] = useState(false);
  const [notes, setNotes] = useState('');

  const isResolved = prediction.status === 'resolved' && prediction.outcome;
  const badge = isResolved ? outcomeBadgeConfig[prediction.outcome!] : null;

  const handleScore = async (outcome: PredictionOutcome) => {
    try {
      await scoreMutation.mutateAsync({
        predictionId: prediction.id,
        outcome,
        notes: notes.trim() || undefined,
      });
      setShowScoring(false);
      setNotes('');
      onScored?.();
    } catch (err) {
      console.error('Error scoring prediction:', err);
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getConfidenceBg(prediction.confidence)}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-foreground text-sm flex-1">{prediction.prediction_text}</p>
        {badge && (
          <Badge variant="outline" className={`text-xs shrink-0 ${badge.cls}`}>
            {prediction.outcome === 'correct' && <IconPredictionCorrect className="h-3 w-3 mr-1" />}
            {prediction.outcome === 'incorrect' && <IconPredictionIncorrect className="h-3 w-3 mr-1" />}
            {prediction.outcome === 'partial' && <IconJudgmentLoop className="h-3 w-3 mr-1" />}
            {badge.label}
          </Badge>
        )}
      </div>

      {prediction.outcome_notes && (
        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border/50 pl-3">
          {prediction.outcome_notes}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
        {prediction.timeframe && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {prediction.timeframe}
          </span>
        )}
        {prediction.confidence !== null && (
          <span>
            Confidence: <span className={getConfidenceColor(prediction.confidence)}>{prediction.confidence}%</span>
          </span>
        )}
        {prediction.company_name && (
          <span className="text-primary">{prediction.company_name}</span>
        )}
      </div>

      {/* Scoring controls — only for open predictions on Growth+ tier */}
      {!isResolved && prediction.status === 'open' && (
        <div className="mt-3 pt-3 border-t border-border/30">
          {!canScore ? (
            <p className="text-xs text-muted-foreground">
              <span className="text-primary cursor-pointer hover:underline">Upgrade to Growth</span> to score predictions and build your accuracy record.
            </p>
          ) : !showScoring ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScoring(true)}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              <IconJudgmentLoop className="h-3 w-3 mr-1.5" />
              Score this prediction
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Optional notes on how this turned out..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px] text-xs bg-background/50 border-border/50"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScore('correct')}
                  disabled={scoreMutation.isPending}
                  className="text-xs h-7 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  {scoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <IconPredictionCorrect className="h-3 w-3 mr-1" />}
                  Correct
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScore('partial')}
                  disabled={scoreMutation.isPending}
                  className="text-xs h-7 bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                >
                  Partial
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScore('incorrect')}
                  disabled={scoreMutation.isPending}
                  className="text-xs h-7 bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                >
                  {scoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <IconPredictionIncorrect className="h-3 w-3 mr-1" />}
                  Incorrect
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowScoring(false); setNotes(''); }}
                  className="text-xs h-7 text-muted-foreground ml-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
