import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, TrendingUp, TrendingDown, Minus, Sparkles, Filter, FileText, ArrowLeft } from 'lucide-react';
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
import type { SwipeFileVersion, SwipePhrase } from '@/types/artifacts';

function PhraseCard({ phrase }: { phrase: SwipePhrase }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const trendIcons = {
    rising: <TrendingUp className="h-4 w-4 text-green-500" />,
    stable: <Minus className="h-4 w-4 text-muted-foreground" />,
    fading: <TrendingDown className="h-4 w-4 text-red-500" />,
  };

  const trendLabels = {
    rising: 'Rising',
    stable: 'Stable',
    fading: 'Fading',
  };

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

  return (
    <Card className="relative group">
      {phrase.is_new_this_week && (
        <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground gap-1">
          <Sparkles className="h-3 w-3" />
          New
        </Badge>
      )}
      <CardContent className="pt-6">
        <blockquote className="text-lg font-medium text-foreground italic border-l-4 border-primary pl-4 mb-4">
          "{phrase.phrase}"
        </blockquote>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{phrase.category}</Badge>
            <Badge variant="secondary">{phrase.persona}</Badge>
            <Badge variant="outline" className="gap-1">
              {trendIcons[phrase.trend]}
              {trendLabels[phrase.trend]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
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
  const [showNewOnly, setShowNewOnly] = useState(false);

  const currentVersion = selectedVersion || versions[0] || null;

  const { personas, categories, filteredPhrases } = useMemo(() => {
    if (!currentVersion?.content_json) {
      return { personas: [], categories: [], filteredPhrases: [] };
    }

    const content = currentVersion.content_json;
    const phrases = content.phrases || [];
    
    const allPersonas = [...new Set(phrases.map(p => p.persona))];
    const allCategories = [...new Set(phrases.map(p => p.category))];

    let filtered = phrases;
    if (personaFilter !== 'all') {
      filtered = filtered.filter(p => p.persona === personaFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    if (showNewOnly) {
      filtered = filtered.filter(p => p.is_new_this_week);
    }

    return {
      personas: allPersonas,
      categories: allCategories,
      filteredPhrases: filtered,
    };
  }, [currentVersion, personaFilter, categoryFilter, showNewOnly]);

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Personas" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Personas</SelectItem>
                {personas.map(persona => (
                  <SelectItem key={persona} value={persona}>{persona}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="new-only"
                checked={showNewOnly}
                onCheckedChange={setShowNewOnly}
              />
              <Label htmlFor="new-only" className="text-sm">New only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phrases Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPhrases.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>

      {filteredPhrases.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No phrases match the current filters.
        </div>
      )}
    </div>
  );
}
