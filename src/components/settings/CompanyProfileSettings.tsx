import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Target, Plus, X, Loader2, CheckCircle2, Search } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';
import { usePilot } from '@/hooks/usePilot';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { detectPages } from '@/lib/pageDetection';

const INDUSTRIES = [
  'SaaS / Software',
  'AI / Automation',
  'GEO / AEO',
  'Intent Data',
  'Events / Webinars',
  'ABM Platforms',
  'Content Tools',
  'Data Enrichment',
  'Stack Consolidation',
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

interface Competitor {
  name: string;
  domain: string;
}

interface DetectionProgress {
  current: number;
  total: number;
  currentName: string;
  completed: number;
  failed: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function CompanyProfileSettings() {
  const { profile, competitors: existingCompetitors, needsOnboarding, refetch } = useOnboarding();
  const { user } = useAuth();
  const { maxCompetitors } = usePilot();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [companyDomain, setCompanyDomain] = useState(profile?.company_domain || '');
  const [industry, setIndustry] = useState(profile?.industry || '');
  const [companySize, setCompanySize] = useState(profile?.company_size || '');
  const [competitors, setCompetitors] = useState<Competitor[]>(
    existingCompetitors?.map(c => ({ name: c.competitor_name, domain: c.competitor_domain || '' })) || []
  );

  // New competitor form
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');

  // Detection progress
  const [detectionProgress, setDetectionProgress] = useState<DetectionProgress | null>(null);

  const startEditing = () => {
    setCompanyName(profile?.company_name || '');
    setCompanyDomain(profile?.company_domain || '');
    setIndustry(profile?.industry || '');
    setCompanySize(profile?.company_size || '');
    setCompetitors(
      existingCompetitors?.map(c => ({ name: c.competitor_name, domain: c.competitor_domain || '' })) || []
    );
    setIsEditing(true);
  };

  const addCompetitor = () => {
    if (!newCompetitorName.trim()) return;
    if (competitors.length >= maxCompetitors) {
      toast({ title: `Maximum ${maxCompetitors} competitors allowed`, variant: 'destructive' });
      return;
    }

    setCompetitors([...competitors, { name: newCompetitorName.trim(), domain: newCompetitorDomain.trim() }]);
    setNewCompetitorName('');
    setNewCompetitorDomain('');
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !companyName.trim()) {
      toast({ title: 'Company name is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    // Capture which competitor domains existed BEFORE save
    const previousDomains = new Set(
      existingCompetitors?.map(c => c.competitor_domain?.toLowerCase()).filter(Boolean) || []
    );

    const competitorsJson = competitors.map((c, idx) => ({
      name: c.name,
      domain: c.domain,
      priority: competitors.length - idx,
    }));

    const { error } = await supabase.rpc('complete_onboarding', {
      p_user_id: user.id,
      p_company_name: companyName.trim(),
      p_company_domain: companyDomain.trim() || null,
      p_industry: industry || null,
      p_company_size: companySize || null,
      p_job_title: profile?.job_title || null,
      p_department: profile?.department || null,
      p_competitors: competitorsJson,
    });

    if (error) {
      setIsSaving(false);
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
      return;
    }

    // Clear the session skip flag since user is now setting up
    sessionStorage.removeItem('skippedOnboarding');

    // Profile saved — now auto-detect pages for NEW competitors
    const newCompetitors = competitors.filter(
      (c) => c.domain && !previousDomains.has(c.domain.toLowerCase())
    );

    if (newCompetitors.length > 0) {
      let completedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < newCompetitors.length; i++) {
        const comp = newCompetitors[i];
        setDetectionProgress({
          current: i + 1,
          total: newCompetitors.length,
          currentName: comp.name,
          completed: completedCount,
          failed: failedCount,
        });

        try {
          // Step 1: Create company in core.companies
          const { data: companyData, error: companyError } = await supabase.rpc('add_company', {
            p_company_name: comp.name,
            p_company_slug: comp.domain,
          });

          if (companyError) {
            console.warn(`add_company failed for ${comp.name}:`, companyError.message);
            failedCount++;
            continue;
          }

          const compId = companyData?.[0]?.company_id;
          if (!compId) {
            console.warn(`No company_id returned for ${comp.name}`);
            failedCount++;
            continue;
          }

          // Step 2: Detect pages
          const pages = await detectPages(comp.domain, industry || undefined);
          const selectedPages = pages
            .filter((p) => p.confidence !== 'low') // auto-select high + medium
            .slice(0, 10) // respect 10-page limit
            .map((p) => ({ url: p.url, url_type: p.type }));

          if (selectedPages.length > 0) {
            // Step 3: Insert pages
            const { error: pagesError } = await supabase.rpc('add_company_pages', {
              p_company_id: compId,
              p_pages: selectedPages,
            });

            if (pagesError) {
              console.warn(`add_company_pages failed for ${comp.name}:`, pagesError.message);
              failedCount++;
            } else {
              completedCount++;
            }
          } else {
            // Company created but no pages detected
            completedCount++;
          }
        } catch (err) {
          console.warn(`Page detection failed for ${comp.domain}:`, err);
          failedCount++;
        }

        // Delay between calls to respect rate limits (20 req/min)
        if (i < newCompetitors.length - 1) {
          await delay(3000);
        }
      }

      // Invalidate tracked pages so MyPages reflects new data
      queryClient.invalidateQueries({ queryKey: ['tracked-pages'] });
      queryClient.invalidateQueries({ queryKey: ['competitor-suggestions'] });

      // Show result toast with link to MyPages
      if (completedCount > 0) {
        toast({
          title: 'Pages auto-detected',
          description: `${completedCount} competitor${completedCount !== 1 ? 's' : ''} set up with tracked pages. ${failedCount > 0 ? `${failedCount} failed.` : ''} Review in My Pages.`,
        });
      } else if (failedCount > 0) {
        toast({
          title: 'Page detection had issues',
          description: `Could not detect pages for ${failedCount} competitor${failedCount !== 1 ? 's' : ''}. You can add pages manually from My Pages.`,
          variant: 'destructive',
        });
      }
    } else {
      toast({ title: 'Profile updated', description: 'Your company profile has been saved.' });
    }

    setDetectionProgress(null);
    setIsSaving(false);
    setIsEditing(false);
    refetch();
  };

  // Not configured state
  if (needsOnboarding && !isEditing) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#6B9B9B]" />
            Company Profile
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up your company to get personalized competitive intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border border-dashed border-border rounded-lg text-center">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Configure your company and competitors to receive tailored intel packets and battlecards.
            </p>
            <Button
              onClick={startEditing}
              className="bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Up Company
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode
  if (!isEditing) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#6B9B9B]" />
              Company Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your company context for personalized intelligence
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={startEditing}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Company</Label>
              <p className="text-foreground">{profile?.company_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Domain</Label>
              <p className="text-foreground">{profile?.company_domain || '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Industry</Label>
              <p className="text-foreground">{profile?.industry || '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Company Size</Label>
              <p className="text-foreground">{profile?.company_size || '—'}</p>
            </div>
          </div>

          {existingCompetitors && existingCompetitors.length > 0 && (
            <div className="pt-4 border-t border-border">
              <Label className="text-muted-foreground text-xs flex items-center gap-1 mb-2">
                <Target className="h-3 w-3" />
                Tracked Competitors ({existingCompetitors.length}/{maxCompetitors})
              </Label>
              <div className="flex flex-wrap gap-2">
                {existingCompetitors.map((comp) => (
                  <span
                    key={comp.id}
                    className="px-3 py-1 bg-[#6B9B9B]/20 border border-[#6B9B9B]/30 rounded-full text-sm text-foreground/80"
                  >
                    {comp.competitor_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#6B9B9B]" />
          Edit Company Profile
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Update your company context and tracked competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-foreground/80">
              Company Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-background border-border text-foreground"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDomain" className="text-foreground/80">
              Domain
            </Label>
            <Input
              id="companyDomain"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="yourcompany.com"
              className="bg-background border-border text-foreground"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/80">Industry</Label>
            <Select value={industry} onValueChange={setIndustry} disabled={isSaving}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
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
            <Select value={companySize} onValueChange={setCompanySize} disabled={isSaving}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value} className="text-foreground">
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Competitors section */}
        <div className="pt-4 border-t border-border space-y-3">
          <Label className="text-foreground/80 flex items-center gap-1">
            <Target className="h-4 w-4" />
            Tracked Competitors ({competitors.length}/{maxCompetitors})
          </Label>

          {competitors.length > 0 && (
            <div className="space-y-2">
              {competitors.map((comp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <div>
                    <p className="text-foreground font-medium">{comp.name}</p>
                    {comp.domain && <p className="text-muted-foreground text-sm">{comp.domain}</p>}
                  </div>
                  <button
                    onClick={() => removeCompetitor(idx)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {competitors.length < maxCompetitors && !isSaving && (
            <div className="flex gap-2">
              <Input
                placeholder="Competitor name"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                className="bg-background border-border text-foreground"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); } }}
              />
              <Input
                placeholder="domain.com"
                value={newCompetitorDomain}
                onChange={(e) => setNewCompetitorDomain(e.target.value)}
                className="bg-background border-border text-foreground w-40"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); } }}
              />
              <Button
                onClick={addCompetitor}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Detection progress */}
        {detectionProgress && (
          <div className="rounded-lg border border-emerald-600/30 bg-emerald-900/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">
                Detecting pages for {detectionProgress.currentName}
              </span>
              <span className="text-xs text-emerald-400/70 ml-auto">
                {detectionProgress.current}/{detectionProgress.total}
              </span>
            </div>
            <div className="w-full bg-emerald-900/30 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(detectionProgress.current / detectionProgress.total) * 100}%` }}
              />
            </div>
            {(detectionProgress.completed > 0 || detectionProgress.failed > 0) && (
              <p className="text-[11px] text-emerald-400/60 mt-1.5">
                {detectionProgress.completed > 0 && `${detectionProgress.completed} done`}
                {detectionProgress.completed > 0 && detectionProgress.failed > 0 && ' · '}
                {detectionProgress.failed > 0 && `${detectionProgress.failed} failed`}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="border-border text-muted-foreground hover:bg-muted"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-[#6B9B9B] text-white hover:bg-[#5A8A8A]"
            disabled={isSaving || !companyName.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {detectionProgress ? 'Detecting pages...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
