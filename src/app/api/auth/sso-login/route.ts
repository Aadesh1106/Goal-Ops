import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase URL or Service Key is not configured' }, { status: 500 });
  }
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`[SSO Claims Simulation] Generating magic link for email: ${email}`);

    // Generate login link and OTP using admin API
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: email
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[SSO Claims Simulation] Failed to generate login link:', errText);
      return NextResponse.json({ error: 'SSO login link generation failed', details: errText }, { status: 500 });
    }

    const data = await res.json();
    const emailOtp = data.email_otp;

    if (!emailOtp) {
      console.error('[SSO Claims Simulation] Response missing OTP:', data);
      return NextResponse.json({ error: 'Response missing OTP' }, { status: 500 });
    }

    console.log(`[SSO Claims Simulation] OTP generated. Exchanging on server side...`);

    // Verify OTP on the server side using createClient to set auth cookies directly in browser response
    const supabase = await createClient();
    
    let { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: 'magiclink'
    });

    if (verifyErr) {
      console.warn('[SSO Claims Simulation] verifyOtp with magiclink failed, trying email type...', verifyErr.message);
      const retry = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: 'email'
      });
      verifyErr = retry.error;
    }

    if (verifyErr) {
      console.error('[SSO Claims Simulation] Failed to exchange OTP:', verifyErr);
      return NextResponse.json({ error: 'Failed to authenticate dynamic session', details: verifyErr.message }, { status: 401 });
    }

    console.log(`[SSO Claims Simulation] OTP exchange succeeded! Session cookies set in browser.`);
    
    // Fetch profile role to redirect the client side properly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', email)
      .single();

    const role = profile?.role ?? 'employee';

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error('[SSO Claims Simulation] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
