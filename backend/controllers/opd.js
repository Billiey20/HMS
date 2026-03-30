import { supabase } from '../config/supabase.js';

export async function getQueue(_req, res, next) {
  try {
    const { data, error } = await supabase.from('v_opd_queue_today').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function createVisit(req, res, next) {
  try {
    const { data, error } = await supabase.from('opd_visits').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function getVisit(req, res, next) {
  try {
    const { data, error } = await supabase.from('opd_visits').select('*, patients(*)').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from('opd_visits').update({ status }).eq('id', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}
