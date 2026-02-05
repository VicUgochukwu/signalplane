import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const hasShownToast = useRef(false);

  const isLoading = authLoading || adminLoading;

  useEffect(() => {
    if (!isLoading && user && !isAdmin && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error('Access denied', {
        description: 'You do not have permission to access the admin panel.',
      });
    }
  }, [isLoading, user, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-3/4 bg-zinc-800" />
          <Skeleton className="h-4 w-1/2 bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/messaging-diff" />;
  }

  return <>{children}</>;
}
