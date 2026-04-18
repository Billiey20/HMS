import { supabase } from '../lib/supabase';

export const paediatricService = {
  // Growth Monitoring
  async getGrowthRecords(patientId) {
    const { data, error } = await supabase
      .from('growth_monitoring')
      .select('*, recorded_by_user:users!recorded_by(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addGrowthRecord(payload) {
    const { data, error } = await supabase.from('growth_monitoring').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // IMCI
  async getIMCIAssessments(patientId) {
    const { data, error } = await supabase
      .from('imci_assessments')
      .select('*, assessor:users!assessor_id(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addIMCIAssessment(payload) {
    const { data, error } = await supabase.from('imci_assessments').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // Weight Based Dosing Helper (Client-side simulation logic)
  calculateDose(weight_kg, dose_per_kg_mg) {
    return (weight_kg * dose_per_kg_mg).toFixed(1);
  }
};
