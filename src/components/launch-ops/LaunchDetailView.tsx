import { ArrowLeft, Calendar, Rocket, Loader2, AlertTriangle, CheckCircle2, TrendingDown, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLaunchDetail } from '@/hooks/useLaunchOps';
import { ReadinessGauge } from './ReadinessGauge';
import { LaunchTimeline, PhaseBadge } from './LaunchTimeline';
import { LaunchBriefCard } from './LaunchBriefCard';
import {
  LAUNCH_TYPE_CONFIG,
  MOMENTUM_STATUS_CONFIG,
  type DecayReport,
  type ReadinessCheck,
  type LaunchPlaybook,
} from '@/types/launchOps';

// âââ LaunchDetailView âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface LaunchDetailViewProps {
  launchId: string;
  onBack: () => void;
}

export function LaunchDetailView({ launchId, onBack }: LaunchDetailViewProps) {
  const { data: detail, isLoading } = useLaunchDetail(launchId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail || !detail.launch) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Launch not found.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to launches
        </Button>
      </div>
    );
  }

  const { launch, briefs, readiness_checks, decay_reports, playbook } = detail;
  const typeConfig = LAUNCH_TYPE_CONFIG[launch.launch_type];
  const daysUntil = Math.round(
    (new Date(launch.target_launch_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div>
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to launches
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Rocket className="h-5 w-5 text-orange-400" />
              {launch.launch_name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{launch.product_name}</span>
              <span>â¢</span>
              <span>{typeConfig.label}</span>
              <span>â¢</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(launch.target_launch_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <PhaseBadge phase={launch.phase} />
              {launch.competitor_names && launch.competitor_names.map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  vs {c}
                </Badge>
              ))}
              {daysUntil > 0 && (
                <span className="text-sm font-mono font-bold text-amber-400">
                  T-{daysUntil}d
                </span>
              )}
              {daysUntil === 0 && (
                <span className="text-sm font-mono font-bold text-orange-400">
                  Launch Day
                </span>
              )}
              {daysUntil < 0 && (
                <span className="text-sm font-mono text-muted-foreground">
                  T+{Math.abs(daysUntil)}d
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Readiness Gauge */}
      {launch.readiness_score > 0 && (
        <Card className="rounded-xl border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">
              Launch Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReadinessGauge
              score={launch.readiness_score}
              breakdown={launch.readiness_breakdown}
            />
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="rounded-xl border border-border/50">
        <CardContent className="pt-6">
          <LaunchTimeline currentPhase={launch.phase} briefs={briefs} />
        </CardContent>
      </Card>

      {/* Tabs: Briefs / Readiness / Decay / Playbook */}
      <Tabs defaultValue="briefs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="briefs" className="gap-1.5">
            Briefs
            {briefs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 text-xs">
                {briefs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="readiness" className="gap-1.5">
            Readiness
            {readiness_checks.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 text-xs">
                {readiness_checks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decay" className="gap-1.5">
            Decay
            {decay_reports.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 text-xs">
                {decay_reports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="playbook">Playbook</TabsTrigger>
        </TabsList>

        {/* Briefs Tab */}
        <TabsContent value="briefs">
          {briefs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No briefs yet"
              description="Intelligence briefs, launch packets, and decay reports will appear here as they are generated."
            />
          ) : (
            <div className="space-y-2">
              {briefs.map((b) => (
                <LaunchBriefCard key={b.id} brief={b} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Readiness Tab */}
        <TabsContent value="readiness">
          {readiness_checks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="No readiness checks yet"
              description="Daily readiness scores will appear here once the pre-launch phase begins."
            />
          ) : (
            <div className="space-y-3">
              {readiness_checks.map((rc) => (
                <ReadinessCheckCard key={rc.id} check={rc} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Decay Tab */}
        <TabsContent value="decay">
          {decay_reports.length === 0 ? (
            <EmptyState
              icon={<TrendingDown className="h-8 w-8" />}
              title="No decay reports yet"
              description="Weekly post-launch decay monitoring (4 weeks) will appear after launch day."
            />
          ) : (
            <div className="space-y-3">
              {decay_reports.map((dr) => (
                <DecayReportCard key={dr.id} report={dr} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Playbook Tab */}
        <TabsContent value="playbook">
          {playbook ? (
            <PlaybookView playbook={playbook} />
          ) : (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No playbook yet"
              description="The retrospective playbook is generated at T+30 days after launch."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// âââ Sub-components âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12 rounded-xl border border-border/50 bg-card">
      <div className="text-muted-foreground/30 mx-auto mb-3">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function ReadinessCheckCard({ check }: { check: ReadinessCheck }) {
  return (
    <Card className="rounded-lg border border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {new Date(check.check_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <ReadinessGauge score={check.score} compact />
        </div>

        {/* Dimension breakdown */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Landscape', score: check.competitor_landscape_score },
            { label: 'Messaging', score: check.messaging_readiness_score },
            { label: 'Timing', score: check.market_timing_score },
            { label: 'Objections', score: check.objection_coverage_score },
            { label: 'Battlecards', score: check.battlecard_freshness_score },
          ].map((d) => (
            <div key={d.label} className="text-center">
              <div className={`text-sm font-bold tabular-nums ${
                d.score >= 80 ? 'text-emerald-400' : d.score >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {d.score}
              </div>
              <div className="text-xs text-muted-foreground truncate">{d.label}</div>
            </div>
          ))}
        </div>

        {/* Risk factors */}
        {check.risk_factors && Array.isArray(check.risk_factors) && check.risk_factors.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" /> Risks
            </div>
            <ul className="space-y-0.5">
              {(check.risk_factors as Array<{ label: string; detail: string }>).map((r, i) => (
                <li key={i} className="text-xs text-foreground/80">
                  <span className="font-medium">{r.label}:</span> {r.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DecayReportCard({ report }: { report: DecayReport }) {
  const momentumConfig = MOMENTUM_STATUS_CONFIG[report.momentum_status];

  return (
    <Card className="rounded-lg border border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Week {report.week_number}
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </span>
          <Badge variant="outline" className={`text-xs ${momentumConfig.color} ${momentumConfig.bgColor} border-transparent`}>
            {momentumConfig.label}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-lg font-bold tabular-nums">{report.messaging_drift_score}%</div>
            <div className="text-xs text-muted-foreground">Drift</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-lg font-bold tabular-nums">{report.homepage_change_count}</div>
            <div className="text-xs text-muted-foreground">Page Changes</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-lg font-bold tabular-nums">{report.competitor_response_count}</div>
            <div className="text-xs text-muted-foreground">Competitor Moves</div>
          </div>
        </div>

        {report.competitor_reactions && Array.isArray(report.competitor_reactions) && report.competitor_reactions.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Competitor Reactions
            </div>
            <div className="space-y-1">
              {(report.competitor_reactions as Array<{ competitor: string; reaction: string }>).map((cr, i) => (
                <div key={i} className="text-xs text-foreground/80">
                  <span className="font-medium">{cr.competitor}:</span> {cr.reaction}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlaybookView({ playbook }: { playbook: LaunchPlaybook }) {
  const momentumConfig = playbook.final_momentum_status
    ? MOMENTUM_STATUS_CONFIG[playbook.final_momentum_status]
    : null;

  return (
    <Card className="rounded-xl border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          {playbook.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-lg font-bold tabular-nums">{playbook.total_briefs_generated}</div>
            <div className="text-xs text-muted-foreground">Briefs</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-lg font-bold tabular-nums">{playbook.total_signals_consumed}</div>
            <div className="text-xs text-muted-foreground">Signals</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="text-lg font-bold tabular-nums">{playbook.peak_readiness_score}</div>
            <div className="text-xs text-muted-foreground">Peak Readiness</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            {momentumConfig ? (
              <>
                <div className={`text-lg font-bold ${momentumConfig.color}`}>
                  {momentumConfig.label}
                </div>
                <div className="text-xs text-muted-foreground">Momentum</div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-muted-foreground">â</div>
                <div className="text-xs text-muted-foreground">Momentum</div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {playbook.content_md ? (
          <div className="prose prose-sm prose-invert max-w-none text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">
            {playbook.content_md}
          </div>
        ) : playbook.content_json && Object.keys(playbook.content_json).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(playbook.content_json).map(([key, value]) => (
              <div key={key}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-foreground/80">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Playbook content will be populated after the retrospective.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
