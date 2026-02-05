import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, ArrowRightLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import signalPlaneLogo from '@/assets/signal-plane-logo.png';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const navItems = [
  { to: '/control-plane', label: 'Intel Packets', icon: BarChart3 },
  { to: '/control-plane/artifacts', label: 'Artifacts', icon: FileText },
  { to: '/messaging-diff', label: 'Messaging Diff', icon: ArrowRightLeft },
];

const navItemFlags: Record<string, string> = {
  '/control-plane': 'control_plane',
  '/control-plane/artifacts': 'artifacts',
  '/messaging-diff': 'messaging_diff',
};

export function AppNavigation() {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { isEnabled } = useFeatureFlag();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center gap-4 sm:gap-6">
          {/* Logo - always visible */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 font-mono font-semibold text-foreground">
            <img src={signalPlaneLogo} alt="Signal Plane" className="w-8 h-8" />
            <span className="hidden xs:inline">Signal Plane</span>
          </Link>

          {/* Navigation tabs - horizontally scrollable on mobile */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="flex items-center gap-1">
              {navItems
                .filter(item => {
                  const flagKey = navItemFlags[item.to];
                  return !flagKey || isEnabled(flagKey);
                })
                .map((item) => {
                  const isActive = location.pathname === item.to || 
                    (item.to !== '/' && location.pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                    </Link>
                  );
                })}

              {/* Admin link - only visible to admins with feature flag enabled */}
              {isAdmin && isEnabled('admin_panel') && (
                <Link
                  to="/admin"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                    location.pathname.startsWith('/admin')
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>
    </nav>
  );
}
