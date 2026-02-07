import { useMemo, useState } from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { useMyChangelog } from '@/hooks/useMyChangelog';
import { useAuth } from '@/hooks/useAuth';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, User, Plus, Radio, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

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

  // Calculate stats
  const totalSignals = entries?.length || 0;
  const highPriorityCount = entries?.filter(e => e.change_magnitude === 'major').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground font-mono">
                Signal Feed
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time competitor changes feeding into weekly intelligence packets
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-terminal">
            <CardContent className="p-4">
              <div className="text-2xl font-mono font-bold text-foreground">{totalSignals}</div>
              <div className="text-xs text-muted-foreground font-mono uppercase">Total Signals</div>
            </CardContent>
          </Card>
          <Card className="card-terminal">
            <CardContent className="p-4">
              <div className="text-2xl font-mono font-bold text-terminal-red">{highPriorityCount}</div>
              <div className="text-xs text-muted-foreground font-mono uppercase">High Priority</div>
            </CardContent>
          </Card>
          <Card className="card-terminal">
            <CardContent className="p-4">
              <div className="text-2xl font-mono font-bold text-primary">{companies.length}</div>
              <div className="text-xs text-muted-foreground font-mono uppercase">Companies</div>
            </CardContent>
          </Card>
          <Card className="card-terminal">
            <CardContent className="p-4">
              <Link to="/control-plane" className="block hover:opacity-80 transition-opacity">
                <div className="text-sm font-mono font-bold text-terminal-green">View Packet →</div>
                <div className="text-xs text-muted-foreground font-mono uppercase">Weekly Intel</div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Feed Toggle & Filters */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Feed toggle for signed-in users */}
            {user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllChanges(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono transition-colors ${
                    !showAllChanges
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  My Feed
                </button>
                <button
                  onClick={() => setShowAllChanges(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono transition-colors ${
                    showAllChanges
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  All Signals
                </button>
              </div>
            )}

            {!user && (
              <div className="text-sm text-muted-foreground font-mono">
                // Showing all public signals
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
            <p className="text-xs text-muted-foreground font-mono">
              Showing signals for your tracked companies only.
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            {[1, 2].map((week) => (
              <div key={week} className="space-y-4">
                <Skeleton className="h-6 w-48 bg-muted" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((card) => (
                    <Skeleton key={card} className="h-48 bg-muted" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="card-terminal border-destructive/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-mono font-medium text-destructive">Error loading signals</p>
                  <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personalized Empty State */}
        {!isLoading && !error && groupedByWeek.length === 0 && isPersonalized && (
          <Card className="card-terminal">
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-mono font-medium">No signals for your tracked companies</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Add companies to track on the My Pages dashboard, or browse all signals to see the full feed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => navigate('/my-pages')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Companies
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAllChanges(true)}
                  className="border-border text-foreground hover:bg-muted"
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
          <Card className="card-terminal">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground font-mono">No signals found matching your filters.</p>
            </CardContent>
          </Card>
        )}

        {/* Signal Feed */}
        <div className="space-y-8">
          {groupedByWeek.map(([weekStart, weekEntries]) => (
            <WeekSection key={weekStart} weekStart={weekStart} entries={weekEntries} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
