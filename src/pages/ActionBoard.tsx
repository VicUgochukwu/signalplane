import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { BoardView } from '@/components/action-board/BoardView';
import { Footer } from '@/components/Footer';

const ActionBoard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="container max-w-7xl mx-auto px-4 py-6 md:py-8 flex-1">
        <BoardView />
      </div>
      <div className="container max-w-7xl mx-auto px-4">
        <Footer />
      </div>
    </div>
  );
};

export default ActionBoard;
