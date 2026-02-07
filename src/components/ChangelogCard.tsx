import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagnitudeBadge } from './MagnitudeBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { TagBadge } from './TagBadge';
import { ExternalLink } from 'lucide-react';
import type { ChangelogEntry } from '@/types/changelog';

interface ChangelogCardProps {
  entry: ChangelogEntry;
}

export function ChangelogCard({ entry }: ChangelogCardProps) {
  return (
    <Card className="card-terminal hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-semibold text-foreground">{entry.company_name}</h3>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-border text-muted-foreground font-mono">
                {entry.url_type}
              </Badge>
              <TagBadge tag={entry.primary_tag} />
            </div>
          </div>
          <MagnitudeBadge magnitude={entry.change_magnitude} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{entry.diff_summary}</p>
        {entry.implication && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
            {entry.implication}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-mono">Confidence</span>
          <ConfidenceBar confidence={entry.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}
