const supabaseUrl = 'https://ocgecepbyplfdhuocqow.supabase.co';
const supabaseServiceKey = 'REMOVED_SECRET';

async function run() {
  const googleId = 'ed5ead0b-0d8f-4443-82fb-e67871c7735b';
  
  console.log("Fetching google's profile email...");
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${googleId}`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
    return;
  }
  
  const profiles = await res.json();
  console.log('=== GOOGLE PROFILE ===');
  console.log(profiles);
}

run();
