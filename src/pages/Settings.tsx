import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import { DeliveryIntegrations } from '@/components/DeliveryIntegrations';
import { CompanyProfileSettings } from '@/components/settings/CompanyProfileSettings';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('slack_success')) {
      toast({
        title: 'Slack Connected',
        description: 'Your Slack workspace has been connected successfully.',
      });
      setSearchParams({});
    }

    if (searchParams.get('slack_error')) {
      toast({
        title: 'Slack Connection Failed',
        description: searchParams.get('slack_error') || 'Unable to connect to Slack',
        variant: 'destructive',
      });
      setSearchParams({});
    }

    if (searchParams.get('notion_success')) {
      toast({
        title: 'Notion Connected',
        description: 'Your Notion workspace has been connected successfully.',
      });
      setSearchParams({});
    }

    if (searchParams.get('notion_error')) {
      toast({
        title: 'Notion Connection Failed',
        description: searchParams.get('notion_error') || 'Unable to connect to Notion',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [toast, searchParams, setSearchParams]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/messaging-diff');
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
          <p className="text-zinc-400">Configure your profile and delivery preferences</p>
        </header>

        <CompanyProfileSettings />

        <DeliveryIntegrations />
      </div>
    </div>
  );
};

export default Settings;
