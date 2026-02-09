import { IntelPacket, PacketStatus } from '@/types/report';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Sparkles, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ReportCardProps {
  report: IntelPacket;
  onClick: () => void;
  isPersonalized?: boolean;
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

export const ReportCard = ({ report, onClick, isPersonalized = false }: ReportCardProps) => {
  const status = statusConfig[report.status];

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
      className="group cursor-pointer rounded-xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0 text-primary">
              <Radio className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground leading-tight text-sm truncate">
                {report.packet_title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formattedStartDate} – {formattedEndDate}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs font-medium ${status.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dotClass} ${report.status === 'live' ? 'animate-pulse' : ''}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
          {report.exec_summary.slice(0, 2).map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0">›</span>
              <span className="line-clamp-1">{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {report.exec_summary.length} key insights
            </span>
            {isPersonalized && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-primary/20 text-primary/80 bg-primary/5"
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Personalized
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {report.metrics?.signals_detected !== undefined && (
              <span className="text-xs text-emerald-400 font-medium">
                {report.metrics.signals_detected} signals
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
