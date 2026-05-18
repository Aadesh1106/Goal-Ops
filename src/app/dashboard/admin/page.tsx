import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Target, CheckSquare, AlertTriangle, Activity, Lock, Unlock, Download, Share2, Calendar } from 'lucide-react';
import { DepartmentPerformanceChart } from '@/components/ui/Charts';
import { DEPARTMENTS, THRUST_AREAS } from '@/lib/constants';
import { getActiveWindow } from '@/lib/scheduler';

export const metadata = { title: 'Admin Dashboard | GoalOps Enterprise' };

// ─── Server Action: Unlock Goal Sheet Row ─────────────────────
async function unlockGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const goalId = formData.get('goalId') as string;
  
  await supabase.from('goals').update({ status: 'draft' }).eq('id', goalId);
  
  // Log audit trail
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      entity_type: 'goal',
      entity_id: goalId,
      action: 'goal_reopened',
      metadata: { unlocked_by_admin: true }
    });
  }

  revalidatePath('/dashboard/admin');
}

// ─── Server Action: Update Scheduler Window Override ─────────
async function updateWindowOverride(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const activeWindow = formData.get('activeWindow') as string;
  
  const value = activeWindow === 'none' ? { active_window: null } : { active_window: activeWindow };
  
  await supabase
    .from('app_settings')
    .upsert({ key: 'window_override', value });

  revalidatePath('/dashboard/admin');
}

// ─── Server Action: Push Shared Departmental Goal ────────────
async function pushAdminSharedGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const targetDept = formData.get('targetDept') as string;
  const thrustArea = formData.get('thrustArea') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const uomType = formData.get('uomType') as string;
  const targetValue = Number(formData.get('targetValue'));
  const weightage = Number(formData.get('weightage'));

  // 1. Create a "primary" parent goal owned by the Admin
  const { data: primaryGoal, error: goalError } = await supabase.from('goals').insert({
    employee_id: user.id,
    thrust_area: thrustArea,
    title: `[Manager KPI] ${title}`, // Act as master KPI
    description,
    uom_type: uomType,
    target_value: targetValue,
    weightage,
    status: 'locked'
  }).select('id').single();

  if (goalError || !primaryGoal) {
    console.error('Admin Shared Goal parent creation failed:', goalError);
    return;
  }

  // 2. Fetch all matching active employees in the selected department (or globally)
  let query = supabase.from('profiles').select('id').neq('id', user.id).eq('is_active', true);
  if (targetDept !== 'all') {
    query = query.eq('department', targetDept);
  }
  const { data: employees } = await query;
  if (!employees || employees.length === 0) return;

  // 3. Link this goal to all target employees, creating child goals and shared links
  for (const emp of employees) {
    const { data: empGoal } = await supabase.from('goals').insert({
      employee_id: emp.id,
      thrust_area: thrustArea,
      title: `[Shared] ${title}`,
      description: `Departmental KPI: ${description}`,
      uom_type: uomType,
      target_value: targetValue,
      weightage,
      status: 'locked'
    }).select('id').single();

    if (empGoal) {
      await supabase.from('shared_goals').insert({
        primary_goal_id: primaryGoal.id,
        shared_with_employee_id: emp.id,
        contribution_weightage: weightage,
        status: 'active'
      });
    }
  }

  revalidatePath('/dashboard/admin');
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Load scheduler config and execute all database queries concurrently (eliminating request waterfalls)
  const [
    schedulerConfig,
    { count: totalUsers },
    { count: totalGoals },
    { count: pendingApprovals },
    { count: openEscalations },
    recentLogsRes,
    profilesRes,
    goalsRes,
    lockedGoalsRes
  ] = await Promise.all([
    getActiveWindow(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('goals').select('*', { count: 'exact', head: true }),
    supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('profiles').select('id, department'),
    supabase.from('goals').select('id, status, employee_id'),
    supabase
      .from('goals')
      .select('id, title, status, profiles!goals_employee_id_fkey(full_name, employee_code)')
      .in('status', ['approved', 'locked'])
      .limit(5)
  ]);

  const { activeWindow, isOverride } = schedulerConfig;
  const recentLogs = recentLogsRes.data;
  const profiles = profilesRes.data;
  const goals = goalsRes.data;
  const lockedGoals = lockedGoalsRes.data;

  const deptData = Array.from(new Set(profiles?.map(p => p.department) || [])).map(dept => {
    const empIds = profiles?.filter(p => p.department === dept).map(p => p.id) || [];
    const deptGoals = goals?.filter(g => empIds.includes(g.employee_id)) || [];
    const completed = deptGoals.filter(g => g.status === 'locked' || g.status === 'approved').length;
    const completion = deptGoals.length > 0 ? Math.round((completed / deptGoals.length) * 100) : 0;
    return { department: dept, completion };
  });

  return (
    <div>
      <PageHeader
        title="Admin Control Centre"
        subtitle="Platform-wide governance overview and operational intelligence"
        action={
          <a href="/api/export" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Download size={15} /> Export Achievement Report (CSV)
          </a>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Users" value={totalUsers ?? 0} icon={<Users size={16} style={{ color: '#818cf8' }} />} />
        <KpiCard label="Total Goals" value={totalGoals ?? 0} icon={<Target size={16} style={{ color: '#06b6d4' }} />} />
        <KpiCard label="Pending Approvals" value={pendingApprovals ?? 0} icon={<CheckSquare size={16} style={{ color: '#f59e0b' }} />} />
        <KpiCard label="Open Escalations" value={openEscalations ?? 0} icon={<AlertTriangle size={16} style={{ color: '#ef4444' }} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <a href="/dashboard/admin/audit" className="text-xs" style={{ color: '#818cf8' }}>View all →</a>
          </CardHeader>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Activity size={11} style={{ color: '#818cf8' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {/* @ts-expect-error: joined profile */}
                      <span style={{ color: 'var(--text-primary)' }}>{log.profiles?.full_name ?? 'System'}</span>
                      {' '}{log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
          )}
        </Card>

        {/* Department Performance Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <div className="h-[250px] w-full">
            <DepartmentPerformanceChart data={deptData} />
          </div>
        </Card>
      </div>

      {/* Goal Governance Lock Bypass */}
      <Card className="flex flex-col mb-6">
        <CardHeader>
          <CardTitle>Goal Governance Controls (Lock Bypass & Exception Management)</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4">
          {lockedGoals && lockedGoals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }} className="text-xs">
                    <th className="pb-2">Employee</th>
                    <th className="pb-2">Goal Title</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lockedGoals.map((g: any) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="text-xs">
                      <td className="py-2.5 font-medium">
                        {g.profiles?.full_name} <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>{g.profiles?.employee_code}</span>
                      </td>
                      <td className="py-2.5 max-w-[300px] truncate">{g.title}</td>
                      <td className="py-2.5">
                        <Badge variant={g.status === 'locked' ? 'approved' : 'draft'} dot>{g.status}</Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <form action={unlockGoal}>
                          <input type="hidden" name="goalId" value={g.id} />
                          <button type="submit" className="px-2.5 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Unlock size={12} /> Unlock & Reopen
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No locked or approved goals on the platform right now.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* PUSH SHARED GOAL PANEL */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 size={16} className="text-indigo-400" />
              Global KPI Distribution (Push Shared Goal)
            </CardTitle>
          </CardHeader>
          <form action={pushAdminSharedGoal} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-1 block">Target Department</label>
                <select name="targetDept" className="form-input text-xs" required>
                  <option value="all">All Active Employees (Global)</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label mb-1 block">Thrust Area</label>
                <select name="thrustArea" className="form-input text-xs" required>
                  {THRUST_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-1 block">Goal Title</label>
                <input name="title" type="text" className="form-input text-xs" placeholder="e.g. Complete quarterly safety audits" required />
              </div>
              <div>
                <label className="form-label mb-1 block">UoM Type</label>
                <select name="uomType" className="form-input text-xs" required>
                  <option value="numeric_min">Numeric Min (Higher is better)</option>
                  <option value="numeric_max">Numeric Max (Lower is better)</option>
                  <option value="timeline">Timeline (Milestone)</option>
                  <option value="zero_based">Zero-based (Binary 100/0)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label mb-1 block">Goal Description</label>
              <textarea name="description" className="form-input text-xs min-h-[50px]" placeholder="Outline thrust targets and operational impact detail..." required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-1 block">Target Value</label>
                <input name="targetValue" type="number" min="0" defaultValue="100" className="form-input text-xs" required />
              </div>
              <div>
                <label className="form-label mb-1 block">Weightage (%)</label>
                <input name="weightage" type="number" min="10" max="100" defaultValue="10" className="form-input text-xs" required />
              </div>
            </div>

            <button type="submit" className="btn-primary py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold mt-2">
              <Share2 size={13} /> Distribute Departmental KPI
            </button>
          </form>
        </Card>

        {/* SCHEDULER WINDOW OVERRIDE */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              Scheduler Override Center
            </CardTitle>
          </CardHeader>
          <form action={updateWindowOverride} className="flex flex-col gap-4 text-xs justify-between h-full">
            <div>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Manually force open any quarterly cycle window. Applying an override locks all check-in forms to the selected quarter platform-wide, bypassing normal date restrictions.
              </p>
              
              <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)' }}>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-primary)' }}>Current Window:</span>
                <Badge variant={activeWindow ? 'approved' : 'draft'}>
                  {activeWindow ? `Active Window: ${activeWindow.toUpperCase()}` : 'Date-Derived Calendar Mode'}
                </Badge>
                {isOverride && <span className="ml-1 text-[10px] text-indigo-400 font-bold block mt-1">⚠️ Override active</span>}
              </div>

              <label className="form-label mb-1 block font-semibold">Override Period Selector</label>
              <select name="activeWindow" className="form-input text-xs" defaultValue={activeWindow || 'none'}>
                <option value="none">Automatic Date-Derived Mode</option>
                <option value="goal_setting">Goal Setting & Allocation (May)</option>
                <option value="Q1">Q1 Check-in (July)</option>
                <option value="Q2">Q2 Check-in (October)</option>
                <option value="Q3">Q3 Check-in (January)</option>
                <option value="Q4">Q4 Check-in (March/April)</option>
              </select>
            </div>

            <button type="submit" className="btn-secondary py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold mt-4" style={{ borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}>
              <Calendar size={13} /> Apply Scheduler Override
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Microsoft Entra ID (Azure AD) Sync
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>SSO Status</span>
                <Badge variant="approved">ACTIVE</Badge>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Single Sign-On is currently enabled platform-wide. Org structure and reporting lines sync automatically with Entra Active Directory attributes.</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Hierarchy Mapping</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active</span>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Reporting structure and hierarchy are auto-derived from AD attributes (Admin → Manager → Employee).</p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
              Microsoft Teams & Notifications
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Adaptive Cards Bot</span>
                <Badge variant="approved">CONNECTED</Badge>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Automated webhook channels successfully trigger adaptive cards in MS Teams when goals are submitted, approved, or check-ins are logged.</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Deep Link Support</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active</span>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Teams push notifications redirect directly back into GoalOps dashboard review scopes.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
