import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ToggleLeft, ScrollText, ArrowLeft, Shield, Activity, GitBranch, Wifi, Upload, BarChart3, DollarSign, HeartPulse, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
  { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/admin/system', label: 'System Overview', icon: Activity },
  { to: '/admin/system-health', label: 'System Health', icon: HeartPulse },
  { to: '/admin/workflows', label: 'Workflows', icon: GitBranch },
  { to: '/admin/api-health', label: 'API Health', icon: Wifi },
  { to: '/admin/csv-upload', label: 'CSV Upload', icon: Upload },
  { to: '/admin/usage', label: 'Usage Reports', icon: BarChart3 },
  { to: '/admin/costs', label: 'Cost Dashboard', icon: DollarSign },
  { to: '/admin/tracked-pages', label: 'Tracked Pages', icon: Globe },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.to, item.exact)
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Divider and Back Link */}
        <div className="p-4 border-t border-border">
          <Link
            to="/messaging-diff"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
