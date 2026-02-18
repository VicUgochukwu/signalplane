import { Link, useLocation } from 'react-router-dom';
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
} from '@/components/icons';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useDemo } from '@/contexts/DemoContext';
import { Kanban, ArrowRight } from 'lucide-react';

export function DemoSidebar() {
  const location = useLocation();
  const demo = useDemo();
  const slug = demo?.sectorSlug || 'developer-tools';
  const sectorName = demo?.sectorName || 'Demo';

  const navItems = [
    { to: `/demo/${slug}`, label: 'Intel Packets', icon: IconControlPlane },
    { to: `/demo/${slug}/artifacts`, label: 'Artifacts', icon: IconArtifacts },
    { to: `/demo/${slug}/signals`, label: 'Competitor Messaging', icon: IconDiffTracker },
    { to: `/demo/${slug}/board`, label: 'Action Board', icon: Kanban },
  ];

  const isActive = (path: string) =>
    location.pathname === path;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Control Plane">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Logo className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-mono text-sm font-medium tracking-tight">CONTROL PLANE</span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Demo — {sectorName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
      </SidebarContent>

      {/* Footer — CTA + Theme */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-center group-data-[collapsible=icon]:hidden px-2 pb-1">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="group-data-[collapsible=icon]:hidden px-2 pb-2">
              <p className="font-mono text-[10px] text-muted-foreground mb-2 text-center uppercase tracking-wider">
                Viewing sample data
              </p>
              <Link to="/login" className="btn-primary w-full text-[11px] px-4 py-2 justify-center">
                Sign Up Free
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
