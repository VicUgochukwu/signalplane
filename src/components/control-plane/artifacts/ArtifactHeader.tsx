import { format, parseISO } from 'date-fns';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

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
}

export function ArtifactHeader({
  title,
  versions,
  selectedVersion,
  onVersionSelect,
  markdownContent,
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {selectedVersion && (
          <>
            <p className="text-lg text-muted-foreground">
              {formatWeekRange(selectedVersion.week_start, selectedVersion.week_end)}
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {formatTimestamp(selectedVersion.created_at)}
            </p>
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
          <DropdownMenuContent align="end" className="w-[220px] bg-popover">
            {versions.map((version) => (
              <DropdownMenuItem
                key={version.id}
                onClick={() => onVersionSelect(version)}
                className="cursor-pointer"
              >
                {formatWeekRange(version.week_start, version.week_end)}
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
