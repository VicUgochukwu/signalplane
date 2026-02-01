import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MagnitudeBadgeProps {
  magnitude: 'minor' | 'moderate' | 'major';
}

export function MagnitudeBadge({ magnitude }: MagnitudeBadgeProps) {
  const variants = {
    minor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
    moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
    major: 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30',
  };

  return (
    <Badge className={cn('capitalize', variants[magnitude])}>
      {magnitude}
    </Badge>
  );
}
