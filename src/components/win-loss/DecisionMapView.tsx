import { Map, Loader2, Calendar, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWinLossDecisionMaps } from '@/hooks/useWinLoss';
import type { WinLossDecisionMap, DecisionCriterion, UnmetNeed } from '@/types/winloss';

// âââ DecisionMapView âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function DecisionMapView() {
  const { data: maps = [], isLoading } = useWinLossDecisionMaps();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (maps.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Map className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No decision maps yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Quarterly category decision maps synthesize buyer decision criteria, which products
          own which criteria, and where criteria are shifting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {maps.map((map) => (
        <DecisionMapCard key={map.id} map={map} />
      ))}
    </div>
  );
}

// âââ DecisionMapCard âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function DecisionMapCard({ map }: { map: WinLossDecisionMap }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!map.content_md) return;
    await navigator.clipboard.writeText(map.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const criteria: DecisionCriterion[] = Array.isArray(map.decision_criteria)
    ? (map.decision_criteria as unknown as DecisionCriterion[])
    : [];
  const needs: UnmetNeed[] = Array.isArray(map.unmet_needs)
    ? (map.unmet_needs as unknown as UnmetNeed[])
    : [];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{map.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {map.quarter}
            </div>
          </div>
          {map.content_md && (
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
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Decision Criteria */}
        {criteria.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Decision Criteria</h4>
            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-muted/10"
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                    #{c.rank}
                  </span>
                  <span className="text-sm text-foreground flex-1">{c.criterion}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.owned_by.map((owner) => (
                      <Badge key={owner} variant="outline" className="text-xs">
                        {owner}
                      </Badge>
                    ))}
                    {c.shifting && (
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-400 bg-amber-500/20 border-transparent"
                      >
                        Shifting
                      </Badge>
                    )}
                    <span className="text-xs font-mono text-muted-foreground">
                      {c.frequency}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmet Needs */}
        {needs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Unmet Needs</h4>
            <div className="space-y-2">
              {needs.map((need, idx) => {
                const severityColor =
                  need.severity === 'high'
                    ? 'text-red-400 bg-red-500/20'
                    : need.severity === 'medium'
                    ? 'text-amber-400 bg-amber-500/20'
                    : 'text-gray-400 bg-gray-500/20';

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-muted/10"
                  >
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${severityColor} border-transparent`}
                    >
                      {need.severity}
                    </Badge>
                    <span className="text-sm text-foreground flex-1">{need.need}</span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {need.frequency}x
                    </span>
                    <div className="flex gap-1 shrink-0">
                      {need.sources.map((s) => (
                        <span key={s} className="text-xs text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Markdown fallback */}
        {criteria.length === 0 && needs.length === 0 && map.content_md && (
          <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">
            {map.content_md}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
