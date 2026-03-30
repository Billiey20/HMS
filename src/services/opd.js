import { supabase } from '../lib/supabase';

export const opdService = {
  // We're pivoting from the SQL View because it might be hardcoded to old statuses
  async getQueue() {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('opd_visits')
      .select('*, patients(*)')
      .eq('visit_date', today);
      
    if (error) throw error;

    // Map it to look exactly like the view used to look
    return (data || []).map((v, i) => ({
      visit_id: v.id,
      patient_id: v.patient_id,
      patient_name: v.patients ? `${v.patients.first_name} ${v.patients.last_name}` : 'Unknown',
      patient_no: v.patients?.patient_no,
      age: v.patients?.age,
      gender: v.patients?.gender,
      visit_date: v.visit_date,
      check_in_time: v.check_in_time,
      triage_priority: v.triage_priority,
      presenting_complaint: v.presenting_complaint,
      temperature: v.temperature,
      pulse: v.pulse,
      bp_systolic: v.bp_systolic,
      bp_diastolic: v.bp_diastolic,
      respiratory_rate: v.respiratory_rate,
      spo2: v.spo2,
      weight_kg: v.weight_kg,
      height_cm: v.height_cm,
      blood_glucose: v.blood_glucose,
      status: v.status,
      queue_no: i + 1
    }));
  },

  async createVisit(payload) {
    const { data, error } = await supabase.from('opd_visits').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async getVisit(id) {
    const { data, error } = await supabase.from('opd_visits').select('*, patients(*)').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase.from('opd_visits').update({ status }).eq('id', id);
    if (error) throw error;
    return data;
  },

  async updateVisit(id, payload) {
    const { data, error } = await supabase.from('opd_visits').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async todayCount() {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase.from('opd_visits').select('*', { count: 'exact', head: true }).eq('visit_date', today);
    return count || 0;
  },
};
