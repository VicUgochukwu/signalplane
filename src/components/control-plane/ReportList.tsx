import { IntelPacket } from '@/types/report';
import { ReportCard } from './ReportCard';
import { OnboardingBanner } from './OnboardingBanner';
import { PilotStatusBar } from './PilotStatusBar';
import { IntelligenceOverview } from './IntelligenceOverview';
import { Target } from 'lucide-react';
import { IconPacket, IconSignalCount, IconConfidence, IconSignalRadio, IconPersonaRevenue } from '@/components/icons';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useDemo } from '@/contexts/DemoContext';
import { DemoCtaBanner } from '@/components/demo/DemoCtaBanner';

interface ReportListProps {
  reports: IntelPacket[];
  onSelectReport: (report: IntelPacket) => void;
}

export const ReportList = ({ reports, onSelectReport }: ReportListProps) => {
  const demo = useDemo();
  const { profile, competitors } = useOnboarding();
  const totalSignals = reports.reduce((sum, r) => sum + (r.metrics?.signals_detected || 0), 0);
  const avgConfidence = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + (r.metrics?.confidence_score || 0), 0) / reports.length)
    : 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground font-mono flex items-center gap-3">
          {demo?.isDemo && (
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <IconSignalRadio className="h-5 w-5 text-primary" />
            </div>
          )}
          {demo?.isDemo ? (
            <span className="cursor-blink">Control Plane</span>
          ) : profile?.company_name ? (
            <span className="cursor-blink">{profile.company_name} Control Plane</span>
          ) : (
            <span className="cursor-blink">Control Plane</span>
          )}
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          {demo?.isDemo ? (
            <>Weekly GTM intelligence packets</>
          ) : profile?.company_name && competitors && competitors.length > 0 ? (
            <>
              <Target className="h-4 w-4" />
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
            <div className="p-1.5 rounded-md bg-primary/10">
              <IconPacket className="h-3.5 w-3.5 text-primary" />
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
            <div className="p-1.5 rounded-md bg-sky-500/10">
              <IconPersonaRevenue className="h-3.5 w-3.5 text-sky-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-400 tabular-nums">
            {totalSignals}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Signals Detected</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-violet-500/10">
              <IconConfidence className="h-3.5 w-3.5 text-violet-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-violet-400 tabular-nums">
            {avgConfidence}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Avg Confidence</div>
        </div>
      </div>

      {/* Intelligence Overview — Knowledge Ledger + Compounding */}
      <IntelligenceOverview />

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onClick={() => onSelectReport(report)}
            isPersonalized={!!profile?.company_name}
          />
        ))}
      </div>

      {/* Demo CTA */}
      <DemoCtaBanner />
    </div>
  );
};
