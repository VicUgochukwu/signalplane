import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { ChevronDown, ChevronRight, Trash2, ExternalLink, Loader2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getUrlTypeLabel } from '@/lib/urlGenerator';
import { detectPages, confidenceDot, confidenceLabel } from '@/lib/pageDetection';
import type { DetectedPage } from '@/lib/pageDetection';

const PAGE_TYPES = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'product', label: 'Product' },
  { value: 'features', label: 'Features' },
  { value: 'about', label: 'About' },
  { value: 'blog', label: 'Blog' },
  { value: 'docs', label: 'Documentation' },
  { value: 'solutions', label: 'Solutions' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'customers', label: 'Customers' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'careers', label: 'Careers' },
  { value: 'resources', label: 'Resources' },
  { value: 'partners', label: 'Partners' },
  { value: 'security', label: 'Security' },
  { value: 'changelog', label: 'Changelog' },
];

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
  const { profile } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingCompany, setDeletingCompany] = useState(false);

  // Add Page state
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageUrl, setNewPageUrl] = useState('');
  const [newPageType, setNewPageType] = useState('homepage');
  const [isAddingPage, setIsAddingPage] = useState(false);

  // Detect Pages state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedPages, setDetectedPages] = useState<DetectedPage[]>([]);
  const [showDetected, setShowDetected] = useState(false);
  const [isSavingDetected, setIsSavingDetected] = useState(false);

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

  // Manual Add Page
  const handleAddPage = async () => {
    const trimmedUrl = newPageUrl.trim();
    if (!trimmedUrl) return;

    // Auto-prepend https:// if missing
    let finalUrl = trimmedUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      new URL(finalUrl);
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid URL', variant: 'destructive' });
      return;
    }

    setIsAddingPage(true);
    const { error } = await supabase.rpc('add_company_pages', {
      p_company_id: companyId,
      p_pages: [{ url: finalUrl, url_type: newPageType }],
    });
    setIsAddingPage(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Page added', description: `${getUrlTypeLabel(newPageType)} page now being tracked` });
    setNewPageUrl('');
    setNewPageType('homepage');
    setShowAddPage(false);
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  // Detect Pages for this company
  const handleDetectPages = async () => {
    setIsDetecting(true);
    setShowDetected(true);
    setIsOpen(true);
    try {
      // Filter out pages that are already tracked
      const existingUrls = new Set(pages.map((p) => p.url.toLowerCase()));
      const detected = await detectPages(companySlug, profile?.industry || undefined);
      const newPages = detected.map((p) => ({
        ...p,
        selected: p.selected && !existingUrls.has(p.url.toLowerCase()),
      })).filter((p) => !existingUrls.has(p.url.toLowerCase()));

      if (newPages.length === 0) {
        toast({ title: 'No new pages found', description: 'All detectable pages are already being tracked' });
        setShowDetected(false);
      } else {
        setDetectedPages(newPages);
      }
    } catch (err) {
      console.error('Page detection failed:', err);
      toast({ title: 'Detection failed', description: 'Could not detect pages. Try adding them manually.', variant: 'destructive' });
      setShowDetected(false);
    }
    setIsDetecting(false);
  };

  const handleToggleDetected = (url: string) => {
    setDetectedPages((prev) =>
      prev.map((p) => (p.url === url ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSaveDetected = async () => {
    const selected = detectedPages.filter((p) => p.selected);
    if (selected.length === 0) {
      toast({ title: 'No pages selected', variant: 'destructive' });
      return;
    }

    setIsSavingDetected(true);
    const { error } = await supabase.rpc('add_company_pages', {
      p_company_id: companyId,
      p_pages: selected.map((p) => ({ url: p.url, url_type: p.type })),
    });
    setIsSavingDetected(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Pages added',
      description: `${selected.length} page${selected.length !== 1 ? 's' : ''} now being tracked for ${companyName}`,
    });
    setShowDetected(false);
    setDetectedPages([]);
    queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
  };

  const selectedDetectedCount = detectedPages.filter((p) => p.selected).length;

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

          <div className="flex items-center gap-1">
            {/* Detect Pages button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-accent-signal hover:bg-[hsl(var(--accent-signal)/0.1)]"
              onClick={handleDetectPages}
              disabled={isDetecting}
              title="Detect pages"
            >
              {isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            {/* Delete Company button */}
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
        </div>

        {/* Pages */}
        <CollapsibleContent>
          <div className="border-t border-border divide-y divide-border/50">
            {/* Existing pages */}
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

            {/* Detected Pages Review (inline) */}
            {showDetected && (
              <div className="px-4 py-3 bg-card/50 space-y-3">
                {isDetecting ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-signal mr-2" />
                    <span className="text-sm text-muted-foreground">Detecting pages for {companySlug}...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground font-medium">
                      {detectedPages.length} new page{detectedPages.length !== 1 ? 's' : ''} detected — {selectedDetectedCount} selected
                    </p>
                    <div className="space-y-1.5">
                      {detectedPages.map((page) => (
                        <div
                          key={page.url}
                          className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
                            page.selected
                              ? 'border-[hsl(var(--accent-signal)/0.5)] bg-[hsl(var(--accent-signal)/0.1)]'
                              : 'border-border bg-background/50'
                          }`}
                        >
                          <Checkbox
                            checked={page.selected}
                            onCheckedChange={() => handleToggleDetected(page.url)}
                            className="border-muted-foreground data-[state=checked]:bg-[hsl(var(--accent-signal))] data-[state=checked]:border-[hsl(var(--accent-signal))]"
                          />
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {getUrlTypeLabel(page.type)}
                          </span>
                          <span className="text-sm text-muted-foreground truncate flex-1">{page.url}</span>
                          <div className="flex items-center gap-1 shrink-0" title={confidenceLabel(page.confidence)}>
                            <div className={`w-1.5 h-1.5 rounded-full ${confidenceDot(page.confidence)}`} />
                            <span className="text-[10px] text-muted-foreground">{confidenceLabel(page.confidence)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveDetected}
                        disabled={isSavingDetected || selectedDetectedCount === 0}
                        className="bg-[hsl(var(--accent-signal))] text-white hover:bg-[hsl(var(--accent-signal)/0.85)]"
                      >
                        {isSavingDetected ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        Add {selectedDetectedCount} Page{selectedDetectedCount !== 1 ? 's' : ''}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowDetected(false); setDetectedPages([]); }}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Add Page form */}
            {!showDetected && (
              <div className="px-4 py-2.5 bg-card/50">
                {!showAddPage ? (
                  <button
                    onClick={() => setShowAddPage(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    disabled={pages.length >= 10}
                  >
                    <Plus className="h-3 w-3" />
                    {pages.length >= 10 ? 'Maximum 10 pages reached' : 'Add page manually'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://competitor.com/pricing"
                        value={newPageUrl}
                        onChange={(e) => setNewPageUrl(e.target.value)}
                        className="h-8 text-sm bg-background border-border text-foreground flex-1"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddPage(); }}
                      />
                      <Select value={newPageType} onValueChange={setNewPageType}>
                        <SelectTrigger className="h-8 text-sm bg-background border-border text-foreground w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {PAGE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-foreground">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddPage}
                        disabled={isAddingPage || !newPageUrl.trim()}
                        className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                      >
                        {isAddingPage ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowAddPage(false); setNewPageUrl(''); setNewPageType('homepage'); }}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state with detect prompt */}
            {pages.length === 0 && !showDetected && !showAddPage && (
              <div className="px-4 py-6 bg-card/50 text-center">
                <p className="text-sm text-muted-foreground mb-2">No pages tracked yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDetectPages}
                  disabled={isDetecting}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  {isDetecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Auto-detect pages
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
