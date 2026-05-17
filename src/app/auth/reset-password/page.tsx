'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROLE_DASHBOARD_MAP } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password.length < 6) {
      setServerError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setServerError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      // Supabase automatically holds the active recovery session
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setServerError(error.message);
      } else {
        setSuccessMessage('Your password has been securely updated!');
        
        // Fetch user profile to redirect to correct role-based dashboard
        const { data: { user } } = await supabase.auth.getUser();
        let targetDashboard = '/dashboard/employee/goals';
        
        if (user) {
          const res = await fetch(`${window.location.origin}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${user.id}`
            }
          });
          if (res.ok) {
            const profiles = await res.json();
            if (profiles && profiles[0]) {
              const role = profiles[0].role;
              targetDashboard = ROLE_DASHBOARD_MAP[role as keyof typeof ROLE_DASHBOARD_MAP] || targetDashboard;
            }
          }
        }

        // Redirect after a brief moment
        setTimeout(() => {
          router.replace(targetDashboard);
        }, 1800);
      }
    } catch (err: any) {
      setServerError(err?.message || 'An unexpected error occurred during password update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.1)' }}>
            <svg className="w-6 h-6 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Please establish a secure, strong password for your GoalOps workspace identity.
        </p>
      </div>

      {successMessage ? (
        <div className="p-6 rounded-2xl border text-center animate-in fade-in duration-300" style={{ background: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <svg className="w-6 h-6 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-bold text-white mb-2">Password Updated!</h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {successMessage}
            <br />
            <span className="text-[10px] mt-2 block" style={{ color: 'var(--text-muted)' }}>Redirecting to your dashboard...</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="form-label" htmlFor="reset-password">New Password</label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input pr-10 w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
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
          </div>

          <div>
            <label className="form-label" htmlFor="reset-confirm">Confirm New Password</label>
            <div className="relative">
              <input
                id="reset-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="form-input pr-10 w-full"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {serverError && (
            <div
              className="text-xs px-3 py-2.5 rounded-lg border"
              style={{
                background: 'rgba(239,68,68,0.04)',
                borderColor: 'rgba(239,68,68,0.15)',
                color: '#f87171',
              }}
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full justify-center py-3 text-base mt-2"
          >
            {isSubmitting ? 'Updating password…' : 'Secure Account'}
          </button>
        </form>
      )}
    </div>
  );
}
