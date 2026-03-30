import { supabase } from '../config/supabase.js';

export async function getBedOccupancy(_req, res, next) {
  try {
    const { data, error } = await supabase.from('v_bed_occupancy').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function listBeds(req, res, next) {
  try {
    const { wardId } = req.query;
    let q = supabase.from('beds')
      .select('*, wards(name, ward_type), admissions(*, patients(first_name, last_name, patient_no, age, gender))')
      .eq('admissions.status', 'active');
    if (wardId) q = q.eq('ward_id', wardId);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function listAdmissions(_req, res, next) {
  try {
    const { data, error } = await supabase.from('v_current_inpatients').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function admit(req, res, next) {
  try {
    const payload = req.body;
    if (payload.bed_id) await supabase.from('beds').update({ status: 'occupied' }).eq('id', payload.bed_id);
    const { data, error } = await supabase.from('admissions').insert([payload]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function discharge(req, res, next) {
  try {
    const { data: adm } = await supabase.from('admissions').select('bed_id').eq('id', req.params.id).single();
    if (adm?.bed_id) await supabase.from('beds').update({ status: 'available' }).eq('id', adm.bed_id);
    const { data, error } = await supabase.from('admissions')
      .update({ status: 'discharged', discharged_at: new Date().toISOString(), ...req.body })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function addNote(req, res, next) {
  try {
    const { data, error } = await supabase.from('clinical_notes').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function addVitals(req, res, next) {
  try {
    const { data, error } = await supabase.from('vitals_records').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}
