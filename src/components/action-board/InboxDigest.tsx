import { ActionBoardCard } from '@/types/actionBoard';
import { Inbox, AlertTriangle, Flame } from 'lucide-react';

interface InboxDigestProps {
  cards: ActionBoardCard[];
}

export function InboxDigest({ cards }: InboxDigestProps) {
  if (cards.length === 0) return null;

  const now = Date.now();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  const newThisWeek = cards.filter(c => {
    const age = now - new Date(c.moved_to_inbox_at).getTime();
    return age < WEEK_MS;
  }).length;

  const staleCount = cards.filter(c => {
    const age = now - new Date(c.moved_to_inbox_at).getTime();
    return age >= TWO_WEEKS_MS;
  }).length;

  const maxSeverity = Math.max(...cards.map(c => c.severity));

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/10 border border-border/30 text-[11px] text-muted-foreground">
      <Inbox className="h-3 w-3 shrink-0" />
      <span>
        <span className="font-medium text-foreground">{newThisWeek}</span> new this week
      </span>
      {staleCount > 0 && (
        <>
          <span className="text-muted-foreground/30">·</span>
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {staleCount} stale
          </span>
        </>
      )}
      {maxSeverity >= 4 && (
        <>
          <span className="text-muted-foreground/30">·</span>
          <span className="flex items-center gap-1 text-rose-400">
            <Flame className="h-3 w-3" />
            sev {maxSeverity}
          </span>
        </>
      )}
    </div>
  );
}
