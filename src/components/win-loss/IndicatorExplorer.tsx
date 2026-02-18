import { useState } from 'react';
import { ExternalLink, Filter, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWinLossIndicators } from '@/hooks/useWinLoss';
import {
  INDICATOR_TYPE_CONFIG,
  SOURCE_PLATFORM_CONFIG,
  type IndicatorType,
  type WinLossIndicator,
} from '@/types/winloss';

// âââ IndicatorExplorer âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function IndicatorExplorer() {
  const { data: indicators = [], isLoading } = useWinLossIndicators(90);
  const [typeFilter, setTypeFilter] = useState<IndicatorType | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique companies
  const companies = Array.from(new Set(indicators.map((i) => i.company_name))).sort();

  // Apply filters
  const filtered = indicators.filter((ind) => {
    if (typeFilter !== 'all' && ind.indicator_type !== typeFilter) return false;
    if (companyFilter && ind.company_name !== companyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !ind.reason.toLowerCase().includes(q) &&
        !ind.company_name.toLowerCase().includes(q) &&
        !ind.source_platform.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No indicators yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Indicators will be classified from public review platforms, forums, and comparison pages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Type filter */}
        <div className="flex gap-1">
          <FilterButton active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
            All ({indicators.length})
          </FilterButton>
          {(['win', 'loss', 'switch'] as IndicatorType[]).map((type) => {
            const config = INDICATOR_TYPE_CONFIG[type];
            const count = indicators.filter((i) => i.indicator_type === type).length;
            return (
              <FilterButton
                key={type}
                active={typeFilter === type}
                onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              >
                <span className={config.color}>{config.label}</span> ({count})
              </FilterButton>
            );
          })}
        </div>

        {/* Company filter */}
        {companies.length > 1 && (
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="h-7 text-xs rounded-md border border-border/50 bg-card px-2 text-foreground"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reasons..."
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        {filtered.length} indicator{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Indicator list */}
      <div className="space-y-1">
        {filtered.map((ind) => (
          <IndicatorRow key={ind.id} indicator={ind} />
        ))}
      </div>
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-7 text-xs px-2"
    >
      {children}
    </Button>
  );
}

function IndicatorRow({ indicator }: { indicator: WinLossIndicator }) {
  const config = INDICATOR_TYPE_CONFIG[indicator.indicator_type];
  const platformConfig =
    SOURCE_PLATFORM_CONFIG[indicator.source_platform] || SOURCE_PLATFORM_CONFIG.other;

  // Sentiment dot
  const sentimentColor =
    indicator.sentiment_score > 0.2
      ? 'bg-emerald-400'
      : indicator.sentiment_score < -0.2
      ? 'bg-red-400'
      : 'bg-gray-400';

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${config.color} ${config.bgColor} border-transparent`}
      >
        {config.label}
      </Badge>

      <span className="text-sm font-medium text-foreground shrink-0 w-24 truncate">
        {indicator.company_name}
      </span>

      <span className="text-sm text-foreground/80 flex-1 truncate">
        {indicator.reason}
      </span>

      {/* Sentiment dot */}
      <div className={`h-2 w-2 rounded-full shrink-0 ${sentimentColor}`} title={`Sentiment: ${indicator.sentiment_score}`} />

      {/* Platform */}
      <span className={`text-xs shrink-0 ${platformConfig.color}`}>
        {platformConfig.label}
      </span>

      {/* Date */}
      <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
        {new Date(indicator.detected_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>

      {/* Source link */}
      {indicator.source_url && (
        <a
          href={indicator.source_url}
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
