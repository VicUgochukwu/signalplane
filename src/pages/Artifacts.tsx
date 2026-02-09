import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, MessageSquareQuote, Swords } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ObjectionLibraryTab } from '@/components/control-plane/artifacts/ObjectionLibraryTab';
import { SwipeFileTab } from '@/components/control-plane/artifacts/SwipeFileTab';
import { BattlecardsTab } from '@/components/control-plane/artifacts/BattlecardsTab';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Footer } from '@/components/Footer';
import { useDemo } from '@/contexts/DemoContext';

// Extracted content component — reused by DemoArtifacts
export function ArtifactsContent() {
  const demo = useDemo();
  const backLink = demo?.isDemo ? `/demo/${demo.sectorSlug}` : '/control-plane';

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Back Link */}
      <div className="mb-6">
        <Link to={backLink}>
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Intel Packets
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground font-mono">GTM Artifacts</h1>
        <p className="text-muted-foreground mt-2">
          Weekly AI-generated sales enablement materials based on market signals
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="objections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="objections" className="gap-2">
            <MessageSquareQuote className="h-4 w-4" />
            <span className="hidden sm:inline">Objection Library</span>
            <span className="sm:hidden">Objections</span>
          </TabsTrigger>
          <TabsTrigger value="swipe" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Swipe File</span>
            <span className="sm:hidden">Swipe</span>
          </TabsTrigger>
          <TabsTrigger value="battlecards" className="gap-2">
            <Swords className="h-4 w-4" />
            <span>Battlecards</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objections">
          <ObjectionLibraryTab />
        </TabsContent>

        <TabsContent value="swipe">
          <SwipeFileTab />
        </TabsContent>

        <TabsContent value="battlecards">
          <BattlecardsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Artifacts() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <ArtifactsContent />
      <div className="container max-w-6xl mx-auto px-4">
        <Footer />
      </div>
    </div>
  );
}
