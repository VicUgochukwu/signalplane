import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Copy, Check, Wand2, MessageSquareQuote, ArrowLeft, Search, Filter,
  ChevronDown, ChevronRight, Pencil, X, ExternalLink, Zap, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { useObjectionLibrary } from '@/hooks/useArtifacts';
import { useRebuttalUsageStats, useRecordRebuttalUsage, type RebuttalUsageStat } from '@/hooks/useRebuttalUsage';
import { ArtifactHeader } from './ArtifactHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRecordArtifactEdit } from '@/hooks/useArtifactEdits';
import type { ObjectionLibraryVersion, Objection } from '@/types/artifacts';
import { cn } from '@/lib/utils';

// ─── Stage Labels ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<number, string> = {
  1: 'Problem Aware',
  2: 'Solution Exploring',
  3: 'Decision Making',
  4: 'Onboarding / Expanding',
};

// ─── Quick Match Scoring ───────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  price_value: ['expensive', 'cost', 'price', 'cheap', 'budget', 'afford', 'roi', 'money', 'pricing', 'worth'],
  timing: ['time', 'later', 'rush', 'priority', 'roadmap', 'timeline', 'quarter', 'busy', 'soon', 'wait'],
  complexity: ['complex', 'hard', 'difficult', 'learn', 'training', 'setup', 'integrate', 'migration', 'onboard'],
  risk: ['risk', 'security', 'compliance', 'downtime', 'reliable', 'trust', 'proven', 'stable', 'mature'],
  fit: ['fit', 'need', 'use case', 'feature', 'missing', 'requirement', 'specific', 'industry', 'scale'],
  competition: ['competitor', 'alternative', 'switch', 'better', 'compare', 'versus', 'already using'],
  inertia: ['change', 'status quo', 'current', 'existing', 'migration', 'switching', 'happy with'],
  authority: ['boss', 'approval', 'decision', 'stakeholder', 'buy-in', 'committee', 'leadership'],
  trust: ['trust', 'reviews', 'reference', 'proof', 'case study', 'customer', 'reputation'],
};

function computeMatchScore(query: string, objection: Objection): number {
  if (!query.trim()) return 0;

  const q = query.toLowerCase().trim();
  const objText = (objection.objection_text || '').toLowerCase();

  // Exact substring match → highest score
  if (objText.includes(q)) return 100;

  // Word overlap scoring
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  const objWords = objText.split(/\s+/).filter(w => w.length > 2);

  if (queryWords.length === 0) return 0;

  const matchedWords = queryWords.filter(qw =>
    objWords.some(ow => ow.includes(qw) || qw.includes(ow))
  );
  const overlapScore = (matchedWords.length / queryWords.length) * 80;

  // Category keyword bonus
  let categoryBonus = 0;
  const category = (objection.category || '').toLowerCase().replace(/[^a-z_]/g, '');
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw))) {
      if (category.includes(cat) || cat.includes(category)) {
        categoryBonus = 20;
        break;
      }
    }
  }

  // Also check rebuttal talk_track for additional relevance
  const talkTrack = (objection.rebuttal?.talk_track || '').toLowerCase();
  const reframe = (objection.rebuttal?.reframe || '').toLowerCase();
  let rebuttalBonus = 0;
  if (talkTrack.includes(q) || reframe.includes(q)) {
    rebuttalBonus = 15;
  }

  return Math.min(100, overlapScore + categoryBonus + rebuttalBonus);
}

// ─── Helper: Extract domain from URL ───────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ─── ObjectionCard ─────────────────────────────────────────────────────────────

function ObjectionCard({
  objection,
  versionId,
  usageStat,
  isTopMatch,
  defaultExpanded,
}: {
  objection: Objection;
  versionId: string;
  usageStat?: RebuttalUsageStat;
  isTopMatch?: boolean;
  defaultExpanded?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const recordEdit = useRecordArtifactEdit();
  const recordUsage = useRecordRebuttalUsage();

  const frequencyColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const rebuttal = objection.rebuttal || { acknowledge: '', reframe: '', proof: '', talk_track: '' };
  const evidenceUrls = objection.evidence_urls || [];
  const evidenceSnippets = objection.evidence_snippets || [];
  const hasEvidence = evidenceUrls.length > 0 || evidenceSnippets.length > 0;

  const handleCopyRebuttal = async () => {
    const rebuttalText = `**Acknowledge:** ${rebuttal.acknowledge || ''}

**Reframe:** ${rebuttal.reframe || ''}

**Proof:** ${rebuttal.proof || ''}

**Talk Track:** ${rebuttal.talk_track || ''}`;

    try {
      await navigator.clipboard.writeText(rebuttalText);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Rebuttal copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleCopySection = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label} copied to clipboard` });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string, original: string) => {
    if (editValue.trim() && editValue !== original) {
      recordEdit.mutate({
        artifactType: 'objection_rebuttal',
        artifactVersionId: versionId,
        sectionKey: `${objection.id || 'unknown'}.${field}`,
        originalContent: original,
        editedContent: editValue,
        editType: 'modify',
      });
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleUsageFeedback = (outcome: 'helped' | 'not_helpful') => {
    recordUsage.mutate({
      objectionId: objection.id,
      libraryVersionId: versionId,
      outcome,
    });
  };

  const rebuttalSections = [
    { key: 'acknowledge', label: 'Acknowledge', value: rebuttal.acknowledge || '' },
    { key: 'reframe', label: 'Reframe', value: rebuttal.reframe || '' },
    { key: 'proof', label: 'Proof', value: rebuttal.proof || '' },
    { key: 'talk_track', label: 'Talk Track', value: rebuttal.talk_track || '' },
  ];

  return (
    <Card className={cn('relative', isTopMatch && 'ring-2 ring-accent-signal/40 shadow-[0_0_12px_hsl(var(--accent-signal)/0.15)]')}>
      {objection.is_new_this_week && (
        <Badge className="absolute -top-2 -right-2 bg-accent-signal text-white gap-1">
          <Wand2 className="h-3 w-3" />
          New
        </Badge>
      )}
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start gap-2 mb-2">
          <Badge className={frequencyColors[objection.frequency] || frequencyColors.medium}>
            {objection.frequency || 'medium'} frequency
          </Badge>
          <Badge variant="outline">{objection.category || 'General'}</Badge>
          {objection.maturity_stage && (
            <Badge variant="outline" className="text-violet-400 border-violet-500/20 bg-violet-500/10">
              Stage {objection.maturity_stage}: {STAGE_LABELS[objection.maturity_stage] || ''}
            </Badge>
          )}
          {usageStat && usageStat.total_uses > 0 && (
            <Badge variant="outline" className="text-blue-400 border-blue-500/20 bg-blue-500/10 gap-1">
              {usageStat.total_uses}× used
              {usageStat.helped_count > 0 && (
                <span className="text-emerald-400">· {usageStat.helped_count} helped</span>
              )}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-medium leading-relaxed">
          &ldquo;{objection.objection_text || ''}&rdquo;
        </CardTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {(objection.personas || []).map((persona) => (
            <Badge key={persona} variant="secondary" className="text-xs">
              {persona}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Collapsible rebuttal toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-signal hover:text-accent-signal/80 transition-colors w-full text-left"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {expanded ? 'Hide' : 'Show'} rebuttal framework
        </button>

        {expanded && (
          <div className="space-y-2.5 pt-1">
            {rebuttalSections.map((section) => (
              <div key={section.key} className="group/section">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground text-sm">{section.label}: </span>
                    {editingField === section.key ? (
                      <div className="mt-1">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full min-h-[60px] rounded-md border border-[hsl(var(--accent-signal)/0.3)] bg-muted/10 p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent-signal)/0.5)]"
                          autoFocus
                        />
                        <div className="flex gap-1.5 mt-1">
                          <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => saveEdit(section.key, section.value)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingField(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{section.value}</span>
                    )}
                  </div>
                  {!editingField && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity shrink-0 mt-0.5">
                      <button
                        onClick={() => handleCopySection(section.label, section.value)}
                        className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
                        title={`Copy ${section.label}`}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => startEdit(section.key, section.value)}
                        className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
                        title={`Edit ${section.label}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Copy full rebuttal + usage feedback row */}
            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={handleCopyRebuttal} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy full rebuttal
              </Button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Did this help?</span>
                <button
                  onClick={() => handleUsageFeedback('helped')}
                  disabled={recordUsage.isPending}
                  className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-50"
                  title="This helped in a deal"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleUsageFeedback('not_helpful')}
                  disabled={recordUsage.isPending}
                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors disabled:opacity-50"
                  title="Not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evidence section */}
        {hasEvidence && (
          <>
            <button
              onClick={() => setEvidenceExpanded(!evidenceExpanded)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              {evidenceExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <ExternalLink className="h-3.5 w-3.5" />
              Evidence ({evidenceUrls.length + evidenceSnippets.length})
            </button>

            {evidenceExpanded && (
              <div className="pl-6 space-y-2 pt-1">
                {/* Snippets */}
                {evidenceSnippets.map((snippet, i) => (
                  <div key={`snippet-${i}`} className="text-sm border-l-2 border-muted-foreground/20 pl-3 py-1">
                    <p className="text-foreground/80 italic">&ldquo;{snippet.text}&rdquo;</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      — {snippet.source}
                      {snippet.date && <span> · {snippet.date}</span>}
                    </p>
                  </div>
                ))}

                {/* Source URLs */}
                {evidenceUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {evidenceUrls.map((url, i) => (
                      <a
                        key={`url-${i}`}
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent-signal hover:text-accent-signal/80 bg-accent-signal/5 hover:bg-accent-signal/10 rounded-md px-2 py-1 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {extractDomain(url)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ObjectionLibraryTab ───────────────────────────────────────────────────────

export function ObjectionLibraryTab() {
  const { data: versions = [], isLoading } = useObjectionLibrary();
  const [selectedVersion, setSelectedVersion] = useState<ObjectionLibraryVersion | null>(null);
  const [searchParams] = useSearchParams();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [personaFilter, setPersonaFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [quickMatchMode, setQuickMatchMode] = useState(false);

  // Auto-select latest version
  const currentVersion = selectedVersion || versions[0] || null;

  // Rebuttal usage stats
  const { data: usageStatsMap } = useRebuttalUsageStats(currentVersion?.id);

  // Read search param from URL (for Enablement → Library deep-link)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && !searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const { personas, categories, stages, filteredObjections, groupedObjections, rankedObjections } = useMemo(() => {
    if (!currentVersion?.content_json?.objections) {
      return { personas: [], categories: [], stages: [], filteredObjections: [], groupedObjections: {}, rankedObjections: [] };
    }

    const objections = currentVersion.content_json.objections;
    const allPersonas = [...new Set(objections.flatMap(o => o.personas || []))].sort();
    const allCategories = [...new Set(objections.map(o => o.category || 'Uncategorized'))].sort();
    const allStages = [...new Set(objections.map(o => o.maturity_stage).filter(Boolean))].sort() as number[];

    let filtered = objections;

    // Standard filters (applied in both modes)
    if (personaFilter !== 'all') {
      filtered = filtered.filter(o => o.personas?.includes(personaFilter));
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(o => o.category === categoryFilter);
    }
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(o => o.frequency === frequencyFilter);
    }
    if (stageFilter !== 'all') {
      filtered = filtered.filter(o => String(o.maturity_stage) === stageFilter);
    }
    if (showNewOnly) {
      filtered = filtered.filter(o => o.is_new_this_week);
    }

    // Quick Match mode: score and rank
    if (quickMatchMode && searchQuery.trim()) {
      const scored = filtered
        .map(o => ({ objection: o, score: computeMatchScore(searchQuery, o) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

      return {
        personas: allPersonas,
        categories: allCategories,
        stages: allStages,
        filteredObjections: scored.map(s => s.objection),
        groupedObjections: {},
        rankedObjections: scored,
      };
    }

    // Standard search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.objection_text?.toLowerCase().includes(q) ||
        o.rebuttal?.talk_track?.toLowerCase().includes(q) ||
        o.rebuttal?.reframe?.toLowerCase().includes(q) ||
        o.category?.toLowerCase().includes(q)
      );
    }

    // Group by category
    const grouped = filtered.reduce((acc, objection) => {
      const category = objection.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(objection);
      return acc;
    }, {} as Record<string, Objection[]>);

    return { personas: allPersonas, categories: allCategories, stages: allStages, filteredObjections: filtered, groupedObjections: grouped, rankedObjections: [] };
  }, [currentVersion, searchQuery, personaFilter, categoryFilter, frequencyFilter, stageFilter, showNewOnly, quickMatchMode]);

  const hasActiveFilters = searchQuery || personaFilter !== 'all' || categoryFilter !== 'all' || frequencyFilter !== 'all' || stageFilter !== 'all' || showNewOnly;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!currentVersion) {
    return (
      <div className="text-center py-12 space-y-4">
        <MessageSquareQuote className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <div className="space-y-2">
          <p className="text-foreground font-medium">No objection data yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once the Buyer Resistance Monitor runs its weekly analysis, this tab will display buyer objections ranked by frequency with full rebuttal frameworks.
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

  const content = currentVersion.content_json;

  // Determine if first matching card should auto-expand (from URL deep-link)
  const urlSearch = searchParams.get('search');
  const shouldAutoExpand = !!urlSearch && urlSearch === searchQuery;

  return (
    <div className="space-y-6">
      <ArtifactHeader
        title="Objection Library"
        versions={versions}
        selectedVersion={currentVersion}
        onVersionSelect={(v) => setSelectedVersion(versions.find(ver => ver.id === v.id) || null)}
        markdownContent={currentVersion.content_md}
        newItemCount={content.new_this_week_count || 0}
        newItemLabel="objections"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground">{content.total_count || 0}</div>
            <p className="text-sm text-muted-foreground">Total Objections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent-signal">{content.new_this_week_count || 0}</div>
            <p className="text-sm text-muted-foreground">New This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground">{content.categories?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Search bar with Quick Match toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                {quickMatchMode ? (
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                )}
                <input
                  type="text"
                  placeholder={quickMatchMode
                    ? 'Paste what the buyer said...'
                    : 'Search objections, rebuttals, categories...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full h-9 pl-10 pr-3 rounded-lg border bg-muted/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1',
                    quickMatchMode
                      ? 'border-amber-500/30 focus:ring-amber-500/50'
                      : 'border-border/50 focus:ring-[hsl(var(--accent-signal)/0.5)]'
                  )}
                />
              </div>
              <Button
                variant={quickMatchMode ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'gap-1.5 shrink-0 h-9',
                  quickMatchMode && 'bg-amber-500 hover:bg-amber-600 text-white'
                )}
                onClick={() => setQuickMatchMode(!quickMatchMode)}
                title={quickMatchMode ? 'Switch to standard search' : 'Switch to Quick Match — paste buyer quotes for relevance-ranked results'}
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quick Match</span>
              </Button>
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select value={personaFilter} onValueChange={setPersonaFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="All Personas" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Personas</SelectItem>
                  {personas.map(p => {
                    const count = currentVersion.content_json.objections.filter(o => o.personas?.includes(p)).length;
                    return <SelectItem key={p} value={p}>{p} ({count})</SelectItem>;
                  })}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => {
                    const count = currentVersion.content_json.objections.filter(o => o.category === c).length;
                    return <SelectItem key={c} value={c}>{c} ({count})</SelectItem>;
                  })}
                </SelectContent>
              </Select>

              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Frequencies" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Frequencies</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {stages.length > 0 && (
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map(s => (
                      <SelectItem key={s} value={String(s)}>
                        Stage {s}: {STAGE_LABELS[s] || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-2">
                <Switch id="obj-new-only" checked={showNewOnly} onCheckedChange={setShowNewOnly} />
                <Label htmlFor="obj-new-only" className="text-xs">New only</Label>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPersonaFilter('all');
                    setCategoryFilter('all');
                    setFrequencyFilter('all');
                    setStageFilter('all');
                    setShowNewOnly(false);
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredObjections.length} of {content.total_count || 0} objections
          {quickMatchMode && searchQuery.trim() && ' (ranked by relevance)'}
        </p>
      )}

      {/* Quick Match mode: flat ranked list */}
      {quickMatchMode && searchQuery.trim() && rankedObjections.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {rankedObjections.map((item, idx) => (
              <ObjectionCard
                key={item.objection.id || `match-${idx}`}
                objection={item.objection}
                versionId={currentVersion.id}
                usageStat={usageStatsMap?.get(item.objection.id)}
                isTopMatch={idx === 0}
                defaultExpanded={idx === 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Standard mode: grouped by category */}
      {(!quickMatchMode || !searchQuery.trim()) && Object.entries(groupedObjections).map(([category, objections]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            {category} ({objections.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {objections.map((objection, idx) => (
              <ObjectionCard
                key={objection.id || `obj-${idx}`}
                objection={objection}
                versionId={currentVersion.id}
                usageStat={usageStatsMap?.get(objection.id)}
                defaultExpanded={shouldAutoExpand && idx === 0}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredObjections.length === 0 && hasActiveFilters && (
        <div className="text-center py-8 text-muted-foreground">
          {quickMatchMode
            ? 'No objections match that buyer statement. Try rephrasing or switch to standard search.'
            : 'No objections match the current filters.'
          }
        </div>
      )}
    </div>
  );
}
