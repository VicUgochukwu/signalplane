import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, loading, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/my-pages', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Changelog
        </Button>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-zinc-100">Sign in</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your email to receive a magic link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-zinc-100 font-medium">Check your email</p>
                  <p className="text-zinc-400 text-sm">
                    We sent a magic link to <span className="text-zinc-200">{email}</span>
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Click the link in the email to sign in
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="mt-4 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900 border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-3">
                    <p className="text-sm text-rose-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
