import { useState } from 'react';
import {
  FileText,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePackagingBriefs } from '@/hooks/usePackagingIntel';
import {
  CHANGE_TYPE_CONFIG,
  SIGNIFICANCE_CONFIG,
  type PackagingBrief,
  type ResponseRecommendation,
} from '@/types/packagingIntel';

// âââ IntelBriefView âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function IntelBriefView() {
  const { data: briefs = [], isLoading } = usePackagingBriefs(180);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No intelligence briefs</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Intelligence briefs are generated when significant pricing or packaging
          changes are detected among tracked competitors. Each brief provides
          strategic interpretation and response recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {briefs.map((brief) => (
        <BriefCard key={brief.id} brief={brief} />
      ))}
    </div>
  );
}

// âââ Sub-components ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function BriefCard({ brief }: { brief: PackagingBrief }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const changeConfig = CHANGE_TYPE_CONFIG[brief.change_type];
  const sevConfig = SIGNIFICANCE_CONFIG[brief.severity];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(brief.strategic_interpretation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse recommendations (may be JSON string or array)
  const recommendations: ResponseRecommendation[] = (() => {
    if (Array.isArray(brief.response_recommendations)) return brief.response_recommendations;
    if (typeof brief.response_recommendations === 'string') {
      try {
        return JSON.parse(brief.response_recommendations);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const hasDetails =
    brief.change_details && Object.keys(brief.change_details).length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {brief.company_name}
              <Badge
                variant="outline"
                className={`text-xs ${sevConfig.color} ${sevConfig.bgColor} border-transparent`}
              >
                {sevConfig.label}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`text-xs ${changeConfig.color} ${changeConfig.bgColor} border-transparent`}
              >
                {changeConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(brief.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
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
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Strategic interpretation */}
        <div className="text-sm text-foreground/80 leading-relaxed">
          {brief.strategic_interpretation}
        </div>

        {/* Response recommendations */}
        {recommendations.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {recommendations.map((rec, idx) => (
              <RecommendationBadge key={idx} recommendation={rec} />
            ))}
          </div>
        )}

        {/* Expandable change details */}
        {hasDetails && (
          <div className="border-t border-border/50 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-6 text-xs text-muted-foreground gap-1 px-1"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Change Details
            </Button>
            {expanded && (
              <pre className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(brief.change_details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-blue-400 bg-blue-500/10',
};

function RecommendationBadge({ recommendation }: { recommendation: ResponseRecommendation }) {
  const color = PRIORITY_COLOR[recommendation.priority] || PRIORITY_COLOR.low;

  return (
    <Badge
      variant="outline"
      className={`text-xs ${color} border-transparent`}
      title={recommendation.description}
    >
      {recommendation.action}
    </Badge>
  );
}
