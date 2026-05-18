export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#090b11' }}>
      {/* Left panel: Dark dashboard teaser */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 text-white relative overflow-hidden" style={{ background: '#07090e', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }} />
        
        {/* Top Info */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: 'var(--brand-gradient)' }}>
              G
            </div>
            <div>
              <div className="font-bold text-sm leading-none">GoalOps</div>
              <div className="text-[10px] mt-0.5 text-slate-400">Enterprise Edition</div>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>GoalOps</h1>
          <p className="text-lg font-semibold text-indigo-400 mb-6">Enterprise Performance Governance</p>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed">
            Unified goal management, compliance tracking, manager approvals, quarterly reviews, and escalation workflows.
          </p>
        </div>

        {/* Mock Dashboard Preview exactly like screenshot 1 with Innovative Telemetry Console */}
        <div className="relative z-10 my-8 max-w-md rounded-2xl border p-5 shadow-2xl animated-pulse-glow" style={{ background: 'rgba(10,15,26,0.85)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
              <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-bold">SYSTEM TELEMETRY LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl transition-transform hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Compliance</span>
              <div className="text-xl font-bold text-white mt-1">94%</div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div className="p-3 rounded-xl transition-transform hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Approvals</span>
              <div className="text-xl font-bold text-white mt-1">8/11</div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '73%' }}></div>
              </div>
            </div>
            <div className="p-3 rounded-xl transition-transform hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Escalations</span>
              <div className="text-xl font-bold text-white mt-1">3</div>
              <span className="inline-block mt-2 text-[8px] font-semibold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Pending Review</span>
            </div>
          </div>

          <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Performance Trend</span>
              <span className="text-[9px] text-emerald-400 font-bold">82% (+6pp)</span>
            </div>
            <div className="h-16 flex items-end gap-1.5 pt-2">
              {[30, 45, 35, 60, 50, 75, 82].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500/40 to-indigo-500 rounded-t" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          {/* Real-time Ticker console */}
          <div className="p-3 rounded-xl border" style={{ background: 'rgba(5,7,12,0.85)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">Live Governance Stream</span>
              <span className="text-[8px] font-mono text-slate-500">active status logger</span>
            </div>
            <div className="h-6 overflow-hidden relative">
              <div className="audit-ticker text-[10px] font-mono leading-6">
                <span className="truncate text-emerald-400">⚡ [09:41] Arun updated Q2 Quarterly check-in (90% Met)</span>
                <span className="truncate text-indigo-400">👤 [10:15] Sarah Manager approved Varun's weightage adjustment</span>
                <span className="truncate text-red-400">🚨 [10:30] Auto-escalation triggered for stale goals (General Dept)</span>
                <span className="truncate text-blue-400">💼 [11:02] Departmental KPI pushed successfully to all employees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex gap-4 relative z-10 text-[10px] text-slate-400">
          <span>9 Employees</span>
          <span>·</span>
          <span>94% Compliant</span>
          <span>·</span>
          <span>3 Active Escalations</span>
        </div>
      </div>

      {/* Right panel: Light-mode clean login interface */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 dashboard-layout" style={{ background: '#f8fafc' }}>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
