'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormValues } from '@/lib/validations';
import { ROLE_DASHBOARD_MAP } from '@/lib/constants';
import type { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const handleMicrosoftLogin = async () => {
    setServerError(null);
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid profile email User.Read',
      }
    });

    if (error) {
      setServerError(error.message);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    // Fetch role and redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Auto-repair missing profile for bricked accounts
      if (!profile) {
        const fallbackRole = user.email?.includes('admin') ? 'admin' : (user.email?.includes('manager') ? 'manager' : 'employee');
        const defaultName = user.user_metadata?.full_name || (user.email?.split('@')[0] || 'User');
        const { data: newProfile, error: insertErr } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: defaultName,
          role: fallbackRole,
          department: 'General',
          employee_code: 'EMP-REC-' + Date.now().toString().slice(-4),
        }).select().single();
        
        if (insertErr) {
          setServerError(`Profile Repair Failed: ${insertErr.message} (Code: ${insertErr.code})`);
          return;
        }
        profile = newProfile;
      }

      const role = (profile?.role ?? 'employee') as UserRole;
      router.push(ROLE_DASHBOARD_MAP[role]);
      router.refresh();
    }
  };

  return (
    <div className="card" style={{ padding: '2.5rem' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
          style={{ background: 'var(--brand-gradient)' }}
        >
          G
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            GoalOps Enterprise
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Goal Governance Platform
          </div>
        </div>
      </div>

      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Welcome back
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
        Sign in to your enterprise workspace
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label className="form-label" htmlFor="login-email">Work Email</label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label" style={{ marginBottom: 0 }} htmlFor="login-password">Password</label>
            <Link href="/auth/forgot-password"
              className="text-xs" style={{ color: '#818cf8' }}>
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs" style={{ color: 'var(--status-error)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <div
            className="text-xs px-3 py-2.5 rounded-lg"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          id="login-submit"
          disabled={isSubmitting}
          className="btn-primary w-full justify-center py-3 text-base mt-2"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="relative flex py-2 items-center my-1">
        <div className="flex-grow border-t" style={{ borderColor: 'var(--bg-border)' }}></div>
        <span className="flex-shrink mx-4 text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
        <div className="flex-grow border-t" style={{ borderColor: 'var(--bg-border)' }}></div>
      </div>

      <button
        onClick={handleMicrosoftLogin}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--bg-border)',
          color: 'var(--text-primary)',
          cursor: 'pointer'
        }}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
          <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
          <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
          <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
        </svg>
        Sign in with Microsoft (SSO)
      </button>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" style={{ color: '#818cf8' }}>
          Register here
        </Link>
      </p>
    </div>
  );
}
