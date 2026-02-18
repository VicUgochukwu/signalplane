import { Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PackagingOverview,
  ChangeEventLog,
  LandscapeMapView,
  IntelBriefView,
  PackagingAuditView,
} from '@/components/packaging';

export default function PackagingIntel() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Package className="h-6 w-6 text-indigo-400" />
          Packaging Intelligence
        </h1>
        <p className="text-muted-foreground mt-2">
          Track competitor pricing moves and packaging strategy â
          tier changes, value metric shifts, and category-wide landscape trends
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="changes" className="text-xs">Change Events</TabsTrigger>
          <TabsTrigger value="landscape" className="text-xs">Landscape Map</TabsTrigger>
          <TabsTrigger value="briefs" className="text-xs">Briefs</TabsTrigger>
          <TabsTrigger value="audits" className="text-xs">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PackagingOverview />
        </TabsContent>

        <TabsContent value="changes">
          <ChangeEventLog />
        </TabsContent>

        <TabsContent value="landscape">
          <LandscapeMapView />
        </TabsContent>

        <TabsContent value="briefs">
          <IntelBriefView />
        </TabsContent>

        <TabsContent value="audits">
          <PackagingAuditView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
