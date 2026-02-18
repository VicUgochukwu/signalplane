import { useState } from 'react';
import { Link2, Unlink, Plus, Loader2, FileText, Shield, MessageSquare, Layers, Briefcase, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEnablement, type ArtifactType, type DealArtifactLink } from '@/hooks/useEnablement';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ARTIFACT_TYPE_LABELS } from './ArtifactFeedbackForm';

// âââ Config âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const ARTIFACT_ICON: Record<ArtifactType, React.ComponentType<{ className?: string }>> = {
  battlecard: Shield,
  objection_library: MessageSquare,
  swipe_file: FileText,
  maturity_model: Layers,
  deal_brief: Briefcase,
  scorecard: BarChart3,
};

const ARTIFACT_COLOR: Record<ArtifactType, string> = {
  battlecard: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  objection_library: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  swipe_file: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  maturity_model: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  deal_brief: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  scorecard: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

// âââ Props ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface DealArtifactLinkerProps {
  dealId: string;
  dealName?: string;
}

// âââ Component ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function DealArtifactLinker({ dealId, dealName }: DealArtifactLinkerProps) {
  const { linkArtifactToDeal, unlinkArtifactFromDeal, useDealArtifacts } = useEnablement();
  const { data: linkedArtifacts, isLoading } = useDealArtifacts(dealId);
  const { competitors } = useOnboarding();

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [artifactType, setArtifactType] = useState<ArtifactType | ''>('');
  const [competitorName, setCompetitorName] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setArtifactType('');
    setCompetitorName('');
    setNotes('');
  };

  const handleLink = async () => {
    if (!artifactType) return;

    await linkArtifactToDeal.mutateAsync({
      dealId,
      artifactType,
      competitorName: competitorName || undefined,
      notes: notes.trim() || undefined,
    });

    resetForm();
    setLinkDialogOpen(false);
  };

  const handleUnlink = async (linkId: string) => {
    await unlinkArtifactFromDeal.mutateAsync(linkId);
  };

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Linked Artifacts
            {dealName && (
              <span className="normal-case font-normal text-muted-foreground">
                â {dealName}
              </span>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLinkDialogOpen(true)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !linkedArtifacts || linkedArtifacts.length === 0 ? (
          <div className="text-center py-6">
            <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No artifacts linked to this deal yet.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Link battlecards, objection libraries, and other artifacts to track what&apos;s used in this deal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedArtifacts.map((link: DealArtifactLink) => {
              const type = link.artifact_type as ArtifactType;
              const Icon = ARTIFACT_ICON[type] || FileText;
              const colorClass = ARTIFACT_COLOR[type] || 'text-muted-foreground bg-muted/20';

              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-md border ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {ARTIFACT_TYPE_LABELS[type] || type}
                        </span>
                        {link.competitor_name && (
                          <Badge variant="outline" className="text-xs">
                            {link.competitor_name}
                          </Badge>
                        )}
                      </div>
                      {link.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {link.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Linked {new Date(link.linked_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnlink(link.id)}
                    disabled={unlinkArtifactFromDeal.isPending}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* âââ Link Dialog ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Link Artifact to Deal
            </DialogTitle>
            <DialogDescription>
              Connect an enablement artifact to this deal for tracking and correlation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Artifact Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Artifact Type *
              </label>
              <Select
                value={artifactType}
                onValueChange={(v) => setArtifactType(v as ArtifactType)}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Select artifact type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ARTIFACT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competitor */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Competitor
              </label>
              <Select
                value={competitorName}
                onValueChange={setCompetitorName}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Select competitor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {(competitors || []).map((c) => (
                    <SelectItem key={c.id} value={c.competitor_name}>
                      {c.competitor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why are you linking this? (e.g., 'Used talk tracks in demo call')"
                className="min-h-[60px] bg-background/50 border-border/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                resetForm();
                setLinkDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={!artifactType || linkArtifactToDeal.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {linkArtifactToDeal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Link2 className="h-4 w-4 mr-1.5" />
              )}
              Link Artifact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
