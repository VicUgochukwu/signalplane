import { BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  VocOverview,
  VocRepository,
  VocTrendsView,
  PersonaReportView,
  MarketPulseView,
} from '@/components/voc-research';

export default function VocResearch() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-400" />
          VoC Research
        </h1>
        <p className="text-muted-foreground mt-2">
          Voice of Customer research repository â buyer pains, desires, language patterns, and decision criteria from public sources
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="repository" className="text-xs">Repository</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
          <TabsTrigger value="persona-reports" className="text-xs">Persona Reports</TabsTrigger>
          <TabsTrigger value="market-pulse" className="text-xs">Market Pulse</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <VocOverview />
        </TabsContent>

        <TabsContent value="repository">
          <VocRepository />
        </TabsContent>

        <TabsContent value="trends">
          <VocTrendsView />
        </TabsContent>

        <TabsContent value="persona-reports">
          <PersonaReportView />
        </TabsContent>

        <TabsContent value="market-pulse">
          <MarketPulseView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
