import { useMemo, useState } from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { useMyChangelog } from '@/hooks/useMyChangelog';
import { useAuth } from '@/hooks/useAuth';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, User, Plus, Activity, AlertCircle, ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllChanges, setShowAllChanges] = useState(false);

  const publicFeed = useChangelog();
  const myFeed = useMyChangelog(!!user && !showAllChanges);

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

  const totalSignals = entries?.length || 0;
  const highPriorityCount = entries?.filter(e => e.change_magnitude === 'major').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Competitor Messaging
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time competitor changes feeding into weekly intelligence packets
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl border border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{totalSignals}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Signals</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-rose-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-400 tabular-nums">{highPriorityCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">High Priority</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-sky-500/10">
                  <Building2 className="h-3.5 w-3.5 text-sky-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-sky-400 tabular-nums">{companies.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Companies</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/50 bg-card group hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <Link to="/control-plane" className="block">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10">
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">View Packets →</div>
                <div className="text-xs text-muted-foreground mt-0.5">Weekly Intel</div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Feed Toggle & Filters */}
        <div className="space-y-4 border-t border-border/50 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Feed toggle for signed-in users */}
            {user && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                <button
                  onClick={() => setShowAllChanges(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    !showAllChanges
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  My Feed
                </button>
                <button
                  onClick={() => setShowAllChanges(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    showAllChanges
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  All Signals
                </button>
              </div>
            )}

            {!user && (
              <div className="text-sm text-muted-foreground">
                Showing all public signals
              </div>
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
          </div>

          {isPersonalized && (
            <p className="text-xs text-muted-foreground">
              Showing signals for your tracked companies only.
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            {[1, 2].map((week) => (
              <div key={week} className="space-y-4">
                <Skeleton className="h-6 w-48 bg-muted rounded-lg" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((card) => (
                    <Skeleton key={card} className="h-48 bg-muted rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="rounded-xl border border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Error loading signals</p>
                  <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personalized Empty State */}
        {!isLoading && !error && groupedByWeek.length === 0 && isPersonalized && (
          <Card className="rounded-xl border border-border/50">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">No signals for your tracked companies</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Add companies to track on the My Pages dashboard, or browse all signals to see the full feed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => navigate('/my-pages')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Companies
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAllChanges(true)}
                  className="border-border/50 text-foreground hover:bg-muted/50 rounded-lg"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Browse All Signals
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generic Empty State */}
        {!isLoading && !error && groupedByWeek.length === 0 && !isPersonalized && (
          <Card className="rounded-xl border border-border/50">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No signals found matching your filters.</p>
            </CardContent>
          </Card>
        )}

        {/* Competitor Messaging */}
        <div className="space-y-10">
          {groupedByWeek.map(([weekStart, weekEntries]) => (
            <WeekSection key={weekStart} weekStart={weekStart} entries={weekEntries} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
