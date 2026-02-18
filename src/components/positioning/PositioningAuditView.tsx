import { useState } from 'react';
import { Calendar, FileText, Loader2, Copy, Check, ShieldCheck, ShieldAlert, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePositioningAudits } from '@/hooks/usePositioningHealth';
import type { PositioningAudit, AuditRecommendation } from '@/types/positioningHealth';

// âââ PositioningAuditView ââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function PositioningAuditView() {
  const { data: audits = [], isLoading } = usePositioningAudits();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No audits yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Quarterly positioning audits are generated at the start of each quarter.
          They synthesize health scores, drift events, and cross-module intelligence
          into claim-by-claim recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {audits.map((audit) => (
        <AuditCard key={audit.id} audit={audit} />
      ))}
    </div>
  );
}

// âââ AuditCard âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function AuditCard({ audit }: { audit: PositioningAudit }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!audit.content_md) return;
    await navigator.clipboard.writeText(audit.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse recommendations (may be JSON string or array)
  const recommendations: AuditRecommendation[] = (() => {
    if (Array.isArray(audit.recommendations)) return audit.recommendations;
    if (typeof audit.recommendations === 'string') {
      try {
        return JSON.parse(audit.recommendations);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const holdCount = recommendations.filter((r) => r.action === 'hold').length;
  const adjustCount = recommendations.filter((r) => r.action === 'adjust').length;
  const retireCount = recommendations.filter((r) => r.action === 'retire').length;
  const createCount = recommendations.filter((r) => r.action === 'create').length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{audit.title}</CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {audit.quarter}
              </div>
              <span>{audit.claim_count} claims analyzed</span>
            </div>
          </div>
          <div className="flex gap-2">
            {audit.content_md && (
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

      {/* Recommendation summary badges */}
      <CardContent className="pt-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {holdCount > 0 && (
            <Badge variant="outline" className="text-xs text-emerald-400 bg-emerald-500/10 border-transparent">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {holdCount} Hold
            </Badge>
          )}
          {adjustCount > 0 && (
            <Badge variant="outline" className="text-xs text-amber-400 bg-amber-500/10 border-transparent">
              <ShieldAlert className="h-3 w-3 mr-1" />
              {adjustCount} Adjust
            </Badge>
          )}
          {retireCount > 0 && (
            <Badge variant="outline" className="text-xs text-red-400 bg-red-500/10 border-transparent">
              <Trash2 className="h-3 w-3 mr-1" />
              {retireCount} Retire
            </Badge>
          )}
          {createCount > 0 && (
            <Badge variant="outline" className="text-xs text-blue-400 bg-blue-500/10 border-transparent">
              <Plus className="h-3 w-3 mr-1" />
              {createCount} Create
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Expanded content */}
      {expanded && (
        <CardContent className="pt-0">
          {/* Recommendations detail */}
          {recommendations.length > 0 && (
            <div className="space-y-2 mb-4 border-t border-border/50 pt-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Recommendations
              </div>
              {recommendations.map((rec, idx) => (
                <RecommendationRow key={idx} rec={rec} />
              ))}
            </div>
          )}

          {/* Full markdown content */}
          {audit.content_md ? (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed border-t border-border/50 pt-3">
              {audit.content_md}
            </div>
          ) : audit.content_json && Object.keys(audit.content_json).length > 0 ? (
            <div className="space-y-2 border-t border-border/50 pt-3">
              {Object.entries(audit.content_json).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-foreground/80">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-3 border-t border-border/50">
              No content available
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// âââ RecommendationRow âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof ShieldCheck }> = {
  hold: { label: 'Hold', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: ShieldCheck },
  adjust: { label: 'Adjust', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: ShieldAlert },
  retire: { label: 'Retire', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: Trash2 },
  create: { label: 'Create', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Plus },
};

function RecommendationRow({ rec }: { rec: AuditRecommendation }) {
  const config = ACTION_CONFIG[rec.action] || ACTION_CONFIG.hold;

  return (
    <div className="flex items-start gap-3 py-1.5">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${config.color} ${config.bgColor} border-transparent mt-0.5`}
      >
        {config.label}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground">{rec.claim}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{rec.reasoning}</div>
      </div>
      {rec.priority && (
        <Badge variant="outline" className={`text-xs shrink-0 border-transparent ${
          rec.priority === 'high' ? 'text-red-400' :
          rec.priority === 'medium' ? 'text-amber-400' :
          'text-blue-400'
        }`}>
          {rec.priority}
        </Badge>
      )}
      {rec.evidence_count > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {rec.evidence_count} signals
        </span>
      )}
    </div>
  );
}
