// ============================================================
// GoalOps Enterprise — Core TypeScript Types
// ============================================================

// ─── Enums ───────────────────────────────────────────────────
export type UserRole = 'employee' | 'manager' | 'admin';

export type GoalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'locked';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type EscalationLevel = 'reminder' | 'manager' | 'admin';

export type EscalationStatus = 'open' | 'acknowledged' | 'resolved';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type UoMType =
  | 'numeric_min'
  | 'numeric_max'
  | 'timeline'
  | 'zero_based';

export type AuditAction =
  | 'goal_created'
  | 'goal_updated'
  | 'goal_submitted'
  | 'goal_approved'
  | 'goal_rejected'
  | 'goal_locked'
  | 'goal_reopened'
  | 'checkin_created'
  | 'checkin_updated'
  | 'escalation_created'
  | 'escalation_resolved'
  | 'user_created'
  | 'cycle_opened'
  | 'cycle_closed';

// ─── User / Auth ─────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  designation: string;
  manager_id: string | null;
  employee_code: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
}

// ─── Goals ───────────────────────────────────────────────────
export interface Goal {
  id: string;
  employee_id: string;
  thrust_area: string;
  title: string;
  description: string;
  uom_type: UoMType;
  target_value: number;
  weightage: number;
  status: GoalStatus;
  cycle_year: number;
  manager_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: UserProfile;
  manager?: UserProfile;
  checkins?: QuarterlyCheckin[];
}

export interface CreateGoalPayload {
  thrust_area: string;
  title: string;
  description: string;
  uom_type: UoMType;
  target_value: number;
  weightage: number;
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {
  id: string;
}

// ─── Quarterly Check-ins ──────────────────────────────────────
export interface QuarterlyCheckin {
  id: string;
  goal_id: string;
  employee_id: string;
  quarter: Quarter;
  cycle_year: number;
  planned_value: number;
  actual_value: number;
  progress_percentage: number;
  progress_status: 'Not Started' | 'On Track' | 'Completed';
  employee_remarks: string | null;
  manager_remarks: string | null;
  status: 'pending' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  goal?: Goal;
}

export interface CreateCheckinPayload {
  goal_id: string;
  quarter: Quarter;
  cycle_year: number;
  planned_value: number;
  actual_value: number;
  progress_status: 'Not Started' | 'On Track' | 'Completed';
  employee_remarks?: string;
}

// ─── Approvals ────────────────────────────────────────────────
export interface Approval {
  id: string;
  goal_id: string;
  manager_id: string;
  employee_id: string;
  status: ApprovalStatus;
  comment: string | null;
  acted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  goal?: Goal;
  manager?: UserProfile;
  employee?: UserProfile;
}

// ─── Escalations ─────────────────────────────────────────────
export interface Escalation {
  id: string;
  employee_id: string;
  goal_id: string | null;
  escalation_level: EscalationLevel;
  reason: string;
  status: EscalationStatus;
  triggered_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  sla_deadline: string;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: UserProfile;
  goal?: Goal;
}

// ─── Audit Logs ───────────────────────────────────────────────
export interface AuditLog {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // Joined
  actor?: UserProfile;
}

// ─── Shared Goals ─────────────────────────────────────────────
export interface SharedGoal {
  id: string;
  primary_goal_id: string;
  shared_with_employee_id: string;
  contribution_weightage: number;
  status: 'active' | 'inactive';
  created_at: string;
  // Joined
  primary_goal?: Goal;
  shared_employee?: UserProfile;
}

// ─── Analytics ────────────────────────────────────────────────
export interface GoalMetrics {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  locked: number;
  completion_rate: number;
  avg_weightage: number;
}

export interface DepartmentMetrics {
  department: string;
  total_employees: number;
  goals_submitted: number;
  goals_approved: number;
  completion_rate: number;
  avg_progress: number;
}

export interface QuarterlyTrend {
  quarter: Quarter;
  year: number;
  avg_progress: number;
  total_checkins: number;
  on_track: number;
  behind: number;
}

// ─── API Response Wrapper ─────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Form State ───────────────────────────────────────────────
export interface FormState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// ─── Navigation ───────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  badge?: number;
}

// ─── Business Constants ───────────────────────────────────────
export const GOAL_CONSTRAINTS = {
  MAX_GOALS: 8,
  TOTAL_WEIGHTAGE: 100,
  MIN_WEIGHTAGE: 10,
  MAX_WEIGHTAGE: 100,
} as const;

export const CURRENT_CYCLE_YEAR = new Date().getFullYear();

export const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export const UOM_LABELS: Record<UoMType, string> = {
  numeric_min: 'Numeric Min (Higher is Better)',
  numeric_max: 'Numeric Max (Lower is Better)',
  timeline: 'Timeline (Days - Lower is Better)',
  zero_based: 'Zero-based (0 = Success)',
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  locked: 'Locked',
};

export const THRUST_AREAS = [
  'Revenue Growth',
  'Cost Optimization',
  'Customer Experience',
  'Operational Excellence',
  'People & Culture',
  'Innovation & Technology',
  'Compliance & Risk',
  'Sustainability',
] as const;
