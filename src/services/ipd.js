import { supabase } from '../lib/supabase';
import { billingService } from './billing';

export const ipdService = {
  async getBedOccupancy() {
    const { data, error } = await supabase.from('v_bed_occupancy').select('*');
    if (error) throw error;
    return data;
  },

  async listBeds(wardId = null) {
    let q = supabase
      .from('beds')
      .select('*, wards(name, ward_type)');
    if (wardId) q = q.eq('ward_id', wardId);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async listAdmissions() {
    const { data, error } = await supabase.from('v_current_inpatients').select('*');
    if (error) throw error;
    return data;
  },
  
  async listPendingAdmissions() {
    const { data, error } = await supabase
      .from('opd_visits')
      .select('*, patients(*)')
      .eq('status', 'awaiting_admission');
    if (error) throw error;
    return data;
  },

  async listWards() {
    const { data, error } = await supabase.from('wards').select('*');
    if (error) throw error;
    return data;
  },

  async admit(payload) {
    const { notes, ...admissionData } = payload;
    
    if (payload.bed_id) await supabase.from('beds').update({ status: 'occupied' }).eq('id', payload.bed_id);
    
    const { data, error } = await supabase.from('admissions').insert([admissionData]).select().single();
    if (error) throw error;

    // Save admission notes to clinical_notes if provided
    if (notes) {
      await this.addNote({
        admission_id: data.id,
        patient_id: payload.patient_id,
        author_id: payload.admitted_by,
        note_type: 'doctor',
        note_text: `Initial Admission Notes: ${notes}`,
        created_at: new Date().toISOString()
      });
    }

    // Update visit status so they are no longer in 'awaiting_admission' queue
    if (payload.visit_id) {
       await supabase.from('opd_visits').update({ status: 'admitted' }).eq('id', payload.visit_id);
    }

    try {
      await billingService.appendCharge(payload.patient_id, payload.visit_id, 'Inpatient Admission Fee', 'Bed Charges', 3000, 1, payload.admitted_by);
    } catch (e) {
      console.error('Failed to append admission fee:', e);
    }

    return data;
  },

  async discharge(admissionId, payload) {
    const { data: adm } = await supabase.from('admissions').select('bed_id').eq('id', admissionId).single();
    if (adm?.bed_id) await supabase.from('beds').update({ status: 'available' }).eq('id', adm.bed_id);
    const { data, error } = await supabase.from('admissions')
      .update({ status: 'discharged', discharged_at: new Date().toISOString(), ...payload })
      .eq('id', admissionId);
    if (error) throw error;
    return data;
  },

  async addNote(payload) {
    const { data, error } = await supabase.from('clinical_notes').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async addVitals(payload) {
    const { data, error } = await supabase.from('vitals_records').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async getVitals(patientId, admissionId) {
    const { data, error } = await supabase
      .from('vitals_records')
      .select('*')
      .eq('patient_id', patientId)
      .eq('admission_id', admissionId)
      .order('recorded_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  },

  async activeCount() {
    const { count } = await supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'active');
    return count || 0;
  },
};
