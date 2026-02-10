import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Plug, UserCircle, Palette } from 'lucide-react';
import { IconCompany } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppNavigation } from '@/components/control-plane/AppNavigation';
import { Footer } from '@/components/Footer';
import { DeliveryIntegrations } from '@/components/DeliveryIntegrations';
import { CompanyProfileSettings } from '@/components/settings/CompanyProfileSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunctionSilent } from '@/lib/edge-functions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const VALID_TABS = ['profile', 'integrations', 'account', 'appearance'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

const Settings = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine active tab from URL, defaulting to 'profile'
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const activeTab: SettingsTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile';

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'profile') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', value);
    }
    setSearchParams(newParams, { replace: true });
  };

  // OAuth callback toast handling (preserved from original)
  useEffect(() => {
    let toastShown = false;

    if (searchParams.get('slack_success')) {
      toast({
        title: 'Slack Connected',
        description: 'Your Slack workspace has been connected successfully.',
      });
      // Fire Loops event (fire-and-forget)
      invokeEdgeFunctionSilent('loops-sync', {
        action: 'track_event',
        event_name: 'integration_connected',
        properties: { channel: 'slack' },
      });
      toastShown = true;
    }

    if (searchParams.get('slack_error')) {
      toast({
        title: 'Slack Connection Failed',
        description:
          searchParams.get('slack_error') || 'Unable to connect to Slack',
        variant: 'destructive',
      });
      toastShown = true;
    }

    if (searchParams.get('notion_success')) {
      toast({
        title: 'Notion Connected',
        description:
          'Your Notion workspace has been connected successfully.',
      });
      // Fire Loops event (fire-and-forget)
      invokeEdgeFunctionSilent('loops-sync', {
        action: 'track_event',
        event_name: 'integration_connected',
        properties: { channel: 'notion' },
      });
      toastShown = true;
    }

    if (searchParams.get('notion_error')) {
      toast({
        title: 'Notion Connection Failed',
        description:
          searchParams.get('notion_error') || 'Unable to connect to Notion',
        variant: 'destructive',
      });
      toastShown = true;
    }

    // If an OAuth callback was processed, clean up params and switch to integrations tab
    if (toastShown) {
      const cleaned = new URLSearchParams();
      cleaned.set('tab', 'integrations');
      setSearchParams(cleaned, { replace: true });
    }
  }, [toast, searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your profile, integrations, and account
          </p>
        </div>

        {/* Tabbed content */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <IconCompany className="h-4 w-4" />
              <span className="hidden sm:inline">Company Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4" />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <UserCircle className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <CompanyProfileSettings />
          </TabsContent>

          <TabsContent value="integrations">
            <DeliveryIntegrations />
          </TabsContent>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Choose how Signal Plane looks to you. Select a single theme or sync with your system settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeToggle variant="full" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div className="container max-w-6xl mx-auto px-4">
        <Footer />
      </div>
    </div>
  );
};

export default Settings;
