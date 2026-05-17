import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Resolve Escalation | GoalOps Enterprise' };

async function resolveEscalation(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const escalationId = formData.get('escalationId') as string;
  const resolutionNotes = formData.get('resolutionNotes') as string;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('escalations').update({
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolved_by: user?.id,
    reason: `[RESOLVED] ${resolutionNotes}` // append to reason or handle via separate notes field if available
  }).eq('id', escalationId);

  revalidatePath('/dashboard/admin/escalations');
  redirect('/dashboard/admin/escalations');
}

export default async function EscalationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: escalation } = await supabase
    .from('escalations')
    .select('*, goals(title, status), profiles!escalations_employee_id_fkey(full_name, department, email)')
    .eq('id', id)
    .single();

  if (!escalation) redirect('/dashboard/admin/escalations');

  const profile = escalation.profiles as any;
  const goal = escalation.goals as any;

  return (
    <div>
      <PageHeader
        title="Escalation Details"
        subtitle="Review and resolve this SLA breach"
        action={
          <Link href="/dashboard/admin/escalations"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="max-w-2xl flex flex-col gap-4">
        <Card className="p-5" style={{ borderTop: escalation.status === 'resolved' ? '3px solid #10b981' : '3px solid #ef4444' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{escalation.reason}</h3>
              <div className="flex gap-2">
                <Badge variant={escalation.status === 'resolved' ? 'approved' : 'pending'}>{escalation.status}</Badge>
                <span className="text-xs px-2 py-0.5 rounded font-bold uppercase"
                  style={{ background: 'var(--bg-elevated)', color: escalation.escalation_level === 'admin' ? '#ef4444' : '#f59e0b' }}>
                  Level: {escalation.escalation_level}
                </span>
              </div>
            </div>
            {escalation.status !== 'resolved' && (
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 text-sm p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Triggered At</p>
              <p style={{ color: 'var(--text-primary)' }}>{new Date(escalation.triggered_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>SLA Deadline</p>
              <p style={{ color: 'var(--status-error)' }}>{new Date(escalation.sla_deadline).toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Affected Entities</h4>
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-lg border text-sm" style={{ borderColor: 'var(--bg-border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Employee: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{profile?.full_name}</strong> ({profile?.department})
                <br />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{profile?.email}</span>
              </div>
              {goal && (
                <div className="p-3 rounded-lg border text-sm" style={{ borderColor: 'var(--bg-border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Related Goal: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{goal.title}</strong>
                  <div className="mt-1">
                    <Badge variant="draft" dot>{goal.status}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {escalation.status === 'resolved' ? (
          <Card className="p-4 text-center">
            <CheckCircle size={30} style={{ color: '#10b981' }} className="mx-auto mb-2" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Escalation Resolved</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Resolved on {new Date(escalation.resolved_at).toLocaleString()}
            </p>
          </Card>
        ) : (
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Resolve Action</h4>
            <form action={resolveEscalation} className="flex flex-col gap-3">
              <input type="hidden" name="escalationId" value={escalation.id} />
              <textarea
                name="resolutionNotes"
                required
                className="form-input"
                rows={3}
                placeholder="Describe how this escalation was resolved (e.g. 'Manually unlocked cycle', 'Emailed manager')..."
              />
              <button type="submit"
                className="btn-primary flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 w-full"
                style={{ background: '#ef4444' }}>
                <CheckCircle size={15} /> Mark as Resolved
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
