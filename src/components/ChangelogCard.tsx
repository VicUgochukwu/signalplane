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
    <Card className="group rounded-xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{entry.company_name}</h3>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground font-medium">
                {entry.url_type}
              </Badge>
              <TagBadge tag={entry.primary_tag} />
            </div>
          </div>
          <MagnitudeBadge magnitude={entry.change_magnitude} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/80 leading-relaxed">{entry.diff_summary}</p>
        {entry.implication && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/20 pl-3">
            {entry.implication}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <ConfidenceBar confidence={entry.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}
