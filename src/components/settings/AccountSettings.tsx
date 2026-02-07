import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Mail, UserCircle, Shield } from 'lucide-react';

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Determine auth method from user metadata
  const provider = user?.app_metadata?.provider;
  const authMethod =
    provider === 'google'
      ? 'Google'
      : provider === 'github'
        ? 'GitHub'
        : 'Magic link';

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your account details and login method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Email
                </p>
                <p className="text-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Sign-in method
                </p>
                <p className="text-foreground">{authMethod}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-base">Session</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign out of your Signal Plane account on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
