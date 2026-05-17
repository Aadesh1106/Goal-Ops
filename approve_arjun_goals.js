const supabaseUrl = 'https://ocgecepbyplfdhuocqow.supabase.co';
const supabaseServiceKey = 'REMOVED_SECRET';

async function run() {
  const arjunId = '2ae34683-3bb6-4f89-9606-c891b453334a';
  const managerId = '87eb4807-0bcc-4560-9840-1d23269f74cb';
  
  console.log("Fetching Arjun's goals to verify status...");
  const getRes = await fetch(`${supabaseUrl}/rest/v1/goals?employee_id=eq.${arjunId}`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  
  if (!getRes.ok) {
    console.error('Failed to fetch goals:', getRes.status, await getRes.text());
    return;
  }
  
  const goals = await getRes.json();
  console.log(`Found ${goals.length} goals for Arjun.`);
  console.log('Current statuses:', goals.map(g => ({ id: g.id, title: g.title, status: g.status })));
  
  console.log("Updating all of Arjun's goals to 'approved' status programmatically...");
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/goals?employee_id=eq.${arjunId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: 'approved',
      approved_by: managerId,
      approved_at: new Date().toISOString()
    })
  });
  
  if (!patchRes.ok) {
    console.error('Failed to patch goals:', patchRes.status, await patchRes.text());
    return;
  }
  
  console.log('=== SUCCESS ===');
  console.log("All of Arjun's goals have been successfully updated to 'approved'!");
  console.log("Arjun can now instantly log check-ins! Refresh the dashboard page now!");
}

run();
