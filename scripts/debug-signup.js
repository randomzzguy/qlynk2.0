const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMinimalInsert() {
  console.log('--- Testing Minimal Inserts ---');
  
  const testId = '00000000-0000-0000-0000-000000000000';
  
  console.log('Testing Subscriptions (Minimal)...');
  const { error: sError } = await supabase
    .from('subscriptions')
    .insert({ user_id: testId });

  if (sError) console.error('  Error:', sError.message);
  else console.log('  OK');

  console.log('Testing Profiles (Minimal)...');
  const { error: pError } = await supabase
    .from('profiles')
    .insert({ id: testId });

  if (pError) console.error('  Error:', pError.message);
  else console.log('  OK');
}

testMinimalInsert();
