import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, User } from 'lucide-react';

const MyPages = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Changelog
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-zinc-100">My Pages</h1>
          <p className="text-zinc-400">Your personal dashboard</p>
        </header>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Info
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Email</p>
              <p className="text-zinc-100">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">User ID</p>
              <p className="text-zinc-400 text-sm font-mono">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Last Sign In</p>
              <p className="text-zinc-400 text-sm">
                {user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8 text-zinc-500">
          <p>More features coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default MyPages;
