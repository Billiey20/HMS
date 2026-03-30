import { supabase } from '../lib/supabase';

export const pharmacyService = {
  async listPrescriptions() {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, patients(patient_no, first_name, last_name), prescription_items(*), consultations(visit_id, opd_visits(assigned_doctor_id, users(first_name, last_name)))')
      .order('prescribed_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listDrugStock() {
    const { data, error } = await supabase
      .from('drug_catalog')
      .select('*, drug_stock(quantity, expiry_date, batch_no)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  },

  async dispense(prescriptionId, itemUpdates, allDone) {
    for (const upd of itemUpdates) {
      await supabase.from('prescription_items').update({ quantity_dispensed: upd.dispensed }).eq('id', upd.id);
    }
    await supabase.from('prescriptions').update({
      status: allDone ? 'dispensed' : 'partial',
      dispensed_at: new Date().toISOString(),
    }).eq('id', prescriptionId);
  },
};
