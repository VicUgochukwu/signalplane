import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  IconControlPlane,
  IconArtifacts,
  IconDiffTracker,
  IconSubmitSignal,
  IconShield,
  IconTeam,
  IconDeals,
  IconSettings,
  IconSignalEnablement,
  IconSignalLaunch,
  IconMonitorPricing,
  IconTrophy,
  IconPersonaPMM,
  IconMonitorTargeting,
} from '@/components/icons';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Kanban, LogOut, FileStack, MessageCircleQuestion } from 'lucide-react';
import { SupportModal } from './SupportModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown } from 'lucide-react';

const intelligenceItems = [
  { to: '/control-plane', label: 'Intel Packets', icon: IconControlPlane, flag: 'control_plane' },
  { to: '/control-plane/artifacts', label: 'Artifacts', icon: IconArtifacts, flag: 'artifacts' },
  { to: '/messaging-diff', label: 'Competitor Messaging', icon: IconDiffTracker, flag: 'messaging_diff' },
];

const actionItems = [
  { to: '/control-plane/submit', label: 'Submit Signal', icon: IconSubmitSignal, flag: 'submit_signal' },
  { to: '/control-plane/board', label: 'Action Board', icon: Kanban, flag: 'action_board' },
  { to: '/control-plane/deals', label: 'Deals', icon: IconDeals, flag: 'deal_logging' },
];

const pmmItems = [
  { to: '/control-plane/enablement', label: 'Enablement', icon: IconSignalEnablement, flag: '' },
  { to: '/control-plane/launches', label: 'Launch Ops', icon: IconSignalLaunch, flag: '' },
  { to: '/control-plane/win-loss', label: 'Win/Loss', icon: IconTrophy, flag: '' },
  { to: '/control-plane/voc-research', label: 'VoC Research', icon: IconPersonaPMM, flag: '' },
  { to: '/control-plane/positioning', label: 'Positioning', icon: IconMonitorTargeting, flag: '' },
  { to: '/control-plane/packaging', label: 'Packaging Intel', icon: IconMonitorPricing, flag: '' },
];

const workspaceItems = [
  { to: '/control-plane/team', label: 'Team', icon: IconTeam, flag: 'team_management' },
  { to: '/my-pages', label: 'My Pages', icon: FileStack, flag: '' },
  { to: '/settings', label: 'Settings', icon: IconSettings, flag: '' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { isEnabled } = useFeatureFlag();
  const { user, signOut } = useAuth();

  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = email.charAt(0).toUpperCase();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path + '/'));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderGroup = (
    label: string,
    items: typeof intelligenceItems,
  ) => {
    const visible = items.filter(
      (item) => !item.flag || isEnabled(item.flag),
    );
    if (visible.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.to)}
                  tooltip={item.label}
                >
                  <Link to={item.to}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Control Plane">
              <Link to="/control-plane">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Logo className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-mono text-sm font-medium tracking-tight">CONTROL PLANE</span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Intelligence</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        {renderGroup('Intelligence', intelligenceItems)}
        {renderGroup('PMM Modules', pmmItems)}
        {renderGroup('Actions', actionItems)}
        {renderGroup('Workspace', workspaceItems)}

        {/* Admin */}
        {isAdmin && isEnabled('admin_panel') && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith('/admin')}
                    tooltip="Admin Panel"
                  >
                    <Link to="/admin">
                      <IconShield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer — Support, links, theme, user */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SupportModal />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-center group-data-[collapsible=icon]:hidden px-2 pb-1">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={email}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={email} />}
                    <AvatarFallback className="rounded-lg bg-[hsl(var(--accent-signal)/0.15)] text-accent-signal text-sm font-mono">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{email.split('@')[0]}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={email} />}
                      <AvatarFallback className="rounded-lg bg-[hsl(var(--accent-signal)/0.15)] text-accent-signal text-sm font-mono">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{email.split('@')[0]}</span>
                      <span className="truncate text-xs text-muted-foreground">{email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <IconSettings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-pages')}>
                  <FileStack className="mr-2 h-4 w-4" />
                  My Pages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
