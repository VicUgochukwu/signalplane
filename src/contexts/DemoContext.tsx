import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const CTA_THRESHOLD = 3;

export interface SectorInfo {
  slug: string;
  name: string;
  companyCount: number;
}

interface DemoContextValue {
  isDemo: boolean;
  sectorSlug: string;
  sectorName: string;
  trackExploration: (action: string) => void;
  explorationCount: number;
  showCta: boolean;
  dismissCta: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

// Static sector metadata — avoids a DB query on every demo page load
const SECTOR_MAP: Record<string, string> = {
  'developer-tools': 'Developer Tools',
  'product-analytics': 'Product Analytics',
  'sales-engagement': 'Sales Engagement',
  'customer-success': 'Customer Success',
  'marketing-automation': 'Marketing Automation',
  'data-infrastructure': 'Data Infrastructure',
  'cybersecurity': 'Cybersecurity',
  'fintech-infrastructure': 'Fintech Infrastructure',
  'hr-tech': 'HR Tech',
  'collaboration': 'Collaboration',
  'cloud-infrastructure': 'Cloud Infrastructure',
  'ai-ml-platforms': 'AI/ML Platforms',
  'devops-observability': 'DevOps & Observability',
  'ecommerce-platforms': 'E-commerce Platforms',
  'nocode-lowcode': 'No-Code / Low-Code',
};

export function DemoProvider({ sectorSlug, children }: { sectorSlug: string; children: ReactNode }) {
  const [explorationCount, setExplorationCount] = useState(0);
  const [ctaDismissed, setCtaDismissed] = useState(false);

  const trackExploration = useCallback((action: string) => {
    setExplorationCount(prev => prev + 1);
  }, []);

  const dismissCta = useCallback(() => {
    setCtaDismissed(true);
  }, []);

  const sectorName = SECTOR_MAP[sectorSlug] || sectorSlug;
  const showCta = explorationCount >= CTA_THRESHOLD && !ctaDismissed;

  return (
    <DemoContext.Provider value={{
      isDemo: true,
      sectorSlug,
      sectorName,
      trackExploration,
      explorationCount,
      showCta,
      dismissCta,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextValue | undefined {
  return useContext(DemoContext);
}
