import { Calendar, FileText, Loader2, Copy, Check, User } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePersonaReports } from '@/hooks/useVocResearch';
import { VOC_DIMENSION_CONFIG } from '@/types/vocResearch';
import type { PersonaReport, LanguageShift, DimensionBreakdown } from '@/types/vocResearch';

// âââ PersonaReportView âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function PersonaReportView() {
  const { data: reports = [], isLoading } = usePersonaReports();

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
        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No persona reports yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Monthly per-persona reports are generated on the first Monday of each month, synthesizing
          top pains, desires, language patterns, and decision criteria for each tracked persona.
        </p>
      </div>
    );
  }

  // Group reports by month
  const byMonth: Record<string, PersonaReport[]> = {};
  for (const report of reports) {
    const key = report.report_month;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(report);
  }

  return (
    <div className="space-y-6">
      {Object.entries(byMonth).map(([month, monthReports]) => {
        const monthLabel = new Date(month + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        return (
          <div key={month} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              {monthLabel}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthReports.map((report) => (
                <PersonaReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// âââ PersonaReportCard âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function PersonaReportCard({ report }: { report: PersonaReport }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!report.content_md) return;
    await navigator.clipboard.writeText(report.content_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const breakdown = report.dimension_breakdown as DimensionBreakdown;
  const shifts = (Array.isArray(report.language_shifts)
    ? report.language_shifts
    : []) as LanguageShift[];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-violet-400" />
              {report.persona}
            </CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{report.entry_count} entries</span>
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

      {/* Dimension breakdown badges */}
      {breakdown && (
        <CardContent className="pt-0 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.entries(breakdown) as [string, number][]).map(([dim, count]) => {
              const config = VOC_DIMENSION_CONFIG[dim as keyof typeof VOC_DIMENSION_CONFIG];
              if (!config || !count) return null;
              return (
                <Badge
                  key={dim}
                  variant="outline"
                  className={`text-xs ${config.color} border-transparent`}
                >
                  {config.label}: {count}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      )}

      {/* Language shifts preview */}
      {!expanded && shifts.length > 0 && (
        <CardContent className="pt-0 pb-3">
          <div className="text-xs text-muted-foreground">
            {shifts.length} language shift{shifts.length !== 1 ? 's' : ''} detected
          </div>
        </CardContent>
      )}

      {/* Expanded content */}
      {expanded && (
        <CardContent className="pt-0">
          {/* Language shifts detail */}
          {shifts.length > 0 && (
            <div className="border-t border-border/50 pt-3 mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Language Shifts
              </h4>
              <div className="space-y-1.5">
                {shifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={`text-xs border-transparent ${
                        shift.direction === 'emerging'
                          ? 'text-red-400 bg-red-500/10'
                          : shift.direction === 'fading'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {shift.direction}
                    </Badge>
                    <span className="text-foreground">{shift.term}</span>
                    {shift.previous_term && (
                      <span className="text-muted-foreground text-xs">
                        (was: {shift.previous_term})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Markdown content */}
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
