import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LAUNCH_PHASE_CONFIG, type LaunchPhase, type LaunchBrief, BRIEF_TYPE_CONFIG } from '@/types/launchOps';

// âââ LaunchTimeline âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Phase progress indicator (6 phases) with brief dots along timeline

const PHASE_ORDER: LaunchPhase[] = [
  'planning',
  'pre_launch',
  'launch_day',
  'post_launch',
  'retrospective',
  'completed',
];

interface LaunchTimelineProps {
  currentPhase: LaunchPhase;
  briefs?: LaunchBrief[];
}

export function LaunchTimeline({ currentPhase, briefs = [] }: LaunchTimelineProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  // Group briefs by the phase they relate to
  const briefsByPhase = briefs.reduce<Record<string, LaunchBrief[]>>((acc, b) => {
    let phase: LaunchPhase = 'planning';
    if (b.brief_type === 'intelligence') phase = 'pre_launch';
    else if (b.brief_type === 'packet') phase = 'launch_day';
    else if (b.brief_type === 'decay') phase = 'post_launch';
    else if (b.brief_type === 'playbook') phase = 'retrospective';

    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(b);
    return acc;
  }, {});

  return (
    <div className="relative">
      {/* Phase steps */}
      <div className="flex items-center justify-between">
        {PHASE_ORDER.map((phase, i) => {
          const config = LAUNCH_PHASE_CONFIG[phase];
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const phaseBriefs = briefsByPhase[phase] || [];

          return (
            <div key={phase} className="flex flex-col items-center relative flex-1">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={`absolute top-3 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    isCompleted ? 'bg-emerald-500/50' : 'bg-border/30'
                  }`}
                  style={{ left: '-50%' }}
                />
              )}

              {/* Phase circle */}
              <div className="relative z-10">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : isCurrent ? (
                  <div className={`h-6 w-6 rounded-full border-2 border-current flex items-center justify-center ${config.color}`}>
                    <div className={`h-2.5 w-2.5 rounded-full bg-current ${config.color} animate-pulse`} />
                  </div>
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground/30" />
                )}
              </div>

              {/* Phase label */}
              <span
                className={`text-xs mt-1.5 text-center leading-tight ${
                  isCurrent ? config.color + ' font-semibold' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'
                }`}
              >
                {config.label}
              </span>

              {/* Brief dots */}
              {phaseBriefs.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {phaseBriefs.slice(0, 5).map((b) => {
                    const briefConfig = BRIEF_TYPE_CONFIG[b.brief_type];
                    return (
                      <div
                        key={b.id}
                        className={`h-1.5 w-1.5 rounded-full ${briefConfig.bgColor}`}
                        title={`${briefConfig.label}: ${b.title}`}
                      />
                    );
                  })}
                  {phaseBriefs.length > 5 && (
                    <span className="text-xs text-muted-foreground/50">+{phaseBriefs.length - 5}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// âââ Small inline phase badge ââââââââââââââââââââââââââââââââââââââââââââââââ

export function PhaseBadge({ phase }: { phase: LaunchPhase }) {
  const config = LAUNCH_PHASE_CONFIG[phase];
  return (
    <Badge variant="outline" className={`text-xs ${config.color} ${config.bgColor} border-transparent`}>
      {config.label}
    </Badge>
  );
}
