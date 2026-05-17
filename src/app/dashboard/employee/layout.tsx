import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { EMPLOYEE_NAV } from '@/lib/constants';
import type { UserProfile } from '@/types';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.role !== 'employee') redirect(`/dashboard/${profile.role}`);

  return (
    <DashboardShell
      sidebar={<Sidebar navItems={EMPLOYEE_NAV} profile={profile as UserProfile} />}
    >
      {children}
    </DashboardShell>
  );
}
