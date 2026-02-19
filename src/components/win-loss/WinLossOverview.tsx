import { ThumbsUp, ThumbsDown, ArrowRightLeft, TrendingUp, Gauge, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWinLoss } from '@/hooks/useWinLoss';
import {
  INDICATOR_TYPE_CONFIG,
  PATTERN_TREND_CONFIG,
  SOURCE_PLATFORM_CONFIG,
  type TopPattern,
  type RecentIndicator,
} from '@/types/winloss';

// âââ WinLossOverview âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function WinLossOverview() {
  const { overview, isLoading } = useWinLoss();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Gauge className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No data yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Win/Loss indicators will appear here once the source collector workflows run
          and classify public buyer decision signals.
        </p>
      </div>
    );
  }

  const hasData = overview.indicators_90d > 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Win Signals"
          value={overview.win_count}
          sublabel="90 days"
          icon={<ThumbsUp className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <StatCard
          label="Loss Signals"
          value={overview.loss_count}
          sublabel="90 days"
          icon={<ThumbsDown className="h-4 w-4" />}
          color="text-red-400"
        />
        <StatCard
          label="Switch Signals"
          value={overview.switch_count}
          sublabel="90 days"
          icon={<ArrowRightLeft className="h-4 w-4" />}
          color="text-amber-400"
        />
        <StatCard
          label="Active Patterns"
          value={overview.active_patterns}
          sublabel={`${overview.rising_patterns} rising`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-purple-400"
        />
      </div>

      {/* Top patterns by type */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TopPatternsCard
            title="Top Win Patterns"
            patterns={overview.top_win_patterns}
            type="win"
          />
          <TopPatternsCard
            title="Top Loss Patterns"
            patterns={overview.top_loss_patterns}
            type="loss"
          />
          <TopPatternsCard
            title="Top Switch Patterns"
            patterns={overview.top_switch_patterns}
            type="switch"
          />
        </div>
      )}

      {/* Recent indicators feed */}
      {overview.recent_indicators.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Indicators</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {overview.recent_indicators.map((ind) => (
                <RecentIndicatorRow key={ind.id} indicator={ind} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies tracked */}
      {overview.companies_tracked.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Tracking:</span>
          {overview.companies_tracked.map((company) => (
            <Badge key={company} variant="outline" className="text-xs">
              {company}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function StatCard({
  label,
  value,
  sublabel,
  icon,
  color,
}: {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={color}>{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>
    </div>
  );
}

function TopPatternsCard({
  title,
  patterns,
  type,
}: {
  title: string;
  patterns: TopPattern[];
  type: 'win' | 'loss' | 'switch';
}) {
  const config = INDICATOR_TYPE_CONFIG[type];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${config.color}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {patterns.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No patterns detected yet</p>
        ) : (
          <div className="space-y-2">
            {patterns.map((p, idx) => {
              const trendConfig = PATTERN_TREND_CONFIG[p.trend];
              return (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">{p.description}</div>
                    <div className="text-xs text-muted-foreground">{p.company_name}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      {p.frequency}x
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${trendConfig.color} border-transparent`}
                    >
                      {trendConfig.label}
                    </Badge>
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

function RecentIndicatorRow({ indicator }: { indicator: RecentIndicator }) {
  const config = INDICATOR_TYPE_CONFIG[indicator.indicator_type];
  const platformConfig = SOURCE_PLATFORM_CONFIG[indicator.source_platform] || SOURCE_PLATFORM_CONFIG.other;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${config.color} ${config.bgColor} border-transparent`}
      >
        {config.label}
      </Badge>
      <span className="text-sm text-foreground truncate flex-1">{indicator.reason}</span>
      <span className="text-xs text-muted-foreground shrink-0">{indicator.company_name}</span>
      <span className={`text-xs shrink-0 ${platformConfig.color}`}>{platformConfig.label}</span>
      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(indicator.detected_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </div>
  );
}
