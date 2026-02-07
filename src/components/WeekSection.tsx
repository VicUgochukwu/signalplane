import { format, parseISO } from 'date-fns';
import { ChangelogCard } from './ChangelogCard';
import type { ChangelogEntry } from '@/types/changelog';

interface WeekSectionProps {
  weekStart: string;
  entries: ChangelogEntry[];
}

export function WeekSection({ weekStart, entries }: WeekSectionProps) {
  const formattedDate = format(parseISO(weekStart), 'MMMM d, yyyy');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wider">
          // Week of {formattedDate}
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-mono text-muted-foreground">{entries.length} signals</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry, index) => (
          <ChangelogCard key={`${entry.company_slug}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
