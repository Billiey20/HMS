import { supabase } from '../lib/supabase';

export const isolationService = {
  // Active Isolations
  async getIsolations(patientId) {
    const { data, error } = await supabase
      .from('isolation_logs')
      .select('*, doctor:users!ordered_by(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('start_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async startIsolation(payload) {
    const { data, error } = await supabase.from('isolation_logs').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // PPE Usage Setup
  async getPPEUsage(isolationId) {
    const { data, error } = await supabase
      .from('ppe_usage')
      .select('*, staff:users!staff_id(first_name, last_name)')
      .eq('isolation_id', isolationId)
      .order('entry_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Contact Tracing Setup
  async getContactTracing(isolationId) {
    const { data, error } = await supabase
      .from('contact_tracing')
      .select('*')
      .eq('isolation_id', isolationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
