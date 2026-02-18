import { Calendar, Loader2, Copy, Check, Zap, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketPulse } from '@/hooks/useVocResearch';
import { VOC_TREND_CONFIG } from '@/types/vocResearch';
import type { MarketPulse, RankedEntry, LanguageShift, CriteriaShift } from '@/types/vocResearch';

// âââ MarketPulseView âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function MarketPulseView() {
  const { data: pulses = [], isLoading } = useMarketPulse();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pulses.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No market pulse yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Monthly market pulse reports synthesize top pains, emerging desires,
          language shifts, and criteria shifts across all personas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pulses.map((pulse) => (
        <PulseCard key={pulse.id} pulse={pulse} />
      ))}
    </div>
  );
}

// âââ PulseCard âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function PulseCard({ pulse }: { pulse: MarketPulse }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!pulse.content_md) return;
    await navigator.clipboard.writeText(pulse.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const monthLabel = new Date(pulse.report_month + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const pains = (Array.isArray(pulse.top_pains) ? pulse.top_pains : []) as RankedEntry[];
  const desires = (Array.isArray(pulse.emerging_desires) ? pulse.emerging_desires : []) as RankedEntry[];
  const langShifts = (Array.isArray(pulse.language_shifts) ? pulse.language_shifts : []) as LanguageShift[];
  const critShifts = (Array.isArray(pulse.criteria_shifts) ? pulse.criteria_shifts : []) as CriteriaShift[];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{pulse.title}</CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {monthLabel}
              </div>
              <span>{pains.length} pains</span>
              <span>{desires.length} desires</span>
              <span>{langShifts.length} language shifts</span>
              <span>{critShifts.length} criteria shifts</span>
            </div>
          </div>
          <div className="flex gap-2">
            {pulse.content_md && (
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 gap-1.5">
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-7"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Summary badges */}
      <CardContent className="pt-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {pains.length > 0 && (
            <Badge variant="outline" className="text-xs text-red-400 border-transparent">
              {pains.length} top pains
            </Badge>
          )}
          {desires.length > 0 && (
            <Badge variant="outline" className="text-xs text-emerald-400 border-transparent">
              {desires.length} emerging desires
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Expanded detail */}
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Top Pains */}
          {pains.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                Top Pains
              </h4>
              <div className="space-y-1.5">
                {pains.map((pain, idx) => (
                  <RankedEntryRow key={idx} entry={pain} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Emerging Desires */}
          {desires.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Emerging Desires
              </h4>
              <div className="space-y-1.5">
                {desires.map((desire, idx) => (
                  <RankedEntryRow key={idx} entry={desire} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Language Shifts */}
          {langShifts.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                Language Shifts
              </h4>
              <div className="space-y-1.5">
                {langShifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={`text-xs border-transparent ${
                        shift.direction === 'emerging'
                          ? 'text-red-400 bg-red-500/10'
                          : shift.direction === 'fading'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {shift.direction}
                    </Badge>
                    <span className="text-foreground">{shift.term}</span>
                    {shift.previous_term && (
                      <>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{shift.previous_term}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Criteria Shifts */}
          {critShifts.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Criteria Shifts
              </h4>
              <div className="space-y-1.5">
                {critShifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={`text-xs border-transparent ${
                        shift.direction === 'rising'
                          ? 'text-red-400 bg-red-500/10'
                          : shift.direction === 'falling'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-blue-400 bg-blue-500/10'
                      }`}
                    >
                      {shift.direction}
                    </Badge>
                    <span className="text-foreground">{shift.criterion}</span>
                    {shift.current_rank && (
                      <span className="text-xs text-muted-foreground">
                        #{shift.current_rank}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ({shift.evidence_count} signals)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full markdown content */}
          {pulse.content_md && (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed border-t border-border/50 pt-3">
              {pulse.content_md}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function RankedEntryRow({ entry, rank }: { entry: RankedEntry; rank: number }) {
  const trendConfig = VOC_TREND_CONFIG[entry.trend];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono tabular-nums text-muted-foreground w-5 text-right shrink-0">
        {rank}.
      </span>
      <span className="text-sm text-foreground flex-1 truncate">{entry.text}</span>
      {entry.persona && (
        <span className="text-xs text-muted-foreground shrink-0">{entry.persona}</span>
      )}
      <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
        {entry.frequency}x
      </span>
      <Badge
        variant="outline"
        className={`text-xs ${trendConfig.color} border-transparent shrink-0`}
      >
        {trendConfig.label}
      </Badge>
    </div>
  );
}
