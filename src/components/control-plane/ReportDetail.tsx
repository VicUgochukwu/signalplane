import { useEffect, useMemo, useState } from 'react';
import { IntelPacket, PacketStatus, IntelSection, SectionKey } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, HelpCircle, Target,
  Clock, AlertTriangle, CheckCircle2, Mail, Download, Loader2, Eye
} from 'lucide-react';
import {
  IconSignalRadio, IconSignalCount, IconConfidence,
  IconSignalMessaging, IconSignalNarrative, IconSignalICP,
  IconSignalHorizon, IconSignalObjection
} from '@/components/icons';
import { format, parseISO } from 'date-fns';
import { MarketWinnersCard } from './MarketWinnersCard';
import { JudgmentLoopCard } from './JudgmentLoopCard';
import { useExportPacket } from '@/hooks/useExportPacket';
import { useDemo } from '@/contexts/DemoContext';
import { DemoCtaBanner } from '@/components/demo/DemoCtaBanner';
import { useTeam } from '@/hooks/useTeam';
import { useTierGate } from '@/hooks/useTierGate';
import type { TeamRole } from '@/types/teams';

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
  icon: (props: { className?: string }) => React.JSX.Element;
  color: string;
}

const sectionConfigs: SectionConfig[] = [
  { key: 'messaging', title: 'Messaging Intel', icon: IconSignalMessaging, color: 'text-sky-400' },
  { key: 'narrative', title: 'Narrative Intel', icon: IconSignalNarrative, color: 'text-violet-400' },
  { key: 'icp', title: 'ICP Intel', icon: IconSignalICP, color: 'text-emerald-400' },
  { key: 'horizon', title: 'Horizon Intel', icon: IconSignalHorizon, color: 'text-amber-400' },
  { key: 'objection', title: 'Objection Intel', icon: IconSignalObjection, color: 'text-rose-400' },
];

/**
 * Role-based visibility rules:
 * - executive: exec_summary, metrics, bets, predictions, judgment_loop, market_winners
 * - sales: exec_summary, metrics, objection section, action_mapping
 * - pmm: full packet (all sections)
 * - admin: full packet (all sections) + annotations (future)
 * - null (no team/no role): full packet (default PMM view)
 */
type ViewMode = 'full' | 'executive' | 'sales';

const ROLE_VIEW_MAP: Record<TeamRole, ViewMode> = {
  admin: 'full',
  pmm: 'full',
  sales: 'sales',
  executive: 'executive',
};

/** Which intel section keys are visible per view mode */
const VIEW_SECTION_KEYS: Record<ViewMode, SectionKey[] | 'all'> = {
  full: 'all',
  executive: [], // executives don't see individual intel sections
  sales: ['objection'], // sales only sees objection intel
};

/** Label for the view mode badge */
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

/** Normalize raw impact score (could be 0-10 or 0-100) to a 0-10 scale */
const normalizeImpact = (raw: number): number => {
  if (raw > 10) return Math.round(raw / 10 * 10) / 10; // e.g. 84 → 8.4
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

export const ReportDetail = ({ report, onBack }: ReportDetailProps) => {
  const status = statusConfig[report.status];
  const formattedStartDate = format(parseISO(report.week_start), 'MMM d');
  const formattedEndDate = format(parseISO(report.week_end), 'MMM d, yyyy');
  const { emailPacket, isEmailing, downloadAsMarkdown } = useExportPacket();
  const demo = useDemo();
  const { role } = useTeam();
  const { canUse } = useTierGate();

  // Determine the default view based on user's team role
  const defaultView: ViewMode = role ? ROLE_VIEW_MAP[role] : 'full';
  const [activeView, setActiveView] = useState<ViewMode>(defaultView);

  // Role-based views are only available on Growth+ tiers
  const roleViewsEnabled = canUse('role_views');

  // Update activeView if role changes
  useEffect(() => {
    if (role && roleViewsEnabled) {
      setActiveView(ROLE_VIEW_MAP[role]);
    }
  }, [role, roleViewsEnabled]);

  // Filter section configs based on view mode
  const visibleSectionConfigs = useMemo(() => {
    const allowedKeys = VIEW_SECTION_KEYS[activeView];
    if (allowedKeys === 'all') return sectionConfigs;
    return sectionConfigs.filter(c => allowedKeys.includes(c.key));
  }, [activeView]);

  // Visibility helpers for each packet section
  const showExecSummary = true; // All views see exec summary
  const showMetrics = true; // All views see metrics
  const showIntelSections = visibleSectionConfigs.length > 0;
  const showPredictions = activeView === 'full' || activeView === 'executive';
  const showJudgmentLoop = activeView === 'full' || activeView === 'executive';
  const showActionMapping = activeView === 'full' || activeView === 'sales';
  const showBets = activeView === 'full' || activeView === 'executive';
  const showKeyQuestions = activeView === 'full';
  const showMarketWinners = activeView === 'full' || activeView === 'executive';

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

      {/* Role-based View Switcher — only shown if role_views feature is enabled */}
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

      {/* Metrics Grid */}
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

      {/* Executive Summary */}
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

      {/* Intel Sections - Tabbed Interface (filtered by role) */}
      {showIntelSections && visibleSectionConfigs.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Intelligence Signals
            </h2>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={visibleSectionConfigs.find(c => {
              const s = report.sections[c.key];
              return s && (s.summary || s.highlights.length > 0);
            })?.key || visibleSectionConfigs[0]?.key} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1 rounded-lg">
                {visibleSectionConfigs.map((config) => {
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

              {visibleSectionConfigs.map((config) => {
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
      )}

      {/* Predictions */}
      {showPredictions && report.predictions && report.predictions.length > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <IconSignalHorizon className="h-4 w-4 text-violet-400" />
              Predictions
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.predictions.map((pred, index) => {
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

      {/* Judgment Loop */}
      {showJudgmentLoop && report.judgment_loop && (
        <JudgmentLoopCard
          judgmentLoop={report.judgment_loop}
          predictions={report.predictions}
        />
      )}

      {/* Action Mapping */}
      {showActionMapping && report.action_mapping && (
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
      {showBets && report.bets && report.bets.length > 0 && (
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
      {showKeyQuestions && report.key_questions && report.key_questions.length > 0 && (
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
      {showMarketWinners && report.market_winners && (
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
