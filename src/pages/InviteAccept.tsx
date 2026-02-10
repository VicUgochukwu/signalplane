import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAcceptInvite } from '@/hooks/useTeam';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { IconTeam } from '@/components/icons';
import { Logo } from '@/components/Logo';

/**
 * Page for accepting a team invite via token URL.
 * Route: /invite/:token
 */
export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const acceptInvite = useAcceptInvite();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth_required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('auth_required');
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invite link');
      return;
    }

    // Accept the invite
    acceptInvite.mutateAsync(token)
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to accept invite');
      });
  }, [token, user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-xl border border-border/50">
        <CardContent className="py-12 text-center space-y-4">
          <Logo className="w-12 h-12 mx-auto" />

          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-foreground font-medium">Accepting invite...</p>
            </>
          )}

          {status === 'auth_required' && (
            <>
              <IconTeam className="h-10 w-10 text-primary mx-auto" />
              <p className="text-foreground font-medium">Sign in to accept invite</p>
              <p className="text-sm text-muted-foreground">
                You need to be signed in to join the team.
              </p>
              <Button
                onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                Sign In
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-foreground font-medium">You've joined the team!</p>
              <p className="text-sm text-muted-foreground">
                You now have access to shared intelligence and team features.
              </p>
              <Button
                onClick={() => navigate('/control-plane')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                Go to Control Plane
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
              <p className="text-foreground font-medium">Could not accept invite</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button
                variant="outline"
                onClick={() => navigate('/control-plane')}
                className="rounded-lg"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
