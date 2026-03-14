'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, FileText, Shield, Settings, Database,
  ShieldCheck, Truck, MessageSquare, LayoutDashboard,
  ChevronLeft, ChevronRight, Menu,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/transport', label: 'Transport', icon: Truck },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/audit', label: 'Audit Logs', icon: Shield },
  { href: '/admin/config', label: 'Configuration', icon: Settings },
  { href: '/admin/backups', label: 'Backups', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Sidebar */}
      <aside
        className={`relative flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out bg-black ${
          collapsed ? 'w-14' : 'w-56'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center h-14 px-3 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <p className="font-bold text-white truncate tracking-wide">Admin Panel</p>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href) && href !== '/admin';
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-white text-black font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0 bg-white text-black">{children}</main>
    </div>
  );
}
