// ============================================================
// GoalOps Enterprise — Constants & Configuration
// ============================================================
import { type NavItem } from '@/types';

export const APP_NAME = 'GoalOps Enterprise';
export const APP_TAGLINE = 'Operational Goal Governance & Performance Intelligence';

// ─── Navigation ───────────────────────────────────────────────
export const EMPLOYEE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/employee', icon: 'LayoutDashboard', roles: ['employee'] },
  { label: 'My Goals', href: '/dashboard/employee/goals', icon: 'Target', roles: ['employee'] },
  { label: 'Check-ins', href: '/dashboard/employee/checkins', icon: 'ClipboardList', roles: ['employee'] },
];

export const MANAGER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/manager', icon: 'LayoutDashboard', roles: ['manager'] },
  { label: 'Approvals', href: '/dashboard/manager/approvals', icon: 'CheckSquare', roles: ['manager'] },
  { label: 'Check-ins', href: '/dashboard/manager/checkins', icon: 'ClipboardList', roles: ['manager'] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: 'LayoutDashboard', roles: ['admin'] },
  { label: 'Escalations', href: '/dashboard/admin/escalations', icon: 'AlertTriangle', roles: ['admin'] },
  { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: 'Shield', roles: ['admin'] },
];

// ─── Role → Dashboard routing ─────────────────────────────────
export const ROLE_DASHBOARD_MAP = {
  employee: '/dashboard/employee',
  manager: '/dashboard/manager',
  admin: '/dashboard/admin',
} as const;

// ─── Protected route patterns ─────────────────────────────────
export const PROTECTED_ROUTES = ['/dashboard'];
export const AUTH_ROUTES = ['/auth/login', '/auth/register'];
export const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register'];

// ─── Departments ──────────────────────────────────────────────
export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Sales',
  'Marketing',
  'Finance',
  'HR',
  'Operations',
  'Legal',
  'Customer Success',
  'Design',
] as const;

// ─── Thrust Areas ─────────────────────────────────────────────
export const THRUST_AREAS = [
  'Revenue Growth',
  'Operational Excellence',
  'Innovation & Technology',
  'People & Culture',
  'Customer Experience',
  'Compliance & Risk',
  'Cost Optimization',
  'Digital Transformation',
] as const;

// ─── SLA (hours) for escalations ──────────────────────────────
export const ESCALATION_SLA = {
  reminder: 48,
  manager: 24,
  admin: 12,
} as const;

// ─── Quarters ────────────────────────────────────────────────
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
