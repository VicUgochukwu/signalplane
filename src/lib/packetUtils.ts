/**
 * Shared packet computation utilities.
 * Used by ReportDetail, ReportCard, ReportList, and Index.
 */
import type { IntelPacket, Prediction } from '@/types/report';

/** Merge bets into predictions — bets become predictions without a specific timeframe */
export function mergedPredictions(report: IntelPacket): Prediction[] {
  const preds = [...(report.predictions || [])];

  for (const bet of (report.bets || [])) {
    // Avoid obvious duplicates by checking prefix overlap
    const isDuplicate = preds.some(p =>
      p.prediction.toLowerCase().includes(bet.hypothesis.toLowerCase().slice(0, 40)) ||
      bet.hypothesis.toLowerCase().includes(p.prediction.toLowerCase().slice(0, 40))
    );
    if (!isDuplicate) {
      preds.push({
        prediction: bet.hypothesis,
        timeframe: 'Ongoing',
        confidence: bet.confidence,
        signals: bet.signal_ids,
      });
    }
  }

  return preds;
}

/** Compute judgment loop accuracy from predictions — used as inline header stat */
export function computeAccuracy(predictions: Prediction[]): { scored: number; accuracy: number } | null {
  const scored = predictions.filter(p => p.outcome && p.outcome !== 'pending').length;
  if (scored === 0) return null;
  const correct = predictions.filter(p => p.outcome === 'correct').length;
  return { scored, accuracy: Math.round((correct / scored) * 100) };
}

/** Count market winner gaps across proven + emerging tiers */
export function countMarketGaps(report: IntelPacket): number {
  if (!report.market_winners) return 0;
  const all = [...(report.market_winners.proven || []), ...(report.market_winners.emerging || [])];
  return all.filter(w => w.your_gap).length;
}
