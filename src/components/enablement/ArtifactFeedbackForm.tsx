import { useState } from 'react';
import { Star, Loader2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { useEnablement, type ArtifactType } from '@/hooks/useEnablement';

// âââ Star Rating ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function StarRating({
  value,
  onChange,
  max = 5,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-muted-foreground ml-2">
          {value}/{max}
        </span>
      )}
    </div>
  );
}

// âââ Tag Input ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const cleaned = input.trim().replace(/,+$/, '');
      if (cleaned && !tags.includes(cleaned)) {
        onAdd(cleaned);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-xs gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type and press Enter to add'}
        className="bg-background/50 border-border/50 text-sm"
      />
    </div>
  );
}

// âââ Artifact Type Labels âââââââââââââââââââââââââââââââââââââââââââââââââââââ

const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  battlecard: 'Battlecard',
  objection_library: 'Objection Library',
  swipe_file: 'Swipe File',
  maturity_model: 'Maturity Model',
  deal_brief: 'Deal Brief',
  scorecard: 'Scorecard',
};

// âââ Props ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface ArtifactFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill: which artifact type */
  artifactType?: ArtifactType;
  /** Pre-fill: specific artifact ID */
  artifactId?: string;
  /** Pre-fill: competitor name */
  competitorName?: string;
  /** Pre-fill: delivery ID that triggered this feedback */
  deliveryId?: string;
}

// âââ Component ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function ArtifactFeedbackForm({
  open,
  onOpenChange,
  artifactType: prefillArtifactType,
  artifactId,
  competitorName: prefillCompetitor,
  deliveryId,
}: ArtifactFeedbackFormProps) {
  const { submitFeedback } = useEnablement();

  // Form state
  const [artifactType, setArtifactType] = useState<ArtifactType | ''>(
    prefillArtifactType || ''
  );
  const [rating, setRating] = useState(0);
  const [usefulSections, setUsefulSections] = useState<string[]>([]);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [comments, setComments] = useState('');

  const resetForm = () => {
    setArtifactType(prefillArtifactType || '');
    setRating(0);
    setUsefulSections([]);
    setMissingItems([]);
    setComments('');
  };

  const handleSubmit = async () => {
    if (!artifactType || rating === 0) return;

    await submitFeedback.mutateAsync({
      artifactType,
      rating,
      deliveryId,
      artifactId,
      competitorName: prefillCompetitor,
      usefulSections: usefulSections.length > 0 ? usefulSections : undefined,
      missingItems: missingItems.length > 0 ? missingItems : undefined,
      comments: comments.trim() || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const canSubmit = artifactType !== '' && rating > 0 && !submitFeedback.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-400" />
            Rate this artifact
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us improve the intelligence artifacts we generate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Artifact Type */}
          {!prefillArtifactType && (
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
          )}

          {/* Pre-filled context */}
          {prefillArtifactType && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                {ARTIFACT_TYPE_LABELS[prefillArtifactType]}
              </Badge>
              {prefillCompetitor && (
                <span className="text-muted-foreground">
                  for {prefillCompetitor}
                </span>
              )}
            </div>
          )}

          {/* Star Rating */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Overall Rating *
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Useful Sections */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              What was useful?
            </label>
            <TagInput
              tags={usefulSections}
              onAdd={(t) => setUsefulSections((prev) => [...prev, t])}
              onRemove={(t) => setUsefulSections((prev) => prev.filter((x) => x !== t))}
              placeholder="e.g., talk tracks, pricing comparison, landmines"
            />
          </div>

          {/* Missing Items */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              What was missing?
            </label>
            <TagInput
              tags={missingItems}
              onAdd={(t) => setMissingItems((prev) => [...prev, t])}
              onRemove={(t) => setMissingItems((prev) => prev.filter((x) => x !== t))}
              placeholder="e.g., ROI data, integration details, case studies"
            />
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Additional comments
            </label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any other feedback on this artifactâ¦"
              className="min-h-[80px] bg-background/50 border-border/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitFeedback.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Star className="h-4 w-4 mr-1.5" />
            )}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { StarRating, ARTIFACT_TYPE_LABELS };
