import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Fixing duty_station column and checking users...');
  
  // We can't run raw DDL via supabase-js unless using RPC, but we can query standard REST.
  // We will just verify if duty_station exists by selecting it.
  const { error } = await supabase.from('users').select('duty_station').limit(1);
  if (error && error.code === '42703') {
    console.error('CRITICAL: duty_station column is missing!');
    process.exit(1);
  } else if (error) {
    console.error('Other error:', error.message);
  } else {
    console.log('SUCCESS: duty_station column exists.');
  }

  // Check how many auth users vs public users we have
  const { data: users } = await supabase.from('users').select('id, email, first_name');
  console.log('Public Users:', users?.length);
}
run();
