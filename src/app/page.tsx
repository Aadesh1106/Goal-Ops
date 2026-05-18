'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Target, Users, Shield, AlertTriangle } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'employee' | 'manager' | 'admin'>('employee');

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#090b11' }}>
      
      {/* Animated Floating Glow Orbs in background */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-80 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 relative z-10" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--brand-gradient)' }}>
            G
          </div>
          <span className="font-bold text-base text-white">
            {APP_NAME}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="btn-secondary text-sm px-4 py-2"
            style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' }}>
            Sign In
          </Link>
          <Link href="/auth/register"
            className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Enterprise Goal Governance Platform
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight text-white">
          Replace spreadsheets with{' '}
          <span className="gradient-text">operational intelligence</span>
        </h1>

        <p className="text-lg max-w-2xl mb-10 text-slate-300" style={{ lineHeight: '1.75' }}>
          {APP_TAGLINE}. Empower employees, managers, and leadership with a unified
          goal governance workflow — from creation to quarterly tracking.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center mb-16">
          <Link href="/auth/register"
            className="btn-primary px-7 py-3 text-base">
            Start Free Trial
          </Link>
          <Link href="/auth/login"
            className="btn-secondary px-7 py-3 text-base"
            style={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' }}>
            View Demo →
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t pt-8 w-full" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {[
            { value: '100%', label: 'Weightage Governance' },
            { value: 'Q1–Q4', label: 'Quarterly Tracking' },
            { value: '3 Roles', label: 'Enterprise Workflows' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Platform Preview Console */}
      <section className="px-8 py-12 max-w-5xl mx-auto w-full relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3 text-white">
            Experience the <span className="gradient-text">GoalOps Ecosystem</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Toggle between our integrated enterprise personas to preview the platform interface and operational rules in action.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center gap-2 p-1.5 rounded-xl max-w-md mx-auto mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { id: 'employee', label: 'Employee Hub', icon: Target },
            { id: 'manager', label: 'Manager Desk', icon: Users },
            { id: 'admin', label: 'Governance Console', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Mock Container */}
        <div className="rounded-2xl border p-6 md:p-8 shadow-2xl relative overflow-hidden animated-pulse-glow" style={{ background: 'rgba(10,15,26,0.85)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          {activeTab === 'employee' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400">Persona View: Arjun Engineer</span>
                  <h3 className="text-base font-bold text-white mt-0.5">My Goalboard</h3>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">100% Compliant</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">FY 2026</span>
                </div>
              </div>

              {/* Goals list */}
              <div className="flex flex-col gap-3.5 mb-6">
                {[
                  { title: 'Optimize Trombay pipeline flow rate constraints', weight: 40, status: 'Approved' },
                  { title: 'Deploy AI-driven leakage alert telemetry triggers', weight: 35, status: 'Approved' },
                  { title: 'Reduce overall maintenance downtime by 12%', weight: 25, status: 'Draft' }
                ].map((g, idx) => (
                  <div key={idx} className="p-4 rounded-xl flex items-center justify-between border hover:bg-white/5 transition-colors" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-xs font-semibold text-white truncate">{g.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Weightage: {g.weight}%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${g.weight}%` }}></div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${g.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {g.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span>🔒 Securely locked for review</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Q2 Check-in Met</span>
              </div>
            </div>
          )}

          {activeTab === 'manager' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400">Persona View: Sarah Manager</span>
                  <h3 className="text-base font-bold text-white mt-0.5">L1 Approval Panel</h3>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">1 Pending Action</span>
              </div>

              {/* Pending list */}
              <div className="p-4 rounded-xl border mb-6" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Arjun Engineer (Trombay HQ)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Submitted Q2 Quarterly check-in for review</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Pending Approval</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border mb-4 animate-pulse" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[10px] italic text-slate-300">"Trombay pumping simulation pipelines finalized. Checked flow rates; Q2 milestones achieved."</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => alert('Demo Action: Goal set approved successfully!')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Approve Progress
                  </button>
                  <button 
                    onClick={() => alert('Demo Action: Revision requested!')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Request Revision
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span>⚡ Global Manager Access enabled</span>
                <span>Audit trail compiled for compliance</span>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">Persona View: Boss Admin</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Governance Command Center</h3>
                </div>
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">Exception Pending</span>
              </div>

              {/* Exception alerts */}
              <div className="p-4 rounded-xl border mb-6" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className="p-1 rounded bg-amber-500/10 text-amber-400"><AlertTriangle size={14} /></span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Stale Goal Weightage Exception</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Arjun Engineer's goal weightage totals 85% (Required: 100%)</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full font-bold">Auto-Escalated</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                  System detected a non-compliant goal total. The state has been locked, and notification triggers have escalated to the department supervisor.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => alert('Demo Action: Dispatched urgent alert to Sarah Manager!')}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Trigger Exception Alert
                  </button>
                  <button 
                    onClick={() => alert('Demo Action: Audit logs compiled!')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Export Compliance Audit Log
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span>🔒 Immutable transaction ledger active</span>
                <span>ISO-27001 compliant state logs</span>
              </div>
            </div>
          )}
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
            <div key={f.title} className="card transition-all hover:-translate-y-1 hover:border-indigo-500/30">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5 text-sm text-white">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs relative z-10" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)' }}>
        © 2026 GoalOps Enterprise · Built for Performance Excellence · Powered by Next.js + Supabase
      </footer>
    </main>
  );
}
