import { Link, useLocation } from 'react-router-dom';
import { IconControlPlane, IconArtifacts, IconDiffTracker, IconSubmitSignal, IconShield, IconTeam, IconDeals } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Logo } from '@/components/Logo';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Kanban } from 'lucide-react';

const navItems = [
  { to: '/control-plane', label: 'Intel Packets', icon: IconControlPlane },
  { to: '/control-plane/artifacts', label: 'Artifacts', icon: IconArtifacts },
  { to: '/messaging-diff', label: 'Competitor Messaging', icon: IconDiffTracker },
  { to: '/control-plane/submit', label: 'Submit Signal', icon: IconSubmitSignal },
  { to: '/control-plane/team', label: 'Team', icon: IconTeam },
  { to: '/control-plane/deals', label: 'Deals', icon: IconDeals },
  { to: '/control-plane/board', label: 'Action Board', icon: Kanban },
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
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 font-semibold text-foreground hover:opacity-80 transition-opacity">
            <Logo className="w-9 h-9" />
            <span className="hidden sm:inline text-sm">Control Plane</span>
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
                        'flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                        isActive
                          ? 'bg-primary/10 text-primary'
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
                      ? 'bg-primary/10 text-primary'
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
