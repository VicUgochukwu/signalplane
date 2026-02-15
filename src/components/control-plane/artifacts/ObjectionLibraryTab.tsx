import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Sparkles, MessageSquareQuote, ArrowLeft, Search, Filter, ChevronDown, ChevronRight, Pencil, X } from 'lucide-react';
import { useObjectionLibrary } from '@/hooks/useArtifacts';
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

function ObjectionCard({ objection, versionId }: { objection: Objection; versionId: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const recordEdit = useRecordArtifactEdit();

  const frequencyColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const rebuttal = objection.rebuttal || { acknowledge: '', reframe: '', proof: '', talk_track: '' };

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

  const rebuttalSections = [
    { key: 'acknowledge', label: 'Acknowledge', value: rebuttal.acknowledge || '' },
    { key: 'reframe', label: 'Reframe', value: rebuttal.reframe || '' },
    { key: 'proof', label: 'Proof', value: rebuttal.proof || '' },
    { key: 'talk_track', label: 'Talk Track', value: rebuttal.talk_track || '' },
  ];

  return (
    <Card className="relative">
      {objection.is_new_this_week && (
        <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground gap-1">
          <Sparkles className="h-3 w-3" />
          New
        </Badge>
      )}
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start gap-2 mb-2">
          <Badge className={frequencyColors[objection.frequency] || frequencyColors.medium}>
            {objection.frequency || 'medium'} frequency
          </Badge>
          <Badge variant="outline">{objection.category || 'General'}</Badge>
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
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full text-left"
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
                          className="w-full min-h-[60px] rounded-md border border-primary/50 bg-muted/10 p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
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

            <Button variant="ghost" size="sm" onClick={handleCopyRebuttal} className="gap-2 mt-1">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy full rebuttal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ObjectionLibraryTab() {
  const { data: versions = [], isLoading } = useObjectionLibrary();
  const [selectedVersion, setSelectedVersion] = useState<ObjectionLibraryVersion | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [personaFilter, setPersonaFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [showNewOnly, setShowNewOnly] = useState(false);

  // Auto-select latest version
  const currentVersion = selectedVersion || versions[0] || null;

  const { personas, categories, filteredObjections, groupedObjections } = useMemo(() => {
    if (!currentVersion?.content_json?.objections) {
      return { personas: [], categories: [], filteredObjections: [], groupedObjections: {} };
    }

    const objections = currentVersion.content_json.objections;
    const allPersonas = [...new Set(objections.flatMap(o => o.personas || []))].sort();
    const allCategories = [...new Set(objections.map(o => o.category || 'Uncategorized'))].sort();

    let filtered = objections;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.objection_text?.toLowerCase().includes(q) ||
        o.rebuttal?.talk_track?.toLowerCase().includes(q) ||
        o.rebuttal?.reframe?.toLowerCase().includes(q) ||
        o.category?.toLowerCase().includes(q)
      );
    }

    // Filters
    if (personaFilter !== 'all') {
      filtered = filtered.filter(o => o.personas?.includes(personaFilter));
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(o => o.category === categoryFilter);
    }
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(o => o.frequency === frequencyFilter);
    }
    if (showNewOnly) {
      filtered = filtered.filter(o => o.is_new_this_week);
    }

    // Group by category
    const grouped = filtered.reduce((acc, objection) => {
      const category = objection.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(objection);
      return acc;
    }, {} as Record<string, Objection[]>);

    return { personas: allPersonas, categories: allCategories, filteredObjections: filtered, groupedObjections: grouped };
  }, [currentVersion, searchQuery, personaFilter, categoryFilter, frequencyFilter, showNewOnly]);

  const hasActiveFilters = searchQuery || personaFilter !== 'all' || categoryFilter !== 'all' || frequencyFilter !== 'all' || showNewOnly;

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
            <div className="text-3xl font-bold text-primary">{content.new_this_week_count || 0}</div>
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
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search objections, rebuttals, categories..."
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

              <div className="flex items-center gap-2">
                <Switch id="obj-new-only" checked={showNewOnly} onCheckedChange={setShowNewOnly} />
                <Label htmlFor="obj-new-only" className="text-xs">New only</Label>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => { setSearchQuery(''); setPersonaFilter('all'); setCategoryFilter('all'); setFrequencyFilter('all'); setShowNewOnly(false); }}
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
        </p>
      )}

      {/* Objections by Category */}
      {Object.entries(groupedObjections).map(([category, objections]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            {category} ({objections.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {objections.map((objection, idx) => (
              <ObjectionCard key={objection.id || `obj-${idx}`} objection={objection} versionId={currentVersion.id} />
            ))}
          </div>
        </div>
      ))}

      {filteredObjections.length === 0 && hasActiveFilters && (
        <div className="text-center py-8 text-muted-foreground">
          No objections match the current filters.
        </div>
      )}
    </div>
  );
}
