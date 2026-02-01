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
        <h2 className="text-lg font-semibold text-zinc-100">Week of {formattedDate}</h2>
        <div className="flex-1 h-px bg-zinc-700" />
        <span className="text-sm text-zinc-500">{entries.length} changes</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry, index) => (
          <ChangelogCard key={`${entry.company_slug}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
