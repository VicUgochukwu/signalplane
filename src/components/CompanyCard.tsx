import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronRight, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getUrlTypeLabel } from '@/lib/urlGenerator';

interface TrackedPage {
  id: string;
  url: string;
  url_type: string;
  enabled: boolean;
  created_at: string;
}

interface CompanyCardProps {
  companyId: string;
  companyName: string;
  companySlug: string;
  pages: TrackedPage[];
}

export function CompanyCard({ companyId, companyName, companySlug, pages }: CompanyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingCompany, setDeletingCompany] = useState(false);

  const activeCount = pages.filter((p) => p.enabled).length;

  const handleToggle = async (pageId: string) => {
    setTogglingIds((prev) => new Set(prev).add(pageId));
    const { error } = await supabase.rpc('toggle_tracked_page', { page_id: pageId });
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  const handleDeletePage = async (pageId: string) => {
    setDeletingIds((prev) => new Set(prev).add(pageId));
    const { error } = await supabase.rpc('delete_tracked_page', { page_id: pageId });
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Page removed from tracking' });
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  const handleDeleteCompany = async () => {
    setDeletingCompany(true);
    const { error } = await supabase.rpc('delete_company', { p_company_id: companyId });
    setDeletingCompany(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: `${companyName} and all its pages removed` });
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
    queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    queryClient.invalidateQueries({ queryKey: ['knowledge-ledger'] });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-muted overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:text-foreground transition-colors">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-semibold text-foreground">{companyName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {pages.length} page{pages.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-muted-foreground">
                {activeCount} active
              </span>
            </button>
          </CollapsibleTrigger>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-400/10"
                disabled={deletingCompany}
              >
                {deletingCompany ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-muted border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Delete {companyName}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently remove {companyName} from your competitors, delete all {pages.length} tracked page{pages.length !== 1 ? 's' : ''}, and erase all collected snapshots and change history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted text-foreground border-border hover:bg-muted">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCompany}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  Delete Company
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Pages */}
        <CollapsibleContent>
          <div className="border-t border-border divide-y divide-border/50">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between px-4 py-3 bg-card/50"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {getUrlTypeLabel(page.url_type)}
                    </span>
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-muted-foreground flex items-center gap-1 truncate mt-1"
                  >
                    {page.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {togglingIds.has(page.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={page.enabled}
                        onCheckedChange={() => handleToggle(page.id)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    )}
                    <span className="text-xs text-muted-foreground w-12">
                      {page.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-400/10 h-8 w-8"
                        disabled={deletingIds.has(page.id)}
                      >
                        {deletingIds.has(page.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-muted border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">
                          Delete page?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Remove the {getUrlTypeLabel(page.url_type)} page for {companyName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-muted text-foreground border-border hover:bg-muted">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePage(page.id)}
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
