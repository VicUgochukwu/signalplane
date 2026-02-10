import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Building2, TrendingUp, Tag } from 'lucide-react';
import { ChangelogCard } from './ChangelogCard';
import type { ChangelogEntry } from '@/types/changelog';

interface WeeklyPacketProps {
  packet: {
    weekStart: string;
    totalChanges: number;
    companies: string[];
    topTags: string[];
    magnitudeCounts: Record<string, number>;
    entries: ChangelogEntry[];
  };
}

export function WeeklyPacket({ packet }: WeeklyPacketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formattedDate = format(parseISO(packet.weekStart), 'MMMM d, yyyy');

  const getMagnitudeColor = (magnitude: string) => {
    switch (magnitude) {
      case 'major':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'minor':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30';
    }
  };

  return (
    <Card className="bg-muted border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Week of {formattedDate}
            </h2>
            <p className="text-sm text-muted-foreground">
              {packet.totalChanges} changes across {packet.companies.length} companies
            </p>
          </div>
          <div className="flex gap-2">
            {packet.magnitudeCounts.major > 0 && (
              <Badge className={getMagnitudeColor('major')}>
                {packet.magnitudeCounts.major} major
              </Badge>
            )}
            {packet.magnitudeCounts.moderate > 0 && (
              <Badge className={getMagnitudeColor('moderate')}>
                {packet.magnitudeCounts.moderate} moderate
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Companies</p>
              <p className="text-sm text-foreground/80">{packet.companies.slice(0, 3).join(', ')}{packet.companies.length > 3 && ` +${packet.companies.length - 3}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Categories</p>
              <p className="text-sm text-foreground/80">{packet.topTags.join(', ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Signal Strength</p>
              <div className="flex gap-1 mt-1">
                {[...Array(Math.min(5, Math.ceil(packet.magnitudeCounts.major * 2 + packet.magnitudeCounts.moderate)))].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-emerald-500" />
                ))}
                {[...Array(Math.max(0, 5 - Math.ceil(packet.magnitudeCounts.major * 2 + packet.magnitudeCounts.moderate)))].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-muted" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
              {isOpen ? 'Hide details' : 'View all changes'}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packet.entries.map((entry, index) => (
                <ChangelogCard key={`${entry.company_slug}-${index}`} entry={entry} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
