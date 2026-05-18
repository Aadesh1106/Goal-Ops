import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: checkins } = await supabase
    .from('quarterly_checkins')
    .select('*, goals(title, target_value, uom_type), profiles(full_name, department, employee_code)')
    .order('created_at', { ascending: false });

  if (!checkins || checkins.length === 0) {
    return new NextResponse('No check-in records found', { status: 404 });
  }

  // Construct CSV string
  const headers = ['Employee Name', 'Employee Code', 'Department', 'Goal Title', 'Quarter', 'UoM', 'Planned Target', 'Actual Achievement', 'Progress %', 'Progress Status'];
  const rows = checkins.map((c: any) => [
    c.profiles?.full_name ?? '',
    c.profiles?.employee_code ?? '',
    c.profiles?.department ?? '',
    c.goals?.title ?? '',
    c.quarter ?? '',
    c.goals?.uom_type ?? '',
    c.planned_value ?? 0,
    c.actual_value ?? 0,
    c.progress_percentage ?? 0,
    c.progress_status ?? 'Not Started',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="GoalOps_Achievement_Report.csv"',
    },
  });
}
