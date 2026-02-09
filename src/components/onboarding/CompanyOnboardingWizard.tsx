import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunctionSilent } from '@/lib/edge-functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  Users,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  Plus,
  X,
  Target
} from 'lucide-react';
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

export function CompanyOnboardingWizard({ onComplete }: CompanyOnboardingWizardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'company' | 'competitors' | 'confirm'>('company');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; domain: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');

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

  // Search companies
  useEffect(() => {
    const searchCompanies = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, domain')
        .or(`name.ilike.%${searchQuery}%,domain.ilike.%${searchQuery}%`)
        .limit(10);

      setIsSearching(false);

      if (error) {
        console.error('Search error:', error);
        return;
      }

      // Filter out already selected competitors
      const filtered = (data || []).filter(
        (c) => !competitors.some((comp) => comp.domain === c.domain)
      );
      setSearchResults(filtered);
    };

    const debounce = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, competitors]);

  const addCompetitor = (company: { id?: string; name: string; domain: string }) => {
    if (competitors.length >= 5) {
      toast({
        title: 'Maximum reached',
        description: 'You can track up to 5 competitors',
        variant: 'destructive',
      });
      return;
    }

    setCompetitors([
      ...competitors,
      { name: company.name, domain: company.domain, company_id: company.id },
    ]);
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
  };

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
    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    if (!user) return;

    setIsLoading(true);

    const competitorsJson = competitors.map((c, idx) => ({
      name: c.name,
      domain: c.domain,
      priority: competitors.length - idx, // First added = highest priority
    }));

    const { error } = await supabase.rpc('complete_onboarding', {
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

    toast({
      title: 'Welcome to Control Plane!',
      description: `Your competitive intelligence feed is now configured for ${companyName}`,
    });

    // Fire Loops event (fire-and-forget)
    invokeEdgeFunctionSilent('loops-sync', {
      action: 'track_event',
      event_name: 'onboarding_completed',
      properties: { company_name: companyName, industry, competitor_count: competitors.length },
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-4">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {['company', 'competitors', 'confirm'].map((s, i) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step === s
                    ? 'bg-[#6B9B9B]'
                    : ['company', 'competitors', 'confirm'].indexOf(step) > i
                    ? 'bg-[#6B9B9B]/60'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <CardTitle className="text-zinc-100 text-2xl flex items-center justify-center gap-3">
            {step === 'company' && (
              <>
                <Building2 className="h-6 w-6 text-[#6B9B9B]" />
                Tell us about your company
              </>
            )}
            {step === 'competitors' && (
              <>
                <Target className="h-6 w-6 text-[#6B9B9B]" />
                Who are your competitors?
              </>
            )}
            {step === 'confirm' && (
              <>
                <CheckCircle2 className="h-6 w-6 text-[#6B9B9B]" />
                Ready to launch
              </>
            )}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {step === 'company' && 'This helps us personalize your intelligence feed'}
            {step === 'competitors' && `Add up to 5 competitors to track (${competitors.length}/5 selected)`}
            {step === 'confirm' && 'Review your setup before we start gathering intel'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: Company Info */}
          {step === 'company' && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-zinc-200">
                  Company Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDomain" className="text-zinc-200">
                  Website Domain
                </Label>
                <Input
                  id="companyDomain"
                  placeholder="acme.com"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-200">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind} className="text-zinc-100">
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value} className="text-zinc-100">
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-zinc-200">
                    Your Role
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="Head of Marketing"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value} className="text-zinc-100">
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

          {/* Step 2: Competitors */}
          {step === 'competitors' && (
            <div className="space-y-5">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search for competitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-500" />
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="border border-zinc-700 rounded-lg overflow-hidden">
                  {searchResults.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => addCompetitor(company)}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 border-b border-zinc-700 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-zinc-100 font-medium">{company.name}</p>
                        <p className="text-zinc-500 text-sm">{company.domain}</p>
                      </div>
                      <Plus className="h-4 w-4 text-[#6B9B9B]" />
                    </button>
                  ))}
                </div>
              )}

              {/* Add new competitor manually */}
              {!showAddNew ? (
                <button
                  onClick={() => setShowAddNew(true)}
                  className="text-sm text-[#6B9B9B] hover:text-[#5A8A8A] flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add competitor not in list
                </button>
              ) : (
                <div className="p-4 border border-zinc-700 rounded-lg space-y-3">
                  <Input
                    placeholder="Company name"
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                  <Input
                    placeholder="domain.com"
                    value={newCompetitorDomain}
                    onChange={(e) => setNewCompetitorDomain(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
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
                      className="border-zinc-700 text-zinc-300"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected competitors */}
              {competitors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-sm">Selected competitors:</Label>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((comp) => (
                      <div
                        key={comp.domain}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#6B9B9B]/20 border border-[#6B9B9B]/30 rounded-full"
                      >
                        <span className="text-zinc-100 text-sm">{comp.name}</span>
                        <button
                          onClick={() => removeCompetitor(comp.domain)}
                          className="text-zinc-400 hover:text-zinc-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep('company')}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Your Company</h4>
                  <p className="text-zinc-100 font-medium">{companyName}</p>
                  {companyDomain && <p className="text-zinc-500 text-sm">{companyDomain}</p>}
                  {(industry || companySize) && (
                    <p className="text-zinc-500 text-sm mt-1">
                      {[industry, companySize].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">
                    Tracking {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((comp) => (
                      <span
                        key={comp.domain}
                        className="px-2 py-1 bg-zinc-700 rounded text-sm text-zinc-200"
                      >
                        {comp.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#6B9B9B]/10 border border-[#6B9B9B]/20 rounded-lg">
                  <h4 className="text-sm font-medium text-[#6B9B9B] mb-1">What happens next</h4>
                  <p className="text-zinc-400 text-sm">
                    Your first intelligence packet will arrive Monday with competitive signals,
                    battlecards, and action items personalized for {companyName}.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('competitors')}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
