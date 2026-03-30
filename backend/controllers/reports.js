import { supabase } from '../config/supabase.js';

export async function summary(_req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      { count: totalPatients },
      { count: todayVisits },
      { count: activeAdmissions },
      { count: pendingLab },
      { data: revenue },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('opd_visits').select('*', { count: 'exact', head: true }).eq('visit_date', today),
      supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('lab_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bills').select('paid_amount').eq('status', 'paid').gte('created_at', `${today}T00:00:00`),
    ]);

    const todayRevenue = (revenue || []).reduce((s, b) => s + parseFloat(b.paid_amount || 0), 0);

    res.json({ totalPatients, todayVisits, activeAdmissions, pendingLab, todayRevenue });
  } catch (err) { next(err); }
}
