'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterFormValues } from '@/lib/validations';
import { DEPARTMENTS } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'employee' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    const supabase = createClient();

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.full_name } },
    });

    if (error) { setServerError(error.message); return; }

    // 2. Insert profile row (trigger handles this in production, explicit fallback here)
    if (data.user) {
      // Auto-assign mock hierarchy so hackathon demo works seamlessly for new accounts
      let assignedManager = null;
      if (values.role === 'employee') {
        // Try to find a manager in the SAME department
        const { data: mDept } = await supabase.from('profiles').select('id')
          .eq('role', 'manager').eq('department', values.department).limit(1).single();
        
        if (mDept) {
          assignedManager = mDept.id;
        } else {
          // Fallback to any manager
          const { data: mAny } = await supabase.from('profiles').select('id')
            .eq('role', 'manager').limit(1).single();
          if (mAny) assignedManager = mAny.id;
        }
      } else if (values.role === 'manager') {
        const { data: a } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
        if (a) assignedManager = a.id;
      }

      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: values.email,
        full_name: values.full_name,
        role: values.role,
        department: values.department,
        designation: values.designation,
        employee_code: values.employee_code,
        manager_id: assignedManager,
      });
    }

    router.push('/auth/login?registered=true');
  };

  return (
    <div className="card" style={{ padding: '2.5rem' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-7">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
          style={{ background: 'var(--brand-gradient)' }}>G</div>
        <div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>GoalOps Enterprise</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Create your account</div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Full name */}
        <div>
          <label className="form-label" htmlFor="reg-name">Full Name</label>
          <input id="reg-name" className="form-input" placeholder="Arjun Mehta" {...register('full_name')} />
          {errors.full_name && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.full_name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="form-label" htmlFor="reg-email">Work Email</label>
          <input id="reg-email" type="email" className="form-input" placeholder="you@company.com" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="form-label" htmlFor="reg-password">Password</label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input pr-10 w-full"
              placeholder="Min 8 characters"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.password.message}</p>}
        </div>

        {/* Employee code + role row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label" htmlFor="reg-empcode">Employee Code</label>
            <input id="reg-empcode" className="form-input" placeholder="EMP-001" {...register('employee_code')} />
            {errors.employee_code && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.employee_code.message}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="reg-role">Role</label>
            <select id="reg-role" className="form-input" {...register('role')}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              {/* Admin accounts are provisioned internally only */}
            </select>
          </div>
        </div>

        {/* Department + Designation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label" htmlFor="reg-dept">Department</label>
            <select id="reg-dept" className="form-input" {...register('department')}>
              <option value="">Select…</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.department.message}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="reg-designation">Designation</label>
            <input id="reg-designation" className="form-input" placeholder="Senior Engineer" {...register('designation')} />
            {errors.designation && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.designation.message}</p>}
          </div>
        </div>

        {serverError && (
          <div className="text-xs px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {serverError}
          </div>
        )}

        <button type="submit" id="register-submit" disabled={isSubmitting}
          className="btn-primary w-full justify-center py-3 text-base mt-2">
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: '#818cf8' }}>Sign in</Link>
      </p>
    </div>
  );
}
