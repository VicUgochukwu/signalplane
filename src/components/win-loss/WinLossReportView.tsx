import { Calendar, FileText, Loader2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWinLossReports } from '@/hooks/useWinLoss';
import type { WinLossReport } from '@/types/winloss';

// âââ WinLossReportView âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function WinLossReportView() {
  const { data: reports = [], isLoading } = useWinLossReports();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No reports yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Monthly win/loss pattern reports are generated on the first Monday of each month
          when there are enough indicators to analyze.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

// âââ ReportCard ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function ReportCard({ report }: { report: WinLossReport }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!report.content_md) return;
    await navigator.clipboard.writeText(report.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const monthLabel = new Date(report.report_month + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{report.title}</CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {monthLabel}
              </div>
              <span>{report.indicator_count} indicators</span>
              <span>{report.pattern_count} patterns</span>
            </div>
          </div>
          <div className="flex gap-2">
            {report.content_md && (
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

      {/* Companies analyzed */}
      {report.companies_analyzed && report.companies_analyzed.length > 0 && (
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {report.companies_analyzed.map((company) => (
              <Badge key={company} variant="outline" className="text-xs">
                {company}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      {/* Expanded content */}
      {expanded && (
        <CardContent className="pt-0">
          {report.content_md ? (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed border-t border-border/50 pt-3">
              {report.content_md}
            </div>
          ) : report.content_json && Object.keys(report.content_json).length > 0 ? (
            <div className="space-y-2 border-t border-border/50 pt-3">
              {Object.entries(report.content_json).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-foreground/80">
                    {typeof value === 'string'
                      ? value
                      : JSON.stringify(value, null, 2)}
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
