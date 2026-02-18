import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useWinLossPatterns } from '@/hooks/useWinLoss';
import {
  INDICATOR_TYPE_CONFIG,
  PATTERN_TREND_CONFIG,
  type WinLossPattern,
  type IndicatorType,
} from '@/types/winloss';

// âââ PatternList (renders all patterns with grouping) ââââââââââââââââââââââââ

export function PatternList() {
  const { data: patterns = [], isLoading } = useWinLossPatterns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No patterns yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Patterns are aggregated weekly from indicators. They surface recurring reasons
          buyers choose, reject, or switch between products.
        </p>
      </div>
    );
  }

  // Group by company
  const byCompany = patterns.reduce<Record<string, WinLossPattern[]>>((acc, p) => {
    if (!acc[p.company_name]) acc[p.company_name] = [];
    acc[p.company_name].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(byCompany)
        .sort(([, a], [, b]) => b.length - a.length)
        .map(([company, companyPatterns]) => (
          <div key={company}>
            <h3 className="text-sm font-semibold text-foreground mb-3">{company}</h3>
            <div className="space-y-2">
              {companyPatterns.map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// âââ PatternCard âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function PatternCard({ pattern }: { pattern: WinLossPattern }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = INDICATOR_TYPE_CONFIG[pattern.pattern_type as IndicatorType];
  const trendConfig = PATTERN_TREND_CONFIG[pattern.trend];

  // Frequency bar (max 20 for visual)
  const freqPct = Math.min(100, (pattern.frequency / 20) * 100);

  // Confidence badge color
  const confidenceColor =
    pattern.confidence >= 0.7
      ? 'text-emerald-400'
      : pattern.confidence >= 0.4
      ? 'text-amber-400'
      : 'text-gray-400';

  const TrendIcon =
    pattern.trend === 'rising'
      ? TrendingUp
      : pattern.trend === 'falling'
      ? TrendingDown
      : Minus;

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${typeConfig.color} ${typeConfig.bgColor} border-transparent`}
          >
            {typeConfig.label}
          </Badge>
          <span className="text-sm font-medium text-foreground truncate">
            {pattern.description}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Frequency */}
          <div className="flex items-center gap-1.5 w-20">
            <Progress value={freqPct} className="h-1.5 flex-1" />
            <span className="text-xs font-mono tabular-nums text-muted-foreground w-6 text-right">
              {pattern.frequency}x
            </span>
          </div>

          {/* Trend */}
          <div className={`flex items-center gap-1 ${trendConfig.color}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="text-xs">{trendConfig.label}</span>
          </div>

          {/* Confidence */}
          <span className={`text-xs font-mono ${confidenceColor}`}>
            {Math.round(pattern.confidence * 100)}%
          </span>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">First Seen</div>
              <div className="text-foreground">
                {new Date(pattern.first_seen).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Seen</div>
              <div className="text-foreground">
                {new Date(pattern.last_seen).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Indicators</div>
              <div className="text-foreground">{pattern.indicator_ids?.length || 0} linked</div>
            </div>
            <div>
              <div className="text-muted-foreground">Confidence</div>
              <div className={confidenceColor}>
                {pattern.confidence >= 0.7 ? 'High' : pattern.confidence >= 0.4 ? 'Medium' : 'Low'}{' '}
                ({Math.round(pattern.confidence * 100)}%)
              </div>
            </div>
          </div>

          {pattern.tags && pattern.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {pattern.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
