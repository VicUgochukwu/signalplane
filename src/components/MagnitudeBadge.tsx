import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MagnitudeBadgeProps {
  magnitude: 'minor' | 'moderate' | 'major';
}

export function MagnitudeBadge({ magnitude }: MagnitudeBadgeProps) {
  const variants = {
    minor: 'bg-terminal-green/20 text-terminal-green border-terminal-green/40',
    moderate: 'bg-terminal-amber/20 text-terminal-amber border-terminal-amber/40',
    major: 'bg-terminal-red/20 text-terminal-red border-terminal-red/40',
  };

  const labels = {
    minor: 'LOW',
    moderate: 'MED',
    major: 'HIGH',
  };

  return (
    <Badge className={cn('font-mono text-xs uppercase', variants[magnitude])}>
      {labels[magnitude]}
    </Badge>
  );
}
