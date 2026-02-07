import { useQueryClient } from '@tanstack/react-query';
import { AddCompanyWizard } from '@/components/AddCompanyWizard';
import { TrackedPagesList } from '@/components/TrackedPagesList';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Footer } from '@/components/Footer';

const MyPages = () => {
  const queryClient = useQueryClient();

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground font-mono">
            My Pages
          </h1>
          <p className="text-muted-foreground">
            Manage your tracked company pages
          </p>
        </header>

        <div className="space-y-6">
          <AddCompanyWizard onSuccess={handleFormSuccess} />
          <TrackedPagesList />
        </div>
      </div>
      <div className="container max-w-6xl mx-auto px-4">
        <Footer />
      </div>
    </div>
  );
};

export default MyPages;
