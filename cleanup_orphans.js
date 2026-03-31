import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xfknataplfxupyefyiwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma25hdGFwbGZ4dXB5ZWZ5aXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgwNDksImV4cCI6MjA5MDM3NDA0OX0.ozeN1XvuTmwSDxJLcaPRZ1zxu_7qCuItTTXgzSxyzCw'
);

async function cleanupOrphans() {
  console.log('--- STARTING ORPHANED VISIT CLEANUP ---');
  
  // 1. Get all pending admissions
  const { data: visits } = await supabase
    .from('opd_visits')
    .select('id, patient_id')
    .eq('status', 'awaiting_admission');

  if (!visits || visits.length === 0) {
    console.log('No pending admissions found to clean.');
    return;
  }

  console.log(`Checking ${visits.length} records...`);
  const toDelete = [];

  for (const v of visits) {
    const { data: p } = await supabase.from('patients').select('id').eq('id', v.patient_id);
    if (!p || p.length === 0) {
      toDelete.push(v.id);
      console.log(`Marked for deletion: Visit ${v.id} (Patient ID: ${v.patient_id} NOT FOUND)`);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} orphaned records...`);
    const { error } = await supabase.from('opd_visits').delete().in('id', toDelete);
    if (error) console.error('Delete error:', error);
    else console.log('Cleanup successful!');
  } else {
    console.log('No orphans found among pending admissions.');
  }

  console.log('--- CLEANUP COMPLETE ---');
}

cleanupOrphans();
