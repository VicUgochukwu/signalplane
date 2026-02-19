import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Scale, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { NarrativeArc, ConfidenceLevel, CorroborationScore, EvidenceWeight } from '@/types/narrativeGraph';

const STATUS_STYLE: Record<string, string> = {
  building: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  escalating: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  peaked: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  fading: 'bg-muted text-muted-foreground border-border/50',
};

const EDGE_COLOR: Record<string, string> = {
  origin: 'bg-sky-500',
  escalation: 'bg-amber-500',
  reinforcement: 'bg-emerald-500',
  pivot: 'bg-violet-500',
};

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

const WEIGHT_LABEL: Record<EvidenceWeight, { short: string; cls: string }> = {
  high: { short: 'HIGH', cls: 'text-emerald-400' },
  medium: { short: 'MED', cls: 'text-amber-400' },
  low: { short: 'LOW', cls: 'text-muted-foreground' },
};

export function NarrativeArcCard({ arc }: { arc: NarrativeArc }) {
  const [expanded, setExpanded] = useState(false);
  const [showAltExplanation, setShowAltExplanation] = useState(false);

  const corrob = CORROBORATION_STYLE[arc.corroboration_score] || CORROBORATION_STYLE.weak;
  const conf = CONFIDENCE_STYLE[arc.confidence_level] || CONFIDENCE_STYLE.low;

  return (
    <Card className="rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Row 1: Title + Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{arc.arc_title}</h3>
            <Badge variant="outline" className={`text-[10px] shrink-0 border ${STATUS_STYLE[arc.arc_status] || STATUS_STYLE.building}`}>
              {arc.arc_status.charAt(0).toUpperCase() + arc.arc_status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {arc.trajectory === 'accelerating' && <TrendingUp className="h-3.5 w-3.5 text-rose-400" />}
            {arc.trajectory === 'decelerating' && <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />}
            {arc.trajectory === 'steady' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>

        {/* Row 2: Corroboration + Confidence + Evidence stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] border ${corrob.cls}`}>
            <ShieldCheck className="h-2.5 w-2.5 mr-1" />
            {corrob.label}
          </Badge>
          <span className={`text-[10px] font-medium ${conf.cls}`}>
            {conf.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {arc.edges.length} signal{arc.edges.length !== 1 ? 's' : ''} · {arc.page_type_diversity} page type{arc.page_type_diversity !== 1 ? 's' : ''} · {arc.weeks_active}w
          </span>
        </div>

        {/* Row 3: Company + Timeline */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-medium">{arc.company_name}</span>
          <span>
            {arc.escalation_count} shift{arc.escalation_count !== 1 ? 's' : ''} · {format(parseISO(arc.first_seen_week), 'MMM d')} – {format(parseISO(arc.last_seen_week), 'MMM d')}
          </span>
        </div>

        {/* Row 4: Timeline graph with evidence weight */}
        <div className="flex items-center gap-0.5">
          {arc.edges.map((edge, i) => (
            <div key={edge.edge_id || i} className="flex items-center">
              {i > 0 && <div className="w-4 h-px bg-border/60" />}
              <div
                className={`w-2 h-2 rounded-full ${EDGE_COLOR[edge.edge_label] || EDGE_COLOR.origin} ${edge.evidence_weight === 'high' ? 'ring-1 ring-emerald-400/50' : ''}`}
                title={`${edge.edge_label} · ${edge.page_type || 'unknown'} · weight: ${edge.evidence_weight} — Week of ${edge.week_start_date}`}
              />
            </div>
          ))}
        </div>

        {/* Row 5: Strategic summary — intelligence language */}
        {arc.strategic_summary && (
          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-3">
            {arc.strategic_summary}
          </p>
        )}

        {/* Row 6: Counter-hypothesis */}
        {arc.alternative_explanation && (
          <div>
            <button
              onClick={() => setShowAltExplanation(!showAltExplanation)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              <Scale className="h-3 w-3" />
              {showAltExplanation ? 'Hide' : 'View'} counter-hypothesis
            </button>
            {showAltExplanation && (
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-1.5 pl-[18px] italic">
                {arc.alternative_explanation}
              </p>
            )}
          </div>
        )}

        {/* Expandable signal chain */}
        {arc.edges.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors pt-1"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide' : 'View'} signal chain ({arc.edges.length})
          </button>
        )}

        {expanded && (
          <div className="space-y-1.5 pl-1">
            {arc.edges.map((edge, i) => {
              const wt = WEIGHT_LABEL[edge.evidence_weight] || WEIGHT_LABEL.medium;
              return (
                <div key={edge.edge_id || i} className="flex items-start gap-2 text-[11px]">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${EDGE_COLOR[edge.edge_label] || EDGE_COLOR.origin}`} />
                  <div className="flex-1">
                    <span className="text-muted-foreground">
                      {format(parseISO(edge.week_start_date), 'MMM d')} · {' '}
                      <span className="capitalize">{edge.edge_label}</span>
                      {edge.page_type && (
                        <span className="text-muted-foreground/60"> · {edge.page_type}</span>
                      )}
                      {' '}
                      <span className={`text-[9px] font-semibold uppercase ${wt.cls}`}>[{wt.short}]</span>
                    </span>
                    {edge.llm_reasoning && (
                      <p className="text-foreground/60">{edge.llm_reasoning}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
