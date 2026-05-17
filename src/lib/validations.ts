// ============================================================
// GoalOps Enterprise — Zod Validation Schemas
// ============================================================
import { z } from 'zod';

// ─── Goal Schema ─────────────────────────────────────────────
export const createGoalSchema = z.object({
  thrust_area: z.string().min(1, 'Thrust area is required'),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be under 120 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be under 500 characters'),
  uom_type: z.enum(['percentage', 'number', 'currency', 'boolean', 'rating'], {
    error: 'Select a valid unit of measurement',
  }),
  target_value: z
    .number({ error: 'Target must be a number' })
    .min(0, 'Target must be non-negative'),
  weightage: z
    .number({ error: 'Weightage must be a number' })
    .min(10, 'Minimum weightage is 10%')
    .max(50, 'Maximum weightage is 50%'),
});

export type CreateGoalFormValues = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateGoalFormValues = z.infer<typeof updateGoalSchema>;

// ─── Check-in Schema ─────────────────────────────────────────
export const createCheckinSchema = z.object({
  goal_id: z.string().uuid(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  cycle_year: z.number().int().min(2020).max(2100),
  planned_value: z.number({ error: 'Planned value must be a number' }),
  actual_value: z.number({ error: 'Actual value must be a number' }),
  employee_remarks: z.string().max(500).optional(),
});

export type CreateCheckinFormValues = z.infer<typeof createCheckinSchema>;

// ─── Approval Schema ─────────────────────────────────────────
export const approvalActionSchema = z.object({
  goal_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  comment: z.string().max(500).optional(),
});

export type ApprovalActionValues = z.infer<typeof approvalActionSchema>;

// ─── Login Schema ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Register Schema ──────────────────────────────────────────
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employee_code: z.string().min(2, 'Employee code is required'),
  role: z.enum(['employee', 'manager', 'admin']),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
