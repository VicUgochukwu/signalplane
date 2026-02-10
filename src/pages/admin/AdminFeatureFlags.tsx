import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, MoreVertical, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface FeatureFlag {
  id: string;
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  applies_to: string;
  allowed_user_ids: string[];
  created_at: string;
  updated_at: string;
}

interface FlagFormData {
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  applies_to: string;
}

const defaultFormData: FlagFormData = {
  flag_key: '',
  label: '',
  description: '',
  is_enabled: false,
  applies_to: 'all',
};

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState<FlagFormData>(defaultFormData);

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_feature_flags');
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ flagKey, enabled }: { flagKey: string; enabled: boolean }) => {
      const { error } = await supabase.rpc('admin_toggle_feature_flag', {
        p_flag_key: flagKey,
        p_enabled: enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feature flag updated');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: (error) => toast.error('Failed to update flag', { description: error.message }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: FlagFormData) => {
      const { error } = await supabase.rpc('admin_create_feature_flag', {
        p_flag_key: data.flag_key,
        p_label: data.label,
        p_description: data.description || null,
        p_is_enabled: data.is_enabled,
        p_applies_to: data.applies_to,
        p_allowed_user_ids: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feature flag created');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      setIsCreateOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => toast.error('Failed to create flag', { description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ flagKey, data }: { flagKey: string; data: Partial<FlagFormData> }) => {
      const { error } = await supabase.rpc('admin_update_feature_flag', {
        p_flag_key: flagKey,
        p_label: data.label || null,
        p_description: data.description || null,
        p_applies_to: data.applies_to || null,
        p_allowed_user_ids: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feature flag updated');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      setIsEditOpen(false);
      setSelectedFlag(null);
    },
    onError: (error) => toast.error('Failed to update flag', { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (flagKey: string) => {
      const { error } = await supabase.rpc('admin_delete_feature_flag', {
        p_flag_key: flagKey,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feature flag deleted');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      setIsDeleteOpen(false);
      setSelectedFlag(null);
    },
    onError: (error) => toast.error('Failed to delete flag', { description: error.message }),
  });

  const getScopeBadge = (scope: string, userCount?: number) => {
    const colors: Record<string, string> = {
      all: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      specific_users: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    const label = scope === 'specific_users' && userCount !== undefined
      ? `${userCount} users`
      : scope;
    return <Badge className={colors[scope] || colors.all}>{label}</Badge>;
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setFormData({
      flag_key: flag.flag_key,
      label: flag.label,
      description: flag.description || '',
      is_enabled: flag.is_enabled,
      applies_to: flag.applies_to,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flag_key || !formData.label) {
      toast.error('Flag key and label are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlag) return;
    updateMutation.mutate({
      flagKey: selectedFlag.flag_key,
      data: formData,
    });
  };

  const FlagForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="flag_key">Flag Key</Label>
        <Input
          id="flag_key"
          placeholder="e.g., new_feature_enabled"
          value={formData.flag_key}
          onChange={(e) => setFormData({ ...formData, flag_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
          disabled={isEdit}
          className="bg-background border-border"
        />
        <p className="text-xs text-muted-foreground">Lowercase with underscores only</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          placeholder="Feature Display Name"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="bg-background border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-background border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="applies_to">Applies To</Label>
        <Select
          value={formData.applies_to}
          onValueChange={(value) => setFormData({ ...formData, applies_to: value })}
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admins Only</SelectItem>
            <SelectItem value="specific_users">Specific Users</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!isEdit && (
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />
          <Label>Enabled by default</Label>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Feature Flags</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag to control functionality
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <FlagForm />
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Create'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-muted/50 border-border">
                <CardHeader>
                  <Skeleton className="h-5 w-48 bg-muted" />
                  <Skeleton className="h-4 w-72 bg-muted" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : flags?.length === 0 ? (
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              No feature flags configured yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {flags?.map((flag) => (
              <Card key={flag.flag_key} className="bg-muted/50 border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-foreground">{flag.label}</CardTitle>
                        {getScopeBadge(flag.applies_to, flag.allowed_user_ids?.length)}
                      </div>
                      <CardDescription>{flag.description}</CardDescription>
                      <div className="flex items-center gap-2 pt-1">
                        <code className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                          {flag.flag_key}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          Created {format(new Date(flag.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={(enabled) =>
                          toggleMutation.mutate({ flagKey: flag.flag_key, enabled })
                        }
                        disabled={toggleMutation.isPending}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border-border">
                          <DropdownMenuItem onClick={() => openEditDialog(flag)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(flag)}
                            className="text-red-400 focus:text-red-400"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle>Edit Feature Flag</DialogTitle>
              <DialogDescription>Update the feature flag settings</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <FlagForm isEdit />
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the "{selectedFlag?.label}" flag? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedFlag && deleteMutation.mutate(selectedFlag.flag_key)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
