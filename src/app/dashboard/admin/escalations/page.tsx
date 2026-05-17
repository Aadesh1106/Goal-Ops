import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Escalations | GoalOps Enterprise' };

export default async function EscalationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: escalations } = await supabase
    .from('escalations')
    .select('*, goals(title), profiles!escalations_employee_id_fkey(full_name, department, email)')
    .order('created_at', { ascending: false });

  const open = escalations?.filter(e => e.status === 'open' || e.status === 'acknowledged') ?? [];
  const resolved = escalations?.filter(e => e.status === 'resolved') ?? [];

  return (
    <div>
      <PageHeader
        title="Escalation Engine"
        subtitle="Manage SLA breaches and platform warnings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card className="p-4 bg-red-500/10 border-red-500/20 text-red-500">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <p className="font-bold text-2xl">{open.length}</p>
              <p className="text-xs uppercase tracking-wider font-semibold">Action Required</p>
            </div>
          </div>
        </Card>
      </div>

      {open.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Active Escalations
          </h2>
          <div className="flex flex-col gap-3">
            {open.map((e: any) => (
              <Link key={e.id} href={`/dashboard/admin/escalations/${e.id}`}>
                <Card className="p-4 hover:border-red-500/40 transition-all cursor-pointer" style={{ borderLeft: '3px solid #ef4444' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="pending" dot>{e.status}</Badge>
                      <span className="text-xs px-2 py-0.5 rounded font-bold uppercase"
                        style={{ background: 'var(--bg-elevated)', color: e.escalation_level === 'admin' ? '#ef4444' : '#f59e0b' }}>
                        Level: {e.escalation_level}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Deadline: {new Date(e.sla_deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{e.reason}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Entity: {e.profiles?.full_name} ({e.profiles?.department}) {e.goals && `— Goal: ${e.goals.title}`}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Resolved
          </h2>
          <div className="flex flex-col gap-3">
            {resolved.map((e: any) => (
              <Card key={e.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="approved">resolved</Badge>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{e.reason}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {e.profiles?.full_name} — Resolved on {new Date(e.resolved_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!escalations || escalations.length === 0) && (
        <Card className="py-16 text-center">
          <CheckCircle size={40} style={{ color: '#10b981' }} className="mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Zero Escalations</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            All SLAs are currently being met. Platform health is 100%.
          </p>
        </Card>
      )}
    </div>
  );
}
