import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X, Copy, Check, Link } from 'lucide-react';
import { IconTeam } from '@/components/icons';
import { useTeam } from '@/hooks/useTeam';
import { useTierGate } from '@/hooks/useTierGate';
import { useToast } from '@/hooks/use-toast';
import type { TeamRole } from '@/types/teams';

function buildInviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: 'Admin',
  pmm: 'PMM',
  sales: 'Sales',
  executive: 'Executive',
};

const ROLE_COLORS: Record<TeamRole, string> = {
  admin: 'bg-[hsl(var(--accent-signal)/0.1)] text-accent-signal border-[hsl(var(--accent-signal)/0.2)]',
  pmm: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  sales: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  executive: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export default function TeamSettings() {
  const { team, members, invites, role, isAdmin, hasTeam, isLoading, membership, inviteMember, revokeInvite } = useTeam();
  const { canUse, isFree, tier, status, isLoading: tierLoading } = useTierGate();
  const canManageTeam = canUse('team');
  const { toast } = useToast();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('pmm');
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const token = await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      const link = buildInviteUrl(token as string);
      setLastInviteLink(link);
      toast({ title: 'Invite Created', description: `Share the invite link with ${inviteEmail}` });
      setInviteEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invite';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleCopyLink = async (token: string, inviteId: string) => {
    const link = buildInviteUrl(token);
    await navigator.clipboard.writeText(link);
    setCopiedInviteId(inviteId);
    toast({ title: 'Link Copied', description: 'Invite link copied to clipboard' });
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInvite.mutateAsync(inviteId);
      toast({ title: 'Invite Revoked' });
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke invite', variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <IconTeam className="h-6 w-6 text-accent-signal" />
            Team
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and invitations
          </p>
        </div>

        {/* Free tier gate */}
        {!canManageTeam && (
          <Card className="rounded-xl border border-border/50 mb-6">
            <CardContent className="py-12 text-center space-y-3">
              <IconTeam className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-foreground font-medium">Team features require Growth plan</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Upgrade to Growth to invite team members, assign roles, and collaborate on competitive intelligence.
              </p>
              <Button className="bg-accent-signal hover:bg-accent-signal/90 text-white rounded-lg mt-2">
                Upgrade to Growth
              </Button>
            </CardContent>
          </Card>
        )}

        {canManageTeam && (
          <div className="space-y-6">
            {/* Team Info */}
            {hasTeam && team && (
              <Card className="rounded-xl border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                    Team Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium">{team.name}</p>
                      {team.company_domain && (
                        <p className="text-xs text-muted-foreground mt-0.5">{team.company_domain}</p>
                      )}
                    </div>
                    {role && (
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[role]}`}>
                        {ROLE_LABELS[role]}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members */}
            <Card className="rounded-xl border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No team members yet.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                      >
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {member.email || member.user_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invite Member (admin only) */}
            {isAdmin && (
              <Card className="rounded-xl border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                    Invite Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs text-muted-foreground">Email</label>
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="w-32 space-y-1.5">
                      <label className="text-xs text-muted-foreground">Role</label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                        <SelectTrigger className="bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pmm">PMM</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || inviteMember.isPending}
                      className="bg-accent-signal hover:bg-accent-signal/90 text-white rounded-lg"
                    >
                      {inviteMember.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1.5" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Last invite link */}
                  {lastInviteLink && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link className="h-3.5 w-3.5 text-emerald-400" />
                        <p className="text-xs font-medium text-emerald-400">Invite link created</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Share this link with your teammate. They'll need to sign in to accept.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background/50 rounded px-2 py-1.5 text-foreground truncate">
                          {lastInviteLink}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-7 text-xs"
                          onClick={async () => {
                            await navigator.clipboard.writeText(lastInviteLink);
                            toast({ title: 'Copied!' });
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Pending Invites */}
                  {invites.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Pending Invitations
                      </h4>
                      <div className="space-y-2">
                        {invites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground">{invite.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {ROLE_LABELS[invite.role]} — expires {new Date(invite.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(invite.invite_token, invite.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Copy invite link"
                              >
                                {copiedInviteId === invite.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevoke(invite.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                                title="Revoke invite"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  );
}
