import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rocket, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLaunchOps } from '@/hooks/useLaunchOps';
import { LaunchCard, LaunchRegistrationForm, LaunchDetailView } from '@/components/launch-ops';
import { LAUNCH_PHASE_CONFIG, type LaunchPhase } from '@/types/launchOps';

export default function LaunchOps() {
  const { launchId } = useParams<{ launchId: string }>();
  const navigate = useNavigate();
  const { launches, isLoading } = useLaunchOps();
  const [registerOpen, setRegisterOpen] = useState(false);

  // âââ Detail view ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (launchId) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
        <LaunchDetailView
          launchId={launchId}
          onBack={() => navigate('/control-plane/launches')}
        />
      </div>
    );
  }

  // âââ Registry view ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // Group launches by phase
  const phaseOrder: LaunchPhase[] = ['launch_day', 'pre_launch', 'post_launch', 'planning', 'retrospective', 'completed'];
  const grouped = phaseOrder.reduce<Record<LaunchPhase, typeof launches>>((acc, phase) => {
    acc[phase] = launches.filter((l) => l.phase === phase);
    return acc;
  }, {} as Record<LaunchPhase, typeof launches>);

  const activeLaunches = launches.filter((l) => l.phase !== 'completed');
  const completedLaunches = launches.filter((l) => l.phase === 'completed');

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Rocket className="h-6 w-6 text-orange-400" />
            Launch Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your product launches through their full lifecycle â planning to retrospective
          </p>
        </div>
        <Button
          onClick={() => setRegisterOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Launch</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Stats row */}
      {launches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatBox label="Active" value={activeLaunches.length} color="text-orange-400" />
          <StatBox
            label="Pre-Launch"
            value={grouped.pre_launch.length}
            color="text-amber-400"
          />
          <StatBox
            label="Post-Launch"
            value={grouped.post_launch.length}
            color="text-purple-400"
          />
          <StatBox
            label="Completed"
            value={completedLaunches.length}
            color="text-emerald-400"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && launches.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
          <Rocket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No launches yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Register your first product launch to start tracking it through planning, pre-launch intelligence,
            launch day, post-launch decay monitoring, and retrospective playbook generation.
          </p>
          <Button onClick={() => setRegisterOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Register First Launch
          </Button>
        </div>
      )}

      {/* Launch list grouped by phase */}
      {!isLoading && launches.length > 0 && (
        <div className="space-y-6">
          {phaseOrder.map((phase) => {
            const items = grouped[phase];
            if (items.length === 0) return null;
            const config = LAUNCH_PHASE_CONFIG[phase];

            return (
              <div key={phase}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${config.color}`}>
                  {config.label} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((launch) => (
                    <LaunchCard
                      key={launch.id}
                      launch={launch}
                      onClick={() => navigate(`/control-plane/launches/${launch.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration dialog */}
      <LaunchRegistrationForm open={registerOpen} onOpenChange={setRegisterOpen} />
    </div>
  );
}

// âââ Stat Box ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
