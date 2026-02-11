import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground font-mono">
          My Pages
        </h1>
        <p className="text-muted-foreground">
          Manage your tracked company pages
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
