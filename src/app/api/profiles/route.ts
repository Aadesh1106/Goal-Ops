import { NextResponse } from 'next/server';

const supabaseUrl = 'https://ocgecepbyplfdhuocqow.supabase.co';
const supabaseServiceKey = 'REMOVED_SECRET';

export async function GET() {
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
