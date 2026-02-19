import { IntelPacket } from '@/types/report';
import { ReportCard } from './ReportCard';
import { OnboardingBanner } from './OnboardingBanner';
import { PilotStatusBar } from './PilotStatusBar';
import { IntelligenceOverview } from './IntelligenceOverview';
import { Scan, Orbit, AlertTriangle, RadioTower } from 'lucide-react';
import { IconPacket, IconSignalCount, IconSignalRadio } from '@/components/icons';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useDemo } from '@/contexts/DemoContext';
import { DemoCtaBanner } from '@/components/demo/DemoCtaBanner';
import { mergedPredictions, computeAccuracy, countMarketGaps } from '@/lib/packetUtils';
import { useActionBoardCounts } from '@/hooks/useActionBoardCounts';

interface ReportListProps {
  reports: IntelPacket[];
  onSelectReport: (report: IntelPacket) => void;
}

export const ReportList = ({ reports, onSelectReport }: ReportListProps) => {
  const demo = useDemo();
  const { profile, competitors } = useOnboarding();

  // Aggregate prediction accuracy across all packets
  const avgAccuracy = (() => {
    let totalScored = 0;
    let totalCorrect = 0;
    for (const r of reports) {
      const preds = mergedPredictions(r);
      const stat = computeAccuracy(preds);
      if (stat) {
        totalScored += stat.scored;
        totalCorrect += Math.round(stat.accuracy * stat.scored / 100);
      }
    }
    return totalScored > 0 ? Math.round((totalCorrect / totalScored) * 100) : null;
  })();

  const totalGaps = reports.reduce((sum, r) => sum + countMarketGaps(r), 0);

  // Action board counts per packet
  const packetIds = reports.map(r => r.id);
  const { data: boardCounts } = useActionBoardCounts(packetIds);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground font-mono flex items-center gap-3">
          {demo?.isDemo && (
            <div className="p-2 rounded-lg bg-[hsl(var(--accent-signal)/0.1)] shrink-0">
              <IconSignalRadio className="h-5 w-5 text-accent-signal" />
            </div>
          )}
          <span className="cursor-blink">Control Plane</span>
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          {demo?.isDemo ? (
            <>Weekly GTM intelligence packets</>
          ) : profile?.company_name && competitors && competitors.length > 0 ? (
            <>
              <Scan className="h-4 w-4" />
              Tracking {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
            </>
          ) : (
            <>Weekly GTM intelligence packets</>
          )}
        </p>
      </div>

      {/* Pilot Status (hidden in demo) */}
      {!demo?.isDemo && <PilotStatusBar />}

      {/* Onboarding Banner (hidden in demo) */}
      {!demo?.isDemo && <OnboardingBanner />}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-[hsl(var(--accent-signal)/0.1)]">
              <IconPacket className="h-3.5 w-3.5 text-accent-signal" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">{reports.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Intel Packets</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <IconSignalCount className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">
            {reports.filter(r => r.status === 'live').length}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Live</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-amber-500/10">
              <Orbit className="h-3.5 w-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {avgAccuracy !== null ? `${avgAccuracy}%` : '--'}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Prediction Accuracy</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-rose-500/10">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 tabular-nums">
            {totalGaps}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Market Gaps</div>
        </div>
      </div>

      {/* Intelligence Overview — Knowledge Ledger + Compounding */}
      <IntelligenceOverview />

      {/* Report Cards */}
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => onSelectReport(report)}
              isPersonalized={!!profile?.company_name}
              actionBoardCount={boardCounts?.[report.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-[hsl(var(--accent-signal)/0.1)]">
              <RadioTower className="h-6 w-6 text-accent-signal" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">No intelligence packets yet</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your first evidence-grade intel packet will be generated on the next scheduled run.
            All claims will be source-verified against real competitive signals.
          </p>
        </div>
      )}

      {/* Demo CTA */}
      <DemoCtaBanner />
    </div>
  );
};
