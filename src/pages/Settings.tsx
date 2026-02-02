import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import { DeliveryIntegrations } from '@/components/DeliveryIntegrations';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('slack_success')) {
      toast({
        title: 'Slack Connected',
        description: 'Your Slack workspace has been connected successfully.',
      });
      window.history.replaceState({}, '', '/settings');
    }

    if (params.get('slack_error')) {
      toast({
        title: 'Slack Connection Failed',
        description: params.get('slack_error') || 'Unable to connect to Slack',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/settings');
    }

    if (params.get('notion_success')) {
      toast({
        title: 'Notion Connected',
        description: 'Your Notion workspace has been connected successfully.',
      });
      window.history.replaceState({}, '', '/settings');
    }

    if (params.get('notion_error')) {
      toast({
        title: 'Notion Connection Failed',
        description: params.get('notion_error') || 'Unable to connect to Notion',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/settings');
    }
  }, [toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container max-w-3xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-pages')}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Pages
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user?.email}</span>
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
          <h1 className="text-3xl font-bold text-zinc-100">Settings</h1>
          <p className="text-zinc-400">Configure how you receive weekly reports</p>
        </header>

        <DeliveryIntegrations />
      </div>
    </div>
  );
};

export default Settings;
