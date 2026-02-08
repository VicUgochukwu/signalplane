import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyOnboardingWizard } from '@/components/onboarding/CompanyOnboardingWizard';
import { OnboardingChoiceModal } from '@/components/onboarding/OnboardingChoiceModal';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboarding?: boolean;
}

// Common personal email domains - users with these get a choice
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'live.com',
  'msn.com',
  'mail.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
];

function isPersonalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return PERSONAL_EMAIL_DOMAINS.includes(domain);
}

export function ProtectedRoute({ children, skipOnboarding = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, isLoading: onboardingLoading, refetch } = useOnboarding();

  // Track if user chose to skip onboarding (persisted in session)
  const [userSkippedOnboarding, setUserSkippedOnboarding] = useState(() => {
    return sessionStorage.getItem('skippedOnboarding') === 'true';
  });

  // Track if user chose to start onboarding from choice modal
  const [showFullOnboarding, setShowFullOnboarding] = useState(false);

  const isLoading = authLoading || (user && onboardingLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-3/4 bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If onboarding is explicitly skipped via prop, or user already completed it, show children
  if (skipOnboarding || !needsOnboarding || userSkippedOnboarding) {
    return <>{children}</>;
  }

  // User needs onboarding - determine which flow to show
  const userEmail = user.email || '';
  const isPersonal = isPersonalEmail(userEmail);

  // If user chose to do full onboarding from choice modal, show wizard
  if (showFullOnboarding) {
    return <CompanyOnboardingWizard onComplete={refetch} />;
  }

  // Personal email users: show choice modal
  // Work email users: go straight to onboarding wizard
  if (isPersonal) {
    return (
      <OnboardingChoiceModal
        onSetupCompany={() => setShowFullOnboarding(true)}
        onSkip={() => {
          sessionStorage.setItem('skippedOnboarding', 'true');
          setUserSkippedOnboarding(true);
          // Fire Loops event (fire-and-forget)
          supabase.functions.invoke('loops-sync', {
            body: { action: 'track_event', event_name: 'onboarding_skipped' },
          }).catch(() => {});
        }}
      />
    );
  }

  // Work email - show full onboarding wizard
  return <CompanyOnboardingWizard onComplete={refetch} />;
}
