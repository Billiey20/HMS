import { supabase } from '../config/supabase.js';

export async function list(req, res, next) {
  try {
    const { status } = req.query;
    let q = supabase
      .from('lab_orders')
      .select('*, patients(patient_no, first_name, last_name, age, gender), lab_order_items(*)')
      .order('ordered_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const { orderPayload, tests = [] } = req.body;
    const { data: order, error } = await supabase.from('lab_orders').insert([orderPayload]).select().single();
    if (error) throw error;
    if (tests.length) {
      await supabase.from('lab_order_items').insert(
        tests.map(t => ({ lab_order_id: order.id, test_name: t, status: 'pending' }))
      );
    }
    res.status(201).json(order);
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from('lab_orders').update({ status }).eq('id', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function saveResults(req, res, next) {
  try {
    const { items } = req.body;
    await Promise.all(items.map(i =>
      supabase.from('lab_order_items').update({ result: i.result, status: 'completed', result_at: new Date().toISOString() }).eq('id', i.id)
    ));
    await supabase.from('lab_orders').update({ status: 'completed' }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}
