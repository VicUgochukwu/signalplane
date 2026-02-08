import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MagnitudeBadgeProps {
  magnitude: 'minor' | 'moderate' | 'major';
}

export function MagnitudeBadge({ magnitude }: MagnitudeBadgeProps) {
  const variants = {
    minor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    major: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const labels = {
    minor: 'Low',
    moderate: 'Medium',
    major: 'High',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', variants[magnitude])}>
      {labels[magnitude]}
    </Badge>
  );
}
