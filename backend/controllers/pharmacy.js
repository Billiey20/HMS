import { supabase } from '../config/supabase.js';

export async function listPrescriptions(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, patients(patient_no, first_name, last_name), prescription_items(*)')
      .order('prescribed_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function listDrugStock(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('drug_catalog')
      .select('*, drug_stock(quantity, expiry_date, batch_no)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function dispense(req, res, next) {
  try {
    const { itemUpdates, allDone } = req.body;
    for (const upd of itemUpdates) {
      await supabase.from('prescription_items').update({ quantity_dispensed: upd.dispensed }).eq('id', upd.id);
    }
    await supabase.from('prescriptions').update({
      status: allDone ? 'dispensed' : 'partial',
      dispensed_at: new Date().toISOString()
    }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}
