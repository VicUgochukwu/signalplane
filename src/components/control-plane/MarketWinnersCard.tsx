import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Minus, TrendingDown, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { IconTrophy, IconCompany, IconTeam } from '@/components/icons';
import { MarketWinner, WINNER_CATEGORY_CONFIG, WinnerTrend } from '@/types/controlPlane';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MarketWinnersCardProps {
  proven: MarketWinner[];
  emerging: MarketWinner[];
}

const FALLBACK_CATEGORY_CONFIG = { label: 'Other', color: 'text-muted-foreground', bgColor: 'bg-muted-foreground/20' };

const TREND_CONFIG: Record<WinnerTrend, { icon: typeof TrendingUp; label: string; color: string }> = {
  accelerating: { icon: TrendingUp, label: 'Accelerating', color: 'text-emerald-400' },
  stable: { icon: Minus, label: 'Stable', color: 'text-muted-foreground' },
  fading: { icon: TrendingDown, label: 'Fading', color: 'text-rose-400' },
};

const WinnerRow = ({ winner, tierLabel }: { winner: MarketWinner; tierLabel: 'proven' | 'emerging' }) => {
  const [expanded, setExpanded] = useState(false);
  const categoryConfig = WINNER_CATEGORY_CONFIG[winner.category] || FALLBACK_CATEGORY_CONFIG;
  const trendConfig = winner.trend ? TREND_CONFIG[winner.trend] : null;
  const TrendIcon = trendConfig?.icon || null;
  const { toast } = useToast();

  const handleActOnThis = () => {
    toast({
      title: 'Sent to Action Board',
      description: `"${winner.pattern_label}" added to your inbox for triage.`,
    });
  };

  return (
    <div className={cn(
      "rounded-lg border transition-colors",
      tierLabel === 'proven'
        ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
        : 'border-amber-500/20 bg-amber-500/[0.03]',
    )}>
      {/* Compact row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          {/* Line 1: label + category + trend */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm text-foreground">
              {winner.pattern_label}
            </span>
            <Badge
              variant="outline"
              className={`${categoryConfig.bgColor} ${categoryConfig.color} border-transparent text-[10px] px-1.5 py-0`}
            >
              {categoryConfig.label}
            </Badge>
            {trendConfig && TrendIcon && (
              <span className={`flex items-center gap-0.5 text-[10px] ${trendConfig.color}`}>
                <TrendIcon className="h-3 w-3" />
                {trendConfig.label}
              </span>
            )}
          </div>

          {/* Line 2: metadata chips */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconCompany className="h-3 w-3" />
              {winner.where_seen.slice(0, 3).join(', ')}
              {winner.where_seen.length > 3 && ` +${winner.where_seen.length - 3}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {winner.survival_weeks}w
            </span>
            <span className="flex items-center gap-1">
              <IconTeam className="h-3 w-3" />
              {winner.propagation_count} adopted
            </span>
          </div>

          {/* Line 3: gap indicator — the punch line */}
          {winner.your_gap && (
            <p className="text-xs font-medium text-rose-400 mt-1.5">
              {winner.your_gap}
            </p>
          )}
        </div>

        {/* Expand chevron */}
        <div className="shrink-0 mt-1 text-muted-foreground/50">
          {expanded
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
          }
        </div>
      </button>

      {/* Expanded detail — what changed + why + act */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
          <p className="text-sm text-foreground">{winner.what_changed}</p>
          {winner.why_it_matters && (
            <p className="text-sm text-muted-foreground">{winner.why_it_matters}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleActOnThis(); }}
              className="h-7 text-xs gap-1.5"
            >
              <Plus className="h-3 w-3" />
              Send to Action Board
            </Button>
            <div className="flex flex-wrap gap-1 ml-auto">
              {winner.where_seen.map((company) => (
                <Badge key={company} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {company}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function MarketWinnersCard({ proven, emerging }: MarketWinnersCardProps) {
  const hasProven = proven.length > 0;
  const hasEmerging = emerging.length > 0;

  if (!hasProven && !hasEmerging) {
    return null;
  }

  const totalPatterns = proven.length + emerging.length;
  const gapCount = [...proven, ...emerging].filter(w => w.your_gap).length;

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <IconTrophy className="h-4 w-4 text-amber-400" />
            What&apos;s Winning in Your Market
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">
              {totalPatterns} pattern{totalPatterns !== 1 ? 's' : ''}
            </Badge>
            {gapCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-400 border-rose-500/20 bg-rose-500/10">
                {gapCount} gap{gapCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proven Winners */}
        {hasProven && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                Proven
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Survived 8+ weeks, adopted by multiple competitors
              </span>
            </div>
            {proven.map((winner, idx) => (
              <WinnerRow key={`proven-${idx}`} winner={winner} tierLabel="proven" />
            ))}
          </div>
        )}

        {/* Emerging Patterns */}
        {hasEmerging && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0">
                Emerging
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Early signals — monitor for confirmation
              </span>
            </div>
            {emerging.map((winner, idx) => (
              <WinnerRow key={`emerging-${idx}`} winner={winner} tierLabel="emerging" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
