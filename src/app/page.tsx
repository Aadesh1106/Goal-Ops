import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e5ecf6 0%, #f0f4fa 100%)' }}>
      
      {/* Soft Elegant Floating Gradient Orbs in background */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-80 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 relative z-10" style={{ borderBottom: '1px solid #d5dfeb' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)' }}>
            G
          </div>
          <span className="font-bold text-base text-slate-900">
            {APP_NAME}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="btn-secondary text-sm px-4 py-2"
            style={{ color: '#475569', borderColor: '#cbd5e1' }}>
            Sign In
          </Link>
          <Link href="/auth/register"
            className="btn-primary text-sm px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative z-10">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
          Enterprise Goal Governance Platform
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight text-slate-900">
          Replace spreadsheets with{' '}
          <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>operational intelligence</span>
        </h1>

        <p className="text-lg max-w-2xl mb-10 text-slate-600" style={{ lineHeight: '1.75' }}>
          {APP_TAGLINE}. Empower employees, managers, and leadership with a unified
          goal governance workflow — from creation to quarterly tracking.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center mb-16">
          <Link href="/auth/register"
            className="btn-primary px-7 py-3 text-base"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)' }}>
            Start Free Trial
          </Link>
          <Link href="/auth/login"
            className="btn-secondary px-7 py-3 text-base"
            style={{ color: '#475569', borderColor: '#cbd5e1' }}>
            View Demo →
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t pt-8 w-full" style={{ borderColor: '#e2e8f0' }}>
          {[
            { value: '100%', label: 'Weightage Governance' },
            { value: 'Q1–Q4', label: 'Quarterly Tracking' },
            { value: '3 Roles', label: 'Enterprise Workflows' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-8 py-16 max-w-6xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: '🎯',
              title: 'Goal CRUD + Validation',
              desc: 'Max 8 goals per employee. Weightage must total 100%. Built-in live validation engine.',
            },
            {
              icon: '✅',
              title: 'Manager Approval Workflow',
              desc: 'Submit → Review → Approve/Reject → Lock. Full audit trail on every decision.',
            },
            {
              icon: '📊',
              title: 'Quarterly Check-ins',
              desc: 'Q1–Q4 progress tracking with planned vs actual metrics and completion heatmaps.',
            },
            {
              icon: '🔔',
              title: 'Escalation Intelligence',
              desc: 'Auto-escalate stale goals, missed check-ins, and overdue approvals.',
            },
            {
              icon: '📋',
              title: 'Audit Logs',
              desc: 'Before/after state tracking for every goal action. Enterprise compliance ready.',
            },
            {
              icon: '📈',
              title: 'Executive Analytics',
              desc: 'Department-level KPIs, quarterly trends, and manager effectiveness dashboards.',
            },
          ].map((f) => (
            <div key={f.title} className="card transition-all hover:-translate-y-1 hover:border-indigo-500/30 bg-white border border-slate-200/80 shadow-md">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5 text-sm text-slate-800">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs relative z-10" style={{ color: 'var(--text-muted)', borderTop: '1px solid #e2e8f0' }}>
        © 2026 GoalOps Enterprise · Built for Performance Excellence · Powered by Next.js + Supabase
      </footer>
    </main>
  );
}
