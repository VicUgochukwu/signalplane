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
import { Button } from '@/components/ui/button';

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
            <SidebarMenuButton size="lg" asChild tooltip="Signal Plane">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Logo className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Signal Plane</span>
                  <span className="text-xs text-muted-foreground">Demo — {sectorName}</span>
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
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
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
              <p className="text-xs text-muted-foreground mb-2 text-center">
                You're viewing sample data
              </p>
              <Link to="/login">
                <Button size="sm" className="w-full rounded-lg text-xs font-medium">
                  Sign Up Free
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Button>
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
