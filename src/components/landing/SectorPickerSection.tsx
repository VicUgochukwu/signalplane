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
    <section id="demo-sectors" className="py-16 md:py-24 px-6 bg-[hsl(var(--section-alt))] dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-12">
          <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">
            Live Demos
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            See Control Plane in action for your industry
          </h2>
          <p className="text-muted-foreground">
            Pick your sector. Explore real competitive intelligence — no signup required.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <Link
                key={sector.slug}
                to={`/demo/${sector.slug}`}
                className="group rounded-xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] hover:bg-primary/5 hover:border-primary/30 dark:border-border/50 dark:bg-card dark:shadow-none dark:hover:shadow-none dark:hover:border-primary/30 transition-all p-4 text-center space-y-2"
              >
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground leading-tight">
                  {sector.name}
                </div>
                <div className="text-xs text-muted-foreground">
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
