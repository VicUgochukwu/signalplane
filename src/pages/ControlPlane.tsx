import { useState } from 'react';
import { IntelPacket } from '@/types/report';
import { useReports } from '@/hooks/useReports';
import { ReportList } from '@/components/control-plane/ReportList';
import { ReportDetail } from '@/components/control-plane/ReportDetail';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Loader2 } from 'lucide-react';

const ControlPlane = () => {
  const [selectedReport, setSelectedReport] = useState<IntelPacket | null>(null);
  const { data: reports = [], isLoading, error } = useReports();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive">
            <p className="font-medium">Error loading intelligence packets</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
        {selectedReport ? (
          <ReportDetail
            report={selectedReport}
            onBack={() => setSelectedReport(null)}
          />
        ) : (
          <ReportList
            reports={reports}
            onSelectReport={setSelectedReport}
          />
        )}
      </div>
    </div>
  );
};

export default ControlPlane;
