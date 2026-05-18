import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ClipboardList, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Review Check-ins | GoalOps Enterprise' };

export default async function ManagerCheckinsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: team } = await supabase.from('profiles').select('id').eq('role', 'employee');
  const teamIds = team?.map(t => t.id) ?? [];

  const { data: checkins } = await supabase
    .from('quarterly_checkins')
    .select('*, goals(title, uom_type), profiles!quarterly_checkins_employee_id_fkey(full_name)')
    .in('employee_id', teamIds.length > 0 ? teamIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false });

  const pending = checkins?.filter(c => c.status === 'submitted') ?? [];
  const reviewed = checkins?.filter(c => c.status === 'reviewed') ?? [];

  return (
    <div>
      <PageHeader
        title="Team Check-ins"
        subtitle={`${pending.length} pending review · ${reviewed.length} reviewed`}
      />

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Pending Review
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((c: any) => (
              <Link key={c.id} href={`/dashboard/manager/checkins/${c.id}`}>
                <Card className="p-4 hover:border-indigo-500/40 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="submitted" dot>submitted</Badge>
                      <span className="text-xs font-bold" style={{ color: 'var(--brand-accent)' }}>{c.quarter}</span>
                    </div>
                    <Clock size={16} style={{ color: '#f59e0b' }} />
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{c.goals?.title}</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    {c.profiles?.full_name} · {c.progress_percentage}% achieved
                  </p>
                  <div className="progress-bar h-1">
                    <div className="progress-fill h-1" style={{ width: `${c.progress_percentage}%` }} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Reviewed
          </h2>
          <div className="flex flex-col gap-3">
            {reviewed.map((c: any) => (
              <Card key={c.id} className="p-4 opacity-70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="approved" dot>reviewed</Badge>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{c.quarter}</span>
                  </div>
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{c.goals?.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {c.profiles?.full_name} · {c.progress_percentage}% achieved
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!checkins || checkins.length === 0) && (
        <Card className="py-16 text-center">
          <ClipboardList size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No team check-ins</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            When your team submits quarterly progress, it will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}
