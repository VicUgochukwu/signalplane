import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { AddCompanyWizard } from '@/components/AddCompanyWizard';
import { CompetitorSuggestions } from '@/components/CompetitorSuggestions';
import { TrackedPagesList } from '@/components/TrackedPagesList';

const MyPages = () => {
  const queryClient = useQueryClient();
  const [prefillCompany, setPrefillCompany] = useState<{ name: string; domain: string } | null>(null);

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
    queryClient.invalidateQueries({ queryKey: ['competitor-suggestions'] });
    setPrefillCompany(null);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Globe className="h-5 w-5 text-accent-signal" />
          Tracked Pages
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage competitor pages monitored by your intelligence engine
        </p>
      </header>

      <div className="space-y-6">
        <AddCompanyWizard
          onSuccess={handleFormSuccess}
          initialCompany={prefillCompany}
          onInitialCompanyConsumed={() => setPrefillCompany(null)}
        />
        <CompetitorSuggestions onAddSuggestion={setPrefillCompany} />
        <TrackedPagesList />
      </div>
    </div>
  );
};

export default MyPages;
