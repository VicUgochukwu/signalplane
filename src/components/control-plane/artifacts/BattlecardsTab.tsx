import { useState, useMemo } from 'react';
import { Copy, Check, AlertTriangle, Trophy, ThumbsDown, Sparkles, ChevronRight } from 'lucide-react';
import { useBattlecards } from '@/hooks/useArtifacts';
import { ArtifactHeader } from './ArtifactHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { BattlecardVersion } from '@/types/artifacts';
import { cn } from '@/lib/utils';

function CompetitorBattlecard({ battlecard }: { battlecard: BattlecardVersion }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const content = battlecard.content_json;

  const handleCopyBattlecard = async () => {
    try {
      await navigator.clipboard.writeText(battlecard.content_md);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Battlecard copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const hasChanges = content.what_changed_this_week?.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-foreground">{content.competitor_name}</h3>
          {hasChanges && (
            <Badge className="bg-primary text-primary-foreground gap-1">
              <Sparkles className="h-3 w-3" />
              Changes This Week
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyBattlecard} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy Battlecard
        </Button>
      </div>

      {/* What Changed This Week */}
      {hasChanges && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What Changed This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.what_changed_this_week.map((change, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Talk Tracks */}
      {content.talk_tracks?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Talk Tracks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.talk_tracks.map((track, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground">{track.title}</h4>
                <p className="text-sm text-muted-foreground">{track.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Landmines */}
      {content.landmines?.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Landmines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.landmines.map((landmine, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="font-semibold text-sm text-destructive">{landmine.warning}</h4>
                <p className="text-sm text-muted-foreground">{landmine.context}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Win/Lose Themes */}
      <div className="grid gap-4 md:grid-cols-2">
        {content.win_themes?.length > 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                <Trophy className="h-4 w-4" />
                Win Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.win_themes.map((theme, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    <span>{theme}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {content.lose_themes?.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ThumbsDown className="h-4 w-4" />
                Lose Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.lose_themes.map((theme, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <span>{theme}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function BattlecardsTab() {
  const { data: versions = [], isLoading } = useBattlecards();
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  // Group by competitor, get latest for each
  const { competitors, latestByCompetitor } = useMemo(() => {
    const byCompetitor: Record<string, BattlecardVersion[]> = {};
    
    versions.forEach(v => {
      const name = v.competitor_name;
      if (!byCompetitor[name]) byCompetitor[name] = [];
      byCompetitor[name].push(v);
    });

    const competitors = Object.keys(byCompetitor).sort();
    const latestByCompetitor: Record<string, BattlecardVersion> = {};
    
    competitors.forEach(name => {
      latestByCompetitor[name] = byCompetitor[name][0]; // Already sorted by created_at desc
    });

    return { competitors, latestByCompetitor };
  }, [versions]);

  const activeCompetitor = selectedCompetitor || competitors[0] || null;
  const currentBattlecard = activeCompetitor ? latestByCompetitor[activeCompetitor] : null;

  // Get all versions for selected competitor (for version dropdown)
  const competitorVersions = useMemo(() => {
    if (!activeCompetitor) return [];
    return versions.filter(v => v.competitor_name === activeCompetitor);
  }, [versions, activeCompetitor]);

  const [selectedVersion, setSelectedVersion] = useState<BattlecardVersion | null>(null);
  const displayVersion = selectedVersion || currentBattlecard;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No battlecard data available. Data will appear after the weekly AI analysis runs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitor Tabs */}
      <Tabs value={activeCompetitor || ''} onValueChange={(v) => {
        setSelectedCompetitor(v);
        setSelectedVersion(null);
      }}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted p-1">
          {competitors.map(name => {
            const hasChanges = latestByCompetitor[name]?.content_json?.what_changed_this_week?.length > 0;
            return (
              <TabsTrigger 
                key={name} 
                value={name}
                className={cn(
                  "relative",
                  hasChanges && "pr-6"
                )}
              >
                {name}
                {hasChanges && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {competitors.map(name => (
          <TabsContent key={name} value={name} className="mt-6">
            {displayVersion && (
              <>
                <ArtifactHeader
                  title={`${name} Battlecard`}
                  versions={competitorVersions}
                  selectedVersion={displayVersion}
                  onVersionSelect={(v) => setSelectedVersion(competitorVersions.find(ver => ver.id === v.id) || null)}
                  markdownContent={displayVersion.content_md}
                />
                <CompetitorBattlecard battlecard={displayVersion} />
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
