import { supabase } from '../lib/supabase';
import { billingService } from './billing';

export const consultationService = {
  async saveDraft(payload) {
    let existing;
    if (payload.visit_id) {
      const { data } = await supabase.from('consultations').select('id').eq('visit_id', payload.visit_id).maybeSingle();
      existing = data;
    }
    
    if (existing) {
      const { data, error } = await supabase.from('consultations').update(payload).eq('id', existing.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('consultations').insert([payload]).select().single();
      if (error) throw error;
      
      try {
        await billingService.appendCharge(payload.patient_id, payload.visit_id, 'General Consultation Fee', 'Consultation', 1500, 1, payload.doctor_id);
      } catch (e) {
        console.error('Failed to append consultation fee:', e);
      }
      return data;
    }
  },

  async update(id, payload) {
    const { data, error } = await supabase.from('consultations').update(payload).eq('id', id);
    if (error) throw error;
    return data;
  },

  async getByVisit(visitId) {
    const { data, error } = await supabase.from('consultations').select('*').eq('visit_id', visitId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async createPrescription(prescriptionPayload, items) {
    const { data: rx, error } = await supabase.from('prescriptions').insert([prescriptionPayload]).select().single();
    if (error) throw error;
    if (items?.length) {
      const { error: itemErr } = await supabase.from('prescription_items').insert(
        items.map(i => ({ ...i, prescription_id: rx.id }))
      );
      if (itemErr) throw itemErr;
      
      try {
        for (const i of items) {
          await billingService.appendCharge(prescriptionPayload.patient_id, prescriptionPayload.consultation_id, `Drug: ${i.drug_name}`, 'Pharmacy', 200, i.quantity || 1, prescriptionPayload.prescribed_by);
        }
      } catch (e) {
        console.error('Failed to append pharmacy charges:', e);
      }
    }
    return rx;
  },
};
