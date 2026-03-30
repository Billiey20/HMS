require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  // Check raw table
  const { data: visits, error: err1 } = await supabase
    .from('opd_visits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log("LAST 5 RAW VISITS:");
  console.log(visits);
  if (err1) console.error("Error1:", err1);

  // Check the view
  const { data: view, error: err2 } = await supabase
    .from('v_opd_queue_today')
    .select('*')
    .order('check_in_time', { ascending: false })
    .limit(5);

  console.log("\nLAST 5 IN VIEW v_opd_queue_today:");
  console.log(view);
  if (err2) console.error("Error2:", err2);
}

check();
