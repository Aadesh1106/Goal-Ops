import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase URL or Service Key is not configured' }, { status: 500 });
  }
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=full_name,email,role,designation,department&order=full_name.asc`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Failed to fetch profiles', details: err }, { status: 500 });
    }

    const profiles = await res.json();
    return NextResponse.json(profiles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
