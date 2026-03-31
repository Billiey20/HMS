const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://xfknataplfxupyefyiwa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma25hdGFwbGZ4dXB5ZWZ5aXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgwNDksImV4cCI6MjA5MDM3NDA0OX0.ozeN1XvuTmwSDxJLcaPRZ1zxu_7qCuItTTXgzSxyzCw');

async function checkSchema() {
  console.log('--- 🧪 HMS DATABASE DIAGNOSTICS 🧪 ---');

  // 1. Check vitals_records
  console.log('\nChecking table: vitals_records...');
  const { data: v, error: ve } = await s.from('vitals_records').select('*').limit(1);
  if (ve) {
    console.error('❌ Vitals Select Error:', ve.message);
  } else {
    const cols = v[0] ? Object.keys(v[0]) : 'None (Empty Table)';
    console.log('✅ Vitals Columns:', cols);
  }

  // 2. Check prescriptions
  console.log('\nChecking table: prescriptions...');
  const { data: p, error: pe } = await s.from('prescriptions').select('*').limit(1);
  if (pe) {
    console.error('❌ Presc Select Error:', pe.message);
  } else {
    console.log('✅ Presc Columns:', Object.keys(p[0] || {}));
    if (p[0]) console.log('✅ Current Sample Status:', p[0].status);
  }

  // 3. Check prescription_items
  console.log('\nChecking table: prescription_items...');
  const { data: pi, error: pie } = await s.from('prescription_items').select('*').limit(1);
  if (pie) {
    console.error('❌ Items Select Error:', pie.message);
  } else {
    console.log('✅ Items Columns:', Object.keys(pi[0] || {}));
  }

  // 4. Test Join (most likely source of 400 error)
  console.log('\nTesting Relationship: prescription_items -> prescriptions...');
  const { error: je } = await s.from('prescription_items').select('*, prescriptions(*)').limit(1);
  if (je) {
    console.error('❌ Join Error:', je.message);
    console.log('💡 Trying alternative relationship name: prescriptions_fkey');
    const { error: je2 } = await s.from('prescription_items').select('*, prescriptions:prescription_id(*)').limit(1);
    if (!je2) console.log('✅ Found it! Use prescription_id as the alias.');
  } else {
    console.log('✅ Simple Join "prescriptions(*)" is VALID.');
  }

  // 5. Test Vitals POST (most likely source of 400 error)
  // We check if "pulse" or "pulse_rate" is used.
  console.log('\nScanning for vitals column names...');
  const tryInsert = async (payload) => s.from('vitals_records').insert([payload]);
  
  const test1 = await tryInsert({ patient_id: 'ba3978fe-c4f0-45d8-8407-02ffd06ad476', admission_id: 'ba3978fe-c4f0-45d8-8407-02ffd06ad476', pulse_rate: 60 });
  if (test1.error?.message.includes('pulse_rate')) {
     console.log('❌ pulse_rate is INVALID.');
  } else {
     console.log('✅ pulse_rate MIGHT be valid (check logic).');
  }

  console.log('\n--- 🏁 DIAGNOSTICS COMPLETE 🏁 ---');
}

checkSchema();
