import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  try {
    const { data, error } = await supabase.from('inventory_items').select('*').limit(1);
    if (error) {
      console.error('Error fetching inventory_items:', error);
    } else {
      console.log('Sample item keys:', Object.keys(data[0] || {}));
    }
  } catch (e) {
    console.error('Crash:', e);
  }
}

checkSchema();
