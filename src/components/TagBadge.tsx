import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const TAG_EXPLANATIONS: Record<string, string> = {
  ICP_SHIFT: 'Target audience or ICP language changed',
  VALUE_PROP_CHANGE: 'Core value proposition updated',
  CATEGORY_POSITIONING: 'Category positioning shifted',
  PROOF_POINTS: 'Social proof or metrics changed',
  FEATURE_PROMINENCE: 'Feature hierarchy shifted',
  PRICING_PACKAGING: 'Pricing or packaging changed',
  TRUST_RISK: 'Security or trust signals modified',
  AI_REFRAMING: 'AI messaging repositioned',
  CTA_CHANGE: 'CTA strategy changed',
  DESIGN_STRUCTURE: 'Layout changed without messaging shift',
  NOISE: 'Minor insignificant change',
};

export function getTagExplanation(tag: string): string {
  return TAG_EXPLANATIONS[tag] || tag;
}

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  const explanation = getTagExplanation(tag);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs border-[hsl(var(--accent-signal)/0.2)] text-accent-signal/80 font-medium cursor-help hover:border-[hsl(var(--accent-signal)/0.4)] hover:bg-[hsl(var(--accent-signal)/0.05)] transition-colors"
        >
          {tag.replace(/_/g, ' ')}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-card border-border text-foreground">
        <p className="max-w-xs text-sm">{explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function TagLegend() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <HelpCircle className="h-4 w-4" />
      <span>Hover tags for explanations</span>
    </div>
  );
}
