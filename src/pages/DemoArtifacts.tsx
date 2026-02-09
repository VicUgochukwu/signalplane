import { useParams } from 'react-router-dom';
import { DemoProvider } from '@/contexts/DemoContext';
import { DemoNavigation } from '@/components/demo/DemoNavigation';
import { ArtifactsContent } from './Artifacts';
import { Footer } from '@/components/Footer';

export default function DemoArtifacts() {
  const { sectorSlug = 'developer-tools' } = useParams();

  return (
    <DemoProvider sectorSlug={sectorSlug}>
      <div className="min-h-screen bg-background flex flex-col">
        <DemoNavigation />
        <ArtifactsContent />
        <div className="container max-w-6xl mx-auto px-4">
          <Footer />
        </div>
      </div>
    </DemoProvider>
  );
}
