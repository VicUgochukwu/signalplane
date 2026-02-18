import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, ArrowRight, Kanban, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Logo } from '@/components/Logo';
import { useDemo } from '@/contexts/DemoContext';

export function DemoNavigation() {
  const location = useLocation();
  const demo = useDemo();
  const slug = demo?.sectorSlug || '';
  const sectorName = demo?.sectorName || 'Demo';

  const navItems = [
    { to: `/demo/${slug}`, label: 'Intel Packets', icon: BarChart3 },
    { to: `/demo/${slug}/artifacts`, label: 'Artifacts', icon: FileText },
    { to: `/demo/${slug}/signals`, label: 'Competitor Messaging', icon: Radio },
    { to: `/demo/${slug}/board`, label: 'Action Board', icon: Kanban },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 dark:border-border/20 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center gap-6">
          {/* Logo + wordmark */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="hidden sm:inline font-mono text-sm font-medium text-foreground tracking-tight">
              CONTROL PLANE
            </span>
          </Link>

          {/* Navigation tabs */}
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-badge transition-all whitespace-nowrap uppercase tracking-wide',
                      isActive
                        ? 'bg-[hsl(var(--accent-signal)/0.1)] text-accent-signal'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          {/* Sign Up CTA */}
          <div className="flex-shrink-0">
            <Link to="/login" className="btn-primary text-[11px] px-4 py-2">
              Sign Up Free
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      <div className="bg-[hsl(var(--accent-signal)/0.04)] border-t border-[hsl(var(--accent-signal)/0.1)] py-1.5 px-4">
        <p className="text-center text-xs text-muted-foreground">
          You're viewing sample data for <span className="font-medium text-foreground">{sectorName}</span>.{' '}
          <Link to="/login" className="text-accent-signal hover:text-accent-signal/80 transition-colors font-medium">
            Track your actual competitors →
          </Link>
        </p>
      </div>
    </nav>
  );
}
