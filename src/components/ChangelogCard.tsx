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
    <Card className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-100">{entry.company_name}</h3>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                {entry.url_type}
              </Badge>
              <TagBadge tag={entry.primary_tag} />
            </div>
          </div>
          <MagnitudeBadge magnitude={entry.change_magnitude} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-300 leading-relaxed">{entry.diff_summary}</p>
        {entry.implication && (
          <p className="text-sm text-zinc-400 italic">{entry.implication}</p>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500">Confidence</span>
          <ConfidenceBar confidence={entry.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}
