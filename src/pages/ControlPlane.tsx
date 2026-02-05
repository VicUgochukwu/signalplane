import { useMemo } from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { AuthNavLink } from '@/components/AuthNavLink';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { WeeklyPacket } from '@/components/WeeklyPacket';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ControlPlane = () => {
  const { data: entries, isLoading, error } = useChangelog();

  const weeklyPackets = useMemo(() => {
    if (!entries) return [];
    
    const groups: Record<string, typeof entries> = {};
    entries.forEach((entry) => {
      if (!groups[entry.week_start_date]) {
        groups[entry.week_start_date] = [];
      }
      groups[entry.week_start_date].push(entry);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekStart, weekEntries]) => {
        const tagCounts: Record<string, number> = {};
        const magnitudeCounts: Record<string, number> = { minor: 0, moderate: 0, major: 0 };
        const companiesSet = new Set<string>();

        weekEntries.forEach((entry) => {
          tagCounts[entry.primary_tag] = (tagCounts[entry.primary_tag] || 0) + 1;
          magnitudeCounts[entry.change_magnitude]++;
          companiesSet.add(entry.company_name);
        });

        const topTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tag]) => tag);

        return {
          weekStart,
          totalChanges: weekEntries.length,
          companies: Array.from(companiesSet),
          topTags,
          magnitudeCounts,
          entries: weekEntries,
        };
      });
  }, [entries]);

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/messaging-diff"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
          <AuthNavLink />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100">Control Plane</h1>
          <p className="text-zinc-400">
            Weekly GTM intelligence packets aggregated from tracked competitor pages
          </p>
        </div>

        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 bg-zinc-800" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400">
            <p className="font-medium">Error loading intelligence packets</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && weeklyPackets.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No intelligence packets available yet.
          </div>
        )}

        <div className="space-y-6">
          {weeklyPackets.map((packet) => (
            <WeeklyPacket key={packet.weekStart} packet={packet} />
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default ControlPlane;
