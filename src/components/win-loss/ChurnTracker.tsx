import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useChurnSignals } from '@/hooks/useWinLoss';
import {
  INDICATOR_TYPE_CONFIG,
  SOURCE_PLATFORM_CONFIG,
  type ChurnSignal,
} from '@/types/winloss';

// âââ ChurnTracker ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function ChurnTracker() {
  const { data: signals = [], isLoading } = useChurnSignals(30);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No churn signals</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Loss and switch indicators from the past 30 days will appear here.
          This tracks public dissatisfaction signals, negative review spikes,
          and migration announcements.
        </p>
      </div>
    );
  }

  // Group by company
  const byCompany = signals.reduce<Record<string, ChurnSignal[]>>((acc, s) => {
    if (!acc[s.company_name]) acc[s.company_name] = [];
    acc[s.company_name].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground">
        {signals.length} churn signal{signals.length !== 1 ? 's' : ''} in the last 30 days
      </div>

      {Object.entries(byCompany)
        .sort(([, a], [, b]) => b.length - a.length)
        .map(([company, companySignals]) => (
          <div key={company}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground">{company}</h3>
              <Badge variant="outline" className="text-xs text-red-400 bg-red-500/20 border-transparent">
                {companySignals.length} signal{companySignals.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-1">
              {companySignals.map((signal) => (
                <ChurnSignalRow key={signal.id} signal={signal} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// âââ ChurnSignalRow ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function ChurnSignalRow({ signal }: { signal: ChurnSignal }) {
  const config = INDICATOR_TYPE_CONFIG[signal.indicator_type];
  const platformConfig =
    SOURCE_PLATFORM_CONFIG[signal.source_platform] || SOURCE_PLATFORM_CONFIG.other;

  // Severity from sentiment (more negative = higher severity)
  const severityColor =
    signal.sentiment_score < -0.5
      ? 'text-red-400'
      : signal.sentiment_score < -0.2
      ? 'text-amber-400'
      : 'text-gray-400';
  const severityLabel =
    signal.sentiment_score < -0.5
      ? 'High'
      : signal.sentiment_score < -0.2
      ? 'Medium'
      : 'Low';

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${config.color} ${config.bgColor} border-transparent`}
      >
        {config.label}
      </Badge>

      <span className="text-sm text-foreground/80 flex-1 truncate">
        {signal.reason}
      </span>

      {/* Severity */}
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${severityColor} border-transparent`}
      >
        {severityLabel}
      </Badge>

      {/* Platform */}
      <span className={`text-xs shrink-0 ${platformConfig.color}`}>
        {platformConfig.label}
      </span>

      {/* Date */}
      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(signal.detected_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>

      {/* Source link */}
      {signal.source_url && (
        <a
          href={signal.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
