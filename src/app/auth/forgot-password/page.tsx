'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/reset-password`,
      });

      if (error) {
        setServerError(error.message);
      } else {
        setSuccessMessage('A secure recovery link has been dispatched to your inbox.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'An unexpected recovery error occurred.');
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Password Recovery</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Enter your registered enterprise email address to dispatch a password recovery claim.
        </p>
      </div>

      {successMessage ? (
        <div className="p-6 rounded-2xl border text-center animate-in fade-in duration-300" style={{ background: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <svg className="w-6 h-6 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-white mb-2">Check your email</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {successMessage}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center py-2 px-4 rounded-xl text-xs font-semibold w-full transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
          >
            Return to login screen
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="form-label" htmlFor="forgot-email">Work Email</label>
            <input
              id="forgot-email"
              type="email"
              required
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
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
            {isSubmitting ? 'Requesting link…' : 'Send Recovery Link'}
          </button>

          <p className="text-center text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
            Remember your credentials?{' '}
            <Link href="/auth/login" style={{ color: '#818cf8' }} className="hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
