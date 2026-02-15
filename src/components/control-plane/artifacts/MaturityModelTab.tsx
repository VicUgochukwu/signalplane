import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Check,
  TrendingUp,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Phone,
  PhoneOff,
} from 'lucide-react';
import { useMaturityModel } from '@/hooks/useArtifacts';
import { useRecordArtifactEdit } from '@/hooks/useArtifactEdits';
import { ArtifactHeader } from './ArtifactHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { MaturityModelVersion, MaturityDimension, MaturityStage } from '@/types/artifacts';
import { cn } from '@/lib/utils';

// Stage color scheme: 1=red (ad hoc), 2=amber (functional), 3=blue (systematic), 4=green (predictive)
const STAGE_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50',
  2: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  3: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  4: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
};

const STAGE_BG: Record<number, string> = {
  1: 'border-l-red-400',
  2: 'border-l-amber-400',
  3: 'border-l-blue-400',
  4: 'border-l-emerald-400',
};

function StageCard({ stage, dimensionLabel, dimensionId, versionId, callMode = false }: {
  stage: MaturityStage;
  dimensionLabel: string;
  dimensionId: string;
  versionId: string;
  callMode?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const recordEdit = useRecordArtifactEdit();

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = (field: string, original: string, artifactType: 'maturity_stage_talk_track' | 'maturity_stage_reframe') => {
    if (editValue.trim() && editValue !== original) {
      recordEdit.mutate({
        artifactType,
        artifactVersionId: versionId,
        sectionKey: `${dimensionId}.stage_${stage.stage_number}.${field}`,
        originalContent: original,
        editedContent: editValue,
        editType: 'modify',
      });
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCopyStage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const stageText = `**Stage ${stage.stage_number}: ${stage.name}** (${dimensionLabel})

${stage.description}

**What Works:** ${stage.what_works}

**What Breaks:** ${stage.what_breaks}

**Trigger to Next Stage:** ${stage.trigger_to_next}

**Discovery Questions:**
${stage.discovery_questions.map(q => `- ${q}`).join('\n')}

**Talk Track:**
${stage.talk_track}${
  stage.objection_reframes.length > 0
    ? `\n\n**Objection Reframes:**\n${stage.objection_reframes
        .map(r => `- "${r.original_objection}" → ${r.readiness_reframe}`)
        .join('\n')}`
    : ''
}`;

    try {
      await navigator.clipboard.writeText(stageText);
      setCopied(true);
      toast({ title: 'Copied!', description: `Stage ${stage.stage_number} copied to clipboard` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  // Call Mode: flat, scannable — talk track, discovery questions, objection reframes only
  if (callMode) {
    return (
      <div className={cn('border-l-4 rounded-lg p-4 space-y-3', STAGE_BG[stage.stage_number], 'bg-muted/10')}>
        <div className="flex items-center gap-2">
          <Badge className={cn('font-mono text-xs', STAGE_COLORS[stage.stage_number])}>
            Stage {stage.stage_number}
          </Badge>
          <h4 className="font-bold text-sm text-foreground">{stage.name}</h4>
        </div>

        {/* Discovery Questions — quick stage identification */}
        {stage.discovery_questions?.length > 0 && (
          <div className="space-y-1">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ask</h5>
            {stage.discovery_questions.map((q, idx) => (
              <p key={idx} className="text-sm text-foreground/80 italic">&ldquo;{q}&rdquo;</p>
            ))}
          </div>
        )}

        {/* Talk Track — the main thing they need */}
        {stage.talk_track && (
          <div className="space-y-1">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Talk Track</h5>
            <p className="text-sm text-foreground leading-relaxed">{stage.talk_track}</p>
          </div>
        )}

        {/* Objection Reframes — quick reference */}
        {stage.objection_reframes?.length > 0 && (
          <div className="space-y-1.5">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">If They Say</h5>
            {stage.objection_reframes.map((reframe, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium text-foreground">&ldquo;{reframe.original_objection}&rdquo;</span>
                <span className="text-muted-foreground"> → </span>
                <span className="text-primary">{reframe.readiness_reframe}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('border-l-4 transition-all', STAGE_BG[stage.stage_number])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-start gap-2 flex-1 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={cn('font-mono text-xs', STAGE_COLORS[stage.stage_number])}>
                  Stage {stage.stage_number}
                </Badge>
                <h4 className="font-bold text-base text-foreground">{stage.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </div>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyStage}
            className="shrink-0 h-8 w-8 p-0"
            title="Copy stage details"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* What Works / What Breaks */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 rounded-md bg-green-50/50 dark:bg-green-950/20 p-3 border border-green-200/50 dark:border-green-800/30">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                What Works
              </p>
              <p className="text-sm text-foreground/80">{stage.what_works}</p>
            </div>
            <div className="space-y-1 rounded-md bg-red-50/50 dark:bg-red-950/20 p-3 border border-red-200/50 dark:border-red-800/30">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                What Breaks
              </p>
              <p className="text-sm text-foreground/80">{stage.what_breaks}</p>
            </div>
          </div>

          {/* Trigger to Next Stage */}
          {stage.trigger_to_next && (
            <div className="space-y-1 rounded-md bg-amber-50/50 dark:bg-amber-950/20 p-3 border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Trigger to Next Stage
              </p>
              <p className="text-sm text-foreground/80">{stage.trigger_to_next}</p>
            </div>
          )}

          {/* Discovery Questions */}
          {stage.discovery_questions?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Discovery Questions
              </p>
              <ul className="space-y-1.5">
                {stage.discovery_questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5 shrink-0">{idx + 1}.</span>
                    <span className="text-muted-foreground italic">&ldquo;{q}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Talk Track (editable) */}
          {stage.talk_track && (
            <div className="space-y-1 group/talk">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Talk Track
                </p>
                {!editingField && (
                  <button
                    onClick={() => startEdit('talk_track', stage.talk_track)}
                    className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover/talk:opacity-100 transition-opacity"
                    title="Edit talk track"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
              {editingField === 'talk_track' ? (
                <div>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full min-h-[80px] rounded-md border border-primary/50 bg-muted/10 p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 leading-relaxed"
                    autoFocus
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => saveEdit('talk_track', stage.talk_track, 'maturity_stage_talk_track')}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 border border-border/50 leading-relaxed">
                  {stage.talk_track}
                </p>
              )}
            </div>
          )}

          {/* Objection Reframes (editable) */}
          {stage.objection_reframes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Objection Reframes
              </p>
              {stage.objection_reframes.map((reframe, idx) => {
                const reframeFieldKey = `reframe_${idx}`;
                return (
                  <div
                    key={idx}
                    className="bg-muted/20 rounded-md p-3 border border-border/30 space-y-1.5 group/reframe"
                  >
                    <p className="text-sm font-medium text-foreground">
                      &ldquo;{reframe.original_objection}&rdquo;
                    </p>
                    {editingField === reframeFieldKey ? (
                      <div>
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full min-h-[60px] rounded-md border border-primary/50 bg-muted/10 p-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 leading-relaxed"
                          autoFocus
                        />
                        <div className="flex gap-1.5 mt-1.5">
                          <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => saveEdit(reframeFieldKey, reframe.readiness_reframe, 'maturity_stage_reframe')}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-muted-foreground flex-1">
                          <span className="font-medium text-primary">Reframe: </span>
                          {reframe.readiness_reframe}
                        </p>
                        {!editingField && (
                          <button
                            onClick={() => startEdit(reframeFieldKey, reframe.readiness_reframe)}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover/reframe:opacity-100 transition-opacity shrink-0"
                            title="Edit reframe"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Swipe Phrases */}
          {stage.swipe_phrases?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Buyer Language at This Stage
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stage.swipe_phrases.map((phrase, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-normal">
                    &ldquo;{phrase}&rdquo;
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DimensionView({ dimension, versionId, callMode = false }: { dimension: MaturityDimension; versionId: string; callMode?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Layers className="h-5 w-5 text-primary" />
        <h3 className={cn("font-bold text-foreground", callMode ? "text-base" : "text-lg")}>{dimension.label}</h3>
        {!callMode && (
          <Badge variant="outline" className="text-xs ml-auto">
            {dimension.stages.length} stages
          </Badge>
        )}
      </div>

      <div className="grid gap-3">
        {dimension.stages
          .sort((a, b) => a.stage_number - b.stage_number)
          .map((stage) => (
            <StageCard
              key={stage.stage_number}
              stage={stage}
              dimensionLabel={dimension.label}
              dimensionId={dimension.id}
              versionId={versionId}
              callMode={callMode}
            />
          ))}
      </div>
    </div>
  );
}

export function MaturityModelTab() {
  const { data: versions = [], isLoading } = useMaturityModel();
  const [selectedVersion, setSelectedVersion] = useState<MaturityModelVersion | null>(null);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [callMode, setCallMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const currentVersion = selectedVersion || versions[0] || null;
  const content = currentVersion?.content_json;

  // Filter dimensions by search
  const filteredDimensions = useMemo(() => {
    if (!content?.dimensions) return [];
    if (!searchQuery.trim()) return content.dimensions;

    const query = searchQuery.toLowerCase();
    return content.dimensions.filter(
      (dim) =>
        dim.label?.toLowerCase().includes(query) ||
        dim.stages?.some(
          (stage) =>
            stage.name?.toLowerCase().includes(query) ||
            stage.description?.toLowerCase().includes(query) ||
            stage.talk_track?.toLowerCase().includes(query)
        )
    );
  }, [content, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentVersion) {
    return (
      <div className="text-center py-12 space-y-4">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <div className="space-y-2">
          <p className="text-foreground font-medium">No maturity model data yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Once the monthly Maturity Model Generator runs, this tab will display a 4-stage
            capability progression. Buyers self-identify their stage and see the path forward.
            No competitor names, no political risk.
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

  const handleCopyModel = async () => {
    try {
      await navigator.clipboard.writeText(currentVersion.content_md);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Maturity model copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Call Mode Toggle — always visible */}
      <div className="flex items-center justify-end">
        <Button
          variant={callMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCallMode(!callMode)}
          className={cn(
            "gap-2 shrink-0",
            callMode && "bg-primary text-primary-foreground"
          )}
        >
          {callMode ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          {callMode ? 'Exit Call Mode' : 'Call Mode'}
        </Button>
      </div>

      {/* Header with version selector — hidden in call mode */}
      {!callMode && (
        <ArtifactHeader
          title={content?.title || 'Maturity Model'}
          versions={versions}
          selectedVersion={currentVersion}
          onVersionSelect={(v) =>
            setSelectedVersion(versions.find((ver) => ver.id === v.id) || null)
          }
          markdownContent={currentVersion.content_md}
        />
      )}

      {/* Call mode header */}
      {callMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Quick Reference: {content?.title || 'Maturity Model'}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyModel} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>
      )}

      {/* Summary Cards — hidden in call mode */}
      {!callMode && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">
                {content?.dimensions?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Capability Dimensions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">4</div>
              <p className="text-sm text-muted-foreground">Stages per Dimension</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Ad Hoc &rarr; Functional &rarr; Systematic &rarr; Predictive
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-0.5">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">
                    {content?.generation_metadata?.signal_count || 0}
                  </span>{' '}
                  <span className="text-muted-foreground">signals</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-foreground">
                    {content?.generation_metadata?.objection_count || 0}
                  </span>{' '}
                  <span className="text-muted-foreground">objections</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-foreground">
                    {content?.generation_metadata?.swipe_phrase_count || 0}
                  </span>{' '}
                  <span className="text-muted-foreground">swipe phrases</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sourced from existing artifacts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls row: search + internal view toggle — hidden in call mode */}
      {!callMode && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search dimensions, stages, talk tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 rounded-lg border border-border/50 bg-muted/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="show-competitors"
                  checked={showCompetitors}
                  onCheckedChange={setShowCompetitors}
                />
                <Label htmlFor="show-competitors" className="text-sm cursor-pointer flex items-center gap-1.5">
                  {showCompetitors ? (
                    <Eye className="h-4 w-4 text-amber-500" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  Internal View
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search results count — hidden in call mode */}
      {!callMode && searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredDimensions.length} of {content?.dimensions?.length || 0} dimensions
        </p>
      )}

      {/* Dimensions with stages */}
      <div className={callMode ? "space-y-6" : "space-y-8"}>
        {filteredDimensions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? `No dimensions match "${searchQuery}"`
              : 'No dimensions in this maturity model'}
          </div>
        ) : (
          filteredDimensions.map((dimension) => (
            <DimensionView key={dimension.id} dimension={dimension} versionId={currentVersion.id} callMode={callMode} />
          ))
        )}
      </div>

      {/* Competitor Stage Mapping — Internal Only, hidden in call mode */}
      {!callMode &&
        showCompetitors &&
        content?.competitor_mapping &&
        content.competitor_mapping.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <EyeOff className="h-4 w-4" />
                Competitor Stage Mapping (Internal Only - Never Show to Buyers)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {content.competitor_mapping.map((position, idx) => {
                  const dimension = content.dimensions.find(
                    (d) => d.id === position.dimension_id
                  );
                  const stageName =
                    dimension?.stages.find((s) => s.stage_number === position.stage_number)
                      ?.name || `Stage ${position.stage_number}`;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm p-2.5 bg-background rounded-md border border-border/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-semibold text-foreground truncate">
                          {position.competitor_name}
                        </span>
                        <span className="text-muted-foreground/50">&rarr;</span>
                        <span className="text-muted-foreground truncate">
                          {dimension?.label || position.dimension_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={cn(
                            'text-xs',
                            STAGE_COLORS[position.stage_number] || ''
                          )}
                        >
                          {stageName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {position.confidence}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
