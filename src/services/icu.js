import { supabase } from '../lib/supabase';

export const icuService = {
  // ICU Vitals Setup
  async getIcuVitals(patientId) {
    const { data, error } = await supabase
      .from('icu_vitals')
      .select('*, recorded_by_user:users!recorded_by(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('record_time', { ascending: false })
      .limit(24); // Last 24 readings
    if (error) throw error;
    return data || [];
  },

  async recordVitals(payload) {
    const { data, error } = await supabase.from('icu_vitals').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // ICU Scoring (RASS/CPOT/APACHE)
  async getScores(patientId) {
    const { data, error } = await supabase
      .from('icu_scoring')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  
  // Fluid Balance Setup
  async getFluidBalance(patientId) {
    const { data, error } = await supabase
      .from('icu_fluid_balance')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_time', { ascending: false })
      .limit(48);
    if (error) throw error;
    return data || [];
  }
};
