import { useParams } from 'react-router-dom';
import { DemoProvider } from '@/contexts/DemoContext';
import { DemoNavigation } from '@/components/demo/DemoNavigation';
import { BoardView } from '@/components/action-board/BoardView';
import { Footer } from '@/components/Footer';

export default function DemoActionBoard() {
  const { sectorSlug = 'developer-tools' } = useParams();

  return (
    <DemoProvider sectorSlug={sectorSlug}>
      <div className="min-h-screen bg-background flex flex-col">
        <DemoNavigation />
        <div className="container max-w-7xl mx-auto px-4 py-6 md:py-8 flex-1">
          <BoardView />
        </div>
        <div className="container max-w-7xl mx-auto px-4">
          <Footer />
        </div>
      </div>
    </DemoProvider>
  );
}
