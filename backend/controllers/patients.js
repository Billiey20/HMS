import { supabase } from '../config/supabase.js';

export async function list(req, res, next) {
  try {
    const { search = '' } = req.query;
    let q = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (search) {
      q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_no.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function get(req, res, next) {
  try {
    const { data, error } = await supabase.from('patients').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const { data, error } = await supabase.from('patients').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const { data, error } = await supabase.from('patients').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}
