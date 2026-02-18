import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Scale, Shield } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Convergence, CorroborationScore, ConfidenceLevel } from '@/types/narrativeGraph';

const CORROBORATION_STYLE: Record<CorroborationScore, { label: string; cls: string }> = {
  strong: { label: 'Strong', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  moderate: { label: 'Moderate', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  weak: { label: 'Weak', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
};

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { label: string; cls: string }> = {
  'high': { label: 'High confidence', cls: 'text-emerald-400' },
  'moderate-high': { label: 'Moderate-high confidence', cls: 'text-emerald-400/80' },
  'moderate': { label: 'Moderate confidence', cls: 'text-amber-400' },
  'low': { label: 'Low confidence', cls: 'text-rose-400' },
};

export function ConvergenceAlert({ convergence }: { convergence: Convergence }) {
  const [showAltExplanation, setShowAltExplanation] = useState(false);

  const corrob = CORROBORATION_STYLE[convergence.corroboration_score] || CORROBORATION_STYLE.weak;
  const conf = CONFIDENCE_STYLE[convergence.confidence_level] || CONFIDENCE_STYLE.low;

  return (
    <Card className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03]">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-md bg-amber-500/10 shrink-0 mt-0.5">
          <Target className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Market Convergence</span>
            <span className="text-[10px] text-muted-foreground">
              {format(parseISO(convergence.week_detected), 'MMM d')}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{convergence.convergence_theme}</p>
          {convergence.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed">{convergence.summary}</p>
          )}

          {/* Credibility row: corroboration + confidence + companies + severity */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <Badge variant="outline" className={`text-[10px] border ${corrob.cls}`}>
              <Shield className="h-2.5 w-2.5 mr-1" />
              {corrob.label}
            </Badge>
            <span className={`text-[10px] font-medium ${conf.cls}`}>
              {conf.label}
            </span>
            <span className="text-[10px] text-muted-foreground/50">|</span>
            {(convergence.company_names ?? []).map((name, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                {name}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400">
              {convergence.severity}/5
            </Badge>
          </div>

          {/* Counter-hypothesis */}
          {convergence.alternative_explanation && (
            <div className="pt-1">
              <button
                onClick={() => setShowAltExplanation(!showAltExplanation)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                <Scale className="h-3 w-3" />
                {showAltExplanation ? 'Hide' : 'View'} counter-hypothesis
              </button>
              {showAltExplanation && (
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-1.5 pl-[18px] italic">
                  {convergence.alternative_explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
