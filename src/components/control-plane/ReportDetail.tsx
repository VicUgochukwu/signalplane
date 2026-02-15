import { useEffect, useMemo, useState } from 'react';
import { IntelPacket, PacketStatus, IntelSection, SectionKey } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, HelpCircle,
  Clock, AlertTriangle, CheckCircle2, Mail, Download, Loader2, Eye, Brain
} from 'lucide-react';
import {
  IconSignalRadio, IconSignalCount, IconConfidence,
  IconSignalMessaging, IconSignalICP, IconSignalObjection,
  IconSignalSocial, IconSignalEnablement
} from '@/components/icons';
import { format, parseISO } from 'date-fns';
import { MarketWinnersCard } from './MarketWinnersCard';
import { IconSignalHorizon } from '@/components/icons';
import { useExportPacket } from '@/hooks/useExportPacket';
import { mergedPredictions, computeAccuracy } from '@/lib/packetUtils';
import { useDemo } from '@/contexts/DemoContext';
import { DemoCtaBanner } from '@/components/demo/DemoCtaBanner';
import { useTeam } from '@/hooks/useTeam';
import { useTierGate } from '@/hooks/useTierGate';
import type { TeamRole } from '@/types/teams';
import type { Prediction } from '@/types/report';

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

// ──────────────────────────────────────────────────────
// Merged 3-tab structure:
//   "Competitive Changes" = messaging + narrative
//   "Market Direction"    = icp + horizon
//   "Objections"          = objection (standalone)
// ──────────────────────────────────────────────────────
type MergedTabKey = 'competitive' | 'market' | 'objections' | 'social' | 'enablement';

interface MergedTabConfig {
  key: MergedTabKey;
  title: string;
  shortTitle: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  color: string;
  sourceKeys: SectionKey[];
}

const mergedTabConfigs: MergedTabConfig[] = [
  {
    key: 'competitive',
    title: 'Competitive Changes',
    shortTitle: 'Changes',
    icon: IconSignalMessaging,
    color: 'text-sky-400',
    sourceKeys: ['messaging', 'narrative'],
  },
  {
    key: 'market',
    title: 'Market Direction',
    shortTitle: 'Market',
    icon: IconSignalICP,
    color: 'text-emerald-400',
    sourceKeys: ['icp', 'horizon'],
  },
  {
    key: 'objections',
    title: 'Objections & Risk',
    shortTitle: 'Objections',
    icon: IconSignalObjection,
    color: 'text-rose-400',
    sourceKeys: ['objection'],
  },
  {
    key: 'social',
    title: 'Social Intelligence',
    shortTitle: 'Social',
    icon: IconSignalSocial,
    color: 'text-violet-400',
    sourceKeys: ['social'],
  },
  {
    key: 'enablement',
    title: 'Sales Enablement',
    shortTitle: 'Enablement',
    icon: IconSignalEnablement,
    color: 'text-amber-400',
    sourceKeys: ['enablement'],
  },
];

/** Merge highlights from multiple source sections */
function mergeSections(report: IntelPacket, sourceKeys: SectionKey[]): { summary: string; highlights: string[] } {
  const summaryParts: string[] = [];
  const highlights: string[] = [];

  for (const key of sourceKeys) {
    const s = report.sections[key];
    if (!s) continue;
    if (s.summary) summaryParts.push(s.summary);
    if (s.highlights?.length) highlights.push(...s.highlights);
  }

  return {
    summary: summaryParts.join(' '),
    highlights,
  };
}

/**
 * Role-based visibility rules (updated):
 * - executive: exec_summary, metrics, key_questions, predictions, market_winners
 * - sales: exec_summary, metrics, key_questions, objection tab, action_mapping
 * - pmm/admin: full packet
 */
type ViewMode = 'full' | 'executive' | 'sales';

const ROLE_VIEW_MAP: Record<TeamRole, ViewMode> = {
  admin: 'full',
  pmm: 'full',
  sales: 'sales',
  executive: 'executive',
};

const VIEW_TAB_KEYS: Record<ViewMode, MergedTabKey[] | 'all'> = {
  full: 'all',
  executive: [],
  sales: ['objections'],
};

const VIEW_MODE_LABELS: Record<ViewMode, { label: string; color: string }> = {
  full: { label: 'Full View', color: 'bg-primary/10 text-primary border-primary/20' },
  executive: { label: 'Exec View', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  sales: { label: 'Sales View', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
};

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

const normalizeImpact = (raw: number): number => {
  if (raw > 10) return Math.round(raw / 10 * 10) / 10;
  return raw;
};

const getImpactSeverity = (score: number): { label: string; color: string; bgColor: string } => {
  const n = normalizeImpact(score);
  if (n >= 9) return { label: 'Critical', color: 'text-rose-400', bgColor: 'bg-rose-500/10' };
  if (n >= 7) return { label: 'High', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
  if (n >= 4) return { label: 'Moderate', color: 'text-sky-400', bgColor: 'bg-sky-500/10' };
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

// computeAccuracy and mergedPredictions imported from @/lib/packetUtils

export const ReportDetail = ({ report, onBack }: ReportDetailProps) => {
  const status = statusConfig[report.status];
  const formattedStartDate = format(parseISO(report.week_start), 'MMM d');
  const formattedEndDate = format(parseISO(report.week_end), 'MMM d, yyyy');
  const { emailPacket, isEmailing, downloadAsMarkdown } = useExportPacket();
  const demo = useDemo();
  const { role } = useTeam();
  const { canUse } = useTierGate();

  const defaultView: ViewMode = role ? ROLE_VIEW_MAP[role] : 'full';
  const [activeView, setActiveView] = useState<ViewMode>(defaultView);
  const roleViewsEnabled = canUse('role_views');

  useEffect(() => {
    if (role && roleViewsEnabled) {
      setActiveView(ROLE_VIEW_MAP[role]);
    }
  }, [role, roleViewsEnabled]);

  // Merged tab visibility
  const visibleTabs = useMemo(() => {
    const allowedKeys = VIEW_TAB_KEYS[activeView];
    if (allowedKeys === 'all') return mergedTabConfigs;
    return mergedTabConfigs.filter(c => allowedKeys.includes(c.key));
  }, [activeView]);

  const showExecSummary = true;
  const showMetrics = true;
  const showKeyQuestions = true;
  const showIntelSections = visibleTabs.length > 0;
  const showPredictions = activeView === 'full' || activeView === 'executive';
  const showActionMapping = activeView === 'full' || activeView === 'sales';
  const showMarketWinners = activeView === 'full' || activeView === 'executive';

  // Merged predictions (bets folded in)
  const allPredictions = useMemo(() => mergedPredictions(report), [report]);

  // Judgment loop as inline stat in header
  const accuracyStat = useMemo(() => computeAccuracy(allPredictions), [allPredictions]);

  useEffect(() => {
    demo?.trackExploration('view_packet');
  }, [report.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="animate-slide-up space-y-6">
      {/* ─── Header ─── */}
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
          <div className="p-3 rounded-xl bg-primary/10 shrink-0 text-primary">
            <IconSignalRadio className="h-8 w-8" />
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
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">{formattedStartDate} – {formattedEndDate}</p>
              {/* Judgment loop accuracy — inline header stat */}
              {accuracyStat && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1 border-violet-500/20 bg-violet-500/5 text-violet-400">
                  <Brain className="h-3 w-3" />
                  {accuracyStat.accuracy}% prediction accuracy ({accuracyStat.scored} scored)
                </Badge>
              )}
            </div>
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

      {/* ─── View Switcher ─── */}
      {roleViewsEnabled && (
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">View:</span>
          {(['full', 'executive', 'sales'] as ViewMode[]).map((mode) => {
            const modeConfig = VIEW_MODE_LABELS[mode];
            const isActive = activeView === mode;
            return (
              <button
                key={mode}
                onClick={() => setActiveView(mode)}
                className={`
                  text-xs px-2.5 py-1 rounded-md border transition-all
                  ${isActive
                    ? modeConfig.color + ' font-medium'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                {modeConfig.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── 1. Metrics Grid ─── */}
      {showMetrics && report.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <IconSignalRadio className="h-5 w-5" />
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
                    <IconConfidence className={`h-5 w-5 ${confColor}`} />
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
            const rawScore = report.metrics.impact_score;
            const displayScore = rawScore !== undefined ? normalizeImpact(rawScore) : undefined;
            const severity = rawScore !== undefined ? getImpactSeverity(rawScore) : null;
            return (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${severity?.bgColor || 'bg-amber-500/10'}`}>
                    <IconSignalCount className={`h-5 w-5 ${severity?.color || 'text-amber-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold tabular-nums ${severity?.color || 'text-amber-400'}`}>
                        {displayScore ?? '—'}
                      </span>
                      {displayScore !== undefined && (
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

      {/* ─── 2. Executive Summary ─── */}
      {showExecSummary && (
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
      )}

      {/* ─── 3. Key Questions — primes the reader before intel ─── */}
      {showKeyQuestions && report.key_questions && report.key_questions.length > 0 && (
        <Card className="rounded-xl border border-sky-500/20 bg-sky-500/[0.02]">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-sky-400" />
              This Week&apos;s Key Questions
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.key_questions.map((question, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="text-sky-400 text-xs mt-0.5 font-semibold shrink-0">Q{index + 1}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ─── 4. Intelligence Signals — 3 merged tabs ─── */}
      {showIntelSections && visibleTabs.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Intelligence Signals
            </h2>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={
                visibleTabs.find(t => {
                  const merged = mergeSections(report, t.sourceKeys);
                  return merged.summary || merged.highlights.length > 0;
                })?.key || visibleTabs[0]?.key
              }
              className="w-full"
            >
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-lg">
                {visibleTabs.map((config) => {
                  const merged = mergeSections(report, config.sourceKeys);
                  const hasContent = merged.summary || merged.highlights.length > 0;
                  const Icon = config.icon;
                  return (
                    <TabsTrigger
                      key={config.key}
                      value={config.key}
                      disabled={!hasContent}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md ${!hasContent ? 'opacity-40' : ''}`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      <span className="hidden sm:inline">{config.title}</span>
                      <span className="sm:hidden">{config.shortTitle}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {visibleTabs.map((config) => {
                const merged = mergeSections(report, config.sourceKeys);
                if (!merged.summary && merged.highlights.length === 0) return null;
                const Icon = config.icon;

                return (
                  <TabsContent key={config.key} value={config.key} className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <h3 className="text-base font-semibold text-foreground">{config.title}</h3>
                      </div>

                      {merged.summary && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {merged.summary}
                        </p>
                      )}

                      {merged.highlights.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Key Highlights
                          </h4>
                          <ul className="space-y-2">
                            {merged.highlights.map((highlight, index) => (
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
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* ─── 5. Predictions & Hypotheses (bets merged in) ─── */}
      {showPredictions && allPredictions.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <IconSignalHorizon className="h-4 w-4 text-violet-400" />
              Predictions &amp; Hypotheses
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allPredictions.map((pred, index) => {
                const outcomeBadge = pred.outcome ? {
                  correct: { label: '✓ Correct', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  incorrect: { label: '✗ Incorrect', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                  partial: { label: '~ Partial', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                  pending: { label: '◷ Pending', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
                }[pred.outcome] : null;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${getConfidenceBg(pred.confidence)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-foreground text-sm flex-1">{pred.prediction}</p>
                      {outcomeBadge && (
                        <Badge variant="outline" className={`text-xs shrink-0 ${outcomeBadge.cls}`}>
                          {outcomeBadge.label}
                        </Badge>
                      )}
                    </div>
                    {pred.outcome_notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border/50 pl-3">
                        {pred.outcome_notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 6. Market Winners ─── */}
      {showMarketWinners && report.market_winners && (
        <MarketWinnersCard
          proven={report.market_winners.proven || []}
          emerging={report.market_winners.emerging || []}
        />
      )}

      {/* ─── 7. Action Mapping ─── */}
      {showActionMapping && report.action_mapping && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Demo CTA */}
      <DemoCtaBanner />
    </div>
  );
};
