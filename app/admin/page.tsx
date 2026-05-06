'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getAdminStatus } from '@/lib/admin';
import { adminFetch } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Stats = {
  users: {
    total: number;
    signupsToday: number;
    signups7d: number;
    signups30d: number;
  };
  listings: {
    total: number;
    active: number;
    draft: number;
    cancelled: number;
    completed: number;
  };
  reports: {
    pending: number;
  };
};

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: number | string;
  hint?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-navy">
          {loading ? <span className="text-slate-300">—</span> : value.toLocaleString()}
        </p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { isMaster } = getAdminStatus(user);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminFetch<Stats>('/admin/api/stats')
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message ?? 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome, {user?.name || user?.email}
          {isMaster && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Owner
            </span>
          )}
        </p>
      </header>

      {/* Pending reports — most actionable */}
      <section className="mb-8">
        <Link
          href="/admin/reports"
          className="block bg-white rounded-lg border hover:border-slate-300 transition-colors p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending reports</p>
              <p className="text-3xl font-semibold text-navy mt-1">
                {loading ? (
                  <span className="text-slate-300">—</span>
                ) : (
                  (stats?.reports.pending ?? 0).toLocaleString()
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats && stats.reports.pending > 0
                  ? 'Click to review the queue'
                  : 'Nothing waiting'}
              </p>
            </div>
            {stats && stats.reports.pending > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1">
                Needs review
              </span>
            )}
          </div>
        </Link>
      </section>

      {/* Users */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Users
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats?.users.total ?? 0} loading={loading} />
          <StatCard
            label="Signed up today"
            value={stats?.users.signupsToday ?? 0}
            loading={loading}
          />
          <StatCard
            label="Signed up (7d)"
            value={stats?.users.signups7d ?? 0}
            loading={loading}
          />
          <StatCard
            label="Signed up (30d)"
            value={stats?.users.signups30d ?? 0}
            loading={loading}
          />
        </div>
      </section>

      {/* Listings */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Listings
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats?.listings.total ?? 0} loading={loading} />
          <StatCard
            label="Active"
            value={stats?.listings.active ?? 0}
            loading={loading}
          />
          <StatCard label="Draft" value={stats?.listings.draft ?? 0} loading={loading} />
          <StatCard
            label="Cancelled"
            value={stats?.listings.cancelled ?? 0}
            loading={loading}
          />
          <StatCard
            label="Completed"
            value={stats?.listings.completed ?? 0}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}
