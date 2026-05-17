import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Shield, Activity, Search } from 'lucide-react';

export const metadata = { title: 'Audit Logs | GoalOps Enterprise' };

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  let query = supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) {
    query = query.ilike('action', `%${q}%`); // simple search
  }

  const { data: logs } = await query;

  return (
    <div>
      <PageHeader
        title="Global Audit Logs"
        subtitle="Immutable record of all platform activity and state changes"
      />

      <Card className="p-0 overflow-hidden mb-6">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Shield size={16} style={{ color: '#818cf8' }} />
            System Activity Feed
          </div>
          
          {/* Simple search form using Server Components & native HTML form GET */}
          <form method="GET" action="/dashboard/admin/audit" className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" style={{ color: 'var(--text-muted)' }} />
            <input 
              name="q"
              type="text" 
              defaultValue={q}
              placeholder="Search actions..." 
              className="pl-9 pr-4 py-1.5 text-xs rounded-full outline-none w-48 transition-all focus:w-64"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap" style={{ fontSize: '12px' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                        hour12: true
                      })}
                    </td>
                    <td>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {log.profiles?.full_name ?? 'System Process'}
                      </div>
                      <div className="text-[10px]">{log.profiles?.email ?? 'sys@goalops.com'}</div>
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded text-[10px] font-mono font-bold"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="uppercase text-[10px] tracking-wider font-semibold">
                      {log.entity_type}
                    </td>
                    <td className="font-mono text-[10px]">
                      {log.ip_address ?? '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Activity size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No audit records found</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{q ? 'Try a different search term.' : 'System activity will appear here.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
