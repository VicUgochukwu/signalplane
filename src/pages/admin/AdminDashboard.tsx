import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserPlus, Shield, ArrowRight, Activity, Crown, Rocket, FlaskConical, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface UserGrowthStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  banned_users: number;
  admins: number;
  users_last_7_days: number;
  users_last_30_days: number;
  users_last_90_days: number;
}

interface DailySignup {
  signup_date: string;
  count: number;
}

interface SystemSummary {
  total_apis: number;
  healthy_apis: number;
  degraded_apis: number;
  down_apis: number;
  avg_response_time_ms: number;
}

interface TierCount {
  tier: string;
  user_count: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-user-growth-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_user_growth_stats');
      if (error) throw error;
      return data as UserGrowthStats;
    },
  });

  const { data: dailySignups, isLoading: signupsLoading } = useQuery({
    queryKey: ['admin-daily-signups'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_daily_signups', { p_days: 30 });
      if (error) throw error;
      return (data as DailySignup[]).map(d => ({
        ...d,
        date: new Date(d.signup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
    },
  });

  const { data: systemSummary, isLoading: systemLoading } = useQuery({
    queryKey: ['admin-system-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_system_summary');
      if (error) throw error;
      return data as SystemSummary;
    },
  });

  const { data: tierCounts, isLoading: tiersLoading } = useQuery({
    queryKey: ['admin-tier-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_tier_summary');
      if (error) throw error;
      return data as TierCount[];
    },
  });

  const tierConfig: Record<string, { label: string; icon: typeof Crown; color: string; badgeClass: string }> = {
    enterprise: { label: 'Enterprise', icon: Crown, color: 'text-purple-400', badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    growth: { label: 'Growth', icon: Rocket, color: 'text-blue-400', badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    pilot: { label: 'Pilot', icon: FlaskConical, color: 'text-amber-400', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    free: { label: 'Free', icon: User, color: 'text-muted-foreground', badgeClass: 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30' },
  };

  const getTierCount = (tier: string) => {
    return tierCounts?.find(t => t.tier === tier)?.user_count ?? 0;
  };

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'text-blue-400' },
    { label: 'Active Users', value: stats?.active_users ?? 0, icon: UserCheck, color: 'text-emerald-400' },
    { label: 'New (7d)', value: stats?.users_last_7_days ?? 0, icon: UserPlus, color: 'text-amber-400' },
    { label: 'Admins', value: stats?.admins ?? 0, icon: Shield, color: 'text-purple-400' },
  ];

  const quickLinks = [
    { label: 'Manage Users', to: '/admin/users' },
    { label: 'Feature Flags', to: '/admin/feature-flags' },
    { label: 'Audit Log', to: '/admin/audit-log' },
    { label: 'System Overview', to: '/admin/system' },
  ];

  const healthPercentage = systemSummary && (systemSummary.total_apis ?? 0) > 0
    ? Math.round(((systemSummary.healthy_apis ?? 0) / systemSummary.total_apis) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-muted/50 border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-muted" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscription Tiers */}
        <Card className="bg-muted/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Subscription Tiers</CardTitle>
            <Link
              to="/admin/users"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View all users <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {tiersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['enterprise', 'growth', 'pilot', 'free'].map((tier) => {
                  const config = tierConfig[tier];
                  const Icon = config.icon;
                  const count = getTierCount(tier);
                  return (
                    <div
                      key={tier}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border"
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <div>
                        <div className="text-xl font-bold text-foreground">{count}</div>
                        <Badge className={config.badgeClass}>{config.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Signups Chart */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Daily Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {signupsLoading ? (
              <Skeleton className="h-64 w-full bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailySignups}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#27272a', 
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Signups"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Card className="bg-muted/50 border-border hover:border-[hsl(var(--accent-signal)/0.5)] transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium text-foreground">{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* System Health Summary */}
        <Card className="bg-muted/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              System Health
            </CardTitle>
            <Link 
              to="/admin/system" 
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {systemLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-32 bg-muted" />
                <Skeleton className="h-2 w-full bg-muted" />
                <Skeleton className="h-4 w-24 bg-muted" />
              </div>
            ) : systemSummary ? (
              (systemSummary.total_apis ?? 0) > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {systemSummary.healthy_apis ?? 0}/{systemSummary.total_apis ?? 0} APIs healthy
                    </span>
                    <span className="text-muted-foreground">{healthPercentage}%</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${((systemSummary.healthy_apis ?? 0) / Math.max(systemSummary.total_apis ?? 1, 1)) * 100}%` }}
                    />
                    <div 
                      className="absolute top-0 h-full bg-amber-500"
                      style={{ 
                        left: `${((systemSummary.healthy_apis ?? 0) / Math.max(systemSummary.total_apis ?? 1, 1)) * 100}%`,
                        width: `${((systemSummary.degraded_apis ?? 0) / Math.max(systemSummary.total_apis ?? 1, 1)) * 100}%` 
                      }}
                    />
                    <div 
                      className="absolute top-0 h-full bg-red-500 rounded-r-full"
                      style={{ 
                        left: `${(((systemSummary.healthy_apis ?? 0) + (systemSummary.degraded_apis ?? 0)) / Math.max(systemSummary.total_apis ?? 1, 1)) * 100}%`,
                        width: `${((systemSummary.down_apis ?? 0) / Math.max(systemSummary.total_apis ?? 1, 1)) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Avg latency: {systemSummary.avg_response_time_ms
                      ? `${Math.round(systemSummary.avg_response_time_ms)}ms`
                      : '—'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">No API health data cached yet.</p>
                  <p className="text-xs text-muted-foreground">
                    Run a health check from System Overview to populate this widget.
                  </p>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No system data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
