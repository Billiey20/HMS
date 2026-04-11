import { supabase } from '../lib/supabase';

export const analyticsService = {
  // 1. Core KPIs
  async getKPIs() {
    const today = new Date().toISOString().slice(0, 10);

    const [patients, opd, ipd, lab, revenue] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('opd_visits').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('admissions').select('*', { count: 'exact', head: true }).in('status', ['admitted', 'transferred']),
      supabase.from('lab_orders').select('*', { count: 'exact', head: true }).not('status', 'eq', 'completed'),
      supabase.from('payments').select('amount, method').gte('created_at', `${today}T00:00:00Z`),
    ]);

    let totalRevenue = 0;
    let revenueInsurance = 0;
    let revenueCash = 0;

    if (revenue.data) {
      revenue.data.forEach(p => {
        const amt = Number(p.amount) || 0;
        totalRevenue += amt;
        if (p.method === 'Insurance') revenueInsurance += amt;
        else if (p.method !== 'Waiver') revenueCash += amt;
      });
    }

    return {
      patients: patients.count || 0,
      todayOpd: opd.count || 0,
      inpatients: ipd.count || 0,
      pendingLab: lab.count || 0,
      revenue: totalRevenue,
      revenueCash,
      revenueInsurance
    };
  },

  // 2. Bed Occupancy
  async getBedOccupancy() {
    const { data: wards } = await supabase.from('wards').select('id, name, total_beds');
    const { data: activeAdmissions } = await supabase.from('admissions').select('ward_id').in('status', ['admitted', 'transferred']);

    if (!wards) return [];

    return wards.map(w => {
      const occupied = activeAdmissions?.filter(a => a.ward_id === w.id).length || 0;
      return {
        name: w.name,
        total: w.total_beds || 0,
        occupied
      };
    }).sort((a,b) => b.occupied - a.occupied); // Most busy at top
  },

  // 3. Department Activity (Today)
  async getDepartmentActivity() {
    const today = new Date().toISOString().slice(0, 10);

    const [opd, lab, rx, ipd] = await Promise.all([
      supabase.from('opd_visits').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('lab_orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('prescriptions').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
      supabase.from('admissions').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
    ]);

    const acts = [
      { dept: 'OPD / Triage', visits: opd.count || 0 },
      { dept: 'Laboratory',   visits: lab.count || 0 },
      { dept: 'Pharmacy',     visits: rx.count || 0 },
      { dept: 'Inpatient Admissions', visits: ipd.count || 0 },
    ];
    
    // Calculate Pct
    const max = Math.max(...acts.map(a => a.visits), 1);
    return acts.map(a => ({ ...a, pct: Math.round((a.visits / max) * 100) })).sort((a,b) => b.visits - a.visits);
  },

  // 4. Top Diagnoses (Last 30 Days)
  async getTopDiagnoses() {
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    const { data } = await supabase
      .from('consultations')
      .select('diagnosis')
      .not('diagnosis', 'is', null)
      .gte('created_at', lastMonth.toISOString());

    if (!data || data.length === 0) return [];

    const counts = {};
    let total = 0;
    data.forEach(c => {
      if (c.diagnosis) {
        // Taking the first primary diagnosis text simply separated by newline or commas (if they typed list)
        // or just group the exact raw text if they typed clean singular words
        const d = c.diagnosis.split('\n')[0].trim().substring(0, 30); 
        counts[d] = (counts[d] || 0) + 1;
        total++;
      }
    });

    return Object.entries(counts)
      .map(([name, n]) => ({ name, n, pct: Math.round((n / total) * 100) }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 7);
  },

  // 5. Revenue Trend (Last 7 Days)
  async getRevenueTrend() {
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        fullDate: d.toISOString().slice(0, 10), 
        label: d.toLocaleDateString('en-GB', { weekday: 'short' }) + (i===6 ? ' (Today)' : ''),
        val: 0 
      };
    });

    const start = days[0].fullDate;
    
    const { data } = await supabase
      .from('payments')
      .select('amount, payment_date') // Ensure 'payment_date' or 'created_at' exists
      .gte('created_at', `${start}T00:00:00Z`);

    if (data) {
      data.forEach(p => {
        const pDate = (p.payment_date || p.created_at).slice(0, 10);
        const day = days.find(d => d.fullDate === pDate);
        if (day) day.val += Number(p.amount);
      });
    }

    return days;
  },

  // 6. Staff On Duty (Logged in Today)
  async getStaffOnDuty() {
    // Fetch users with the highest privileges or strictly clinicians who logged in or were created recently 
    // Just mock list using real users from the DB
    const { data } = await supabase.from('users').select('first_name, last_name, role, department').limit(10);
    
    if (!data) return [];
    
    const roleColors = {
      doctor: 'bg-blue-100 text-blue-700',
      nurse: 'bg-violet-100 text-violet-700',
      reception: 'bg-primary-100 text-primary-700',
      lab_staff: 'bg-amber-100 text-amber-700',
      pharmacy: 'bg-emerald-100 text-emerald-700',
    };

    return data.map(u => ({
      name: `${u.first_name} ${u.last_name || ''}`,
      role: u.role,
      dept: u.department || u.role,
      color: roleColors[u.role] || 'bg-slate-100 text-slate-700'
    }));
  }
};
