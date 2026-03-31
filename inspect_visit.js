import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xfknataplfxupyefyiwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma25hdGFwbGZ4dXB5ZWZ5aXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgwNDksImV4cCI6MjA5MDM3NDA0OX0.ozeN1XvuTmwSDxJLcaPRZ1zxu_7qCuItTTXgzSxyzCw'
);

async function inspectData() {
  console.log('--- INSPECTING RELATIONSHIPS ---');
  
  const { data, error } = await supabase
    .from('opd_visits')
    .select('*, patients(*)')
    .eq('status', 'awaiting_admission')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data.length > 0) {
    const visit = data[0];
    console.log('Keys in visit:', Object.keys(visit));
    console.log('Patient object:', visit.patients);
    if (!visit.patients) {
      console.log('Checking for singular "patient" key...');
      const { data: singular } = await supabase
        .from('opd_visits')
        .select('*, patient(*)')
        .eq('status', 'awaiting_admission')
        .limit(1);
      console.log('Singular try result:', singular?.[0]?.patient ? 'Found singular' : 'Not found singular');
    }
  } else {
    console.log('No pending admissions found to inspect.');
  }
}

inspectData();
