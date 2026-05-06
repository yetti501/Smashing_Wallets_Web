'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';
import type { DecoratedReport } from '@/lib/admin-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  scam: 'Scam',
  other: 'Other',
};

type ConfirmKind = 'dismiss' | 'delete-listing' | 'ban-user' | null;

const CONFIRM_COPY: Record<
  Exclude<ConfirmKind, null>,
  { title: string; description: string; cta: string; destructive?: boolean }
> = {
  dismiss: {
    title: 'Dismiss this report?',
    description: 'The report will be marked dismissed and removed from the queue.',
    cta: 'Dismiss',
  },
  'delete-listing': {
    title: 'Delete the reported listing?',
    description:
      'This permanently removes the listing. All other open reports for this listing will be marked resolved.',
    cta: 'Delete listing',
    destructive: true,
  },
  'ban-user': {
    title: 'Ban the listing owner?',
    description:
      'The owner will be unable to log in. All other open reports against this user will be marked resolved.',
    cta: 'Ban user',
    destructive: true,
  },
};

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<DecoratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminFetch<{ report: DecoratedReport }>(`/admin/api/reports/${id}`)
      .then((data) => {
        if (!cancelled) setReport(data.report);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message ?? 'Failed to load report');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAction = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      await adminFetch(`/admin/api/reports/${id}/${confirm}`, { method: 'POST' });
      toast.success(
        confirm === 'dismiss'
          ? 'Report dismissed'
          : confirm === 'delete-listing'
            ? 'Listing deleted'
            : 'User banned'
      );
      router.push('/admin/reports');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }
  if (!report) {
    return <p className="text-slate-500">Report not found.</p>;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/reports" className="text-sm text-slate-500 hover:text-navy">
        ← Back to reports
      </Link>

      <header className="mt-3 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Report detail</h1>
          <p className="mt-1 text-sm text-slate-600">
            Submitted {new Date(report.$createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant="secondary">
          {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
        </Badge>
      </header>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Reported listing</CardTitle>
        </CardHeader>
        <CardContent>
          {report.listing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="font-medium text-navy">{report.listing.title}</p>
                <p className="text-sm text-slate-600">
                  {report.listing.eventType ?? 'unknown type'} ·{' '}
                  {report.listing.status ?? 'unknown status'}
                </p>
                <p className="text-xs text-slate-400 font-mono">{report.listing.$id}</p>
              </div>
              {report.listing.images && report.listing.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {report.listing.images.map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square overflow-hidden rounded-md bg-slate-100 border hover:opacity-90 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Listing image ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 italic">Listing has been deleted.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Reason</CardTitle>
        </CardHeader>
        <CardContent>
          {report.description ? (
            <p className="text-slate-700 whitespace-pre-wrap">{report.description}</p>
          ) : (
            <p className="text-slate-400 italic">No description provided.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Reporter</CardTitle>
          </CardHeader>
          <CardContent>
            {report.reporter ? (
              <>
                <p className="font-medium text-navy">{report.reporter.name || 'No name'}</p>
                <p className="text-sm text-slate-600">{report.reporter.email}</p>
              </>
            ) : report.userId === 'anonymous' ? (
              <p className="text-slate-500 italic">Anonymous</p>
            ) : (
              <p className="text-slate-500 italic">User deleted</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Listing owner</CardTitle>
          </CardHeader>
          <CardContent>
            {report.reportedUser ? (
              <>
                <p className="font-medium text-navy">
                  {report.reportedUser.name || 'No name'}
                </p>
                <p className="text-sm text-slate-600">{report.reportedUser.email}</p>
                {!report.reportedUser.status && (
                  <Badge variant="destructive" className="mt-2">
                    Already banned
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-slate-500 italic">User deleted</p>
            )}
          </CardContent>
        </Card>
      </div>

      {report.status === 'pending' ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setConfirm('dismiss')} variant="outline">
            Dismiss
          </Button>
          <Button
            onClick={() => setConfirm('delete-listing')}
            variant="destructive"
            disabled={!report.listing}
          >
            Delete listing
          </Button>
          <Button
            onClick={() => setConfirm('ban-user')}
            variant="destructive"
            disabled={!report.reportedUser || !report.reportedUser.status}
          >
            Ban user
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          This report is <span className="font-medium">{report.status}</span>.
        </p>
      )}

      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle>{CONFIRM_COPY[confirm].title}</DialogTitle>
                <DialogDescription>{CONFIRM_COPY[confirm].description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirm(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant={CONFIRM_COPY[confirm].destructive ? 'destructive' : 'default'}
                  onClick={handleAction}
                  disabled={submitting}
                >
                  {submitting ? 'Working…' : CONFIRM_COPY[confirm].cta}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
