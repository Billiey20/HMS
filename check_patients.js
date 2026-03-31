import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xfknataplfxupyefyiwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma25hdGFwbGZ4dXB5ZWZ5aXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgwNDksImV4cCI6MjA5MDM3NDA0OX0.ozeN1XvuTmwSDxJLcaPRZ1zxu_7qCuItTTXgzSxyzCw'
);

async function checkPatients() {
  const { data, error } = await supabase.from('patients').select('id, first_name, last_name').limit(5);
  console.log('Sample Patient IDs:');
  data?.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.first_name} ${p.last_name}`));
}

checkPatients();
