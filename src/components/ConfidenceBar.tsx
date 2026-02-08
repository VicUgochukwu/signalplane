import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number;
}

export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);

  const getColor = () => {
    if (confidence >= 0.8) return 'bg-emerald-500';
    if (confidence >= 0.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getTextColor = () => {
    if (confidence >= 0.8) return 'text-emerald-400';
    if (confidence >= 0.5) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium tabular-nums', getTextColor())}>{percentage}%</span>
    </div>
  );
}
