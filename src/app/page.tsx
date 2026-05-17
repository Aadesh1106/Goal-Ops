import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--brand-gradient)' }}>
            G
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {APP_NAME}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="btn-secondary text-sm px-4 py-2">
            Sign In
          </Link>
          <Link href="/auth/register"
            className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Enterprise Goal Governance Platform
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight"
          style={{ color: 'var(--text-primary)' }}>
          Replace spreadsheets with{' '}
          <span className="gradient-text">operational intelligence</span>
        </h1>

        <p className="text-lg max-w-2xl mb-10" style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}>
          {APP_TAGLINE}. Empower employees, managers, and leadership with a unified
          goal governance workflow — from creation to quarterly tracking.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/auth/register"
            className="btn-primary px-7 py-3 text-base">
            Start Free Trial
          </Link>
          <Link href="/auth/login"
            className="btn-secondary px-7 py-3 text-base">
            View Demo →
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
          {[
            { value: '100%', label: 'Weightage Governance' },
            { value: 'Q1–Q4', label: 'Quarterly Tracking' },
            { value: '3 Roles', label: 'Enterprise Workflows' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-8 py-16 max-w-6xl mx-auto w-full">
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
            <div key={f.title} className="card">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)' }}>
        © 2025 GoalOps Enterprise · Hackathon Build · Built with Next.js + Supabase
      </footer>
    </main>
  );
}
