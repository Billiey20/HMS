import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('sha_claims_batches').select('id').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Table exists. Rows found:', data?.length ?? 0);
  }
}

check();
