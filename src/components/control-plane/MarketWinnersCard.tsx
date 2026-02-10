import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock } from 'lucide-react';
import { IconTrophy, IconPersonaRevenue, IconCompany, IconTeam } from '@/components/icons';
import { MarketWinner, WINNER_CATEGORY_CONFIG } from '@/types/controlPlane';

interface MarketWinnersCardProps {
  proven: MarketWinner[];
  emerging: MarketWinner[];
}

const FALLBACK_CATEGORY_CONFIG = { label: 'Other', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };

const WinnerItem = ({ winner, index }: { winner: MarketWinner; index: number }) => {
  const categoryConfig = WINNER_CATEGORY_CONFIG[winner.category] || FALLBACK_CATEGORY_CONFIG;

  return (
    <AccordionItem value={`winner-${index}`} className="border-border/30">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-start gap-3 text-left w-full pr-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-medium text-foreground text-sm">
                {winner.pattern_label}
              </span>
              <Badge
                variant="outline"
                className={`${categoryConfig.bgColor} ${categoryConfig.color} border-transparent text-xs`}
              >
                {categoryConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconCompany className="h-3 w-3" />
                {winner.where_seen.slice(0, 2).join(', ')}
                {winner.where_seen.length > 2 && ` +${winner.where_seen.length - 2}`}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {winner.survival_weeks}w
              </span>
              <span className="flex items-center gap-1">
                <IconTeam className="h-3 w-3" />
                {winner.propagation_count}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-4">
        <div className="space-y-4 pt-2">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              What Changed
            </h4>
            <p className="text-sm text-foreground">{winner.what_changed}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Why It Matters
            </h4>
            <p className="text-sm text-muted-foreground">{winner.why_it_matters}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Implementation Guidance
            </h4>
            <p className="text-sm text-muted-foreground">{winner.implementation_guidance}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {winner.where_seen.map((company) => (
              <Badge
                key={company}
                variant="secondary"
                className="text-xs"
              >
                {company}
              </Badge>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export function MarketWinnersCard({ proven, emerging }: MarketWinnersCardProps) {
  const hasProven = proven.length > 0;
  const hasEmerging = emerging.length > 0;

  if (!hasProven && !hasEmerging) {
    return null;
  }

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <IconTrophy className="h-4 w-4 text-amber-400" />
          Market Winners
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Proven Winners Section */}
        {hasProven && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                Proven Winners
              </Badge>
              <span className="text-xs text-muted-foreground">
                {proven.length} pattern{proven.length !== 1 ? 's' : ''}
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {proven.map((winner, index) => (
                <WinnerItem
                  key={`proven-${index}`}
                  winner={winner}
                  index={index}
                />
              ))}
            </Accordion>
          </div>
        )}

        {/* Emerging Patterns Section */}
        {hasEmerging && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs flex items-center">
                <IconPersonaRevenue className="h-3 w-3 mr-1" />
                Emerging Patterns
              </Badge>
              <span className="text-xs text-muted-foreground">
                {emerging.length} pattern{emerging.length !== 1 ? 's' : ''}
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {emerging.map((winner, index) => (
                <WinnerItem
                  key={`emerging-${index}`}
                  winner={winner}
                  index={index + proven.length}
                />
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
