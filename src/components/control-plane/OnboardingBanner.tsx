import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'dismissedOnboardingBanner';

export const OnboardingBanner = () => {
  const { user } = useAuth();
  const { needsOnboarding, isLoading } = useOnboarding();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  if (!user || !needsOnboarding || isDismissed || isLoading) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Get personalized intelligence
            </p>
            <p className="text-sm text-muted-foreground">
              Set up your company to see battlecards and signals filtered to your specific competitors.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
            <Link to="/settings" className="flex items-center gap-1.5">
              Set Up Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
