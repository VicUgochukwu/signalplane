export interface SectorPack {
  id: string;
  pack_name: string;
  description: string;
  motion: string;
  company_count: number;
}

export interface PackCompany {
  company_name: string;
  company_domain: string;
}

export function useSectorPacks(): { data: SectorPack[]; isLoading: boolean } {
  return { data: [], isLoading: false };
}

export function usePackCompanies(packId: string | null): { data: PackCompany[] } {
  return { data: [] };
}
