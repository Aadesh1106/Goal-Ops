const { supabaseUrl, supabaseServiceKey } = require('./loadEnv');

async function run() {
  console.log('Fetching registered Auth users from Supabase Auth...');
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log('=== REGISTERED AUTH USERS ===');
  console.log(data.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })));
}

run();
