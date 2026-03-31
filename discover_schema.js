import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function discoverSchema() {
  console.log('--- Database Schema Discovery ---');
  
  // Tables to check based on current HMS context
  const tables = [
    'inventory_items',
    'inventory_transactions',
    'drug_catalog',
    'drug_stock',
    'patients',
    'opd_visits',
    'consultations',
    'vitals_records',
    'prescriptions',
    'prescription_items',
    'lab_orders',
    'lab_order_items',
    'bills',
    'bill_items',
    'admissions',
    'users'
  ];

  for (const table of tables) {
    try {
      // Fetching one row to see column names
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`[${table}]: Table does not exist.`);
        } else {
          console.error(`[${table}]: Error - ${error.message}`);
        }
        continue;
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      if (columns.length === 0) {
        // If table is empty, we try to use a dummy insert/rollback or a system query
        // But for efficiency, let's try to query the information_schema via RPC if available,
        // or just accept that we need to find at least one record.
        // Actually, Supabase REST API doesn't easily expose columns for empty tables without RPC.
        // Let's try a clever trick: select * with a filter that returns nothing but might show columns in some clients.
        // Or better, let's just assume we might need to check the backend code for migrations.
        console.log(`[${table}]: Table exists but is EMPTY. (Found 0 rows)`);
      } else {
        console.log(`[${table}]: ${columns.join(', ')}`);
      }
    } catch (e) {
      console.error(`[${table}]: Critical failure - ${e.message}`);
    }
  }
}

discoverSchema();
