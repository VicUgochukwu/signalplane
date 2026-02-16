import { usePilot } from '@/hooks/usePilot';
import { IconPilotTimer } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

/**
 * Status bar shown at the top of the Control Plane dashboard.
 * - Pilot: shows countdown with days remaining
 * - Grace: shows urgent warning
 * - Free: shows upgrade CTA
 * - Paid: shows tier badge (subtle)
 */
export function PilotStatusBar() {
  const { tier, status, daysRemaining, daysElapsed, isPilot, isGrace, isFree, isPaid, isLoading } = usePilot();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return null;

  // Paid users: subtle badge, no bar
  if (isPaid) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
        <span className="text-xs font-medium text-emerald-400 capitalize">{tier} Plan</span>
      </div>
    );
  }

  // Pilot: countdown bar
  if (isPilot) {
    const progressPercent = Math.min(100, Math.round((daysElapsed / 60) * 100));

    return (
      <div className="rounded-xl border border-[hsl(var(--accent-signal)/0.2)] bg-[hsl(var(--accent-signal)/0.05)] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--accent-signal)/0.1)]">
              <IconPilotTimer className="h-4 w-4 text-accent-signal" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your pilot
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full access to all features. Day {daysElapsed} of 60.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-signal transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // Grace period: urgent warning
  if (isGrace) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <IconPilotTimer className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-400">
                Your pilot ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to keep all features, or stay on the free plan with 2 competitors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg"
            >
              Upgrade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-7 w-7 p-0 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Free tier: upgrade CTA
  if (isFree) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10">
              <IconPilotTimer className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Free Plan — 2 competitors
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to Growth for 5 competitors, team seats, Judgment Loop scoring, and more. Or Enterprise for 10.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-accent-signal hover:bg-accent-signal/90 text-white text-xs rounded-lg"
            >
              Upgrade to Growth
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-7 w-7 p-0 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
