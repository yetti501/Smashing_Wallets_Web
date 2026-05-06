'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  masterOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/admins', label: 'Admins', masterOnly: true },
];

export default function AdminSidebar({ isMaster }: { isMaster: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-white">
      <div className="px-5 py-6 border-b">
        <Link href="/admin" className="text-lg font-semibold text-navy">
          Admin
        </Link>
      </div>
      <nav className="p-3 space-y-1">
        {NAV.filter((item) => !item.masterOnly || isMaster).map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-slate-100 font-medium text-navy'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 left-0 w-56 border-t bg-white">
        <Link
          href="/"
          className="block px-5 py-3 text-sm text-slate-500 hover:text-navy"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
