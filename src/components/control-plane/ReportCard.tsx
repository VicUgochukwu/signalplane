import { IntelPacket, PacketStatus } from '@/types/report';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Radio } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ReportCardProps {
  report: IntelPacket;
  onClick: () => void;
}

const statusConfig: Record<PacketStatus, { label: string; class: string }> = {
  live: { label: 'LIVE', class: 'badge-success' },
  published: { label: 'PUBLISHED', class: 'badge-info' },
  draft: { label: 'DRAFT', class: 'badge-warning' },
  archived: { label: 'ARCHIVED', class: 'badge-error' },
};

export const ReportCard = ({ report, onClick }: ReportCardProps) => {
  const status = statusConfig[report.status];
  const formattedDate = format(parseISO(report.date), 'MMM d, yyyy');

  return (
    <Card 
      className="cursor-pointer card-terminal card-hover"
      style={{ boxShadow: 'var(--shadow-card)' }}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground leading-tight font-mono text-sm">
                {report.headline}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {formattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              report.status === 'live' ? 'bg-terminal-green animate-glow-pulse' :
              report.status === 'archived' ? 'bg-terminal-red' :
              report.status === 'draft' ? 'bg-terminal-amber' :
              'bg-terminal-cyan'
            }`} />
            <span className={`badge-status ${status.class}`}>
              {status.label}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="text-sm text-muted-foreground space-y-1 mb-4">
          {report.exec_summary.slice(0, 2).map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-1">›</span>
              <span className="line-clamp-1">{item}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {report.exec_summary.length} key insights
          </span>
          {report.metrics?.signals_detected !== undefined && (
            <span className="text-xs font-mono text-terminal-green">
              {report.metrics.signals_detected} signals
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
