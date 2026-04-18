import { supabase } from '../lib/supabase';

export const alliedHealthService = {
  // Physio
  async getPhysioAssessments(patientId) {
    const { data, error } = await supabase.from('physio_assessments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error; return data || [];
  },
  
  // Dental
  async getDentalRecords(patientId) {
    const { data, error } = await supabase.from('dental_records').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false });
    if (error) throw error; return data || [];
  },
  
  // Eye
  async getEyeRecords(patientId) {
    const { data, error } = await supabase.from('eye_records').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false });
    if (error) throw error; return data || [];
  },
  
  // Social Work
  async getSocialWorkRecords(patientId) {
    const { data, error } = await supabase.from('social_work_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error; return data || [];
  }
};
