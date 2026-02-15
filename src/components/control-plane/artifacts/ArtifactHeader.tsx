import { format, parseISO } from 'date-fns';
import { Copy, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Version {
  id: string;
  week_start: string;
  week_end: string;
  created_at: string;
}

interface ArtifactHeaderProps {
  title: string;
  versions: Version[];
  selectedVersion: Version | null;
  onVersionSelect: (version: Version) => void;
  markdownContent: string;
  /** Optional: count of new items in the current version (e.g., "3 new objections") */
  newItemCount?: number;
  /** Optional: label for new items (e.g., "objections", "phrases") */
  newItemLabel?: string;
}

export function ArtifactHeader({
  title,
  versions,
  selectedVersion,
  onVersionSelect,
  markdownContent,
  newItemCount,
  newItemLabel,
}: ArtifactHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    try {
      const start = parseISO(weekStart);
      const end = parseISO(weekEnd);
      return `Week of ${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch {
      return 'Unknown week';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Unknown';
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Markdown copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const isLatest = selectedVersion && versions.length > 0 && selectedVersion.id === versions[0].id;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {isLatest && (
            <Badge variant="outline" className="border-primary/50 text-primary text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Latest
            </Badge>
          )}
        </div>
        {selectedVersion && (
          <>
            <p className="text-lg text-muted-foreground">
              {formatWeekRange(selectedVersion.week_start, selectedVersion.week_end)}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Last updated: {formatTimestamp(selectedVersion.created_at)}
              </p>
              {newItemCount !== undefined && newItemCount > 0 && newItemLabel && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  {newItemCount} new {newItemLabel} since last week
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-between">
              {selectedVersion
                ? formatWeekRange(selectedVersion.week_start, selectedVersion.week_end).replace('Week of ', '')
                : 'Select version'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[260px] bg-popover">
            {versions.map((version, idx) => (
              <DropdownMenuItem
                key={version.id}
                onClick={() => onVersionSelect(version)}
                className={cn(
                  "cursor-pointer flex items-center justify-between",
                  selectedVersion?.id === version.id && "bg-primary/10 text-primary"
                )}
              >
                <span>{formatWeekRange(version.week_start, version.week_end)}</span>
                {idx === 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-2 border-primary/50 text-primary">
                    Latest
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyMarkdown}
          className="gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy as Markdown
        </Button>
      </div>
    </div>
  );
}
