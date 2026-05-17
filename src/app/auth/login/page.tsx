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
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [isSsoLoggingIn, setIsSsoLoggingIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const handleMicrosoftLogin = () => {
    setServerError(null);
    setShowSsoModal(true);
  };

  const handleSimulatedLogin = async (email: string) => {
    setIsSsoLoggingIn(true);
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'password123',
    });

    if (error) {
      setServerError(`SSO claim simulation failed: ${error.message}`);
      setIsSsoLoggingIn(false);
      setShowSsoModal(false);
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
          setServerError(`SSO profile claims repair failed: ${insertErr.message}`);
          setIsSsoLoggingIn(false);
          setShowSsoModal(false);
          return;
        }
        profile = newProfile;
      }

      const role = (profile?.role ?? 'employee') as UserRole;
      router.push(ROLE_DASHBOARD_MAP[role]);
      router.refresh();
    }
  };

  const triggerLiveOAuthMicrosoft = async () => {
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
      setShowSsoModal(false);
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
    <div className="card" style={{ padding: '2.5rem', position: 'relative' }}>
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

      {/* SSO Simulation Modal Dialog */}
      {showSsoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#12131a', borderColor: 'var(--bg-border)' }}>
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
                <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
                <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
                <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
              </svg>
              <h2 className="font-bold text-base text-white">Microsoft Entra ID (SSO) Simulator</h2>
            </div>
            
            <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Since live Microsoft AD synchronization requires toggling the "Azure" provider inside your private Supabase dashboard, you can trigger a <strong>Simulated SSO Identity Claim</strong> below for testing!
            </p>
            
            {/* Persona Grid */}
            <div className="flex flex-col gap-2.5 mb-6">
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Select simulated enterprise identity:
              </span>
              
              {[
                { name: 'Arjun Engineer (Employee)', email: 'employee@hpcl.com', desc: 'HPCL Technical Stream' },
                { name: 'google (Employee)', email: 'google@google.com', desc: 'Google Federated Identity' },
                { name: 'Sarah Manager (L1 Manager)', email: 'manager@hpcl.com', desc: 'Approvals & Team Check-ins' },
                { name: 'Boss Admin (HR / Exception)', email: 'admin@hpcl.com', desc: 'Audit Logs & Escalation Center' }
              ].map((persona) => (
                <button
                  key={persona.email}
                  disabled={isSsoLoggingIn}
                  onClick={() => handleSimulatedLogin(persona.email)}
                  className="w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all hover:bg-white/5 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--bg-border)', cursor: 'pointer' }}
                >
                  <span className="text-xs font-semibold text-white">{persona.name}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{persona.email} · {persona.desc}</span>
                </button>
              ))}
            </div>

            {/* Separator */}
            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t" style={{ borderColor: 'var(--bg-border)' }}></div>
              <span className="flex-shrink mx-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>or</span>
              <div className="flex-grow border-t" style={{ borderColor: 'var(--bg-border)' }}></div>
            </div>

            {/* Live OAuth Trigger */}
            <button
              onClick={triggerLiveOAuthMicrosoft}
              disabled={isSsoLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all hover:bg-white/5 disabled:opacity-50"
              style={{ borderColor: '#f87171', color: '#f87171', cursor: 'pointer' }}
            >
              Continue to Live production AD Sign-In
            </button>
            <p className="text-[9px] text-center mt-1.5" style={{ color: 'var(--text-muted)' }}>
              ⚠️ Requires live Azure keys set up inside Supabase Auth Providers console.
            </p>

            <div className="flex justify-end mt-5 pt-3 border-t" style={{ borderColor: 'var(--bg-border)' }}>
              <button
                disabled={isSsoLoggingIn}
                onClick={() => setShowSsoModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
