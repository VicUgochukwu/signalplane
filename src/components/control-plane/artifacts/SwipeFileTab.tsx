import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, TrendingUp, TrendingDown, Minus, Sparkles, Filter, FileText, ArrowLeft, Search, X, List, LayoutGrid, Pencil } from 'lucide-react';
import { useSwipeFile } from '@/hooks/useArtifacts';
import { ArtifactHeader } from './ArtifactHeader';
import { Card, CardContent } from '@/components/ui/card';
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
import type { SwipeFileVersion, SwipePhrase } from '@/types/artifacts';
import { cn } from '@/lib/utils';

const TREND_ICONS = {
  rising: <TrendingUp className="h-4 w-4 text-green-500" />,
  stable: <Minus className="h-4 w-4 text-muted-foreground" />,
  fading: <TrendingDown className="h-4 w-4 text-red-500" />,
};

const TREND_LABELS = {
  rising: 'Rising',
  stable: 'Stable',
  fading: 'Fading',
};

function PhraseCard({ phrase, versionId }: { phrase: SwipePhrase; versionId: string }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const recordEdit = useRecordArtifactEdit();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phrase.phrase);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Phrase copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const startEdit = () => {
    setEditValue(phrase.phrase);
    setEditing(true);
  };

  const saveEdit = () => {
    if (editValue.trim() && editValue !== phrase.phrase) {
      recordEdit.mutate({
        artifactType: 'swipe_phrase',
        artifactVersionId: versionId,
        sectionKey: phrase.id,
        originalContent: phrase.phrase,
        editedContent: editValue,
        editType: 'modify',
      });
    }
    setEditing(false);
    setEditValue('');
  };

  return (
    <Card className="relative group">
      {phrase.is_new_this_week && (
        <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground gap-1">
          <Sparkles className="h-3 w-3" />
          New
        </Badge>
      )}
      <CardContent className="pt-6">
        {editing ? (
          <div className="mb-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[60px] rounded-md border border-primary/50 bg-muted/10 p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-1.5 mt-1">
              <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={saveEdit}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <blockquote className="text-lg font-medium text-foreground italic border-l-4 border-primary pl-4 mb-4">
            &ldquo;{phrase.phrase}&rdquo;
          </blockquote>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{phrase.category}</Badge>
            <Badge variant="secondary">{phrase.persona}</Badge>
            <Badge variant="outline" className="gap-1">
              {TREND_ICONS[phrase.trend]}
              {TREND_LABELS[phrase.trend]}
            </Badge>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={startEdit}
              className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
              title="Edit phrase"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 h-7 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SwipeFileTab() {
  const { data: versions = [], isLoading } = useSwipeFile();
  const [selectedVersion, setSelectedVersion] = useState<SwipeFileVersion | null>(null);
  const [personaFilter, setPersonaFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid');
  const [bulkCopied, setBulkCopied] = useState(false);
  const { toast } = useToast();

  const currentVersion = selectedVersion || versions[0] || null;

  const { personas, categories, filteredPhrases, personaCounts, categoryCounts } = useMemo(() => {
    if (!currentVersion?.content_json) {
      return { personas: [], categories: [], filteredPhrases: [], personaCounts: {}, categoryCounts: {} };
    }

    const content = currentVersion.content_json;
    const phrases = content.phrases || [];

    const allPersonas = [...new Set(phrases.map(p => p.persona))].sort();
    const allCategories = [...new Set(phrases.map(p => p.category))].sort();

    // Counts for filter dropdowns
    const pCounts: Record<string, number> = {};
    allPersonas.forEach(p => { pCounts[p] = phrases.filter(ph => ph.persona === p).length; });
    const cCounts: Record<string, number> = {};
    allCategories.forEach(c => { cCounts[c] = phrases.filter(ph => ph.category === c).length; });

    let filtered = phrases;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.phrase.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.persona.toLowerCase().includes(q)
      );
    }

    if (personaFilter !== 'all') {
      filtered = filtered.filter(p => p.persona === personaFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    if (trendFilter !== 'all') {
      filtered = filtered.filter(p => p.trend === trendFilter);
    }
    if (showNewOnly) {
      filtered = filtered.filter(p => p.is_new_this_week);
    }

    return {
      personas: allPersonas,
      categories: allCategories,
      filteredPhrases: filtered,
      personaCounts: pCounts,
      categoryCounts: cCounts,
    };
  }, [currentVersion, personaFilter, categoryFilter, trendFilter, showNewOnly, searchQuery]);

  const hasActiveFilters = searchQuery || personaFilter !== 'all' || categoryFilter !== 'all' || trendFilter !== 'all' || showNewOnly;

  // Grouped view: group filtered phrases by persona
  const groupedByPersona = useMemo(() => {
    return filteredPhrases.reduce((acc, phrase) => {
      const p = phrase.persona || 'Unknown';
      if (!acc[p]) acc[p] = [];
      acc[p].push(phrase);
      return acc;
    }, {} as Record<string, SwipePhrase[]>);
  }, [filteredPhrases]);

  const handleBulkCopy = async () => {
    const text = filteredPhrases.map(p => `"${p.phrase}" — ${p.persona}, ${p.category} (${p.trend})`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setBulkCopied(true);
      toast({ title: 'Copied!', description: `${filteredPhrases.length} phrases copied to clipboard` });
      setTimeout(() => setBulkCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!currentVersion) {
    return (
      <div className="text-center py-12 space-y-4">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <div className="space-y-2">
          <p className="text-foreground font-medium">No buyer language data yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once signals are processed, this tab will display exact phrases buyers use, tagged by persona and funnel stage. Each phrase is trend-labeled: rising, stable, or fading.
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

  return (
    <div className="space-y-6">
      <ArtifactHeader
        title="Swipe File"
        versions={versions}
        selectedVersion={currentVersion}
        onVersionSelect={(v) => setSelectedVersion(versions.find(ver => ver.id === v.id) || null)}
        markdownContent={currentVersion.content_md}
        newItemCount={content.phrases?.filter(p => p.is_new_this_week).length || 0}
        newItemLabel="phrases"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground">{content.total_count || 0}</div>
            <p className="text-sm text-muted-foreground">Total Phrases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground">{personas.length}</div>
            <p className="text-sm text-muted-foreground">Personas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground">{categories.length}</div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">
              {content.phrases?.filter(p => p.is_new_this_week).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">New This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search phrases, personas, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-3 rounded-lg border border-border/50 bg-muted/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
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
                  {personas.map(persona => (
                    <SelectItem key={persona} value={persona}>
                      {persona} ({personaCounts[persona] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category} ({categoryCounts[category] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={trendFilter} onValueChange={setTrendFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Trends" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Trends</SelectItem>
                  <SelectItem value="rising">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" /> Rising
                    </span>
                  </SelectItem>
                  <SelectItem value="stable">
                    <span className="flex items-center gap-1">
                      <Minus className="h-3 w-3 text-muted-foreground" /> Stable
                    </span>
                  </SelectItem>
                  <SelectItem value="fading">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" /> Fading
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="new-only"
                  checked={showNewOnly}
                  onCheckedChange={setShowNewOnly}
                />
                <Label htmlFor="new-only" className="text-xs">New only</Label>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPersonaFilter('all');
                    setCategoryFilter('all');
                    setTrendFilter('all');
                    setShowNewOnly(false);
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}

              {/* Spacer + view toggle + bulk copy */}
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 transition-colors",
                      viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    )}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={cn(
                      "p-1.5 transition-colors",
                      viewMode === 'grouped' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    )}
                    title="Grouped by persona"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCopy}
                  className="gap-1.5 h-7 text-xs"
                  disabled={filteredPhrases.length === 0}
                >
                  {bulkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy All ({filteredPhrases.length})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredPhrases.length} of {content.total_count || 0} phrases
        </p>
      )}

      {/* Phrases Display */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPhrases.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} versionId={currentVersion.id} />
          ))}
        </div>
      ) : (
        /* Grouped by Persona view */
        <div className="space-y-6">
          {Object.entries(groupedByPersona).sort().map(([persona, phrases]) => (
            <div key={persona} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                {persona}
                <Badge variant="secondary" className="text-xs">{phrases.length}</Badge>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {phrases.map((phrase) => (
                  <PhraseCard key={phrase.id} phrase={phrase} versionId={currentVersion.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPhrases.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No phrases match the current filters.
        </div>
      )}
    </div>
  );
}
