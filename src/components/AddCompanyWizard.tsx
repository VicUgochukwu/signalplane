import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, ArrowLeft, Building2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { URL_TYPES, generatePageUrl, getUrlTypeLabel } from '@/lib/urlGenerator';
import type { UrlType } from '@/lib/urlGenerator';

interface PageSelection {
  type: UrlType;
  url: string;
  selected: boolean;
}

interface AddCompanyWizardProps {
  onSuccess: () => void;
}

export function AddCompanyWizard({ onSuccess }: AddCompanyWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'company' | 'pages'>('company');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [pages, setPages] = useState<PageSelection[]>([]);

  // Auto-generate domain from company name (user can edit)
  useEffect(() => {
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
  }, [companyName]);

  // Initialize page selections when entering step 2
  const initializePages = (domain: string) => {
    setPages(
      URL_TYPES.map((type) => ({
        type,
        url: generatePageUrl(domain, type),
        selected: false,
      }))
    );
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
      initializePages(companyDomain);
      setStep('pages');
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  const handleTogglePage = (type: UrlType) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.type !== type) return p;
        if (!p.selected && selectedCount >= 5) return p; // enforce max 5
        return { ...p, selected: !p.selected };
      })
    );
  };

  const handleUrlChange = (type: UrlType, url: string) => {
    setPages((prev) =>
      prev.map((p) => (p.type === type ? { ...p, url } : p))
    );
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
    onSuccess();
  };

  const handleBack = () => {
    setStep('company');
    setCompanyId(null);
    setPages([]);
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
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
        <CardDescription className="text-zinc-400">
          {step === 'company'
            ? 'Track a new competitor (max 5 companies)'
            : `Choose which pages to track (${selectedCount}/5 selected)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'company' ? (
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-zinc-200">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Intercom"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-zinc-900 border-zinc-600 text-zinc-100"
                  disabled={isLoading}
                />
                {nameError && <p className="text-sm text-rose-400">{nameError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDomain" className="text-zinc-200">
                  Website Domain
                </Label>
                <Input
                  id="companyDomain"
                  placeholder="apollo.io"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  className="bg-zinc-900 border-zinc-600 text-zinc-100"
                  disabled={isLoading}
                />
                <p className="text-xs text-zinc-500">
                  Used to generate URLs: www.{companyDomain || '...'}
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
                  Add Company
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Page type checkboxes with editable URLs */}
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.type}
                  className={`rounded-lg border p-3 transition-colors ${
                    page.selected
                      ? 'border-emerald-600/50 bg-emerald-900/10'
                      : 'border-zinc-700 bg-zinc-900/50'
                  } ${!page.selected && selectedCount >= 5 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`page-${page.type}`}
                      checked={page.selected}
                      onCheckedChange={() => handleTogglePage(page.type)}
                      disabled={!page.selected && selectedCount >= 5}
                      className="border-zinc-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <label
                      htmlFor={`page-${page.type}`}
                      className="text-sm font-medium text-zinc-200 cursor-pointer w-28"
                    >
                      {getUrlTypeLabel(page.type)}
                    </label>
                    <Input
                      value={page.url}
                      onChange={(e) => handleUrlChange(page.type, e.target.value)}
                      className="flex-1 h-8 text-sm bg-zinc-900 border-zinc-600 text-zinc-300"
                      disabled={!page.selected}
                    />
                  </div>
                </div>
              ))}
            </div>

            {selectedCount >= 5 && (
              <p className="text-xs text-amber-400">
                Maximum 5 pages per company reached. Deselect one to choose a different page.
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSavePages}
                className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                disabled={isLoading || selectedCount === 0}
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
