import { useEffect } from 'react';
import { IntelPacket, PacketStatus, IntelSection, SectionKey } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Radio, Zap, Shield, HelpCircle, Target,
  MessageSquare, BookOpen, Users, Compass, ShieldAlert,
  Clock, AlertTriangle, CheckCircle2, Mail, Download, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { MarketWinnersCard } from './MarketWinnersCard';
import { useExportPacket } from '@/hooks/useExportPacket';
import { useDemo } from '@/contexts/DemoContext';
import { DemoCtaBanner } from '@/components/demo/DemoCtaBanner';

interface ReportDetailProps {
  report: IntelPacket;
  onBack: () => void;
}

const statusConfig: Record<PacketStatus, { label: string; dotClass: string; badgeClass: string }> = {
  live: {
    label: 'Live',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  published: {
    label: 'Published',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  draft: {
    label: 'Draft',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  archived: {
    label: 'Archived',
    dotClass: 'bg-zinc-500',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
};

interface SectionConfig {
  key: SectionKey;
  title: string;
  icon: typeof MessageSquare;
  color: string;
}

const sectionConfigs: SectionConfig[] = [
  { key: 'messaging', title: 'Messaging Intel', icon: MessageSquare, color: 'text-sky-400' },
  { key: 'narrative', title: 'Narrative Intel', icon: BookOpen, color: 'text-violet-400' },
  { key: 'icp', title: 'ICP Intel', icon: Users, color: 'text-emerald-400' },
  { key: 'horizon', title: 'Horizon Intel', icon: Compass, color: 'text-amber-400' },
  { key: 'objection', title: 'Objection Intel', icon: ShieldAlert, color: 'text-rose-400' },
];

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-emerald-400';
  if (confidence >= 60) return 'text-amber-400';
  return 'text-rose-400';
};

const getConfidenceBg = (confidence: number) => {
  if (confidence >= 80) return 'bg-emerald-500/5 border-emerald-500/20';
  if (confidence >= 60) return 'bg-amber-500/5 border-amber-500/20';
  return 'bg-rose-500/5 border-rose-500/20';
};

const getImpactSeverity = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 9) return { label: 'Critical', color: 'text-rose-400', bgColor: 'bg-rose-500/10' };
  if (score >= 7) return { label: 'High', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
  if (score >= 4) return { label: 'Moderate', color: 'text-sky-400', bgColor: 'bg-sky-500/10' };
  return { label: 'Low', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' };
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const ReportDetail = ({ report, onBack }: ReportDetailProps) => {
  const status = statusConfig[report.status];
  const formattedStartDate = format(parseISO(report.week_start), 'MMM d');
  const formattedEndDate = format(parseISO(report.week_end), 'MMM d, yyyy');
  const { emailPacket, isEmailing, downloadAsMarkdown } = useExportPacket();
  const demo = useDemo();

  useEffect(() => {
    demo?.trackExploration('view_packet');
  }, [report.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to packets
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 shrink-0 radar-pulse text-primary">
            <Radio className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {report.packet_title}
              </h1>
              <Badge variant="outline" className={`text-xs font-medium ${status.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dotClass} ${report.status === 'live' ? 'animate-pulse' : ''}`} />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formattedStartDate} – {formattedEndDate}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => emailPacket(report)}
                disabled={isEmailing}
                className="text-xs rounded-lg"
              >
                {isEmailing ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <Mail className="h-3 w-3 mr-1.5" />
                )}
                Email to me
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadAsMarkdown(report)}
                className="text-xs rounded-lg"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Download .md
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {report.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 radar-pulse text-sky-400">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {report.metrics.signals_detected ?? '—'}
                </div>
                <div className="text-xs text-muted-foreground">Signals Detected</div>
              </div>
            </div>
          </div>

          {(() => {
            const conf = report.metrics.confidence_score;
            const confLabel = conf !== undefined
              ? conf >= 80 ? 'Strong' : conf >= 60 ? 'Moderate' : 'Weak'
              : null;
            const confColor = conf !== undefined ? getConfidenceColor(conf) : 'text-violet-400';
            return (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Shield className={`h-5 w-5 ${confColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`text-2xl font-bold tabular-nums ${confColor}`}>
                      {conf !== undefined ? `${conf}%` : '—'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      {confLabel && (
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 ${confColor}`}>
                          {confLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {(() => {
            const score = report.metrics.impact_score;
            const severity = score !== undefined ? getImpactSeverity(score) : null;
            return (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${severity?.bgColor || 'bg-amber-500/10'}`}>
                    <Zap className={`h-5 w-5 ${severity?.color || 'text-amber-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold tabular-nums ${severity?.color || 'text-amber-400'}`}>
                        {score ?? '—'}
                      </span>
                      {score !== undefined && (
                        <span className="text-sm text-muted-foreground font-medium">/10</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">Impact Score</span>
                      {severity && (
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${severity.bgColor} ${severity.color}`}>
                          {severity.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Executive Summary */}
      <Card className="rounded-xl border border-border/50">
        <CardHeader className="pb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Executive Summary
          </h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.exec_summary.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0">›</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Intel Sections - Tabbed Interface */}
      <Card className="rounded-xl border border-border/50">
        <CardHeader className="pb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Intelligence Signals
          </h2>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={sectionConfigs.find(c => {
            const s = report.sections[c.key];
            return s && (s.summary || s.highlights.length > 0);
          })?.key || 'messaging'} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-lg">
              {sectionConfigs.map((config) => {
                const section = report.sections[config.key];
                const hasContent = section && (section.summary || section.highlights.length > 0);
                const Icon = config.icon;
                return (
                  <TabsTrigger
                    key={config.key}
                    value={config.key}
                    disabled={!hasContent}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md ${!hasContent ? 'opacity-40' : ''}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className="hidden sm:inline">{config.title.replace(' Intel', '')}</span>
                    <span className="sm:hidden">{config.key.slice(0, 3).toUpperCase()}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {sectionConfigs.map((config) => {
              const section = report.sections[config.key];
              if (!section) return null;
              const Icon = config.icon;

              return (
                <TabsContent key={config.key} value={config.key} className="mt-4">
                  <div className="space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <h3 className="text-base font-semibold text-foreground">{config.title}</h3>
                    </div>

                    {/* Summary */}
                    {section.summary && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {section.summary}
                      </p>
                    )}

                    {/* Highlights */}
                    {section.highlights.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          Key Highlights
                        </h4>
                        <ul className="space-y-2">
                          {section.highlights.map((highlight, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-sm text-foreground p-2.5 rounded-lg bg-muted/20"
                            >
                              <span className={`mt-0.5 ${config.color}`}>›</span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {section.action_items && section.action_items.length > 0 && (
                      <div className="pt-3 border-t border-border/30">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Recommended Actions
                        </h4>
                        <ul className="space-y-2">
                          {section.action_items.map((item, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-sm text-emerald-400 p-2.5 rounded-lg bg-emerald-500/5"
                            >
                              <span className="mt-0.5">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Predictions */}
      {report.predictions && report.predictions.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-4 w-4 text-violet-400" />
              Predictions
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.predictions.map((pred, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${getConfidenceBg(pred.confidence)}`}
                >
                  <p className="text-foreground text-sm mb-2">{pred.prediction}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pred.timeframe}
                    </span>
                    <span>
                      Confidence: <span className={getConfidenceColor(pred.confidence)}>{pred.confidence}%</span>
                    </span>
                    <span>{pred.signals.length} signal{pred.signals.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Mapping */}
      {report.action_mapping && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* This Week Actions */}
          {report.action_mapping.this_week.length > 0 && (
            <Card className="rounded-xl border border-border/50">
              <CardHeader className="pb-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  This Week
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.action_mapping.this_week.map((item, index) => (
                    <div key={index} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">Owner: {item.owner}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monitor Items */}
          {report.action_mapping.monitor.length > 0 && (
            <Card className="rounded-xl border border-border/50">
              <CardHeader className="pb-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Monitor
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.action_mapping.monitor.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/20 space-y-2">
                      <p className="text-sm text-foreground font-medium">{item.signal}</p>
                      <div className="text-xs text-muted-foreground">
                        <span className="text-amber-400 font-medium">Trigger:</span> {item.trigger}
                      </div>
                      <div className="text-xs text-emerald-400">
                        → {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Bets */}
      {report.bets && report.bets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider px-1 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-400" />
            Strategic Bets
          </h2>
          <div className="space-y-3">
            {report.bets.map((bet, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${getConfidenceBg(bet.confidence)}`}
              >
                <p className="text-foreground text-sm mb-3 leading-relaxed">
                  {bet.hypothesis}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Confidence: <span className={getConfidenceColor(bet.confidence)}>{bet.confidence}%</span>
                  </span>
                  <span>
                    {bet.signal_ids.length} signal{bet.signal_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Questions */}
      {report.key_questions && report.key_questions.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-sky-400" />
              Key Questions
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.key_questions.map((question, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="text-sky-400 text-xs mt-0.5 font-medium">Q{index + 1}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Market Winners */}
      {report.market_winners && (
        <MarketWinnersCard
          proven={report.market_winners.proven || []}
          emerging={report.market_winners.emerging || []}
        />
      )}

      {/* Demo CTA */}
      <DemoCtaBanner />
    </div>
  );
};
