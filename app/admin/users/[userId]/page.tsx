'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/lib/admin-api';
import { ADMIN_LABEL, getAdminStatus } from '@/lib/admin';
import type { UserDetail } from '@/lib/admin-types';
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

const masterEmail = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? '';

type ConfirmKind =
  | 'reset-password'
  | 'force-logout'
  | 'ban'
  | 'unban'
  | 'delete'
  | 'promote'
  | 'demote'
  | null;

const CONFIRM_COPY: Record<
  Exclude<ConfirmKind, null>,
  { title: string; description: string; cta: string; destructive?: boolean }
> = {
  'reset-password': {
    title: 'Send password reset email?',
    description: 'A password recovery email will be sent to this user.',
    cta: 'Send email',
  },
  'force-logout': {
    title: 'Force logout all sessions?',
    description: 'This signs the user out of every device. They can log back in normally.',
    cta: 'Force logout',
  },
  ban: {
    title: 'Ban this user?',
    description: 'They will be unable to log in until unbanned. Their data is preserved.',
    cta: 'Ban user',
    destructive: true,
  },
  unban: {
    title: 'Unban this user?',
    description: 'They will be able to log in again.',
    cta: 'Unban user',
  },
  delete: {
    title: 'Delete this account permanently?',
    description:
      'This deletes the user account and every listing they own. Cannot be undone.',
    cta: 'Delete user',
    destructive: true,
  },
  promote: {
    title: 'Promote to admin?',
    description: 'This user will gain access to the admin dashboard.',
    cta: 'Promote',
  },
  demote: {
    title: 'Demote this admin?',
    description: 'This user will lose access to the admin dashboard.',
    cta: 'Demote',
  },
};

function formatDateTime(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isMaster: requesterIsMaster } = getAdminStatus(currentUser);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = () => {
    setLoading(true);
    adminFetch<{ user: UserDetail }>(`/admin/api/users/${userId}`)
      .then((data) => setUser(data.user))
      .catch((err) => toast.error(err.message ?? 'Failed to load user'))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [userId]);

  const targetIsMaster = !!user && !!masterEmail && user.email === masterEmail;
  const targetIsAdmin = !!user && user.labels.includes(ADMIN_LABEL);
  const targetIsSelf = !!user && !!currentUser && user.$id === currentUser.$id;

  const handleAction = async () => {
    if (!confirm || !user) return;
    setSubmitting(true);
    try {
      if (confirm === 'delete') {
        const result = await adminFetch<{ deletedListings?: number }>(
          `/admin/api/users/${user.$id}`,
          { method: 'DELETE' }
        );
        const count = result.deletedListings ?? 0;
        toast.success(
          count > 0
            ? `User and ${count} listing${count === 1 ? '' : 's'} deleted`
            : 'User deleted'
        );
        router.push('/admin/users');
        return;
      }
      await adminFetch(`/admin/api/users/${user.$id}/${confirm}`, { method: 'POST' });
      toast.success(
        confirm === 'reset-password'
          ? 'Password reset email sent'
          : confirm === 'force-logout'
            ? 'All sessions cleared'
            : confirm === 'ban'
              ? 'User banned'
              : confirm === 'unban'
                ? 'User unbanned'
                : confirm === 'promote'
                  ? 'User promoted to admin'
                  : 'Admin demoted'
      );
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !user) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <p className="text-slate-500">User not found.</p>;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-navy">
        ← Back to users
      </Link>

      <header className="mt-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold text-navy">{user.name || user.email}</h1>
          {targetIsMaster && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
              Owner
            </Badge>
          )}
          {!targetIsMaster && targetIsAdmin && <Badge variant="secondary">Admin</Badge>}
          {!user.status && <Badge variant="destructive">Banned</Badge>}
        </div>
        <p className="mt-1 text-sm text-slate-600">{user.email}</p>
      </header>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Email verified</span>
            <span>{user.emailVerification ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Phone</span>
            <span>
              {user.phone || '—'}
              {user.phone && (user.phoneVerification ? ' (verified)' : ' (unverified)')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Created</span>
            <span>{formatDateTime(user.$createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last accessed</span>
            <span>{formatDateTime(user.accessedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">User ID</span>
            <span className="font-mono text-xs">{user.$id}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setConfirm('reset-password')}>
            Send password reset
          </Button>
          <Button variant="outline" onClick={() => setConfirm('force-logout')}>
            Force logout
          </Button>
          {user.status ? (
            <Button
              variant="destructive"
              onClick={() => setConfirm('ban')}
              disabled={targetIsMaster || targetIsSelf}
            >
              Ban user
            </Button>
          ) : (
            <Button variant="default" onClick={() => setConfirm('unban')}>
              Unban user
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setConfirm('delete')}
            disabled={targetIsMaster || targetIsSelf}
          >
            Delete user
          </Button>
        </CardContent>
      </Card>

      {requesterIsMaster && !targetIsMaster && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin role</CardTitle>
          </CardHeader>
          <CardContent>
            {targetIsAdmin ? (
              <Button variant="outline" onClick={() => setConfirm('demote')}>
                Demote from admin
              </Button>
            ) : (
              <Button variant="default" onClick={() => setConfirm('promote')}>
                Promote to admin
              </Button>
            )}
          </CardContent>
        </Card>
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
