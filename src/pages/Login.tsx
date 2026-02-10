import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { Logo } from '@/components/Logo';

const emailSchema = z.string().email('Please enter a valid email address');

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, loading, signInWithMagicLink, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/control-plane');
    }
  }, [user, loading, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setEmailSent(true);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3">
          <Logo className="w-14 h-14" />
          <span className="text-xl font-semibold text-foreground">Signal Plane</span>
        </Link>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground">Log in</h1>
        </div>

          {emailSent ? (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/20 border border-primary/40">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-foreground">Check your email</p>
                <p className="text-muted-foreground">
                  We sent a magic link to <span className="text-primary font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to sign in
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="mt-4"
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* OAuth buttons */}
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium border-border hover:bg-muted"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-3">Continue with Google</span>
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              {/* Sign up link */}
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Create your account
                </Link>
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default Login;
