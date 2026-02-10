import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'green' | 'amber' | 'red' | 'cyan' | 'default';
  icon?: LucideIcon;
  subtext?: string;
}

const colorConfig = {
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  default: 'text-foreground',
};

export const StatCard = ({ label, value, color = 'default', icon: Icon, subtext }: StatCardProps) => {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
          {Icon && <Icon className={cn('h-4 w-4', colorConfig[color])} />}
        </div>
        <p className={cn('text-2xl font-bold font-mono mt-1', colorConfig[color])}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs font-mono text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
};
