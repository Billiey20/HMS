import { supabase } from '../lib/supabase';

export const patientService = {
  async list({ search = '' } = {}) {
    let q = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (search) {
      q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_no.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) {
      console.error('Patient list fetch failed:', error);
      throw new Error(`Failed to load patients: ${error.message}`);
    }
    return data;
  },

  async get(id) {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.from('patients').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase.from('patients').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async count() {
    const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    return count || 0;
  },

  async getFullHistory(patientId) {
    const [
      { data: visits, error: vErr },
      { data: admissions, error: aErr },
      { data: vitals, error: vitErr },
      { data: bills, error: bErr },
      { data: prescriptions, error: rErr }
    ] = await Promise.all([
      supabase.from('opd_visits').select('*, consultations(*), lab_orders(*, lab_order_items(*))').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('admissions').select('*, wards(name), clinical_notes(*), vitals_records(*)').eq('patient_id', patientId).order('admitted_at', { ascending: false }),
      supabase.from('vitals_records').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }),
      supabase.from('bills').select('*, bill_items(*), payments(*)').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('prescriptions').select('*, prescription_items(*)').eq('patient_id', patientId).order('prescribed_at', { ascending: false })
    ]);

    if (vErr) console.error("History: Visits Error:", vErr);
    if (aErr) console.error("History: Admissions Error:", aErr);
    if (vitErr) console.error("History: Vitals Error:", vitErr);
    if (bErr) console.error("History: Bills Error:", bErr);
    if (rErr) console.error("History: Prescriptions Error:", rErr);

    return { 
      visits: visits || [], 
      admissions: admissions || [], 
      vitals: vitals || [], 
      bills: bills || [],
      prescriptions: prescriptions || [],
      errors: { vErr, aErr, vitErr, bErr, rErr } 
    };
  },
};
