import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeliveryPreferences } from '@/hooks/useDeliveryPreferences';
import { Loader2, MessageSquare, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function DeliveryIntegrations() {
  const {
    preferences,
    isLoading,
    connectSlack,
    saveNotionConfig,
    isSavingNotion,
    disconnectChannel,
    toggleChannel,
    isConnecting,
  } = useDeliveryPreferences();

  const [notionToken, setNotionToken] = useState('');
  const [notionDbId, setNotionDbId] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 bg-zinc-800" />
        <Skeleton className="h-48 bg-zinc-800" />
      </div>
    );
  }

  const slackPref = preferences?.find((p) => p.channel_type === 'slack');
  const notionPref = preferences?.find((p) => p.channel_type === 'notion');

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-950/50 border-blue-900 text-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Connect integrations to automatically receive weekly reports when competitor messaging
          changes are detected.
        </AlertDescription>
      </Alert>

      {/* Slack Integration */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/50">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-zinc-100">Slack</CardTitle>
              <CardDescription className="text-zinc-400">
                Receive reports in a Slack channel or DM
              </CardDescription>
            </div>
            {slackPref && (
              <Switch
                checked={slackPref.enabled}
                onCheckedChange={() => toggleChannel('slack', !slackPref.enabled)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Toggle Slack delivery"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slackPref ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-zinc-900 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Workspace</span>
                  <span className="text-zinc-100">
                    {slackPref.channel_config.team_name || 'Connected'}
                  </span>
                </div>
                {slackPref.channel_config.channel_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Channel</span>
                    <span className="text-zinc-100">
                      #{slackPref.channel_config.channel_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Status</span>
                  <span className={slackPref.enabled ? 'text-emerald-400' : 'text-zinc-500'}>
                    {slackPref.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => disconnectChannel('slack')}
                className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                Disconnect Slack
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectSlack}
              disabled={isConnecting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add to Slack
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notion Integration */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700/50">
              <FileText className="h-5 w-5 text-zinc-300" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-zinc-100">Notion</CardTitle>
              <CardDescription className="text-zinc-400">
                Save reports to a Notion database
              </CardDescription>
            </div>
            {notionPref && (
              <Switch
                checked={notionPref.enabled}
                onCheckedChange={() => toggleChannel('notion', !notionPref.enabled)}
                className="data-[state=checked]:bg-emerald-600"
                aria-label="Toggle Notion delivery"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notionPref ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-zinc-900 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Database</span>
                  <span className="text-zinc-100 font-mono text-xs truncate max-w-[180px]">
                    {notionPref.channel_config.database_id || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Status</span>
                  <span className={notionPref.enabled ? 'text-emerald-400' : 'text-zinc-500'}>
                    {notionPref.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => disconnectChannel('notion')}
                className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                Disconnect Notion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Create a{' '}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 underline"
                >
                  Notion internal integration
                </a>
                , then paste your token and the database ID where reports should be saved.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="notion-token" className="text-zinc-400 text-xs">
                    Integration Token
                  </Label>
                  <Input
                    id="notion-token"
                    type="password"
                    placeholder="ntn_..."
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    className="bg-zinc-900 border-zinc-600 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notion-db" className="text-zinc-400 text-xs">
                    Database ID
                  </Label>
                  <Input
                    id="notion-db"
                    placeholder="abc123def456..."
                    value={notionDbId}
                    onChange={(e) => setNotionDbId(e.target.value)}
                    className="bg-zinc-900 border-zinc-600 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  saveNotionConfig(notionToken.trim(), notionDbId.trim());
                  setNotionToken('');
                  setNotionDbId('');
                }}
                disabled={!notionToken.trim() || !notionDbId.trim() || isSavingNotion}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
              >
                {isSavingNotion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Save Notion Config
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
