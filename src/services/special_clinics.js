import { supabase } from '../lib/supabase';

export const specialClinicsService = {
  
  // CCC (HIV)
  async getCCCRecords(patientId) {
    const { data, error } = await supabase.from('ccc_records').select('*').eq('patient_id', patientId).order('enrollment_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getCCCLabs(patientId) {
    const { data, error } = await supabase.from('ccc_lab_tracking').select('*').eq('patient_id', patientId).order('record_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // TB DOTS
  async getTBRecords(patientId) {
    const { data, error } = await supabase.from('tb_dots_records').select('*').eq('patient_id', patientId).order('treatment_start_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // MCH (Immunizations)
  async getImmunizations(patientId) {
    const { data, error } = await supabase.from('mch_immunizations').select('*, admin:users!administered_by(first_name, last_name)').eq('patient_id', patientId).order('date_administered', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Mental Health
  async getMentalHealthRecords(patientId) {
    const { data, error } = await supabase.from('mental_health_records').select('*, specialist:users!attending_specialist(first_name, last_name)').eq('patient_id', patientId).order('visit_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Nutrition
  async getNutritionRecords(patientId) {
    const { data, error } = await supabase.from('nutrition_records').select('*, dietitian:users!dietitian_id(first_name, last_name)').eq('patient_id', patientId).order('record_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
