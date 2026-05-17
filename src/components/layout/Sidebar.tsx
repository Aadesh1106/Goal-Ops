'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Misc';
import { createClient } from '@/lib/supabase/client';
import type { NavItem, UserProfile } from '@/types';
import {
  LayoutDashboard, Target, Users, CheckSquare, ClipboardList,
  BarChart2, AlertTriangle, Shield, Settings, LogOut,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Target, Users, CheckSquare, ClipboardList,
  BarChart2, AlertTriangle, Shield, Settings,
};

interface SidebarProps {
  navItems: NavItem[];
  profile: UserProfile;
}

export function Sidebar({ navItems, profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const roleLabel = {
    employee: 'Employee',
    manager: 'Manager',
    admin: 'Administrator',
  }[profile.role];

  const roleBadgeColor = {
    employee: 'rgba(99,102,241,0.15)',
    manager: 'rgba(6,182,212,0.15)',
    admin: 'rgba(245,158,11,0.15)',
  }[profile.role];

  const roleBadgeText = {
    employee: '#818cf8',
    manager: '#22d3ee',
    admin: '#fbbf24',
  }[profile.role];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: 'var(--brand-gradient)' }}
          >
            G
          </div>
          <div>
            <div className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>
              GoalOps
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Enterprise
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
          style={{ color: 'var(--text-muted)' }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-nav-item', isActive && 'active')}
            >
              <Icon size={15} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-2"
          style={{ background: 'var(--bg-elevated)' }}>
          <Avatar name={profile.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {profile.full_name}
            </div>
            <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {profile.department}
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: roleBadgeColor, color: roleBadgeText }}>
            {roleLabel}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          id="sidebar-signout"
          className="sidebar-nav-item w-full text-left"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
