import { AdminLayout } from '@/components/admin/AdminLayout';
import { CostDashboard } from '@/components/admin/CostDashboard';

export default function AdminCostDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cost Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Monitor API costs and resource usage across all ships
          </p>
        </div>
        
        <CostDashboard />
      </div>
    </AdminLayout>
  );
}
