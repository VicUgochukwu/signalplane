import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const URL_TYPES = [
  'homepage',
  'pricing',
  'product',
  'solutions',
  'about',
  'blog',
  'case-studies',
  'integrations',
] as const;

const formSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(100),
  companySlug: z.string().trim().min(1, 'Company slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  url: z.string().trim().url('Please enter a valid URL').max(500),
  urlType: z.enum(URL_TYPES, { required_error: 'Please select a URL type' }),
});

interface AddCompanyFormProps {
  onSuccess: () => void;
}

export function AddCompanyForm({ onSuccess }: AddCompanyFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Auto-generate slug from company name
  useEffect(() => {
    const slug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setCompanySlug(slug);
  }, [companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse({ companyName, companySlug, url, urlType });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.rpc('add_tracked_page', {
      p_company_name: companyName.trim(),
      p_company_slug: companySlug,
      p_url: url.trim(),
      p_url_type: urlType,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Page added for tracking',
    });

    setCompanyName('');
    setCompanySlug('');
    setUrl('');
    setUrlType('');
    onSuccess();
  };

  return (
    <Card className="bg-muted border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Company Page
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Track a new company page for messaging changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-foreground/80">
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-sm text-rose-400">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySlug" className="text-foreground/80">
                Company Slug
              </Label>
              <Input
                id="companySlug"
                placeholder="acme-corp"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={isLoading}
              />
              {errors.companySlug && (
                <p className="text-sm text-rose-400">{errors.companySlug}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground/80">
                URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://acme.com/pricing"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={isLoading}
              />
              {errors.url && (
                <p className="text-sm text-rose-400">{errors.url}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urlType" className="text-foreground/80">
                URL Type
              </Label>
              <Select value={urlType} onValueChange={setUrlType} disabled={isLoading}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {URL_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-foreground focus:bg-muted"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.urlType && (
                <p className="text-sm text-rose-400">{errors.urlType}</p>
              )}
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
                Add Page
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
