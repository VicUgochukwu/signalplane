import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Sparkles, MessageSquareQuote, ArrowLeft } from 'lucide-react';
import { useObjectionLibrary } from '@/hooks/useArtifacts';
import { ArtifactHeader } from './ArtifactHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { ObjectionLibraryVersion, Objection } from '@/types/artifacts';

function ObjectionCard({ objection }: { objection: Objection }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const frequencyColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const handleCopyRebuttal = async () => {
    const rebuttalText = `**Acknowledge:** ${objection.rebuttal.acknowledge}

**Reframe:** ${objection.rebuttal.reframe}

**Proof:** ${objection.rebuttal.proof}

**Talk Track:** ${objection.rebuttal.talk_track}`;

    try {
      await navigator.clipboard.writeText(rebuttalText);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Rebuttal copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

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
          <Badge className={frequencyColors[objection.frequency]}>
            {objection.frequency} frequency
          </Badge>
          <Badge variant="outline">{objection.category}</Badge>
        </div>
        <CardTitle className="text-base font-medium leading-relaxed">
          "{objection.objection_text}"
        </CardTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {objection.personas.map((persona) => (
            <Badge key={persona} variant="secondary" className="text-xs">
              {persona}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold text-foreground">Acknowledge: </span>
            <span className="text-muted-foreground">{objection.rebuttal.acknowledge}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Reframe: </span>
            <span className="text-muted-foreground">{objection.rebuttal.reframe}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Proof: </span>
            <span className="text-muted-foreground">{objection.rebuttal.proof}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Talk Track: </span>
            <span className="text-muted-foreground">{objection.rebuttal.talk_track}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopyRebuttal} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy rebuttal
        </Button>
      </CardContent>
    </Card>
  );
}

export function ObjectionLibraryTab() {
  const { data: versions = [], isLoading } = useObjectionLibrary();
  const [selectedVersion, setSelectedVersion] = useState<ObjectionLibraryVersion | null>(null);

  // Auto-select latest version
  const currentVersion = selectedVersion || versions[0] || null;

  const groupedObjections = useMemo(() => {
    if (!currentVersion?.content_json?.objections) return {};
    return currentVersion.content_json.objections.reduce((acc, objection) => {
      const category = objection.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(objection);
      return acc;
    }, {} as Record<string, Objection[]>);
  }, [currentVersion]);

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
            Once the Buyer Resistance Monitor runs its weekly analysis, this tab will display buyer objections ranked by frequency with full rebuttal frameworks: acknowledge, reframe, proof, and talk track. Tagged by persona and category.
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

      {/* Objections by Category */}
      {Object.entries(groupedObjections).map(([category, objections]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            {category} ({objections.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {objections.map((objection) => (
              <ObjectionCard key={objection.id} objection={objection} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
