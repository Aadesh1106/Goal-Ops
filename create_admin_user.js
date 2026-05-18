const { supabaseUrl, supabaseServiceKey } = require('./loadEnv');

async function run() {
  const email = 'admin@hpcl.com';
  const password = 'password123';
  
  console.log(`Creating Admin user in Supabase Auth: ${email}...`);
  
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password,
      email_confirm: true
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    if (errorText.includes('already exists') || errorText.includes('Email already in use')) {
      console.log('Admin Auth user already exists. We will try to upsert the profile.');
    } else {
      console.error('Failed to create Auth user:', res.status, errorText);
      return;
    }
  }
  
  let userId;
  if (res.ok) {
    const authUser = await res.json();
    userId = authUser.id;
    console.log(`Successfully created Auth user with ID: ${userId}`);
  } else {
    // If user already exists, fetch the user ID
    const listRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${email}&select=id`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    if (listRes.ok) {
      const data = await listRes.json();
      if (data && data[0]) {
        userId = data[0].id;
      }
    }
  }

  if (!userId) {
    console.error('Could not determine Admin User ID');
    return;
  }
  
  console.log('Inserting corresponding profile in database profiles table...');
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: userId,
      email: email,
      full_name: 'Boss Admin (HR)',
      role: 'admin',
      department: 'Governance & Audits',
      designation: 'Chief Governance Officer',
      employee_code: 'EMP-ADMIN-01',
      is_active: true
    })
  });
  
  if (!profileRes.ok) {
    const errText = await profileRes.text();
    if (errText.includes('already exists') || errText.includes('duplicate key')) {
      console.log('Profile record already exists.');
    } else {
      console.error('Failed to create profile record:', profileRes.status, errText);
      return;
    }
  }
  
  console.log('=== SUCCESS ===');
  console.log(`Admin user ${email} is now fully registered in your database!`);
  console.log(`You can now log in with ${email} / password123!`);
}

run();
