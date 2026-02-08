import { format, parseISO } from 'date-fns';
import { ChangelogCard } from './ChangelogCard';
import type { ChangelogEntry } from '@/types/changelog';
import { Calendar } from 'lucide-react';

interface WeekSectionProps {
  weekStart: string;
  entries: ChangelogEntry[];
}

export function WeekSection({ weekStart, entries }: WeekSectionProps) {
  const formattedDate = format(parseISO(weekStart), 'MMMM d, yyyy');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Week of {formattedDate}
        </div>
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs text-muted-foreground font-medium">
          {entries.length} {entries.length === 1 ? 'signal' : 'signals'}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry, index) => (
          <ChangelogCard key={`${entry.company_slug}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
