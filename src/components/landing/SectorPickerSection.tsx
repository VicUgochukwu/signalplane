import { Link } from 'react-router-dom';
import {
  Code2, BarChart3, Phone, HeartHandshake, Megaphone,
  Database, Shield, Landmark, Users, MessageCircle,
  Cloud, Brain, Activity, ShoppingCart, Blocks
} from 'lucide-react';

interface SectorTile {
  slug: string;
  name: string;
  icon: typeof Code2;
  companyCount: number;
}

const sectors: SectorTile[] = [
  { slug: 'developer-tools', name: 'Developer Tools', icon: Code2, companyCount: 8 },
  { slug: 'product-analytics', name: 'Product Analytics', icon: BarChart3, companyCount: 7 },
  { slug: 'sales-engagement', name: 'Sales Engagement', icon: Phone, companyCount: 7 },
  { slug: 'customer-success', name: 'Customer Success', icon: HeartHandshake, companyCount: 6 },
  { slug: 'marketing-automation', name: 'Marketing Automation', icon: Megaphone, companyCount: 7 },
  { slug: 'data-infrastructure', name: 'Data Infrastructure', icon: Database, companyCount: 7 },
  { slug: 'cybersecurity', name: 'Cybersecurity', icon: Shield, companyCount: 7 },
  { slug: 'fintech-infrastructure', name: 'Fintech', icon: Landmark, companyCount: 6 },
  { slug: 'hr-tech', name: 'HR Tech', icon: Users, companyCount: 6 },
  { slug: 'collaboration', name: 'Collaboration', icon: MessageCircle, companyCount: 7 },
  { slug: 'cloud-infrastructure', name: 'Cloud Infrastructure', icon: Cloud, companyCount: 7 },
  { slug: 'ai-ml-platforms', name: 'AI/ML Platforms', icon: Brain, companyCount: 7 },
  { slug: 'devops-observability', name: 'DevOps', icon: Activity, companyCount: 7 },
  { slug: 'ecommerce-platforms', name: 'E-commerce', icon: ShoppingCart, companyCount: 6 },
  { slug: 'nocode-lowcode', name: 'No-Code / Low-Code', icon: Blocks, companyCount: 6 },
];

export function SectorPickerSection() {
  return (
    <section id="demo-sectors" className="py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            See Control Plane in action for your industry
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
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
                className="group rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all p-4 text-center space-y-2"
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
