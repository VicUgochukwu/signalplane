import { Calendar, FileText, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReadinessGauge } from './ReadinessGauge';
import { PhaseBadge } from './LaunchTimeline';
import { LAUNCH_TYPE_CONFIG, type LaunchListItem } from '@/types/launchOps';

// âââ LaunchCard âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// List item: name, product, phase badge, readiness mini-gauge, days countdown, brief count

interface LaunchCardProps {
  launch: LaunchListItem;
  onClick: () => void;
}

export function LaunchCard({ launch, onClick }: LaunchCardProps) {
  const typeConfig = LAUNCH_TYPE_CONFIG[launch.launch_type];
  const daysUntil = launch.days_until_launch;

  let countdownLabel: string;
  let countdownColor: string;

  if (daysUntil > 7) {
    countdownLabel = `${daysUntil}d`;
    countdownColor = 'text-blue-400';
  } else if (daysUntil > 0) {
    countdownLabel = `${daysUntil}d`;
    countdownColor = 'text-amber-400';
  } else if (daysUntil === 0) {
    countdownLabel = 'Today!';
    countdownColor = 'text-orange-400';
  } else {
    countdownLabel = `T+${Math.abs(daysUntil)}d`;
    countdownColor = 'text-muted-foreground';
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border/50 bg-card p-4 hover:border-border hover:bg-muted/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Name + meta */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">
              {launch.launch_name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{launch.product_name}</span>
            <span>â¢</span>
            <span>{typeConfig.label}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <PhaseBadge phase={launch.phase} />
            {launch.competitor_names && launch.competitor_names.length > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                vs {launch.competitor_names.slice(0, 2).join(', ')}
                {launch.competitor_names.length > 2 && ` +${launch.competitor_names.length - 2}`}
              </Badge>
            )}
            {launch.tags && launch.tags.length > 0 && launch.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Right: Score + countdown */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {launch.readiness_score > 0 && (
            <ReadinessGauge score={launch.readiness_score} compact />
          )}

          <div className={`text-sm font-mono font-bold ${countdownColor}`}>
            {countdownLabel}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(launch.target_launch_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          {launch.brief_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{launch.brief_count} briefs</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
