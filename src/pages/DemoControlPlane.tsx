import { useParams } from 'react-router-dom';
import { DemoProvider } from '@/contexts/DemoContext';
import { DemoNavigation } from '@/components/demo/DemoNavigation';
import { ControlPlaneContent } from './ControlPlane';
import { Footer } from '@/components/Footer';

export default function DemoControlPlane() {
  const { sectorSlug = 'developer-tools' } = useParams();

  return (
    <DemoProvider sectorSlug={sectorSlug}>
      <div className="min-h-screen bg-background flex flex-col">
        <DemoNavigation />
        <ControlPlaneContent />
        <div className="container max-w-6xl mx-auto px-4">
          <Footer />
        </div>
      </div>
    </DemoProvider>
  );
}
