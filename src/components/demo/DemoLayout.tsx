import { Outlet, useParams } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoSidebar } from './DemoSidebar';
import { DemoProvider } from '@/contexts/DemoContext';
import { Footer } from '@/components/Footer';
import { Separator } from '@/components/ui/separator';

export default function DemoLayout() {
  const { sectorSlug = 'developer-tools' } = useParams();

  return (
    <DemoProvider sectorSlug={sectorSlug}>
      <SidebarProvider defaultOpen={true}>
        <DemoSidebar />
        <SidebarInset>
          {/* Mobile-only header with sidebar trigger */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium text-muted-foreground">Signal Plane — Demo</span>
          </header>

          {/* Demo banner */}
          <div className="bg-[hsl(var(--accent-signal)/0.05)] border-b border-[hsl(var(--accent-signal)/0.1)] py-1.5 px-4">
            <p className="text-center text-xs text-muted-foreground">
              You're viewing sample data. <a href="/login" className="text-accent-signal hover:text-[hsl(var(--accent-signal)/0.8)] transition-colors font-medium">Track your actual competitors →</a>
            </p>
          </div>

          {/* Page content */}
          <main className="flex-1">
            <Outlet />
          </main>

          {/* Footer */}
          <div className="container max-w-6xl mx-auto px-4">
            <Footer />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DemoProvider>
  );
}
