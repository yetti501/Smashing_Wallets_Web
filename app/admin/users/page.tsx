'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-api';
import type { UserListItem } from '@/lib/admin-types';
import { ADMIN_LABEL } from '@/lib/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const masterEmail = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? '';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const path = debounced
      ? `/admin/api/users?q=${encodeURIComponent(debounced)}`
      : '/admin/api/users';
    adminFetch<{ users: UserListItem[]; total: number }>(path)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message ?? 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Search by email or name. Click a row to manage.
        </p>
      </header>

      <div className="mb-4">
        <Input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isMaster = !!masterEmail && u.email === masterEmail;
                const isAdmin = u.labels.includes(ADMIN_LABEL);
                return (
                  <TableRow key={u.$id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {u.name || <span className="text-slate-400 italic">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {isMaster && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                            Owner
                          </Badge>
                        )}
                        {!isMaster && isAdmin && <Badge variant="secondary">Admin</Badge>}
                        {!u.status && <Badge variant="destructive">Banned</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(u.$createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${u.$id}`}
                        className="text-sm font-medium text-navy hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && total > users.length && (
        <p className="mt-3 text-xs text-slate-500">
          Showing first {users.length} of {total}. Refine the search to narrow.
        </p>
      )}
    </div>
  );
}
