import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://ocgecepbyplfdhuocqow.supabase.co';
const supabaseServiceKey = 'REMOVED_SECRET';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`[SSO Claims Simulation] Generating magic link for email: ${email}`);

    // Generate login link using admin API
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${new URL(request.url).origin}/auth/callback`
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[SSO Claims Simulation] Failed to generate login link:', errText);
      return NextResponse.json({ error: 'SSO login link generation failed', details: errText }, { status: 500 });
    }

    const data = await res.json();
    const actionLink = data.properties?.action_link;

    if (!actionLink) {
      console.error('[SSO Claims Simulation] Response missing action link:', data);
      return NextResponse.json({ error: 'Response missing action link' }, { status: 500 });
    }

    console.log(`[SSO Claims Simulation] Link generated successfully!`);
    return NextResponse.json({ success: true, actionLink });
  } catch (error: any) {
    console.error('[SSO Claims Simulation] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
