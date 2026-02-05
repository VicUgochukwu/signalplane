import { IntelPacket } from '@/types/report';
import { ReportCard } from './ReportCard';
import { Radio } from 'lucide-react';

interface ReportListProps {
  reports: IntelPacket[];
  onSelectReport: (report: IntelPacket) => void;
}

export const ReportList = ({ reports, onSelectReport }: ReportListProps) => {
  const totalSignals = reports.reduce((sum, r) => sum + (r.metrics?.signals_detected || 0), 0);
  const avgConfidence = Math.round(
    reports.reduce((sum, r) => sum + (r.metrics?.confidence_score || 0), 0) / reports.length
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8 terminal-header">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-mono">
            Control Plane<span className="cursor-blink"></span>
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          Weekly GTM Intelligence Packets
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-terminal p-4 rounded-lg">
          <div className="metric-value">{reports.length}</div>
          <div className="metric-label">Intel Packets</div>
        </div>
        <div className="card-terminal p-4 rounded-lg">
          <div className="metric-value text-terminal-green">
            {reports.filter(r => r.status === 'live').length}
          </div>
          <div className="metric-label">Live</div>
        </div>
        <div className="card-terminal p-4 rounded-lg">
          <div className="metric-value text-terminal-cyan">
            {totalSignals}
          </div>
          <div className="metric-label">Signals Detected</div>
        </div>
        <div className="card-terminal p-4 rounded-lg">
          <div className="metric-value text-terminal-purple">
            {avgConfidence}%
          </div>
          <div className="metric-label">Avg Confidence</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onClick={() => onSelectReport(report)}
          />
        ))}
      </div>
    </div>
  );
};
