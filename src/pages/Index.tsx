import { useMemo, useState } from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { useMyChangelog } from '@/hooks/useMyChangelog';
import { useNarrativeArcs } from '@/hooks/useNarrativeArcs';
import { useConvergences } from '@/hooks/useConvergences';
import { useAuth } from '@/hooks/useAuth';
import { FilterBar } from '@/components/FilterBar';
import { WeekSection } from '@/components/WeekSection';
import { NarrativeArcCard } from '@/components/NarrativeArcCard';
import { ConvergenceAlert } from '@/components/ConvergenceAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, User, Plus, AlertCircle, ArrowRight, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { IconSignalCount, IconPersonaRevenue, IconCompany } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useReports } from '@/hooks/useReports';
import { format, parseISO } from 'date-fns';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllChanges, setShowAllChanges] = useState(false);
  const [arcsExpanded, setArcsExpanded] = useState(true);

  // Both feeds are now user-scoped (filtered by auth.uid())
  // "My Feed" = enabled pages only, "All Signals" = all pages including disabled
  const allFeed = useChangelog(!!user && showAllChanges);
  const myFeed = useMyChangelog(!!user && !showAllChanges);
  const { data: arcs } = useNarrativeArcs();
  const { data: convergences } = useConvergences();

  const isPersonalized = !!user && !showAllChanges;
  const activeFeed = isPersonalized ? myFeed : allFeed;
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

  const { data: packets } = useReports();
  const latestPacket = packets?.[0]; // Already sorted by created_at desc

  const totalSignals = entries?.length || 0;
  const highPriorityCount = entries?.filter(e => e.change_magnitude === 'major').length || 0;

  return (
    <div>
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
                  <IconSignalCount className="h-3.5 w-3.5 text-primary" />
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
                  <IconPersonaRevenue className="h-3.5 w-3.5 text-rose-400" />
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
                  <IconCompany className="h-3.5 w-3.5 text-sky-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-sky-400 tabular-nums">{companies.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Companies</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/50 bg-card group hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <Link to={latestPacket ? `/control-plane/packet/${latestPacket.id}` : '/control-plane'} className="block">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10">
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
                {latestPacket ? (
                  <>
                    <div className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {latestPacket.packet_title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Latest Packet · {(() => { try { return format(parseISO(latestPacket.week_start), 'MMM d'); } catch { return ''; } })()}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">View Packets →</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Weekly Intel</div>
                  </>
                )}
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Narrative Intelligence */}
        {user && ((arcs && arcs.length > 0) || (convergences && convergences.length > 0)) && (
          <div className="space-y-4">
            <button
              onClick={() => setArcsExpanded(!arcsExpanded)}
              className="flex items-center gap-2 w-full group"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <GitBranch className="h-4 w-4 text-primary" />
                Narrative Intelligence
              </div>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground font-medium">
                {(arcs?.length || 0)} arc{(arcs?.length || 0) !== 1 ? 's' : ''}
              </span>
              {arcsExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {arcsExpanded && (
              <div className="space-y-4">
                {/* Convergence alerts */}
                {convergences?.map((c) => (
                  <ConvergenceAlert key={c.convergence_id} convergence={c} />
                ))}

                {/* Arc cards */}
                <div className="grid gap-4 md:grid-cols-2">
                  {arcs?.map((arc) => (
                    <NarrativeArcCard key={arc.arc_id} arc={arc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                  All Pages
                </button>
              </div>
            )}

            {!user && (
              <div className="text-sm text-muted-foreground">
                Sign in to view competitor messaging signals for your tracked companies.
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

          {user && (
            <p className="text-xs text-muted-foreground">
              {isPersonalized
                ? 'Showing signals for your active tracked pages only.'
                : 'Showing signals for all your tracked pages, including disabled ones.'}
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
                  View All Pages
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
