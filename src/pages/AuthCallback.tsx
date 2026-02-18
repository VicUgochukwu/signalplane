import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

/**
 * Auth callback page — handles magic link and OAuth redirects.
 *
 * Supabase redirects here after verifying a magic link or OAuth login.
 * On success: hash contains #access_token=...&refresh_token=...
 * On failure: hash contains #error=access_denied&error_code=otp_expired&error_description=...
 *
 * This page detects both cases and shows the appropriate UI.
 */

function parseHashParams(): Record<string, string> {
  const hash = window.location.hash.substring(1); // remove #
  if (!hash) return {};
  const params: Record<string, string> = {};
  for (const pair of hash.split('&')) {
    const [key, ...rest] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
  }
  return params;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  otp_expired: {
    title: 'This link has expired or was already used',
    description:
      'Magic links are single-use and expire after 1 hour. Some email clients also pre-scan links, which can consume them. Please request a new one.',
  },
  access_denied: {
    title: 'Access denied',
    description: 'The sign-in link could not be verified. Please try again.',
  },
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let fallbackTimeoutId: ReturnType<typeof setTimeout>;

    // ── 1. Check for errors in the hash FIRST ────────────────────
    const hashParams = parseHashParams();

    if (hashParams.error || hashParams.error_code) {
      const errorCode = hashParams.error_code || hashParams.error || 'unknown';
      const errorDesc = hashParams.error_description?.replace(/\+/g, ' ') || '';

      console.warn('[AuthCallback] Auth error:', errorCode, errorDesc);

      const known = ERROR_MESSAGES[errorCode];
      if (isMounted) {
        setError(
          known || {
            title: 'Sign-in failed',
            description: errorDesc || 'Something went wrong. Please try signing in again.',
          },
        );
      }
      return; // Don't set up session listeners — there's no session to wait for
    }

    // ── 2. No error — wait for session to be established ─────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          clearTimeout(timeoutId);
          clearTimeout(fallbackTimeoutId);
          subscription.unsubscribe();
          navigate('/control-plane', { replace: true });
        }
      },
    );

    // Fallback: check if session was established before listener
    fallbackTimeoutId = setTimeout(async () => {
      if (!isMounted) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          navigate('/control-plane', { replace: true });
        }
      } catch {
        // Ignore — listener will handle it
      }
    }, 500);

    // Safety timeout
    timeoutId = setTimeout(() => {
      if (!isMounted) return;
      subscription.unsubscribe();
      setError({
        title: 'Sign-in timed out',
        description: 'We couldn\'t complete your sign-in. Please try again.',
      });
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeoutId);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // ── Error state ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <Link to="/" className="flex items-center justify-center gap-3">
            <Logo className="w-12 h-12" />
            <span className="text-lg font-semibold text-foreground">Signal Plane</span>
          </Link>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">{error.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{error.description}</p>
            </div>

            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-6"
            >
              Go to Sign In
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
