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

  async getPastConsultation(patientId, currentVisitId) {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .neq('visit_id', currentVisitId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createPrescription(payload, items) {
    const rxRecord = {
      ...payload,
      prescribed_at: new Date().toISOString(),
      status: payload.status || 'pending'
    };
    const { data: rx, error } = await supabase.from('prescriptions').insert([rxRecord]).select().single();
    if (error) throw error;
    if (items?.length) {
      const { error: itemErr } = await supabase.from('prescription_items').insert(
        items.map(i => ({ ...i, prescription_id: rx.id }))
      );
      if (itemErr) throw itemErr;
      
      try {
        for (const i of items) {
          // Fix: pass payload.visit_id instead of consultation_id tag
          await billingService.appendCharge(payload.patient_id, payload.visit_id, `Drug: ${i.drug_name}`, 'Pharmacy', 200, i.quantity || 1, payload.prescribed_by);
        }
      } catch (e) {
        console.error('Failed to append pharmacy charges:', e);
      }
    }
    return rx;
  },
};
