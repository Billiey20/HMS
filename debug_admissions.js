import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xfknataplfxupyefyiwa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma25hdGFwbGZ4dXB5ZWZ5aXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgwNDksImV4cCI6MjA5MDM3NDA0OX0.ozeN1XvuTmwSDxJLcaPRZ1zxu_7qCuItTTXgzSxyzCw'
);

async function checkPending() {
  console.log('--- START DATABASE DEBUG ---');
  
  const { data: allVisits, error: err1 } = await supabase
    .from('opd_visits')
    .select('id, status, visit_date')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('Recent 10 OPD Visits:');
  allVisits?.forEach(v => console.log(`[${v.visit_date}] ID: ${v.id}, Status: ${v.status}`));

  console.log('\nChecking for status="awaiting_admission"...');
  const { data, error } = await supabase
    .from('opd_visits')
    .select('id, status, presenting_complaint, patients(first_name, last_name)')
    .eq('status', 'awaiting_admission');

  if (error) {
    console.error('Error fetching pending:', error);
  } else {
    console.log('Found awaiting_admission:', data.length);
    data.forEach(v => {
      console.log(`- Patient: ${v.patients?.first_name} ${v.patients?.last_name}, Complaint: ${v.presenting_complaint}`);
    });
  }
  
  console.log('\nChecking for status="admitted"...');
  const { data: admitted } = await supabase
    .from('opd_visits')
    .select('id, status')
    .eq('status', 'admitted');
  console.log('Found admitted:', admitted?.length);

  console.log('--- END DATABASE DEBUG ---');
}

checkPending();
