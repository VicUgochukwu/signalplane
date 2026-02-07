import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Target, Plus, X, Loader2, CheckCircle2, Search } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface Competitor {
  name: string;
  domain: string;
}

export function CompanyProfileSettings() {
  const { profile, competitors: existingCompetitors, needsOnboarding, refetch } = useOnboarding();
  const { user } = useAuth();
  const { toast } = useToast();

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
    if (competitors.length >= 5) {
      toast({ title: 'Maximum 5 competitors allowed', variant: 'destructive' });
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

    setIsSaving(false);

    if (error) {
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
      return;
    }

    // Clear the session skip flag since user is now setting up
    sessionStorage.removeItem('skippedOnboarding');

    toast({ title: 'Profile updated', description: 'Your company profile has been saved.' });
    setIsEditing(false);
    refetch();
  };

  // Not configured state
  if (needsOnboarding && !isEditing) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#6B9B9B]" />
            Company Profile
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Set up your company to get personalized competitive intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border border-dashed border-zinc-600 rounded-lg text-center">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-zinc-500" />
            <p className="text-zinc-400 mb-4">
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
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#6B9B9B]" />
              Company Profile
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your company context for personalized intelligence
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={startEditing}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 text-xs">Company</Label>
              <p className="text-zinc-100">{profile?.company_name}</p>
            </div>
            <div>
              <Label className="text-zinc-500 text-xs">Domain</Label>
              <p className="text-zinc-100">{profile?.company_domain || '—'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 text-xs">Industry</Label>
              <p className="text-zinc-100">{profile?.industry || '—'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 text-xs">Company Size</Label>
              <p className="text-zinc-100">{profile?.company_size || '—'}</p>
            </div>
          </div>

          {existingCompetitors && existingCompetitors.length > 0 && (
            <div className="pt-4 border-t border-zinc-700">
              <Label className="text-zinc-500 text-xs flex items-center gap-1 mb-2">
                <Target className="h-3 w-3" />
                Tracked Competitors ({existingCompetitors.length}/5)
              </Label>
              <div className="flex flex-wrap gap-2">
                {existingCompetitors.map((comp) => (
                  <span
                    key={comp.id}
                    className="px-3 py-1 bg-[#6B9B9B]/20 border border-[#6B9B9B]/30 rounded-full text-sm text-zinc-200"
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
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#6B9B9B]" />
          Edit Company Profile
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Update your company context and tracked competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-zinc-200">
              Company Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-zinc-900 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDomain" className="text-zinc-200">
              Domain
            </Label>
            <Input
              id="companyDomain"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="yourcompany.com"
              className="bg-zinc-900 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-200">Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="bg-zinc-900 border-zinc-600 text-zinc-100">
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
              <SelectTrigger className="bg-zinc-900 border-zinc-600 text-zinc-100">
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

        {/* Competitors section */}
        <div className="pt-4 border-t border-zinc-700 space-y-3">
          <Label className="text-zinc-200 flex items-center gap-1">
            <Target className="h-4 w-4" />
            Tracked Competitors ({competitors.length}/5)
          </Label>

          {competitors.length > 0 && (
            <div className="space-y-2">
              {competitors.map((comp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg"
                >
                  <div>
                    <p className="text-zinc-100 font-medium">{comp.name}</p>
                    {comp.domain && <p className="text-zinc-500 text-sm">{comp.domain}</p>}
                  </div>
                  <button
                    onClick={() => removeCompetitor(idx)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {competitors.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="Competitor name"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                className="bg-zinc-900 border-zinc-600 text-zinc-100"
              />
              <Input
                placeholder="domain.com"
                value={newCompetitorDomain}
                onChange={(e) => setNewCompetitorDomain(e.target.value)}
                className="bg-zinc-900 border-zinc-600 text-zinc-100 w-40"
              />
              <Button
                onClick={addCompetitor}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
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
                Saving...
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
