import { useMemo, useState } from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { useMyChangelog } from '@/hooks/useMyChangelog';
import { useAuth } from '@/hooks/useAuth';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';

import { AuthNavLink } from '@/components/AuthNavLink';
import { HeroSection } from '@/components/HeroSection';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Globe, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllChanges, setShowAllChanges] = useState(false);

  // Always fetch public feed (used when not signed in, or when "Browse all" is active)
  const publicFeed = useChangelog();
  // Only fetch personalized feed when signed in and not browsing all
  const myFeed = useMyChangelog(!!user && !showAllChanges);

  // Determine which feed to display
  const isPersonalized = !!user && !showAllChanges;
  const activeFeed = isPersonalized ? myFeed : publicFeed;
  const { data: entries, isLoading, error } = activeFeed;

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
      <AppNavigation />
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-end">
          <AuthNavLink />
        </div>

        <HeroSection />

        <div className="border-t border-zinc-800 pt-8 space-y-4">
          {/* Feed toggle for signed-in users */}
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllChanges(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    !showAllChanges
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  My Feed
                </button>
                <button
                  onClick={() => setShowAllChanges(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    showAllChanges
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  All Changes
                </button>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-zinc-100">
            {isPersonalized ? 'Your Tracked Changes' : 'Recent Changes'}
          </h2>

          {isPersonalized && (
            <p className="text-sm text-zinc-500">
              Showing changes for your tracked companies only.
            </p>
          )}

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

          {/* Personalized empty state */}
          {!isLoading && !error && groupedByWeek.length === 0 && isPersonalized && (
            <div className="text-center py-16 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Plus className="h-6 w-6 text-zinc-500" />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-300 font-medium">No changes for your tracked companies yet</p>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Add companies to track on the My Pages dashboard, or browse all changes to see what others are tracking.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => navigate('/my-pages')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Companies
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAllChanges(true)}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Browse All Changes
                </Button>
              </div>
            </div>
          )}

          {/* Generic empty state (public feed or filters) */}
          {!isLoading && !error && groupedByWeek.length === 0 && !isPersonalized && (
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
