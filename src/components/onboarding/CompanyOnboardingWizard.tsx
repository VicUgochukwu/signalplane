import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunctionSilent } from '@/lib/edge-functions';
import { detectPages, confidenceDot, confidenceLabel } from '@/lib/pageDetection';
import type { DetectedPage, DetectionResult } from '@/lib/pageDetection';
import { getUrlTypeLabel } from '@/lib/urlGenerator';
import { fetchCompetitorSuggestions, confidenceBadge, confidenceTag } from '@/lib/competitorSuggestions';
import type { CompetitorSuggestion } from '@/lib/competitorSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  X,
  Globe,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { IconCompany, IconSignalICP } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Competitor {
  name: string;
  domain: string;
  company_id?: string;
}

interface CompanyOnboardingWizardProps {
  onComplete: () => void;
}

const INDUSTRIES = [
  'SaaS / Software',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Marketing / Advertising',
  'Sales / CRM',
  'Analytics / Data',
  'Security',
  'Developer Tools',
  'HR / Recruiting',
  'Other',
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const DEPARTMENTS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'revops', label: 'Revenue Operations' },
  { value: 'product', label: 'Product' },
  { value: 'executive', label: 'Executive / Leadership' },
  { value: 'other', label: 'Other' },
];

type Step = 'company' | 'competitors' | 'review_pages' | 'confirm';
const STEPS: Step[] = ['company', 'competitors', 'review_pages', 'confirm'];

export function CompanyOnboardingWizard({ onComplete }: CompanyOnboardingWizardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('company');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Company info
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');

  // Step 2: Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');

  // AI suggestions for step 2
  const [aiSuggestions, setAiSuggestions] = useState<CompetitorSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(false);

  // Search state for competitor lookup (used in addCompetitor reset)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id?: string; name: string; domain: string }>>([]);

  // Step 3: Page detection results per competitor
  const [detectionResults, setDetectionResults] = useState<Map<string, DetectionResult>>(new Map());
  const [expandedCompetitors, setExpandedCompetitors] = useState<Set<string>>(new Set());

  // Auto-generate domain from company name
  useEffect(() => {
    if (companyName && !companyDomain) {
      const slug = companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '')
        .replace(/-+/g, '-');
      if (slug) {
        setCompanyDomain(`${slug}.com`);
      }
    }
  }, [companyName]);

  // ── Fetch AI suggestions when entering step 2 ──────────────────
  // Track what profile was used for suggestions so we re-fetch when it changes
  const [lastSuggestedProfile, setLastSuggestedProfile] = useState('');

  useEffect(() => {
    if (step !== 'competitors') return;
    if (isFetchingSuggestions) return;

    const profileOverride = {
      company_name: companyName.trim(),
      company_domain: companyDomain.trim(),
      industry: industry || '',
    };

    if (!profileOverride.company_name) return;

    // Build a profile key to detect changes (e.g. user went back and changed company name)
    const profileKey = `${profileOverride.company_name}|${profileOverride.company_domain}|${profileOverride.industry}`;
    if (aiSuggestions.length > 0 && profileKey === lastSuggestedProfile) return;

    setIsFetchingSuggestions(true);
    setSuggestionsError(false);

    fetchCompetitorSuggestions(profileOverride)
      .then((res) => {
        setAiSuggestions(res.suggestions || []);
        setLastSuggestedProfile(profileKey);
      })
      .catch((err) => {
        console.warn('AI suggestions failed:', err);
        setSuggestionsError(true);
      })
      .finally(() => {
        setIsFetchingSuggestions(false);
      });
  }, [step, companyName, companyDomain, industry]);

  // ── Page detection ───────────────────────────────────────────────

  const startDetection = (domain: string) => {
    setDetectionResults((prev) => {
      const next = new Map(prev);
      next.set(domain, { domain, status: 'loading', pages: [] });
      return next;
    });

    detectPages(domain, industry || undefined)
      .then((pages) => {
        setDetectionResults((prev) => {
          const next = new Map(prev);
          next.set(domain, { domain, status: 'success', pages });
          return next;
        });
      })
      .catch((err) => {
        setDetectionResults((prev) => {
          const next = new Map(prev);
          next.set(domain, { domain, status: 'error', pages: [], error: err.message });
          return next;
        });
      });
  };

  const togglePage = (domain: string, pageUrl: string) => {
    setDetectionResults((prev) => {
      const next = new Map(prev);
      const result = next.get(domain);
      if (!result) return next;
      next.set(domain, {
        ...result,
        pages: result.pages.map((p) =>
          p.url === pageUrl ? { ...p, selected: !p.selected } : p
        ),
      });
      return next;
    });
  };

  const selectAllPages = (domain: string) => {
    setDetectionResults((prev) => {
      const next = new Map(prev);
      const result = next.get(domain);
      if (!result) return next;
      next.set(domain, {
        ...result,
        pages: result.pages.map((p) => ({ ...p, selected: true })),
      });
      return next;
    });
  };

  const deselectAllPages = (domain: string) => {
    setDetectionResults((prev) => {
      const next = new Map(prev);
      const result = next.get(domain);
      if (!result) return next;
      next.set(domain, {
        ...result,
        pages: result.pages.map((p) => ({ ...p, selected: false })),
      });
      return next;
    });
  };

  const updatePageUrl = (domain: string, oldUrl: string, newUrl: string) => {
    setDetectionResults((prev) => {
      const next = new Map(prev);
      const result = next.get(domain);
      if (!result) return next;
      next.set(domain, {
        ...result,
        pages: result.pages.map((p) =>
          p.url === oldUrl ? { ...p, url: newUrl } : p
        ),
      });
      return next;
    });
  };

  const toggleExpanded = (domain: string) => {
    setExpandedCompetitors((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  // ── Competitor management ────────────────────────────────────────

  const addCompetitor = (company: { id?: string; name: string; domain: string }) => {
    if (competitors.length >= 10) {
      toast({
        title: 'Maximum reached',
        description: 'You can track up to 10 competitors',
        variant: 'destructive',
      });
      return;
    }

    const newCompetitor = { name: company.name, domain: company.domain, company_id: company.id };
    setCompetitors([...competitors, newCompetitor]);

    // Start page detection in background
    startDetection(company.domain);

    setSearchQuery('');
    setSearchResults([]);
  };

  const addNewCompetitor = () => {
    if (!newCompetitorName.trim() || !newCompetitorDomain.trim()) {
      toast({
        title: 'Missing info',
        description: 'Please enter both name and domain',
        variant: 'destructive',
      });
      return;
    }

    addCompetitor({ name: newCompetitorName.trim(), domain: newCompetitorDomain.trim() });
    setNewCompetitorName('');
    setNewCompetitorDomain('');
    setShowAddNew(false);
  };

  const removeCompetitor = (domain: string) => {
    setCompetitors(competitors.filter((c) => c.domain !== domain));
    setDetectionResults((prev) => {
      const next = new Map(prev);
      next.delete(domain);
      return next;
    });
    setExpandedCompetitors((prev) => {
      const next = new Set(prev);
      next.delete(domain);
      return next;
    });
  };

  // ── Step navigation ──────────────────────────────────────────────

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({ title: 'Company name required', variant: 'destructive' });
      return;
    }
    setStep('competitors');
  };

  const handleStep2Submit = () => {
    if (competitors.length === 0) {
      toast({
        title: 'Add at least one competitor',
        description: 'Select competitors to track for your intelligence feed',
        variant: 'destructive',
      });
      return;
    }
    // Expand all competitors by default in review step
    setExpandedCompetitors(new Set(competitors.map((c) => c.domain)));
    setStep('review_pages');
  };

  const handleStep3Submit = () => {
    setStep('confirm');
  };

  // ── Final submit ─────────────────────────────────────────────────

  const handleFinalSubmit = async () => {
    if (!user) return;

    setIsLoading(true);

    const competitorsJson = competitors.map((c, idx) => {
      const detection = detectionResults.get(c.domain);
      const selectedPages = detection?.pages.filter((p) => p.selected) || [];

      return {
        name: c.name,
        domain: c.domain,
        priority: competitors.length - idx,
        pages: selectedPages.map((p) => ({
          url: p.url,
          url_type: p.type,
        })),
      };
    });

    const { error } = await supabase.rpc('complete_onboarding_with_pages', {
      p_user_id: user.id,
      p_company_name: companyName.trim(),
      p_company_domain: companyDomain.trim() || null,
      p_industry: industry || null,
      p_company_size: companySize || null,
      p_job_title: jobTitle.trim() || null,
      p_department: department || null,
      p_competitors: competitorsJson,
    });

    setIsLoading(false);

    if (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const totalPages = competitorsJson.reduce((sum, c) => sum + c.pages.length, 0);
    toast({
      title: 'Welcome to Control Plane!',
      description: `Tracking ${totalPages} pages across ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}`,
    });

    // Fire Loops event with ICP data (fire-and-forget)
    invokeEdgeFunctionSilent('loops-sync', {
      action: 'track_event',
      event_name: 'onboarding_completed',
      properties: {
        company_name: companyName,
        industry,
        competitor_count: competitors.length,
        department: department || 'other',
        job_title: jobTitle || '',
      },
    });

    // Re-sync contact to Loops so ICP fields (department, jobTitle) are captured
    invokeEdgeFunctionSilent('loops-sync', { action: 'sync_new_user' });

    onComplete();
  };

  // ── Computed values ──────────────────────────────────────────────

  const allDetectionsComplete = competitors.every((c) => {
    const result = detectionResults.get(c.domain);
    return result && (result.status === 'success' || result.status === 'error');
  });

  const totalSelectedPages = competitors.reduce((sum, c) => {
    const result = detectionResults.get(c.domain);
    return sum + (result?.pages.filter((p) => p.selected).length || 0);
  }, 0);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl bg-background border-border">
        <CardHeader className="text-center pb-4">
          {/* Progress indicator — 4 dots */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step === s
                    ? 'bg-[#6B9B9B]'
                    : STEPS.indexOf(step) > i
                    ? 'bg-[#6B9B9B]/60'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <CardTitle className="text-foreground text-2xl flex items-center justify-center gap-3">
            {step === 'company' && (
              <>
                <IconCompany className="h-6 w-6 text-[#6B9B9B]" />
                Tell us about your company
              </>
            )}
            {step === 'competitors' && (
              <>
                <IconSignalICP className="h-6 w-6 text-[#6B9B9B]" />
                Who are your competitors?
              </>
            )}
            {step === 'review_pages' && (
              <>
                <Globe className="h-6 w-6 text-[#6B9B9B]" />
                Review tracked pages
              </>
            )}
            {step === 'confirm' && (
              <>
                <CheckCircle2 className="h-6 w-6 text-[#6B9B9B]" />
                Ready to launch
              </>
            )}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'company' && 'This helps us personalize your intelligence feed'}
            {step === 'competitors' && `Add up to 10 competitors to track (${competitors.length}/10 selected)`}
            {step === 'review_pages' && `We auto-detected pages for your competitors. Verify and adjust below.`}
            {step === 'confirm' && 'Review your setup before we start gathering intel'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Step 1: Company Info ─────────────────────────────── */}
          {step === 'company' && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-foreground/80">
                  Company Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDomain" className="text-foreground/80">
                  Website Domain
                </Label>
                <Input
                  id="companyDomain"
                  placeholder="acme.com"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind} className="text-foreground">
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground/80">Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value} className="text-foreground">
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-foreground/80">
                    Your Role
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="Head of Marketing"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground/80">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value} className="text-foreground">
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          )}

          {/* ── Step 2: Competitors ──────────────────────────────── */}
          {step === 'competitors' && (
            <div className="space-y-5">
              {/* AI Suggestions */}
              {(isFetchingSuggestions || aiSuggestions.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <Label className="text-muted-foreground text-sm">Suggested for you</Label>
                    {isFetchingSuggestions && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {!isFetchingSuggestions && aiSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions
                        .filter(
                          (s) => !competitors.some((c) => c.domain === s.domain),
                        )
                        .slice(0, competitors.length >= 3 ? 4 : 8)
                        .map((s) => (
                          <button
                            key={s.domain}
                            onClick={() =>
                              addCompetitor({ name: s.name, domain: s.domain })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border bg-muted/50 hover:bg-[#6B9B9B]/20 hover:border-[#6B9B9B]/30 transition-colors"
                            title={s.reason}
                          >
                            <Plus className="h-3 w-3 text-[#6B9B9B]" />
                            <span className="text-foreground">{s.name}</span>
                            <span
                              className={`text-[9px] px-1 py-0.5 rounded border ${confidenceBadge(s.confidence)}`}
                            >
                              {Math.round(s.confidence * 100)}%
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                  {isFetchingSuggestions && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-8 w-28 rounded-full bg-muted animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add competitor manually */}
              {!showAddNew ? (
                <button
                  onClick={() => setShowAddNew(true)}
                  className="text-sm text-[#6B9B9B] hover:text-[#5A8A8A] flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add a competitor manually
                </button>
              ) : (
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <Input
                    placeholder="Company name"
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                  <Input
                    placeholder="domain.com"
                    value={newCompetitorDomain}
                    onChange={(e) => setNewCompetitorDomain(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={addNewCompetitor}
                      className="flex-1 bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
                      size="sm"
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddNew(false);
                        setNewCompetitorName('');
                        setNewCompetitorDomain('');
                      }}
                      variant="outline"
                      className="border-border text-muted-foreground"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected competitors with detection status */}
              {competitors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Selected competitors:</Label>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((comp) => {
                      const detection = detectionResults.get(comp.domain);
                      return (
                        <div
                          key={comp.domain}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#6B9B9B]/20 border border-[#6B9B9B]/30 rounded-full"
                        >
                          {detection?.status === 'loading' && (
                            <Loader2 className="h-3 w-3 animate-spin text-[#6B9B9B]" />
                          )}
                          {detection?.status === 'success' && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                          {detection?.status === 'error' && (
                            <AlertCircle className="h-3 w-3 text-amber-400" />
                          )}
                          <span className="text-foreground text-sm">{comp.name}</span>
                          <button
                            onClick={() => removeCompetitor(comp.domain)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep('company')}
                  variant="outline"
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Submit}
                  className="flex-1 bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
                  disabled={competitors.length === 0}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review Pages ─────────────────────────────── */}
          {step === 'review_pages' && (
            <div className="space-y-4">
              {/* Competitor accordion */}
              <div className="space-y-3">
                {competitors.map((comp) => {
                  const detection = detectionResults.get(comp.domain);
                  const isExpanded = expandedCompetitors.has(comp.domain);
                  const selectedCount = detection?.pages.filter((p) => p.selected).length || 0;

                  return (
                    <Collapsible
                      key={comp.domain}
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(comp.domain)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="text-left">
                              <p className="text-foreground font-medium text-sm">{comp.name}</p>
                              <p className="text-muted-foreground text-xs">{comp.domain}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {detection?.status === 'loading' && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Detecting...
                              </span>
                            )}
                            {detection?.status === 'success' && (
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                {selectedCount} page{selectedCount !== 1 ? 's' : ''} selected
                              </span>
                            )}
                            {detection?.status === 'error' && (
                              <span className="flex items-center gap-1 text-xs text-amber-400">
                                <AlertCircle className="h-3 w-3" />
                                Detection failed
                              </span>
                            )}
                          </div>
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-1 p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
                          {detection?.status === 'loading' && (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-[#6B9B9B] mr-2" />
                              <span className="text-muted-foreground text-sm">Detecting pages for {comp.domain}...</span>
                            </div>
                          )}

                          {detection?.status === 'error' && (
                            <div className="py-4 text-center">
                              <AlertCircle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                              <p className="text-muted-foreground text-sm">
                                Couldn't auto-detect pages for {comp.name}.
                              </p>
                              <p className="text-muted-foreground text-xs mt-1">
                                You can add pages manually later from My Pages.
                              </p>
                            </div>
                          )}

                          {detection?.status === 'success' && detection.pages.length > 0 && (
                            <>
                              {detection.pages.map((page) => (
                                <div
                                  key={page.url}
                                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                                    page.selected
                                      ? 'bg-[#6B9B9B]/10 border border-[#6B9B9B]/20'
                                      : 'border border-transparent'
                                  }`}
                                >
                                  <Checkbox
                                    checked={page.selected}
                                    onCheckedChange={() => togglePage(comp.domain, page.url)}
                                    className="border-muted-foreground data-[state=checked]:bg-[#6B9B9B] data-[state=checked]:border-[#6B9B9B]"
                                  />
                                  <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
                                    {getUrlTypeLabel(page.type)}
                                  </span>
                                  <Input
                                    value={page.url}
                                    onChange={(e) => updatePageUrl(comp.domain, page.url, e.target.value)}
                                    className="flex-1 h-7 text-xs bg-muted border-border text-muted-foreground"
                                  />
                                  <div className="flex items-center gap-1.5 shrink-0" title={confidenceLabel(page.confidence)}>
                                    <div className={`w-2 h-2 rounded-full ${confidenceDot(page.confidence)}`} />
                                    <span className="text-[10px] text-muted-foreground">{confidenceLabel(page.confidence)}</span>
                                  </div>
                                </div>
                              ))}

                              {/* Select / Deselect all */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => selectAllPages(comp.domain)}
                                  className="text-xs text-[#6B9B9B] hover:text-[#5A8A8A]"
                                >
                                  Select all
                                </button>
                                <span className="text-muted-foreground">|</span>
                                <button
                                  onClick={() => deselectAllPages(comp.domain)}
                                  className="text-xs text-muted-foreground hover:text-muted-foreground"
                                >
                                  Deselect all
                                </button>
                              </div>
                            </>
                          )}

                          {detection?.status === 'success' && detection.pages.length === 0 && (
                            <div className="py-4 text-center">
                              <p className="text-muted-foreground text-sm">No pages detected for this domain.</p>
                              <p className="text-muted-foreground text-xs mt-1">
                                You can add pages manually later from My Pages.
                              </p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="text-center text-sm text-muted-foreground pt-1">
                {totalSelectedPages} page{totalSelectedPages !== 1 ? 's' : ''} across{' '}
                {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep('competitors')}
                  variant="outline"
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStep3Submit}
                  className="flex-1 bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
                  disabled={!allDetectionsComplete}
                >
                  {!allDetectionsComplete ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Detecting pages...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirmation ─────────────────────────────── */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Company</h4>
                  <p className="text-foreground font-medium">{companyName}</p>
                  {companyDomain && <p className="text-muted-foreground text-sm">{companyDomain}</p>}
                  {(industry || companySize) && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {[industry, companySize].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Tracking {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} ({totalSelectedPages} pages)
                  </h4>
                  <div className="space-y-2">
                    {competitors.map((comp) => {
                      const detection = detectionResults.get(comp.domain);
                      const pageCount = detection?.pages.filter((p) => p.selected).length || 0;
                      return (
                        <div key={comp.domain} className="flex items-center justify-between">
                          <span className="text-foreground/80 text-sm">{comp.name}</span>
                          <span className="text-muted-foreground text-xs">{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-[#6B9B9B]/10 border border-[#6B9B9B]/20 rounded-lg">
                  <h4 className="text-sm font-medium text-[#6B9B9B] mb-1">What happens next</h4>
                  <p className="text-muted-foreground text-sm">
                    Your first intelligence packet will arrive Monday with competitive signals,
                    battlecards, and action items personalized for {companyName}.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('review_pages')}
                  variant="outline"
                  className="border-border text-muted-foreground hover:bg-muted"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  className="flex-1 bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Launch Control Plane
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
