import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, MessageSquareQuote, Swords, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ObjectionLibraryTab } from '@/components/control-plane/artifacts/ObjectionLibraryTab';
import { SwipeFileTab } from '@/components/control-plane/artifacts/SwipeFileTab';
import { BattlecardsTab } from '@/components/control-plane/artifacts/BattlecardsTab';
import { MaturityModelTab } from '@/components/control-plane/artifacts/MaturityModelTab';
import { useDemo } from '@/contexts/DemoContext';

const VALID_TABS = ['objections', 'swipe', 'battlecards', 'maturity'] as const;
type TabValue = typeof VALID_TABS[number];

// Extracted content component — reused by DemoArtifacts
export function ArtifactsContent() {
  const demo = useDemo();
  const backLink = demo?.isDemo ? `/demo/${demo.sectorSlug}` : '/control-plane';
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as TabValue | null;
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'objections';

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'objections') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', value);
    }
    setSearchParams(newParams, { replace: true });
  };

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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
          <TabsTrigger value="maturity" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Maturity Model</span>
            <span className="sm:hidden">Maturity</span>
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

        <TabsContent value="maturity">
          <MaturityModelTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Artifacts() {
  return <ArtifactsContent />;
}
