import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDeliveryPreferences, NotionDatabase } from '@/hooks/useDeliveryPreferences';
import { Loader2, MessageSquare, FileText, Info, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DeliveryIntegrations() {
  const {
    preferences,
    isLoading,
    connectSlack,
    connectNotion,
    fetchNotionDatabases,
    selectNotionDatabase,
    isSelectingDatabase,
    testNotionConnection,
    isTestingNotion,
    disconnectChannel,
    toggleChannel,
    isConnecting,
  } = useDeliveryPreferences();

  // Notion database picker state
  const [notionDatabases, setNotionDatabases] = useState<NotionDatabase[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [selectedDbId, setSelectedDbId] = useState<string>('');
  const [showDbPicker, setShowDbPicker] = useState(false);
  const [dbLoadError, setDbLoadError] = useState<string | null>(null);

  const slackPref = preferences?.find((p) => p.channel_type === 'slack');
  const notionPref = preferences?.find((p) => p.channel_type === 'notion');

  // Determine Notion state
  const notionConnected = !!notionPref;
  const notionHasDatabase = notionConnected && !!notionPref.channel_config?.database_id;
  const needsDatabasePicker = notionConnected && !notionHasDatabase;

  // Load databases when in picker state
  useEffect(() => {
    if (needsDatabasePicker || showDbPicker) {
      loadDatabases();
    }
  }, [needsDatabasePicker, showDbPicker]);

  const loadDatabases = async () => {
    setIsLoadingDatabases(true);
    setDbLoadError(null);
    try {
      const dbs = await fetchNotionDatabases();
      setNotionDatabases(dbs);
    } catch (err: any) {
      setDbLoadError(err.message || 'Failed to load databases');
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const handleSelectDatabase = () => {
    const db = notionDatabases.find((d) => d.id === selectedDbId);
    if (db) {
      selectNotionDatabase(db.id, db.title);
      setShowDbPicker(false);
      setSelectedDbId('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 bg-muted" />
        <Skeleton className="h-48 bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-[hsl(var(--accent-signal)/0.05)] border-[hsl(var(--accent-signal)/0.2)] text-foreground">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Connect integrations to automatically receive weekly reports when competitor messaging
          changes are detected.
        </AlertDescription>
      </Alert>

      {/* Slack Integration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]/20">
              <MessageSquare className="h-5 w-5 text-[#E01E5A]" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-foreground">Slack</CardTitle>
              <CardDescription className="text-muted-foreground">
                Receive reports in a Slack channel
              </CardDescription>
            </div>
            {slackPref && (
              <Switch
                checked={slackPref.enabled}
                onCheckedChange={() => toggleChannel('slack', !slackPref.enabled)}
                className="data-[state=checked]:bg-emerald-600"
                aria-label="Toggle Slack delivery"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slackPref ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Workspace</span>
                  <span className="text-foreground font-medium">
                    {slackPref.channel_config?.team_name || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="text-foreground font-medium">
                    #{slackPref.channel_config?.channel_name || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={slackPref.enabled ? 'text-emerald-400' : 'text-muted-foreground'}>
                    {slackPref.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => disconnectChannel('slack')}
                className="w-full"
              >
                Disconnect Slack
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your Slack workspace to receive weekly competitive intelligence reports
                directly in a channel.
              </p>
              <Button
                onClick={connectSlack}
                disabled={isConnecting}
                className="w-full bg-[#4A154B] hover:bg-[#611f69] text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect with Slack
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notion Integration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
              <FileText className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-foreground">Notion</CardTitle>
              <CardDescription className="text-muted-foreground">
                Save reports to a Notion database
              </CardDescription>
            </div>
            {notionHasDatabase && (
              <Switch
                checked={notionPref!.enabled}
                onCheckedChange={() => toggleChannel('notion', !notionPref!.enabled)}
                className="data-[state=checked]:bg-emerald-600"
                aria-label="Toggle Notion delivery"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* State C: Fully connected with database selected */}
          {notionHasDatabase && !showDbPicker ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Workspace</span>
                  <span className="text-foreground font-medium">
                    {notionPref!.channel_config?.workspace_name || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Database</span>
                  <span className="text-foreground font-medium truncate max-w-[200px]">
                    {notionPref!.channel_config?.database_name || notionPref!.channel_config?.database_id?.slice(0, 12) + '...' || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={notionPref!.enabled ? 'text-emerald-400' : 'text-muted-foreground'}>
                    {notionPref!.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotionConnection()}
                  disabled={isTestingNotion}
                  className="flex-1"
                >
                  {isTestingNotion ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDbPicker(true)}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Change
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => disconnectChannel('notion')}
                className="w-full"
              >
                Disconnect Notion
              </Button>
            </div>
          ) : /* State B: Connected but needs database selection */
          needsDatabasePicker || showDbPicker ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-foreground">
                  Connected to <span className="font-medium">{notionPref?.channel_config?.workspace_name || 'Notion'}</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the database where weekly reports should be saved.
                Make sure the database is shared with the Signal Plane integration in Notion.
              </p>
              {isLoadingDatabases ? (
                <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading databases...</span>
                </div>
              ) : dbLoadError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{dbLoadError}</p>
                  <Button variant="outline" size="sm" onClick={loadDatabases}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              ) : notionDatabases.length === 0 ? (
                <div className="rounded-lg bg-muted p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No databases found. Make sure you share at least one database with the Signal Plane integration in Notion.
                  </p>
                  <Button variant="outline" size="sm" onClick={loadDatabases}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select value={selectedDbId} onValueChange={setSelectedDbId}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Choose a database..." />
                    </SelectTrigger>
                    <SelectContent>
                      {notionDatabases.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          {db.icon ? `${db.icon} ` : ''}{db.title || 'Untitled'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSelectDatabase}
                      disabled={!selectedDbId || isSelectingDatabase}
                      className="flex-1"
                    >
                      {isSelectingDatabase ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Database'
                      )}
                    </Button>
                    {showDbPicker && (
                      <Button variant="ghost" onClick={() => setShowDbPicker(false)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {!showDbPicker && (
                <Button
                  variant="outline"
                  onClick={() => disconnectChannel('notion')}
                  className="w-full"
                >
                  Disconnect Notion
                </Button>
              )}
            </div>
          ) : (
            /* State A: Not connected */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your Notion workspace to automatically save weekly intel reports
                to a database of your choice.
              </p>
              <Button
                onClick={connectNotion}
                disabled={isConnecting}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Connect with Notion
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
