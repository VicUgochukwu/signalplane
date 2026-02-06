import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  CalendarIcon, 
  DollarSign, 
  FileText, 
  Cpu, 
  Zap,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfWeek } from 'date-fns';
import { CostSummary } from '@/types/controlPlane';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

// Cost estimation constants
const COST_PER_PAGE = 0.001; // $0.001 per page
const COST_PER_HEADLESS = 0.002; // $0.002 per headless call
const COST_PER_1K_TOKENS = 0.003; // $0.003 per 1K tokens
const BUDGET_LIMIT = 500; // $500 monthly budget

const SHIP_COLORS: Record<string, string> = {
  'messaging-monitor': 'hsl(var(--terminal-cyan))',
  'narrative-tracker': 'hsl(var(--terminal-green))',
  'targeting-detector': 'hsl(var(--terminal-purple))',
  'early-warning': 'hsl(var(--terminal-amber))',
  'objection-tracker': 'hsl(var(--terminal-red))',
  default: 'hsl(var(--primary))',
};

export function CostDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: costData, isLoading, error } = useQuery({
    queryKey: ['admin-cost-summary', dateRange],
    queryFn: async () => {
      // Query from ops.weekly_cost_summary view
      const { data, error } = await supabase
        .schema('ops' as any)
        .from('weekly_cost_summary')
        .select('*')
        .gte('week_start', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('week_start', format(dateRange.to, 'yyyy-MM-dd'))
        .order('week_start', { ascending: true });

      if (error) throw error;
      return data as CostSummary[];
    },
  });

  const aggregatedData = useMemo(() => {
    if (!costData) return null;

    const totals = costData.reduce(
      (acc, row) => ({
        pages: acc.pages + (row.total_pages || 0),
        headless: acc.headless + (row.total_headless || 0),
        llmCalls: acc.llmCalls + (row.total_llm_calls || 0),
        tokens: acc.tokens + (row.total_tokens || 0),
      }),
      { pages: 0, headless: 0, llmCalls: 0, tokens: 0 }
    );

    const estimatedCost =
      totals.pages * COST_PER_PAGE +
      totals.headless * COST_PER_HEADLESS +
      (totals.tokens / 1000) * COST_PER_1K_TOKENS;

    // Group by ship for chart
    const byShip = costData.reduce((acc, row) => {
      const ship = row.ship_name || 'unknown';
      if (!acc[ship]) {
        acc[ship] = { ship_name: ship, total_cost: 0, runs: 0 };
      }
      const rowCost =
        (row.total_pages || 0) * COST_PER_PAGE +
        (row.total_headless || 0) * COST_PER_HEADLESS +
        ((row.total_tokens || 0) / 1000) * COST_PER_1K_TOKENS;
      acc[ship].total_cost += rowCost;
      acc[ship].runs += row.runs || 0;
      return acc;
    }, {} as Record<string, { ship_name: string; total_cost: number; runs: number }>);

    return {
      totals,
      estimatedCost,
      byShip: Object.values(byShip).sort((a, b) => b.total_cost - a.total_cost),
      budgetUsed: (estimatedCost / BUDGET_LIMIT) * 100,
    };
  }, [costData]);

  const statCards = [
    {
      label: 'Total Pages',
      value: aggregatedData?.totals.pages.toLocaleString() ?? '—',
      icon: FileText,
      color: 'text-terminal-cyan',
    },
    {
      label: 'LLM Calls',
      value: aggregatedData?.totals.llmCalls.toLocaleString() ?? '—',
      icon: Cpu,
      color: 'text-terminal-purple',
    },
    {
      label: 'Total Tokens',
      value: aggregatedData?.totals.tokens.toLocaleString() ?? '—',
      icon: Zap,
      color: 'text-terminal-amber',
    },
    {
      label: 'Est. Cost',
      value: aggregatedData ? `$${aggregatedData.estimatedCost.toFixed(2)}` : '—',
      icon: DollarSign,
      color: 'text-terminal-green',
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive">
        <p className="font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Error loading cost data
        </p>
        <p className="text-sm mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 bg-muted" />
              ) : (
                <div className="text-2xl font-bold text-foreground font-mono">
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Progress */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
            <span>Monthly Budget Usage</span>
            <span className="text-muted-foreground font-normal">
              ${aggregatedData?.estimatedCost.toFixed(2) ?? '0.00'} / ${BUDGET_LIMIT}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-full bg-muted" />
          ) : (
            <div className="space-y-2">
              <Progress 
                value={Math.min(aggregatedData?.budgetUsed ?? 0, 100)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span 
                  className={cn(
                    'font-medium',
                    (aggregatedData?.budgetUsed ?? 0) > 80 
                      ? 'text-destructive' 
                      : (aggregatedData?.budgetUsed ?? 0) > 50 
                        ? 'text-terminal-amber' 
                        : 'text-terminal-green'
                  )}
                >
                  {aggregatedData?.budgetUsed.toFixed(1) ?? 0}% used
                </span>
                <span>100%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost by Ship Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Cost by Ship</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full bg-muted" />
          ) : aggregatedData?.byShip.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={aggregatedData.byShip} 
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <YAxis 
                  type="category"
                  dataKey="ship_name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  width={150}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                />
                <Bar dataKey="total_cost" radius={[0, 4, 4, 0]}>
                  {aggregatedData.byShip.map((entry) => (
                    <Cell 
                      key={entry.ship_name}
                      fill={SHIP_COLORS[entry.ship_name] || SHIP_COLORS.default}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No cost data available for selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
