import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IntelPacket } from '@/types/report';
import { useReports } from '@/hooks/useReports';
import { ReportList } from '@/components/control-plane/ReportList';
import { ReportDetail } from '@/components/control-plane/ReportDetail';
import { Loader2 } from 'lucide-react';
import { invokeEdgeFunctionSilent } from '@/lib/edge-functions';
import { useDemo } from '@/contexts/DemoContext';

// Extracted content component — reused by DemoControlPlane
export const ControlPlaneContent = () => {
  const { packetId, sectorSlug } = useParams<{ packetId?: string; sectorSlug?: string }>();
  const navigate = useNavigate();
  const demo = useDemo();
  const { data: reports = [], isLoading, error } = useReports();

  // Build base path for navigation (demo vs authenticated)
  const basePath = demo?.isDemo ? `/demo/${sectorSlug || demo.sectorSlug}` : '/control-plane';

  const selectedReport = packetId
    ? reports.find(r => r.id === packetId) || null
    : null;

  const handleSelectReport = useCallback((report: IntelPacket) => {
    navigate(`${basePath}/packet/${report.id}`);
    invokeEdgeFunctionSilent('loops-sync', {
      action: 'track_event',
      event_name: 'packet_viewed',
      properties: { packet_title: report.packet_title, week_start: report.week_start },
    });
  }, [navigate, basePath]);

  const handleBack = useCallback(() => {
    navigate(basePath);
  }, [navigate, basePath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading intelligence packets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-6">
          <p className="font-medium text-destructive">Error loading intelligence packets</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Handle stale deep links — packetId in URL but not found in loaded data
  if (packetId && !selectedReport && reports.length > 0) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-xl bg-muted/30 border border-border/50 p-6 text-center space-y-3">
          <p className="font-medium text-foreground">Packet not found</p>
          <p className="text-sm text-muted-foreground">This packet may have been archived or removed.</p>
          <button
            onClick={handleBack}
            className="text-sm text-primary hover:underline"
          >
            ← Back to Control Plane
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {selectedReport ? (
        <ReportDetail
          report={selectedReport}
          onBack={handleBack}
        />
      ) : (
        <ReportList
          reports={reports}
          onSelectReport={handleSelectReport}
        />
      )}
    </div>
  );
};

const ControlPlane = () => {
  return <ControlPlaneContent />;
};

export default ControlPlane;
