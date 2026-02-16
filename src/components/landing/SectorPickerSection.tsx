import React from 'react';
import { Link } from 'react-router-dom';
import {
  IconSectorDevTools, IconSectorAnalytics, IconSectorSales, IconSectorSuccess, IconSectorMarketing,
  IconSectorData, IconSectorSecurity, IconSectorFintech, IconSectorHR, IconSectorCollaboration,
  IconSectorCloud, IconSectorAI, IconSectorDevOps, IconSectorEcommerce, IconSectorNoCode,
} from '@/components/icons';

interface SectorTile {
  slug: string;
  name: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  companyCount: number;
}

const sectors: SectorTile[] = [
  { slug: 'developer-tools', name: 'Developer Tools', icon: IconSectorDevTools, companyCount: 8 },
  { slug: 'product-analytics', name: 'Product Analytics', icon: IconSectorAnalytics, companyCount: 7 },
  { slug: 'sales-engagement', name: 'Sales Engagement', icon: IconSectorSales, companyCount: 7 },
  { slug: 'customer-success', name: 'Customer Success', icon: IconSectorSuccess, companyCount: 6 },
  { slug: 'marketing-automation', name: 'Marketing Automation', icon: IconSectorMarketing, companyCount: 7 },
  { slug: 'data-infrastructure', name: 'Data Infrastructure', icon: IconSectorData, companyCount: 7 },
  { slug: 'cybersecurity', name: 'Cybersecurity', icon: IconSectorSecurity, companyCount: 7 },
  { slug: 'fintech-infrastructure', name: 'Fintech', icon: IconSectorFintech, companyCount: 6 },
  { slug: 'hr-tech', name: 'HR Tech', icon: IconSectorHR, companyCount: 6 },
  { slug: 'collaboration', name: 'Collaboration', icon: IconSectorCollaboration, companyCount: 7 },
  { slug: 'cloud-infrastructure', name: 'Cloud Infrastructure', icon: IconSectorCloud, companyCount: 7 },
  { slug: 'ai-ml-platforms', name: 'AI/ML Platforms', icon: IconSectorAI, companyCount: 7 },
  { slug: 'devops-observability', name: 'DevOps', icon: IconSectorDevOps, companyCount: 7 },
  { slug: 'ecommerce-platforms', name: 'E-commerce', icon: IconSectorEcommerce, companyCount: 6 },
  { slug: 'nocode-lowcode', name: 'No-Code / Low-Code', icon: IconSectorNoCode, companyCount: 6 },
];

export function SectorPickerSection() {
  return (
    <section id="demo-sectors" className="py-16 md:py-24 px-6 bg-surface-elevated dark:bg-surface-base">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-12">
          <div className="font-mono text-[11px] font-medium text-accent-signal mb-3 tracking-widest uppercase">
            Live Demos
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            See Control Plane in action for your industry
          </h2>
          <p className="text-muted-foreground">
            Pick your sector. Explore real competitive intelligence — no signup required.
          </p>
        </div>

        <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <Link
                key={sector.slug}
                to={`/demo/${sector.slug}`}
                className="animate-on-scroll group card-intel p-4 text-center space-y-2 hover:border-l-[hsl(var(--accent-signal))] hover:scale-[1.03] transition-transform duration-200"
              >
                <div className="mx-auto w-10 h-10 rounded-badge bg-[hsl(var(--accent-signal)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--accent-signal)/0.15)] transition-colors">
                  <Icon className="h-5 w-5 text-accent-signal" />
                </div>
                <div className="text-sm font-medium text-foreground leading-tight">
                  {sector.name}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {sector.companyCount} companies
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
