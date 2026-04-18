import { supabase } from '../lib/supabase';

export const maternityService = {
  // ANC Visits
  async getANCVisits(patientId) {
    const { data, error } = await supabase
      .from('anc_visits')
      .select('*, doctor:users!attending_doctor_id(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createANCVisit(payload) {
    const { data, error } = await supabase.from('anc_visits').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // Partograph
  async getPartographs(patientId) {
    const { data, error } = await supabase
      .from('partographs')
      .select('*, recorded_by_user:users!recorded_by(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async recordPartograph(payload) {
    const { data, error } = await supabase.from('partographs').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // Delivery Record
  async getDeliveryRecord(patientId) {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*, staff:users!attending_staff_id(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // ignore no rows error
    return data || null;
  },

  async createDeliveryRecord(payload) {
    const { data, error } = await supabase.from('delivery_records').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // CRVS Notification Helper
  async notifyCRVS(deliveryData, motherId) {
    // Calling the backend mock endpoint
    const response = await fetch('http://localhost:4000/api/v1/crvs/birth-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delivery_id: deliveryData.id,
        mother_id: motherId,
        infant_gender: deliveryData.infant_gender,
        infant_weight_kg: deliveryData.infant_weight_kg
      })
    });
    if (!response.ok) throw new Error('Failed to notify CRVS');
    return await response.json();
  }
};
