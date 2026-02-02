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
  const [isOpen, setIsOpen] = useState(true);
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
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-800">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:text-zinc-100 transition-colors">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              )}
              <span className="font-semibold text-zinc-100">{companyName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                {pages.length} page{pages.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-zinc-500">
                {activeCount} active
              </span>
            </button>
          </CollapsibleTrigger>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10"
                disabled={deletingCompany}
              >
                {deletingCompany ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-800 border-zinc-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-zinc-100">
                  Delete {companyName}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  This will permanently remove {companyName} and all {pages.length} tracked page{pages.length !== 1 ? 's' : ''}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600">
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
          <div className="border-t border-zinc-700 divide-y divide-zinc-700/50">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between px-4 py-3 bg-zinc-900/50"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
                      {getUrlTypeLabel(page.url_type)}
                    </span>
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1 truncate mt-1"
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
                        checked={page.enabled}
                        onCheckedChange={() => handleToggle(page.id)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    )}
                    <span className="text-xs text-zinc-500 w-12">
                      {page.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 h-8 w-8"
                        disabled={deletingIds.has(page.id)}
                      >
                        {deletingIds.has(page.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-800 border-zinc-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100">
                          Delete page?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                          Remove the {getUrlTypeLabel(page.url_type)} page for {companyName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600">
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
