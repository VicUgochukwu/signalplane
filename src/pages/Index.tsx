import { useMemo, useState } from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';
import { TagLegend } from '@/components/TagBadge';
import { AuthNavLink } from '@/components/AuthNavLink';
import { HeroSection } from '@/components/HeroSection';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: entries, isLoading, error } = useChangelog();
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedMagnitude, setSelectedMagnitude] = useState('all');

  const companies = useMemo(() => {
    if (!entries) return [];
    return [...new Set(entries.map((e) => e.company_name))].sort();
  }, [entries]);

  const tags = useMemo(() => {
    if (!entries) return [];
    return [...new Set(entries.map((e) => e.primary_tag))].sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter((entry) => {
      if (selectedCompany !== 'all' && entry.company_name !== selectedCompany) return false;
      if (selectedTag !== 'all' && entry.primary_tag !== selectedTag) return false;
      if (selectedMagnitude !== 'all' && entry.change_magnitude !== selectedMagnitude) return false;
      return true;
    });
  }, [entries, selectedCompany, selectedTag, selectedMagnitude]);

  const groupedByWeek = useMemo(() => {
    const groups: Record<string, typeof filteredEntries> = {};
    filteredEntries.forEach((entry) => {
      if (!groups[entry.week_start_date]) {
        groups[entry.week_start_date] = [];
      }
      groups[entry.week_start_date].push(entry);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container py-8 space-y-8">
        <div className="flex justify-end">
          <AuthNavLink />
        </div>

        <HeroSection />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <TagLegend />
          </div>

          <FilterBar
            companies={companies}
            tags={tags}
            selectedCompany={selectedCompany}
            selectedTag={selectedTag}
            selectedMagnitude={selectedMagnitude}
            onCompanyChange={setSelectedCompany}
            onTagChange={setSelectedTag}
            onMagnitudeChange={setSelectedMagnitude}
          />

          {isLoading && (
            <div className="space-y-8">
              {[1, 2].map((week) => (
                <div key={week} className="space-y-4">
                  <Skeleton className="h-8 w-64 bg-zinc-800" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((card) => (
                      <Skeleton key={card} className="h-48 bg-zinc-800" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400">
              <p className="font-medium">Error loading changelog</p>
              <p className="text-sm mt-1">{error.message}</p>
              <p className="text-sm mt-2 text-zinc-400">
                Make sure to configure your Supabase URL and anon key in src/integrations/supabase/client.ts
              </p>
            </div>
          )}

          {!isLoading && !error && groupedByWeek.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              No changes found matching your filters.
            </div>
          )}

          <div className="space-y-8">
            {groupedByWeek.map(([weekStart, weekEntries]) => (
              <WeekSection key={weekStart} weekStart={weekStart} entries={weekEntries} />
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
