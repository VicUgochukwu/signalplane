import {
  Globe,
  ExternalLink,
  Loader2,
  Home,
  DollarSign,
  Package,
  GitCompare,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useOwnMessaging } from '@/hooks/usePositioningHealth';
import {
  PAGE_TYPE_CONFIG,
  type OwnMessaging,
  type PageType,
} from '@/types/positioningHealth';

// âââ Page type icons âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const PAGE_TYPE_ICONS: Record<PageType, typeof Home> = {
  homepage: Home,
  pricing: DollarSign,
  product: Package,
  comparison: GitCompare,
  about: Info,
};

// âââ OwnMessagingTracker âââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function OwnMessagingTracker() {
  const { data: pages = [], isLoading } = useOwnMessaging();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No pages tracked</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          Add your company's public pages (homepage, pricing, product, comparison, about) to monitor
          positioning drift. The system will track changes and detect when your messaging shifts.
        </p>
        <div className="text-xs text-muted-foreground max-w-sm mx-auto space-y-1">
          <p>Pages are added via the n8n workflow configuration.</p>
          <p>Supported page types: homepage, pricing, product, comparison, about</p>
        </div>
      </div>
    );
  }

  // Group by page type
  const grouped = pages.reduce<Record<string, OwnMessaging[]>>((acc, page) => {
    const type = page.page_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(page);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">
          Tracking {pages.length} page{pages.length !== 1 ? 's' : ''}:
        </span>
        {Object.entries(grouped).map(([type, items]) => {
          const config = PAGE_TYPE_CONFIG[type as PageType];
          return (
            <Badge key={type} variant="outline" className={`text-xs ${config?.color || 'text-gray-400'}`}>
              {config?.label || type} ({items.length})
            </Badge>
          );
        })}
      </div>

      {/* Page list */}
      <div className="space-y-2">
        {pages.map((page) => (
          <PageCard key={page.id} page={page} />
        ))}
      </div>
    </div>
  );
}

// âââ PageCard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function PageCard({ page }: { page: OwnMessaging }) {
  const config = PAGE_TYPE_CONFIG[page.page_type as PageType] || { label: page.page_type, color: 'text-gray-400' };
  const Icon = PAGE_TYPE_ICONS[page.page_type as PageType] || Globe;

  let hostname = '';
  try {
    hostname = new URL(page.page_url).hostname;
  } catch {
    hostname = page.page_url;
  }

  return (
    <Card className="border-border/50">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`${config.color} shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {page.page_title || hostname}
              </span>
              <Badge variant="outline" className={`text-xs ${config.color} border-transparent shrink-0`}>
                {config.label}
              </Badge>
            </div>
            <a
              href={page.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
            >
              {page.page_url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>

          {/* Meta */}
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">
              Last captured
            </div>
            <div className="text-xs text-foreground">
              {new Date(page.captured_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Snapshot hash indicator */}
          {page.snapshot_hash && (
            <div className="shrink-0">
              <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                {page.snapshot_hash.substring(0, 8)}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
