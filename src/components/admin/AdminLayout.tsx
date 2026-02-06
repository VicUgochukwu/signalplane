import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ToggleLeft, ScrollText, ArrowLeft, Shield, Activity, GitBranch, Wifi, Upload, BarChart3, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
  { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/admin/system', label: 'System Overview', icon: Activity },
  { to: '/admin/workflows', label: 'Workflows', icon: GitBranch },
  { to: '/admin/api-health', label: 'API Health', icon: Wifi },
  { to: '/admin/csv-upload', label: 'CSV Upload', icon: Upload },
  { to: '/admin/usage', label: 'Usage Reports', icon: BarChart3 },
  { to: '/admin/costs', label: 'Cost Dashboard', icon: DollarSign },
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
    <div className="min-h-screen bg-zinc-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-400">
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
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Divider and Back Link */}
        <div className="p-4 border-t border-zinc-800">
          <Link
            to="/messaging-diff"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-zinc-100">Admin Panel</h1>
          <div className="text-sm text-zinc-400">
            {user?.email}
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
