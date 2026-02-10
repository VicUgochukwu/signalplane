import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_suspended: boolean;
  is_banned: boolean;
  last_active_at: string | null;
  profile_created_at: string;
  auth_created_at: string;
  tracked_companies_count: number;
}

type ActionType = 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'change-role';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_search: search || null,
        p_role: roleFilter === 'all' ? null : roleFilter,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_limit: 50,
        p_offset: 0,
      });
      if (error) throw error;
      return data as User[];
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.rpc('admin_suspend_user', {
        p_user_id: userId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeDialog();
    },
    onError: (error) => toast.error('Failed to suspend user', { description: error.message }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('admin_unsuspend_user', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User unsuspended');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => toast.error('Failed to unsuspend user', { description: error.message }),
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.rpc('admin_ban_user', {
        p_user_id: userId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User banned');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeDialog();
    },
    onError: (error) => toast.error('Failed to ban user', { description: error.message }),
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('admin_unban_user', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User unbanned');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => toast.error('Failed to unban user', { description: error.message }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc('admin_set_user_role', {
        p_user_id: userId,
        p_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User role updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeDialog();
    },
    onError: (error) => toast.error('Failed to change role', { description: error.message }),
  });

  const openDialog = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setActionType(null);
    setReason('');
    setNewRole('');
  };

  const handleConfirm = () => {
    if (!selectedUser) return;

    switch (actionType) {
      case 'suspend':
        suspendMutation.mutate({ userId: selectedUser.id, reason });
        break;
      case 'ban':
        banMutation.mutate({ userId: selectedUser.id, reason });
        break;
      case 'change-role':
        changeRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
        break;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (user.is_suspended) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Suspended</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      user: 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30',
    };
    return <Badge className={colors[role] || colors.user}>{role}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Users</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted border-border"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] bg-muted border-border">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-muted border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="rounded-md border border-border bg-muted/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Companies</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-48 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{user.email}</div>
                        {user.display_name && (
                          <div className="text-sm text-muted-foreground">{user.display_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.tracked_companies_count}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(user.profile_created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.is_suspended && !user.is_banned && (
                            <DropdownMenuItem onClick={() => openDialog(user, 'suspend')}>
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          {user.is_suspended && !user.is_banned && (
                            <DropdownMenuItem onClick={() => unsuspendMutation.mutate(user.id)}>
                              Unsuspend User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {!user.is_banned && (
                            <DropdownMenuItem 
                              onClick={() => openDialog(user, 'ban')}
                              className="text-destructive"
                            >
                              Ban User
                            </DropdownMenuItem>
                          )}
                          {user.is_banned && (
                            <DropdownMenuItem onClick={() => unbanMutation.mutate(user.id)}>
                              Unban User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDialog(user, 'change-role')}>
                            Change Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {actionType === 'suspend' && 'Suspend User'}
              {actionType === 'ban' && 'Ban User'}
              {actionType === 'change-role' && 'Change User Role'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {(actionType === 'suspend' || actionType === 'ban') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="bg-muted border-border"
              />
            </div>
          )}

          {actionType === 'change-role' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleConfirm}
              variant={actionType === 'ban' ? 'destructive' : 'default'}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
