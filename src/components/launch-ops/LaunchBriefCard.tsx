import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Copy, Check, FileText, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BRIEF_TYPE_CONFIG, type LaunchBrief } from '@/types/launchOps';

// âââ LaunchBriefCard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Expandable card per brief: type badge, date, title, rendered content_json, copy content_md

interface LaunchBriefCardProps {
  brief: LaunchBrief;
}

export function LaunchBriefCard({ brief }: LaunchBriefCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = BRIEF_TYPE_CONFIG[brief.brief_type];

  const handleCopy = async () => {
    if (!brief.content_md) return;
    await navigator.clipboard.writeText(brief.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysLabel = brief.days_to_launch != null
    ? brief.days_to_launch > 0
      ? `T-${brief.days_to_launch}d`
      : brief.days_to_launch === 0
      ? 'Launch Day'
      : `T+${Math.abs(brief.days_to_launch)}d`
    : null;

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${config.color} ${config.bgColor} border-transparent`}
          >
            {config.label}
          </Badge>
          <span className="text-sm font-medium text-foreground truncate">
            {brief.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {daysLabel && (
            <span className="text-xs font-mono text-muted-foreground">{daysLabel}</span>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(brief.brief_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          {brief.signal_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              {brief.signal_count}
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          {/* Render content_md if available */}
          {brief.content_md ? (
            <div className="relative">
              <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">
                {brief.content_md}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="absolute top-0 right-0 h-7 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ) : brief.content_json && Object.keys(brief.content_json).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(brief.content_json).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-foreground/80">
                    {typeof value === 'string'
                      ? value
                      : Array.isArray(value)
                      ? (value as string[]).join(', ')
                      : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <FileText className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No content available yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
