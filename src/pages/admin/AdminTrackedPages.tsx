import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Globe, Plus, Search, Trash2, ExternalLink, Loader2,
  CheckCircle2, XCircle, AlertTriangle, BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TrackedPage {
  id: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  url: string;
  url_type: string;
  page_type: string;
  enabled: boolean;
  created_at: string;
  user_id: string;
  snapshot_count: number;
  last_snapshot_at: string | null;
  last_snapshot_status: string | null;
}

interface Stats {
  total_pages: number;
  enabled_pages: number;
  disabled_pages: number;
  unique_companies: number;
  pages_with_snapshots: number;
  total_snapshots: number;
  failed_snapshots: number;
}

interface Company {
  company_id: string;
  company_name: string;
  company_slug: string;
  page_count: number;
}

const PAGE_TYPES = [
  'homepage', 'pricing', 'security', 'customers', 'case_studies',
  'integrations', 'docs', 'comparison', 'partners', 'product',
  'solutions', 'about', 'blog'
];

export default function AdminTrackedPages() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEnabled, setFilterEnabled] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TrackedPage | null>(null);

  // Add form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanySlug, setNewCompanySlug] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPageType, setNewPageType] = useState('homepage');
  const [existingCompanyId, setExistingCompanyId] = useState<string>('new');

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-tracked-pages-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_tracked_pages_stats');
      if (error) throw error;
      return (data as unknown as Stats[])?.[0] ?? null;
    },
  });

  // Fetch tracked pages
  const { data: pages, isLoading: isLoadingPages } = useQuery({
    queryKey: ['admin-tracked-pages', search, filterType, filterEnabled],
    queryFn: async () => {
      const params: Record<string, unknown> = { p_limit: 200, p_offset: 0 };
      if (search) params.p_search = search;
      if (filterType !== 'all') params.p_page_type = filterType;
      if (filterEnabled === 'enabled') params.p_enabled = true;
      if (filterEnabled === 'disabled') params.p_enabled = false;

      const { data, error } = await supabase.rpc('admin_list_tracked_pages', params);
      if (error) throw error;
      return data as unknown as TrackedPage[];
    },
  });

  // Fetch companies for the add form
  const { data: companies } = useQuery({
    queryKey: ['admin-tracked-page-companies'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_tracked_page_companies');
      if (error) throw error;
      return data as unknown as Company[];
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { data, error } = await supabase.rpc('admin_toggle_tracked_page', { p_page_id: pageId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-pages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-pages-stats'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to toggle page', { description: err.message });
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const selectedCompany = companies?.find(c => c.company_id === existingCompanyId);
      const params: Record<string, unknown> = {
        p_company_name: selectedCompany ? selectedCompany.company_name : newCompanyName,
        p_company_slug: selectedCompany ? selectedCompany.company_slug : newCompanySlug,
        p_url: newUrl,
        p_page_type: newPageType,
        p_url_type: newPageType,
      };
      if (selectedCompany) {
        params.p_company_id = selectedCompany.company_id;
      }
      const { data, error } = await supabase.rpc('admin_add_tracked_page', params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-pages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-pages-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-page-companies'] });
      toast.success('Tracked page added');
      setShowAddDialog(false);
      resetAddForm();
    },
    onError: (err: Error) => {
      toast.error('Failed to add page', { description: err.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase.rpc('admin_delete_tracked_page', { p_page_id: pageId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-pages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-pages-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracked-page-companies'] });
      toast.success('Tracked page deleted');
      setDeleteConfirm(null);
    },
    onError: (err: Error) => {
      toast.error('Failed to delete page', { description: err.message });
    },
  });

  const resetAddForm = () => {
    setNewCompanyName('');
    setNewCompanySlug('');
    setNewUrl('');
    setNewPageType('homepage');
    setExistingCompanyId('new');
  };

  const handleCompanyNameChange = (val: string) => {
    setNewCompanyName(val);
    setNewCompanySlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const statusIcon = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground text-xs">—</span>;
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-400" />;
    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Group pages by company
  const groupedPages = pages?.reduce((acc, page) => {
    const key = page.company_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(page);
    return acc;
  }, {} as Record<string, TrackedPage[]>) ?? {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-accent-signal" />
            <h2 className="text-2xl font-bold text-foreground">Tracked Pages</h2>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-[hsl(var(--accent-signal))] hover:bg-[hsl(var(--accent-signal)/0.85)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>

        {/* Stats Row */}
        {isLoadingStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 bg-muted" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold text-foreground">{stats.total_pages}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold text-foreground">{stats.unique_companies}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Snapshots</p>
                <p className="text-2xl font-bold text-foreground">{stats.total_snapshots}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failed_snapshots}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filters */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Company name or URL..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background border-border"
                  />
                </div>
              </div>
              <div className="w-40">
                <Label className="text-xs text-muted-foreground">Page Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PAGE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filterEnabled} onValueChange={setFilterEnabled}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages Table */}
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-base">
              {pages ? `${pages.length} pages` : 'Loading...'}
              {Object.keys(groupedPages).length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">
                  across {Object.keys(groupedPages).length} companies
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingPages ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 bg-muted" />
                ))}
              </div>
            ) : pages && pages.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-10">On</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Snapshots</TableHead>
                      <TableHead>Last Fetch</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pages.map((page) => (
                      <TableRow key={page.id} className="border-border hover:bg-muted/80">
                        <TableCell>
                          <Switch
                            checked={page.enabled}
                            onCheckedChange={() => toggleMutation.mutate(page.id)}
                            disabled={toggleMutation.isPending}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {page.company_name}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-signal hover:underline flex items-center gap-1 truncate"
                          >
                            {page.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-border">
                            {page.page_type || page.url_type || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {page.snapshot_count}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(page.last_snapshot_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {statusIcon(page.last_snapshot_status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                            onClick={() => setDeleteConfirm(page)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tracked pages found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle>Add Tracked Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Company picker */}
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={existingCompanyId} onValueChange={(val) => {
                  setExistingCompanyId(val);
                  if (val !== 'new') {
                    const c = companies?.find(c => c.company_id === val);
                    if (c) {
                      setNewCompanyName(c.company_name);
                      setNewCompanySlug(c.company_slug);
                    }
                  } else {
                    setNewCompanyName('');
                    setNewCompanySlug('');
                  }
                }}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select company..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ New Company</SelectItem>
                    {companies?.map(c => (
                      <SelectItem key={c.company_id} value={c.company_id}>
                        {c.company_name} ({c.page_count} pages)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New company fields */}
              {existingCompanyId === 'new' && (
                <>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={newCompanyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      placeholder="e.g., Stripe"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Slug</Label>
                    <Input
                      value={newCompanySlug}
                      onChange={(e) => setNewCompanySlug(e.target.value)}
                      placeholder="e.g., stripe"
                      className="bg-muted border-border"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://stripe.com/pricing"
                  className="bg-muted border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Page Type</Label>
                <Select value={newPageType} onValueChange={setNewPageType}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetAddForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !newUrl || (!existingCompanyId || (existingCompanyId === 'new' && !newCompanyName))}
                className="bg-[hsl(var(--accent-signal))] hover:bg-[hsl(var(--accent-signal)/0.85)]"
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Page'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-red-400">Delete Tracked Page</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                This will permanently delete this tracked page and all its snapshots/diffs.
              </p>
              {deleteConfirm && (
                <div className="mt-3 p-3 bg-muted rounded border border-border">
                  <p className="font-medium text-sm">{deleteConfirm.company_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{deleteConfirm.url}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {deleteConfirm.snapshot_count} snapshots will be deleted
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
