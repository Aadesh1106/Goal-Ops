const supabaseUrl = 'https://ocgecepbyplfdhuocqow.supabase.co';
const supabaseServiceKey = 'REMOVED_SECRET';

const keepEmails = [
  'employee@hpcl.com',
  'manager@hpcl.com',
  'admin@hpcl.com',
  'google@google.com',
  'arun@hpcl.com',
  'varun@hpcl.com',
  'aravind@hpcl.com'
];

async function run() {
  console.log('Fetching registered Auth users from Supabase Auth...');
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch users:', res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  const users = data.users;
  console.log(`Found ${users.length} total users.`);

  for (const user of users) {
    const email = user.email.toLowerCase();
    if (!keepEmails.includes(email)) {
      console.log(`Deleting spam user: ${user.email} (${user.id})...`);
      
      // Delete from profiles table first to avoid FK constraints
      const deleteProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      if (deleteProfileRes.ok) {
        console.log(`Deleted profile for ${user.email}`);
      } else {
        console.warn(`Failed to delete profile for ${user.email}:`, deleteProfileRes.status, await deleteProfileRes.text());
      }

      // Delete from goals table to avoid FK constraints
      const deleteGoalsRes = await fetch(`${supabaseUrl}/rest/v1/goals?employee_id=eq.${user.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      if (deleteGoalsRes.ok) {
        console.log(`Deleted goals for ${user.email}`);
      }

      // Delete from auth.users
      const deleteAuthRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });

      if (deleteAuthRes.ok) {
        console.log(`Successfully deleted auth user: ${user.email}`);
      } else {
        console.error(`Failed to delete auth user ${user.email}:`, deleteAuthRes.status, await deleteAuthRes.text());
      }
    }
  }
  console.log('Database cleanup completed!');
}

run();
