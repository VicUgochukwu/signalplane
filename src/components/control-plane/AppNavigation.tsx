import { Link, useLocation } from 'react-router-dom';
import { IconControlPlane, IconArtifacts, IconDiffTracker, IconSubmitSignal, IconShield, IconTeam, IconDeals } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Logo } from '@/components/Logo';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Columns3 } from 'lucide-react';

const navItems = [
  { to: '/control-plane', label: 'Intel Packets', icon: IconControlPlane },
  { to: '/control-plane/artifacts', label: 'Artifacts', icon: IconArtifacts },
  { to: '/messaging-diff', label: 'Competitor Messaging', icon: IconDiffTracker },
  { to: '/control-plane/submit', label: 'Submit Signal', icon: IconSubmitSignal },
  { to: '/control-plane/team', label: 'Team', icon: IconTeam },
  { to: '/control-plane/deals', label: 'Deals', icon: IconDeals },
  { to: '/control-plane/board', label: 'Action Board', icon: Columns3 },
];

const navItemFlags: Record<string, string> = {
  '/control-plane': 'control_plane',
  '/control-plane/board': 'action_board',
  '/control-plane/artifacts': 'artifacts',
  '/messaging-diff': 'messaging_diff',
  '/control-plane/submit': 'submit_signal',
  '/control-plane/team': 'team_management',
  '/control-plane/deals': 'deal_logging',
};

export function AppNavigation() {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { isEnabled } = useFeatureFlag();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 dark:border-border/20 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center gap-6">
          {/* Logo + wordmark */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="hidden sm:inline font-mono text-sm font-medium text-foreground tracking-tight">CONTROL PLANE</span>
          </Link>

          {/* Navigation tabs */}
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-1">
              {navItems
                .filter(item => {
                  const flagKey = navItemFlags[item.to];
                  return !flagKey || isEnabled(flagKey);
                })
                .map((item) => {
                  const isActive = location.pathname === item.to ||
                    (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
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
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                    </Link>
                  );
                })}

              {/* Admin link */}
              {isAdmin && isEnabled('admin_panel') && (
                <Link
                  to="/admin"
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                    location.pathname.startsWith('/admin')
                      ? 'bg-[hsl(var(--accent-signal)/0.1)] text-accent-signal'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <IconShield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          {/* Theme toggle + User menu */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
