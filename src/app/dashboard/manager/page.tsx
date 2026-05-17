import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckSquare, Clock, Users, TrendingUp, Share2, Award } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Manager Dashboard | GoalOps Enterprise' };

async function pushSharedGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const thrustArea = formData.get('thrustArea') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const uomType = formData.get('uomType') as string;
  const targetValue = Number(formData.get('targetValue'));
  const weightage = Number(formData.get('weightage'));

  // 1. Create a "primary" goal owned by the manager
  const { data: primaryGoal, error: goalError } = await supabase.from('goals').insert({
    employee_id: user.id,
    thrust_area: thrustArea,
    title: `[Manager KPI] ${title}`,
    description,
    uom_type: uomType,
    target_value: targetValue,
    weightage,
    status: 'locked'
  }).select('id').single();

  if (goalError || !primaryGoal) {
    console.error('Goal Creation Error:', goalError);
    return;
  }

  // 2. Fetch all team members
  const { data: team } = await supabase.from('profiles').select('id').eq('manager_id', user.id);
  if (!team || team.length === 0) return;

  // 3. Link this goal to all team members
  for (const member of team) {
    const { data: empGoal } = await supabase.from('goals').insert({
      employee_id: member.id,
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
        shared_with_employee_id: member.id,
        contribution_weightage: weightage,
        status: 'active'
      });
    }
  }

  revalidatePath('/dashboard/manager');
}

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Team members
  const { data: team } = await supabase
    .from('profiles')
    .select('id, full_name, department, designation')
    .eq('manager_id', user.id);

  const teamIds = team?.map(t => t.id) ?? [];

  // Pending approvals
  const { data: pendingApprovals } = await supabase
    .from('approvals')
    .select('*, goals(title, weightage, thrust_area, employee_id), profiles!approvals_employee_id_fkey(full_name)')
    .eq('manager_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  // Team goals summary
  const { data: teamGoals } = await supabase
    .from('goals')
    .select('status')
    .in('employee_id', teamIds.length > 0 ? teamIds : ['00000000-0000-0000-0000-000000000000']);

  // Pending check-ins
  const { data: pendingCheckins } = await supabase
    .from('quarterly_checkins')
    .select('*, goals(title), profiles!quarterly_checkins_employee_id_fkey(full_name)')
    .in('employee_id', teamIds.length > 0 ? teamIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'submitted')
    .order('created_at', { ascending: false });

  const pending = pendingApprovals?.length ?? 0;
  const approved = teamGoals?.filter(g => g.status === 'approved' || g.status === 'locked').length ?? 0;
  const totalGoals = teamGoals?.length ?? 0;

  return (
    <div>
      <PageHeader title="Manager Dashboard" subtitle="Review team goals, approve submissions, and track progress" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending Approvals" value={pending} icon={<Clock size={16} style={{ color: '#f59e0b' }} />} />
        <KpiCard label="Team Members" value={team?.length ?? 0} icon={<Users size={16} style={{ color: '#818cf8' }} />} />
        <KpiCard label="Goals Approved" value={approved} icon={<CheckSquare size={16} style={{ color: '#10b981' }} />} />
        <KpiCard label="Total Team Goals" value={totalGoals} icon={<TrendingUp size={16} style={{ color: '#06b6d4' }} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            {pending > 0 && (
              <Link href="/dashboard/manager/approvals"
                className="text-xs px-3 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: '#818cf8' }}>
                View all →
              </Link>
            )}
          </CardHeader>
          {pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingApprovals.slice(0, 4).map((a: any) => (
                <Link key={a.id} href={`/dashboard/manager/approvals/${a.id}`}
                  className="flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
                  style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {a.goals?.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {a.profiles?.full_name} · {a.goals?.thrust_area}
                    </p>
                  </div>
                  <Badge variant="pending" dot>pending</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No pending approvals 🎉
            </p>
          )}
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
          {team && team.length > 0 ? (
            <div className="flex flex-col gap-3">
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--brand-gradient)' }}>
                    {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{member.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.designation} · {member.department}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No team members assigned yet
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* Push Departmental KPI (Shared Goals) */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 size={16} className="text-indigo-400" />
              Push Departmental KPI (Shared Goals)
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-secondary-muted" style={{ color: 'var(--text-muted)' }}>
              Establish a unified departmental KPI and push it to all employees in your team instantly. Employees will receive the goal as pre-approved and locked, with title and targets locked to read-only.
            </p>

            <form action={pushSharedGoal} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Thrust Area</label>
                  <select name="thrustArea" className="form-input text-xs py-2" required>
                    <option value="Operational Excellence">Operational Excellence</option>
                    <option value="Revenue Growth">Revenue Growth</option>
                    <option value="Innovation & Technology">Innovation & Technology</option>
                    <option value="Compliance & Risk">Compliance & Risk</option>
                  </select>
                </div>
                <div>
                  <label className="form-label text-xs">Unit of Measurement (UoM)</label>
                  <select name="uomType" className="form-input text-xs py-2" required>
                    <option value="percentage">Percentage (%)</option>
                    <option value="number">Numeric</option>
                    <option value="currency">Timeline (Days)</option>
                    <option value="boolean">Zero-based (0 = Success)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Goal Title</label>
                  <input name="title" type="text" className="form-input text-xs" placeholder="e.g. Complete quarterly safety audits" required />
                </div>
                <div>
                  <label className="form-label text-xs">Target Value</label>
                  <input name="targetValue" type="number" step="0.01" className="form-input text-xs" placeholder="e.g. 100" required />
                </div>
              </div>

              <div>
                <label className="form-label text-xs">Description</label>
                <textarea name="description" className="form-input text-xs" rows={2} placeholder="Explain the expected outcomes and operational significance..." required />
              </div>

              <div>
                <label className="form-label text-xs">Contribution Weightage per Employee (%)</label>
                <input name="weightage" type="number" min={10} max={50} className="form-input text-xs" defaultValue={15} required />
              </div>

              <button type="submit" className="btn-primary flex items-center justify-center gap-2 py-2 text-xs font-semibold"
                style={{ background: 'var(--brand-gradient)' }}>
                <Award size={14} /> Push KPI to Team Sheets
              </button>
            </form>
          </div>
        </Card>

        {/* Pending Check-ins */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Pending Check-ins</CardTitle>
            {pendingCheckins && pendingCheckins.length > 0 && (
              <Link href="/dashboard/manager/checkins"
                className="text-xs px-3 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: '#818cf8' }}>
                View all →
              </Link>
            )}
          </CardHeader>
          {pendingCheckins && pendingCheckins.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingCheckins.slice(0, 4).map((c: any) => (
                <Link key={c.id} href={`/dashboard/manager/checkins/${c.id}`}
                  className="flex flex-col py-2 hover:opacity-80 transition-opacity"
                  style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate max-w-[80%]" style={{ color: 'var(--text-primary)' }}>
                      {c.goals?.title}
                    </p>
                    <span className="text-xs font-bold" style={{ color: 'var(--brand-accent)' }}>{c.quarter}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    {c.profiles?.full_name} · {c.progress_percentage}% achieved
                  </p>
                  <div className="progress-bar h-1">
                    <div className="progress-fill h-1" style={{ width: `${c.progress_percentage}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No pending check-ins 🥳
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
