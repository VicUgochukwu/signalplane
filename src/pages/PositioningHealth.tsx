import { Crosshair } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PositioningOverview,
  HealthScoreHistory,
  DriftTimeline,
  PositioningAuditView,
  OwnMessagingTracker,
} from '@/components/positioning';

export default function PositioningHealth() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Crosshair className="h-6 w-6 text-rose-400" />
          Positioning Health
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor the gap between your stated positioning and market reality â
          buyer alignment, competitive differentiation, and narrative fit
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="score-history" className="text-xs">Score History</TabsTrigger>
          <TabsTrigger value="drift-events" className="text-xs">Drift Events</TabsTrigger>
          <TabsTrigger value="audits" className="text-xs">Audits</TabsTrigger>
          <TabsTrigger value="own-pages" className="text-xs">Own Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PositioningOverview />
        </TabsContent>

        <TabsContent value="score-history">
          <HealthScoreHistory />
        </TabsContent>

        <TabsContent value="drift-events">
          <DriftTimeline />
        </TabsContent>

        <TabsContent value="audits">
          <PositioningAuditView />
        </TabsContent>

        <TabsContent value="own-pages">
          <OwnMessagingTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
