import { supabase } from '../lib/supabase';

export const surgeryService = {
  // Surgical Bookings
  async getBookings() {
    const { data, error } = await supabase
      .from('surgical_bookings')
      .select('*, patient:patients!patient_id(first_name, last_name, patient_no, age), surgeon:users!surgeon_id(first_name, last_name), anaesthetist:users!anaesthetist_id(first_name, last_name)')
      .order('schedule_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createBooking(payload) {
    const { data, error } = await supabase.from('surgical_bookings').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // WHO Checklist
  async getChecklist(bookingId) {
    const { data, error } = await supabase
      .from('pre_op_checklists')
      .select('*')
      .eq('booking_id', bookingId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async saveChecklist(payload) {
    // Upsert behavior
    const { data: existing } = await supabase.from('pre_op_checklists').select('id').eq('booking_id', payload.booking_id).single();
    let res;
    if (existing) {
       res = await supabase.from('pre_op_checklists').update(payload).eq('id', existing.id).select().single();
    } else {
       res = await supabase.from('pre_op_checklists').insert([payload]).select().single();
    }
    if (res.error) throw res.error;
    return res.data;
  },

  // Intraop Record
  async getIntraopRecord(bookingId) {
    const { data, error } = await supabase
      .from('intraop_records')
      .select('*')
      .eq('booking_id', bookingId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
};
