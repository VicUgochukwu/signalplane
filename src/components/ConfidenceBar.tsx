import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number;
}

export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);

  const getColor = () => {
    if (confidence >= 0.8) return 'bg-terminal-green';
    if (confidence >= 0.5) return 'bg-terminal-amber';
    return 'bg-terminal-red';
  };

  const getTextColor = () => {
    if (confidence >= 0.8) return 'text-terminal-green';
    if (confidence >= 0.5) return 'text-terminal-amber';
    return 'text-terminal-red';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono', getTextColor())}>{percentage}%</span>
    </div>
  );
}
