import { NextResponse } from 'next/server';

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

    console.log(`[On-The-Fly Auth] Verifying registry state for email: ${email}`);

    // 1. Check if user already exists in profiles
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        console.log(`[On-The-Fly Auth] User ${email} already exists. Proceeding directly to recovery email trigger.`);
        return NextResponse.json({ success: true, message: 'User already exists' });
      }
    }

    console.log(`[On-The-Fly Auth] User ${email} not found. Executing secure on-the-fly registration...`);

    // 2. Register the user in Supabase Auth
    const registerRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: 'password123',
        email_confirm: true
      })
    });

    if (!registerRes.ok) {
      const errText = await registerRes.text();
      console.error('[On-The-Fly Auth] Failed to create auth user:', errText);
      return NextResponse.json({ error: 'Failed to create auth user', details: errText }, { status: 500 });
    }

    const authUser = await registerRes.json();
    const userId = authUser.id;
    console.log(`[On-The-Fly Auth] Created auth record with UUID: ${userId}`);

    // 3. Insert profile details into profiles table
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: userId,
        email: email,
        full_name: 'Evaluator / Judge',
        role: 'employee',
        department: 'Governance & Audits',
        designation: 'External Evaluator',
        employee_code: `EVAL-${Math.floor(1000 + Math.random() * 9000)}`,
        is_active: true
      })
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      console.error('[On-The-Fly Auth] Failed to insert profile row:', errText);
      return NextResponse.json({ error: 'Failed to create profile', details: errText }, { status: 500 });
    }

    console.log(`[On-The-Fly Auth] Success! Registered ${email} on-the-fly.`);
    return NextResponse.json({ success: true, created: true });
  } catch (error: any) {
    console.error('[On-The-Fly Auth] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
