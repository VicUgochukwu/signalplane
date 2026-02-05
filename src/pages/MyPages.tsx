import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, ArrowLeft, Settings } from 'lucide-react';
import { AddCompanyWizard } from '@/components/AddCompanyWizard';
import { TrackedPagesList } from '@/components/TrackedPagesList';

const MyPages = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    navigate('/messaging-diff');
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
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
            Back to Feed
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user?.email}</span>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
        </div>

        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-zinc-100">My Pages</h1>
          <p className="text-zinc-400">Manage your tracked company pages</p>
        </header>

        <div className="space-y-6">
          <AddCompanyWizard onSuccess={handleFormSuccess} />
          <TrackedPagesList />
        </div>
      </div>
    </div>
  );
};

export default MyPages;
