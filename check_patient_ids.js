import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xfknataplfxupyefyiwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma25hdGFwbGZ4dXB5ZWZ5aXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgwNDksImV4cCI6MjA5MDM3NDA0OX0.ozeN1XvuTmwSDxJLcaPRZ1zxu_7qCuItTTXgzSxyzCw'
);

async function checkIds() {
  console.log('--- CHECKING PATIENT IDS ---');
  
  const { data: visits } = await supabase
    .from('opd_visits')
    .select('patient_id, status')
    .eq('status', 'awaiting_admission')
    .limit(3);

  for (const v of (visits || [])) {
    const { data: p, error } = await supabase.from('patients').select('id').eq('id', v.patient_id).single();
    console.log(`Visit Patient ID: ${v.patient_id} -> Found in patients table: ${p ? 'YES' : 'NO'}`);
  }
}

checkIds();
