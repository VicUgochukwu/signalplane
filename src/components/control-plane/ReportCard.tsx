import { IntelPacket, PacketStatus } from '@/types/report';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ReportCardProps {
  report: IntelPacket;
  onClick: () => void;
  isPersonalized?: boolean;
}

const statusConfig: Record<PacketStatus, { label: string; class: string }> = {
  live: { label: 'LIVE', class: 'badge-success' },
  published: { label: 'PUBLISHED', class: 'badge-info' },
  draft: { label: 'DRAFT', class: 'badge-warning' },
  archived: { label: 'ARCHIVED', class: 'badge-error' },
};

export const ReportCard = ({ report, onClick, isPersonalized = false }: ReportCardProps) => {
  const status = statusConfig[report.status];
  
  // Safely format dates with fallbacks
  const formatDate = (dateStr: string | undefined | null, formatStr: string) => {
    if (!dateStr) return '—';
    try {
      return format(parseISO(dateStr), formatStr);
    } catch {
      return dateStr;
    }
  };
  
  const formattedStartDate = formatDate(report.week_start, 'MMM d');
  const formattedEndDate = formatDate(report.week_end, 'MMM d, yyyy');

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
                {report.packet_title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {formattedStartDate} – {formattedEndDate}
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {report.exec_summary.length} key insights
            </span>
            {isPersonalized && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-4 border-[hsl(180,20%,52%)]/40 text-[hsl(180,20%,52%)] bg-[hsl(180,20%,52%)]/10"
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Personalized
              </Badge>
            )}
          </div>
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
