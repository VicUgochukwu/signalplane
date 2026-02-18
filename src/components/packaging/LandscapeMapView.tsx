import {
  ExternalLink,
  Loader2,
  Map,
  Lock,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePackagingLandscape } from '@/hooks/usePackagingIntel';
import {
  VALUE_METRIC_CONFIG,
  type PackagingLandscapeEntry,
  type TierEntry,
  type GatingStrategy,
} from '@/types/packagingIntel';

// âââ LandscapeMapView âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function LandscapeMapView() {
  const { data: entries = [], isLoading } = usePackagingLandscape();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Map className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No landscape data</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Packaging landscape maps are generated monthly when competitor pricing
          pages are analyzed and structured into tier/gating comparisons.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <LandscapeCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function LandscapeCard({ entry }: { entry: PackagingLandscapeEntry }) {
  const metricConfig = VALUE_METRIC_CONFIG[entry.value_metric];
  const gating = entry.gating_strategy || {};
  const gatingSignals = getGatingSignals(gating);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{entry.company_name}</CardTitle>
          {entry.pricing_url && (
            <a
              href={entry.pricing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge
            variant="outline"
            className={`text-xs ${metricConfig.color} ${metricConfig.bgColor} border-transparent`}
          >
            {metricConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {entry.plan_count} plan{entry.plan_count !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Free / Enterprise badges */}
        <div className="flex items-center gap-2">
          {entry.has_free_tier && (
            <Badge variant="outline" className="text-xs text-emerald-400 bg-emerald-500/10 border-transparent">
              <Sparkles className="h-3 w-3 mr-1" />
              Free Tier
            </Badge>
          )}
          {entry.has_enterprise && (
            <Badge variant="outline" className="text-xs text-indigo-400 bg-indigo-500/10 border-transparent">
              <Building2 className="h-3 w-3 mr-1" />
              Enterprise
            </Badge>
          )}
        </div>

        {/* Tier structure */}
        {entry.tier_structure && entry.tier_structure.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Tiers
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {entry.tier_structure.map((tier, idx) => (
                <TierBadge key={idx} tier={tier} />
              ))}
            </div>
          </div>
        )}

        {/* Gating signals */}
        {gatingSignals.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Gating
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {gatingSignals.map((signal, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs text-amber-400 border-transparent"
                >
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last updated */}
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
          Last updated{' '}
          {new Date(entry.snapshot_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TierBadge({ tier }: { tier: TierEntry }) {
  return (
    <Badge variant="outline" className="text-xs text-foreground/80 border-border/50">
      {tier.name}
      {tier.price && (
        <span className="text-muted-foreground ml-1">{tier.price}</span>
      )}
    </Badge>
  );
}

function getGatingSignals(gating: GatingStrategy): string[] {
  const signals: string[] = [];
  if (gating.paid_gates && gating.paid_gates.length > 0) {
    signals.push(...gating.paid_gates.slice(0, 3));
  }
  if (gating.enterprise_gates && gating.enterprise_gates.length > 0) {
    signals.push(...gating.enterprise_gates.slice(0, 2));
  }
  return signals;
}
