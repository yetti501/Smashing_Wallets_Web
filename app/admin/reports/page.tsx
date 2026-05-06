'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-api';
import type { DecoratedReport, ReportStatus } from '@/lib/admin-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'resolved', label: 'Resolved' },
];

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  scam: 'Scam',
  other: 'Other',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('pending');
  const [reports, setReports] = useState<DecoratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminFetch<{ reports: DecoratedReport[] }>(`/admin/api/reports?status=${status}`)
      .then((data) => {
        if (!cancelled) setReports(data.reports);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message ?? 'Failed to load reports');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review and act on reports submitted from the mobile app.
        </p>
      </header>

      <div className="mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            variant={status === s.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reported user</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  No {status} reports.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r) => (
                <TableRow key={r.$id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {REPORT_TYPE_LABELS[r.reportType] ?? r.reportType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {r.listing ? (
                      r.listing.title
                    ) : (
                      <span className="text-slate-400 italic">deleted</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {r.reporter ? (
                      r.reporter.email
                    ) : (
                      <span className="text-slate-400 italic">anonymous</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {r.reportedUser ? (
                      r.reportedUser.email
                    ) : (
                      <span className="text-slate-400 italic">deleted</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(r.$createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/reports/${r.$id}`}
                      className="text-sm font-medium text-navy hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
