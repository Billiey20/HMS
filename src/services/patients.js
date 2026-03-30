import { supabase } from '../lib/supabase';

export const patientService = {
  async list({ search = '' } = {}) {
    let q = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (search) {
      q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_no.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
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
    const { data: visits } = await supabase
      .from('opd_visits')
      .select('*, consultations(*), lab_orders(*, lab_order_items(*, laboratory_items(name))), prescriptions(*, prescription_items(*, inventory_items(name)))')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    const { data: admissions } = await supabase
      .from('admissions')
      .select('*, wards(name), clinical_notes(*), vitals_records(*)')
      .eq('patient_id', patientId)
      .order('admitted_at', { ascending: false });

    const { data: vitals } = await supabase
      .from('vitals_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    return { visits, admissions, vitals };
  },
};
