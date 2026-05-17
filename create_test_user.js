const { supabaseUrl, supabaseServiceKey } = require('./loadEnv');

async function run() {
  const email = 'aadeshn45@gmail.com';
  const password = 'password123';
  
  console.log(`Creating user in Supabase Auth: ${email}...`);
  
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
    console.error('Failed to create Auth user:', res.status, await res.text());
    return;
  }
  
  const authUser = await res.json();
  const userId = authUser.id;
  console.log(`Successfully created Auth user with ID: ${userId}`);
  
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
      full_name: 'N Aadesh',
      role: 'employee',
      department: 'Technology',
      designation: 'Associate Software Engineer',
      employee_code: 'EMP-AADESH-45',
      is_active: true
    })
  });
  
  if (!profileRes.ok) {
    console.error('Failed to create profile record:', profileRes.status, await profileRes.text());
    return;
  }
  
  console.log('=== SUCCESS ===');
  console.log(`Test user ${email} is now fully registered in your database!`);
  console.log(`You can now log in with ${email} / password123, OR run the Forgot Password flow on this email!`);
}

run();
