import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { AgentProvider } from '@/contexts/AgentContext';
import { AgentPanel } from '@/components/agent/AgentPanel';
import { AgentTrigger } from '@/components/agent/AgentTrigger';

export function ControlPlaneLayout() {
  return (
    <AgentProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          {/* Mobile-only header with sidebar trigger */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium text-muted-foreground">Control Plane</span>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <Outlet />
          </main>

        </SidebarInset>

        {/* Control Plane AI */}
        <AgentPanel />
        <AgentTrigger />
      </SidebarProvider>
    </AgentProvider>
  );
}
