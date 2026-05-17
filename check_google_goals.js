const { supabaseUrl, supabaseServiceKey } = require('./loadEnv');

async function run() {
  const googleId = 'ed5ead0b-0d8f-4443-82fb-e67871c7735b';
  
  console.log("Fetching google's goals...");
  const res = await fetch(`${supabaseUrl}/rest/v1/goals?employee_id=eq.${googleId}`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
    return;
  }
  
  const goals = await res.json();
  console.log('=== GOOGLE GOALS ===');
  console.log(goals.map(g => ({ id: g.id, title: g.title, status: g.status })));
}

run();
