'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/lib/admin-api';
import { ADMIN_LABEL, getAdminStatus } from '@/lib/admin';
import type { UserListItem } from '@/lib/admin-types';
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

export default function AdminsPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { isMaster } = getAdminStatus(currentUser);

  const [admins, setAdmins] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoting, setDemoting] = useState<UserListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isMaster) {
      router.replace('/admin');
      return;
    }
  }, [authLoading, isMaster, router]);

  const reload = () => {
    setLoading(true);
    adminFetch<{ users: UserListItem[] }>('/admin/api/users')
      .then((data) => {
        const onlyAdmins = data.users.filter(
          (u) => u.email === masterEmail || u.labels.includes(ADMIN_LABEL)
        );
        setAdmins(onlyAdmins);
      })
      .catch((err) => toast.error(err.message ?? 'Failed to load admins'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isMaster) reload();
  }, [isMaster]);

  const handleDemote = async () => {
    if (!demoting) return;
    setSubmitting(true);
    try {
      await adminFetch(`/admin/api/users/${demoting.$id}/demote`, { method: 'POST' });
      toast.success('Admin demoted');
      setDemoting(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to demote');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMaster) return null;

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Admins</h1>
        <p className="mt-1 text-sm text-slate-600">
          Owner cannot be demoted. To promote a user, find them in{' '}
          <Link href="/admin/users" className="text-navy underline hover:no-underline">
            Users
          </Link>{' '}
          and click "Promote to admin".
        </p>
      </header>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                  No admins yet.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((u) => {
                const isMasterRow = u.email === masterEmail;
                return (
                  <TableRow key={u.$id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {u.name || <span className="text-slate-400 italic">—</span>}
                    </TableCell>
                    <TableCell>
                      {isMasterRow ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                          Owner
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isMasterRow ? (
                        <span className="text-xs text-slate-400">Cannot demote</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDemoting(u)}
                        >
                          Demote
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!demoting} onOpenChange={(open) => !open && setDemoting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote {demoting?.email}?</DialogTitle>
            <DialogDescription>
              They will lose access to the admin dashboard. They keep their regular account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDemoting(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleDemote} disabled={submitting}>
              {submitting ? 'Working…' : 'Demote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
