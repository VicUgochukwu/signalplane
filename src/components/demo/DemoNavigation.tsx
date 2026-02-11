import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, ArrowRight, Kanban, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/contexts/DemoContext';

export function DemoNavigation() {
  const location = useLocation();
  const demo = useDemo();
  const slug = demo?.sectorSlug || '';
  const sectorName = demo?.sectorName || 'Demo';

  const navItems = [
    { to: `/demo/${slug}`, label: 'Intel Packets', icon: BarChart3 },
    { to: `/demo/${slug}/artifacts`, label: 'Artifacts', icon: FileText },
    { to: `/demo/${slug}/signals`, label: 'Signals', icon: Radio },
    { to: `/demo/${slug}/board`, label: 'Action Board', icon: Kanban },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 font-semibold text-foreground hover:opacity-80 transition-opacity">
            <Logo className="w-9 h-9" />
            <span className="hidden sm:inline text-sm">Signal Plane</span>
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
                      'flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          {/* Sign Up CTA */}
          <div className="flex-shrink-0">
            <Link to="/login">
              <Button size="sm" className="rounded-full px-4 text-xs font-medium">
                Sign Up Free
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      <div className="bg-primary/5 border-t border-primary/10 py-1.5 px-4">
        <p className="text-center text-xs text-muted-foreground">
          You're viewing sample data for <span className="font-medium text-foreground">{sectorName}</span>.{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Track your actual competitors →
          </Link>
        </p>
      </div>
    </nav>
  );
}
