import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  WinLossOverview,
  IndicatorExplorer,
  PatternList,
  WinLossReportView,
  DecisionMapView,
  ChurnTracker,
} from '@/components/win-loss';

export default function WinLoss() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="h-6 w-6 text-amber-400" />
          Win/Loss Intelligence
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor public buyer decision signals â why buyers choose, reject, or switch between products
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="indicators" className="text-xs">Indicators</TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
          <TabsTrigger value="decision-map" className="text-xs">Decision Map</TabsTrigger>
          <TabsTrigger value="churn" className="text-xs">Churn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WinLossOverview />
        </TabsContent>

        <TabsContent value="indicators">
          <IndicatorExplorer />
        </TabsContent>

        <TabsContent value="patterns">
          <PatternList />
        </TabsContent>

        <TabsContent value="reports">
          <WinLossReportView />
        </TabsContent>

        <TabsContent value="decision-map">
          <DecisionMapView />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
