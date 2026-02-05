import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserPlus, Shield, ArrowRight } from 'lucide-react';
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
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-zinc-700" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Signups Chart */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-foreground">Daily Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {signupsLoading ? (
              <Skeleton className="h-64 w-full bg-zinc-700" />
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
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium text-foreground">{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
