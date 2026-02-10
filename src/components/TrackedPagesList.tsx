import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CompanyCard } from './CompanyCard';

interface TrackedPageRow {
  id: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  url: string;
  url_type: string;
  enabled: boolean;
  created_at: string;
}

interface CompanyGroup {
  companyId: string;
  companyName: string;
  companySlug: string;
  pages: Array<{
    id: string;
    url: string;
    url_type: string;
    enabled: boolean;
    created_at: string;
  }>;
}

export function TrackedPagesList() {
  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['tracked-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_tracked_pages');
      if (error) throw error;
      return data as TrackedPageRow[];
    },
  });

  const companies = useMemo<CompanyGroup[]>(() => {
    if (!rows || rows.length === 0) return [];
    const map = new Map<string, CompanyGroup>();
    for (const row of rows) {
      const key = row.company_id || row.company_name; // fallback for rows without company_id
      if (!map.has(key)) {
        map.set(key, {
          companyId: row.company_id,
          companyName: row.company_name,
          companySlug: row.company_slug,
          pages: [],
        });
      }
      map.get(key)!.pages.push({
        id: row.id,
        url: row.url,
        url_type: row.url_type,
        enabled: row.enabled,
        created_at: row.created_at,
      });
    }
    return Array.from(map.values());
  }, [rows]);

  const totalPages = rows?.length || 0;

  if (isLoading) {
    return (
      <Card className="bg-muted border-border">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-muted" />
          <Skeleton className="h-4 w-60 bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-muted" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-muted border-border">
        <CardContent className="py-6">
          <div className="text-center text-rose-400">
            Error loading tracked pages: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <List className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Your Tracked Companies</h2>
        <span className="text-sm text-muted-foreground">
          {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}, {totalPages} page{totalPages !== 1 ? 's' : ''}
        </span>
      </div>

      {companies.length === 0 ? (
        <Card className="bg-muted border-border">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No companies tracked yet. Add your first company above.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.companyId}
              companyId={company.companyId}
              companyName={company.companyName}
              companySlug={company.companySlug}
              pages={company.pages}
            />
          ))}
        </div>
      )}
    </div>
  );
}
