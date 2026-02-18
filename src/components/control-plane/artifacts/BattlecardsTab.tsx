import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, AlertTriangle, Trophy, ThumbsDown, Sparkles, ChevronRight, ChevronDown, Swords, ArrowLeft, Phone, PhoneOff, Pencil, ArrowRight } from 'lucide-react';
import { useBattlecards } from '@/hooks/useArtifacts';
import { ArtifactHeader } from './ArtifactHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRecordArtifactEdit } from '@/hooks/useArtifactEdits';
import type { BattlecardVersion } from '@/types/artifacts';
import { cn } from '@/lib/utils';

function CompetitorBattlecard({ battlecard, callMode }: { battlecard: BattlecardVersion; callMode: boolean }) {
  const [copied, setCopied] = useState(false);
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(new Set());
  const [expandedLandmines, setExpandedLandmines] = useState<Set<number>>(new Set());
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const recordEdit = useRecordArtifactEdit();
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

  const toggleTrack = (idx: number) => {
    setExpandedTracks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleLandmine = (idx: number) => {
    setExpandedLandmines(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleChange = (idx: number) => {
    setExpandedChanges(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string, original: string) => {
    if (editValue.trim() && editValue !== original) {
      recordEdit.mutate({
        artifactType: 'battlecard_talk_track',
        artifactVersionId: battlecard.id,
        sectionKey: field,
        originalContent: original,
        editedContent: editValue,
        editType: 'modify',
      });
    }
    setEditingField(null);
    setEditValue('');
  };

  const hasChanges = content.what_changed_this_week?.length > 0;

  // Call Mode: compact, just talk tracks and landmine warnings
  if (callMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-accent-signal" />
            <h3 className="text-lg font-bold text-foreground">Quick Reference: {content.competitor_name}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyBattlecard} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>

        {/* Compact talk tracks — just titles and content, no chrome */}
        {content.talk_tracks?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Talk Tracks</h4>
            {content.talk_tracks.map((track, idx) => (
              <div key={idx} className="bg-muted/20 rounded-lg p-3 border border-border/50">
                <p className="font-semibold text-sm text-foreground mb-1">{track.title}</p>
                <p className="text-sm text-muted-foreground">{track.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Compact landmines — warning only, expandable context */}
        {content.landmines?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Avoid
            </h4>
            {content.landmines.map((landmine, idx) => (
              <div key={idx} className="bg-destructive/5 rounded-lg p-3 border border-destructive/30">
                <p className="font-semibold text-sm text-destructive">{landmine.warning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick win themes */}
        {content.win_themes?.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Win With</h4>
            <div className="flex flex-wrap gap-1.5">
              {content.win_themes.map((theme, idx) => (
                <Badge key={idx} variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400 text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-foreground">{content.competitor_name}</h3>
          {hasChanges && (
            <Badge className="bg-[hsl(var(--accent-signal)/0.1)] text-accent-signal border-[hsl(var(--accent-signal)/0.2)] gap-1">
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

      {/* What Changed This Week — structured as Change → Implication → Counter */}
      {hasChanges && (
        <Card className="border-[hsl(var(--accent-signal)/0.3)] bg-[hsl(var(--accent-signal)/0.05)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-signal" />
              What Changed This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.what_changed_this_week.map((change, idx) => (
              <div key={idx}>
                <button
                  onClick={() => toggleChange(idx)}
                  className="flex items-start gap-2 text-sm w-full text-left hover:bg-[hsl(var(--accent-signal)/0.05)] rounded-md p-1 -mx-1 transition-colors"
                >
                  {expandedChanges.has(idx) ? (
                    <ChevronDown className="h-4 w-4 mt-0.5 text-accent-signal shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mt-0.5 text-accent-signal shrink-0" />
                  )}
                  <span className="font-medium text-foreground">{change}</span>
                </button>
                {expandedChanges.has(idx) && (
                  <div className="ml-7 mt-1 pl-3 border-l-2 border-[hsl(var(--accent-signal)/0.3)] space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-start gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                      <span><strong className="text-foreground">Implication:</strong> Prospects may ask about this — be ready with a counter-narrative.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      <span><strong className="text-foreground">Counter:</strong> Reframe around your differentiated value. See talk tracks below.</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Talk Tracks — collapsible with scenario context */}
      {content.talk_tracks?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Talk Tracks ({content.talk_tracks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {content.talk_tracks.map((track, idx) => (
              <div key={idx} className="group/track">
                <button
                  onClick={() => toggleTrack(idx)}
                  className="flex items-start gap-2 w-full text-left hover:bg-muted/30 rounded-md p-2 -mx-2 transition-colors"
                >
                  {expandedTracks.has(idx) ? (
                    <ChevronDown className="h-4 w-4 mt-0.5 text-accent-signal shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <h4 className="font-semibold text-sm text-foreground">{track.title}</h4>
                </button>
                {expandedTracks.has(idx) && (
                  <div className="ml-6 pl-2 border-l-2 border-border pb-3 group/content">
                    {editingField === `track_${idx}` ? (
                      <div className="mt-1">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full min-h-[80px] rounded-md border border-[hsl(var(--accent-signal)/0.3)] bg-muted/10 p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent-signal)/0.5)]"
                          autoFocus
                        />
                        <div className="flex gap-1.5 mt-1">
                          <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => saveEdit(`track_${idx}`, track.content)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingField(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-muted-foreground mt-1">{track.content}</p>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/content:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${track.title}\n${track.content}`);
                              toast({ title: 'Copied!', description: 'Talk track copied' });
                            }}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
                            title="Copy talk track"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => startEdit(`track_${idx}`, track.content)}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
                            title="Edit talk track"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Landmines — collapsible with "What to say instead" */}
      {content.landmines?.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Landmines ({content.landmines.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {content.landmines.map((landmine, idx) => (
              <div key={idx} className="group/landmine">
                <button
                  onClick={() => toggleLandmine(idx)}
                  className="flex items-start gap-2 w-full text-left hover:bg-destructive/5 rounded-md p-2 -mx-2 transition-colors"
                >
                  {expandedLandmines.has(idx) ? (
                    <ChevronDown className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mt-0.5 text-destructive/50 shrink-0" />
                  )}
                  <h4 className="font-semibold text-sm text-destructive">{landmine.warning}</h4>
                </button>
                {expandedLandmines.has(idx) && (
                  <div className="ml-6 pl-2 border-l-2 border-destructive/30 pb-3 space-y-2">
                    <div className="group/content">
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong className="text-foreground">Context:</strong> {landmine.context}
                      </p>
                      {editingField === `landmine_${idx}` ? (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-foreground mb-1 block">What to say instead:</label>
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full min-h-[60px] rounded-md border border-[hsl(var(--accent-signal)/0.3)] bg-muted/10 p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent-signal)/0.5)]"
                            autoFocus
                            placeholder="Add a recommended alternative response..."
                          />
                          <div className="flex gap-1.5 mt-1">
                            <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => saveEdit(`landmine_${idx}_response`, landmine.context)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingField(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(`landmine_${idx}`, '')}
                          className="mt-1 text-xs text-accent-signal hover:text-accent-signal/80 flex items-center gap-1 opacity-0 group-hover/content:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-3 w-3" />
                          Add &ldquo;what to say instead&rdquo;
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Win/Lose Themes — with context tags */}
      <div className="grid gap-4 md:grid-cols-2">
        {content.win_themes?.length > 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                <Trophy className="h-4 w-4" />
                Win Themes ({content.win_themes.length})
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
                Lose Themes ({content.lose_themes.length})
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
  const [callMode, setCallMode] = useState(false);

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
      <div className="text-center py-12 space-y-4">
        <Swords className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <div className="space-y-2">
          <p className="text-foreground font-medium">No battlecard data yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once the weekly packet generates, this tab will display per-competitor battlecards with what changed this week, talk tracks, landmines to avoid, and win/lose themes. One card per competitor, updated weekly.
          </p>
        </div>
        <Link to="/control-plane">
          <Button variant="outline" size="sm" className="gap-2 mt-4">
            <ArrowLeft className="h-4 w-4" />
            View Intel Packets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitor Tabs + Call Mode Toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0" />
        <Button
          variant={callMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCallMode(!callMode)}
          className={cn(
            "gap-2 shrink-0",
            callMode && "bg-accent-signal text-white"
          )}
        >
          {callMode ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          {callMode ? 'Exit Call Mode' : 'Call Mode'}
        </Button>
      </div>

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
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-signal" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {competitors.map(name => (
          <TabsContent key={name} value={name} className="mt-6">
            {displayVersion && (
              <>
                {!callMode && (
                  <ArtifactHeader
                    title={`${name} Battlecard`}
                    versions={competitorVersions}
                    selectedVersion={displayVersion}
                    onVersionSelect={(v) => setSelectedVersion(competitorVersions.find(ver => ver.id === v.id) || null)}
                    markdownContent={displayVersion.content_md}
                  />
                )}
                <CompetitorBattlecard battlecard={displayVersion} callMode={callMode} />
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
