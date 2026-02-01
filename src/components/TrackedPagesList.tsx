import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { List, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface TrackedPage {
  id: string;
  company_name: string;
  company_slug: string;
  url: string;
  url_type: string;
  is_active: boolean;
  created_at: string;
}

export function TrackedPagesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const { data: pages, isLoading, error } = useQuery({
    queryKey: ['tracked-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_tracked_pages');
      if (error) throw error;
      return data as TrackedPage[];
    },
  });

  const handleToggle = async (pageId: string) => {
    setTogglingIds((prev) => new Set(prev).add(pageId));

    const { error } = await supabase.rpc('toggle_tracked_page', { page_id: pageId });

    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  const handleDelete = async (pageId: string) => {
    setDeletingIds((prev) => new Set(prev).add(pageId));

    const { error } = await supabase.rpc('delete_tracked_page', { page_id: pageId });

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Deleted',
      description: 'Page removed from tracking',
    });

    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-zinc-700" />
          <Skeleton className="h-4 w-60 bg-zinc-700" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-zinc-700" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="py-6">
          <div className="text-center text-rose-400">
            Error loading tracked pages: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <List className="h-5 w-5" />
          Your Tracked Pages
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {pages?.length || 0} page{pages?.length !== 1 ? 's' : ''} being tracked
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!pages || pages.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No pages tracked yet. Add your first company page above.
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-700"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-100 truncate">
                      {page.company_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
                      {page.url_type}
                    </span>
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1 truncate"
                  >
                    {page.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {togglingIds.has(page.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    ) : (
                      <Switch
                        checked={page.is_active}
                        onCheckedChange={() => handleToggle(page.id)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    )}
                    <span className="text-xs text-zinc-500 w-12">
                      {page.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10"
                        disabled={deletingIds.has(page.id)}
                      >
                        {deletingIds.has(page.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-800 border-zinc-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100">
                          Delete tracked page?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                          This will permanently remove "{page.company_name}" ({page.url_type}) from your tracked pages. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(page.id)}
                          className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
