import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { detectPages, confidenceDot, confidenceLabel } from '@/lib/pageDetection';
import type { DetectedPage } from '@/lib/pageDetection';
import { getUrlTypeLabel } from '@/lib/urlGenerator';
import { checkCompetitorRelevance, relevanceLevel } from '@/lib/competitorSuggestions';
import type { RelevanceResponse } from '@/lib/competitorSuggestions';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, ArrowLeft, Building2, Globe, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCompanyWizardProps {
  onSuccess: () => void;
  initialCompany?: { name: string; domain: string } | null;
  onInitialCompanyConsumed?: () => void;
}

export function AddCompanyWizard({ onSuccess, initialCompany, onInitialCompanyConsumed }: AddCompanyWizardProps) {
  const { toast } = useToast();
  const { profile } = useOnboarding();
  const [step, setStep] = useState<'company' | 'pages'>('company');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [pages, setPages] = useState<DetectedPage[]>([]);

  const [domainManuallyEdited, setDomainManuallyEdited] = useState(false);

  // Relevance warning state
  const [relevanceCheck, setRelevanceCheck] = useState<RelevanceResponse | null>(null);
  const [isCheckingRelevance, setIsCheckingRelevance] = useState(false);
  const [relevanceDismissed, setRelevanceDismissed] = useState(false);

  // Prefill from suggestion
  useEffect(() => {
    if (initialCompany && step === 'company') {
      setCompanyName(initialCompany.name);
      setCompanyDomain(initialCompany.domain);
      setDomainManuallyEdited(true);
      onInitialCompanyConsumed?.();
    }
  }, [initialCompany]);

  // Auto-generate domain from company name (only if user hasn't manually edited domain)
  useEffect(() => {
    if (domainManuallyEdited) return;
    const slug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (slug) {
      setCompanyDomain(`${slug}.com`);
    } else {
      setCompanyDomain('');
    }
  }, [companyName, domainManuallyEdited]);

  // Extract domain from a URL string
  const extractDomainFromUrl = (input: string): string | null => {
    try {
      let urlStr = input.trim();
      if (!urlStr.includes('://')) urlStr = `https://${urlStr}`;
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  };

  // Capitalize first letter of each word for company name
  const domainToCompanyName = (domain: string): string => {
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Intelligent domain input handler — detects pasted URLs and extracts domain
  const handleDomainInput = (value: string) => {
    setDomainManuallyEdited(true);
    const trimmed = value.trim();

    // Check if user pasted a full URL (contains :// or starts with www.)
    if (trimmed.includes('://') || trimmed.startsWith('www.')) {
      const domain = extractDomainFromUrl(trimmed);
      if (domain) {
        setCompanyDomain(domain);
        if (!companyName.trim()) {
          setCompanyName(domainToCompanyName(domain));
        }
        return;
      }
    }

    // Check if it looks like a domain with a path (e.g., "intercom.com/pricing")
    if (trimmed.includes('.') && trimmed.includes('/')) {
      const domain = extractDomainFromUrl(trimmed);
      if (domain) {
        setCompanyDomain(domain);
        if (!companyName.trim()) {
          setCompanyName(domainToCompanyName(domain));
        }
        return;
      }
    }

    setCompanyDomain(value);
  };

  // Smart page detection using edge function
  const detectCompanyPages = async (domain: string) => {
    setIsDetecting(true);
    try {
      const detectedPages = await detectPages(domain, profile?.industry || undefined);
      setPages(detectedPages);
    } catch (err) {
      console.error('Page detection failed:', err);
      // Fallback: set empty pages, user can still add company
      setPages([]);
      toast({
        title: 'Page detection unavailable',
        description: 'You can manually add pages after creating the company.',
      });
    }
    setIsDetecting(false);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setNameError('Company name is required');
      return;
    }
    if (!companyDomain) {
      setNameError('Website domain is required');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.rpc('add_company', {
      p_company_name: trimmedName,
      p_company_slug: companyDomain,
    });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    if (data && data.length > 0) {
      setCompanyId(data[0].company_id);
      setStep('pages');
      // Start smart detection
      detectCompanyPages(companyDomain);
      // Check relevance in background (non-blocking)
      setIsCheckingRelevance(true);
      setRelevanceCheck(null);
      setRelevanceDismissed(false);
      checkCompetitorRelevance(trimmedName, companyDomain)
        .then((result) => {
          setRelevanceCheck(result);
        })
        .catch((err) => {
          console.warn('Relevance check failed:', err);
        })
        .finally(() => {
          setIsCheckingRelevance(false);
        });
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  const handleTogglePage = (pageUrl: string) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.url !== pageUrl) return p;
        if (!p.selected && selectedCount >= 10) return p;
        return { ...p, selected: !p.selected };
      })
    );
  };

  const handleUrlChange = (pageUrl: string, newUrl: string) => {
    setPages((prev) =>
      prev.map((p) => (p.url === pageUrl ? { ...p, url: newUrl } : p))
    );
  };

  const handleSelectAll = () => {
    let count = 0;
    setPages((prev) => prev.map((p) => {
      if (count >= 10) return { ...p, selected: false };
      count++;
      return { ...p, selected: true };
    }));
  };

  const handleDeselectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  const handleSavePages = async () => {
    const selectedPages = pages.filter((p) => p.selected);
    if (selectedPages.length === 0) {
      toast({ title: 'No pages selected', description: 'Select at least one page to track', variant: 'destructive' });
      return;
    }

    // Validate URLs
    for (const page of selectedPages) {
      try {
        new URL(page.url);
      } catch {
        toast({ title: 'Invalid URL', description: `"${page.url}" is not a valid URL`, variant: 'destructive' });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await supabase.rpc('add_company_pages', {
      p_company_id: companyId!,
      p_pages: selectedPages.map((p) => ({ url: p.url, url_type: p.type })),
    });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Pages added',
      description: `${selectedPages.length} page${selectedPages.length !== 1 ? 's' : ''} now being tracked for ${companyName}`,
    });

    // Reset wizard
    setStep('company');
    setCompanyName('');
    setCompanyDomain('');
    setCompanyId(null);
    setPages([]);
    setDomainManuallyEdited(false);
    setRelevanceCheck(null);
    setRelevanceDismissed(false);
    onSuccess();
  };

  const handleBack = () => {
    setStep('company');
    setCompanyId(null);
    setPages([]);
    setRelevanceCheck(null);
    setRelevanceDismissed(false);
  };

  return (
    <Card className="bg-muted border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          {step === 'company' ? (
            <>
              <Building2 className="h-5 w-5" />
              Add Company
            </>
          ) : (
            <>
              <Globe className="h-5 w-5" />
              Select Pages — {companyName}
            </>
          )}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === 'company'
            ? 'Track a new competitor (max 10 companies)'
            : isDetecting
            ? 'Detecting pages...'
            : `${pages.length} pages detected — ${selectedCount} selected`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'company' ? (
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-foreground/80">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Intercom"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-background border-border text-foreground"
                  disabled={isLoading}
                />
                {nameError && <p className="text-sm text-rose-400">{nameError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDomain" className="text-foreground/80">
                  Website Domain
                </Label>
                <Input
                  id="companyDomain"
                  placeholder="apollo.io"
                  value={companyDomain}
                  onChange={(e) => handleDomainInput(e.target.value)}
                  className="bg-background border-border text-foreground"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a URL or type a domain — we'll detect pages automatically
                </p>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company & Detect Pages
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Relevance warning banner */}
            {relevanceCheck && relevanceLevel(relevanceCheck.relevance) === 'low' && !relevanceDismissed && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-300 font-medium">
                    "{companyName}" may not be a direct competitor
                  </p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    {relevanceCheck.reason}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can still track them, but their signals may not be relevant to your competitive strategy.
                  </p>
                </div>
                <button
                  onClick={() => setRelevanceDismissed(true)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Loading state */}
            {isDetecting && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mr-2" />
                <span className="text-muted-foreground text-sm">Detecting pages for {companyDomain}...</span>
              </div>
            )}

            {/* Detected pages with confidence indicators */}
            {!isDetecting && pages.length > 0 && (
              <>
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div
                      key={page.url}
                      className={`rounded-lg border p-3 transition-colors ${
                        page.selected
                          ? 'border-emerald-600/50 bg-emerald-900/10'
                          : 'border-border bg-card/50'
                      } ${!page.selected && selectedCount >= 10 ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`page-${page.type}-${page.url}`}
                          checked={page.selected}
                          onCheckedChange={() => handleTogglePage(page.url)}
                          disabled={!page.selected && selectedCount >= 10}
                          className="border-muted-foreground data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <label
                          htmlFor={`page-${page.type}-${page.url}`}
                          className="text-sm font-medium text-foreground/80 cursor-pointer w-24 shrink-0"
                        >
                          {getUrlTypeLabel(page.type)}
                        </label>
                        <Input
                          value={page.url}
                          onChange={(e) => handleUrlChange(page.url, e.target.value)}
                          className="flex-1 h-8 text-sm bg-background border-border text-muted-foreground"
                          disabled={!page.selected}
                        />
                        <div className="flex items-center gap-1.5 shrink-0" title={confidenceLabel(page.confidence)}>
                          <div className={`w-2 h-2 rounded-full ${confidenceDot(page.confidence)}`} />
                          <span className="text-[10px] text-muted-foreground">{confidenceLabel(page.confidence)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Select / Deselect all */}
                <div className="flex gap-2">
                  <button onClick={handleSelectAll} className="text-xs text-emerald-400 hover:text-emerald-300">
                    Select all
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={handleDeselectAll} className="text-xs text-muted-foreground hover:text-muted-foreground">
                    Deselect all
                  </button>
                </div>
              </>
            )}

            {/* No pages detected */}
            {!isDetecting && pages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">No pages could be auto-detected.</p>
                <p className="text-muted-foreground text-xs mt-1">
                  The company has been added. You can manually add pages later.
                </p>
              </div>
            )}

            {selectedCount >= 10 && (
              <p className="text-xs text-amber-400">
                Maximum 10 pages per company reached. Deselect one to choose a different page.
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-border text-muted-foreground hover:bg-muted"
                disabled={isLoading || isDetecting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSavePages}
                className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                disabled={isLoading || isDetecting || selectedCount === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Save {selectedCount} Page{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
