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
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  cyan: 'text-cyan-400',
  default: 'text-zinc-100',
};

export const StatCard = ({ label, value, color = 'default', icon: Icon, subtext }: StatCardProps) => {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
          {Icon && <Icon className={cn('h-4 w-4', colorConfig[color])} />}
        </div>
        <p className={cn('text-2xl font-bold font-mono mt-1', colorConfig[color])}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs font-mono text-zinc-500 mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
};
