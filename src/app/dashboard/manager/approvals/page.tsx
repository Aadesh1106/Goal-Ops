import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Approvals | GoalOps Enterprise' };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: approvals } = await supabase
    .from('approvals')
    .select('*, goals(title, weightage, thrust_area, description), profiles!approvals_employee_id_fkey(full_name, department)')
    .order('created_at', { ascending: false });

  const pending = approvals?.filter(a => a.status === 'pending') ?? [];
  const acted = approvals?.filter(a => a.status !== 'pending') ?? [];

  return (
    <div>
      <PageHeader
        title="Goal Approvals"
        subtitle={`${pending.length} pending · ${acted.length} reviewed`}
      />

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Pending Review ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((a: any) => (
              <Link key={a.id} href={`/dashboard/manager/approvals/${a.id}`}>
                <Card className="p-4 hover:border-indigo-500/40 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          {a.goals?.thrust_area}
                        </span>
                        <Badge variant="pending" dot>pending</Badge>
                      </div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        {a.goals?.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {a.profiles?.full_name} · {a.profiles?.department} · {a.goals?.weightage}% weightage
                      </p>
                    </div>
                    <Clock size={16} style={{ color: '#f59e0b' }} className="shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {acted.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Reviewed ({acted.length})
          </h2>
          <div className="flex flex-col gap-3">
            {acted.map((a: any) => (
              <Card key={a.id} className="p-4 opacity-70">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={a.status as any} dot>{a.status}</Badge>
                    </div>
                    <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {a.goals?.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.profiles?.full_name} · {a.goals?.weightage}% weightage
                    </p>
                    {a.comment && (
                      <p className="text-xs mt-1 italic" style={{ color: 'var(--text-secondary)' }}>
                        "{a.comment}"
                      </p>
                    )}
                  </div>
                  {a.status === 'approved'
                    ? <CheckCircle size={16} style={{ color: '#10b981' }} />
                    : <XCircle size={16} style={{ color: '#ef4444' }} />
                  }
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!approvals || approvals.length === 0) && (
        <Card className="py-16 text-center">
          <CheckCircle size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No approvals yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Approvals will appear here when your team submits goals.
          </p>
        </Card>
      )}
    </div>
  );
}
