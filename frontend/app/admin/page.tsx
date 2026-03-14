'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { reportsService } from '@/lib/services/admin-service';
import { DashboardMetrics } from '@/lib/types-extended';
import {
  Users, ShoppingCart, DollarSign, ShieldCheck,
  Truck, Activity, TrendingUp, Clock,
} from 'lucide-react';

function StatCard({
  title, value, icon: Icon, sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-black/50">{title}</p>
          <p className="text-2xl font-bold mt-1 text-black">{value}</p>
          {sub && <p className="text-xs text-black/40 mt-1">{sub}</p>}
        </div>
        <Icon className="h-8 w-8 text-black/20" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token || !user || user.role !== 'admin') return;
    reportsService.getDashboardMetrics(token)
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 bg-white min-h-screen">
        <p className="text-black/50 text-center">{error}</p>
      </div>
    );
  }

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-black/50 text-sm mt-1">Platform overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={metrics ? fmt(metrics.total_users) : '—'}
          icon={Users}
          sub="registered accounts"
        />
        <StatCard
          title="Total Orders"
          value={metrics ? fmt(metrics.total_orders) : '—'}
          icon={ShoppingCart}
          sub={metrics ? `${metrics.orders_today} today` : undefined}
        />
        <StatCard
          title="Total Revenue"
          value={metrics ? fmtCurrency(metrics.total_revenue) : '—'}
          icon={DollarSign}
          sub={metrics ? `${fmtCurrency(metrics.revenue_today)} today` : undefined}
        />
        <StatCard
          title="Active Today"
          value={metrics ? fmt(metrics.active_users_today) : '—'}
          icon={Activity}
          sub="active users"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Pending Verifications"
          value={metrics ? metrics.pending_verifications : '—'}
          icon={ShieldCheck}
        />
        <StatCard
          title="Pending Transports"
          value={metrics ? metrics.pending_transports : '—'}
          icon={Truck}
        />
        <StatCard
          title="Orders Today"
          value={metrics ? metrics.orders_today : '—'}
          icon={TrendingUp}
        />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-black">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', href: '/admin/users', icon: Users },
            { label: 'Verifications', href: '/admin/verification', icon: ShieldCheck },
            { label: 'Reports', href: '/admin/reports', icon: TrendingUp },
            { label: 'Audit Logs', href: '/admin/audit', icon: Clock },
          ].map(({ label, href, icon: Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-black/10 bg-white hover:bg-black hover:text-white transition-colors text-sm font-medium text-black"
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
