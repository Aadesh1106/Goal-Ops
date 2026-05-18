import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, sidebar, className }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen dashboard-layout" style={{ background: 'var(--bg-base)' }}>
      {sidebar}
      <main className={cn('page-content flex-1', className)}>
        {children}
      </main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-header flex items-start justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  accent?: string;
}

export function KpiCard({ label, value, change, positive, icon, accent }: KpiCardProps) {
  return (
    <div className="kpi-card" style={accent ? { '--accent': accent } as React.CSSProperties : {}}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {change && (
        <span className="text-xs font-medium" style={{ color: positive ? 'var(--status-success)' : 'var(--status-error)' }}>
          {positive ? '↑' : '↓'} {change}
        </span>
      )}
    </div>
  );
}
