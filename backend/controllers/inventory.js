import { supabase } from '../config/supabase.js';

export async function list(req, res, next) {
  try {
    const { category, search = '' } = req.query;
    let q = supabase.from('inventory_items').select('*').eq('is_active', true).order('name');
    if (category) q = q.eq('category', category);
    if (search)   q = q.ilike('name', `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function receive(req, res, next) {
  try {
    const { itemId, qty, meta } = req.body;
    const { data: item } = await supabase.from('inventory_items').select('current_qty').eq('id', itemId).single();
    await supabase.from('inventory_items').update({ current_qty: (item?.current_qty || 0) + qty }).eq('id', itemId);
    await supabase.from('inventory_transactions').insert([{
      item_id: itemId, txn_type: 'receive', quantity: qty,
      supplier: meta.supplier, batch_no: meta.batchNo, expiry_date: meta.expiry || null,
      cost: parseFloat(meta.cost) || 0, performed_by: meta.userId,
    }]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function issue(req, res, next) {
  try {
    const { itemId, qty, meta } = req.body;
    const { data: item } = await supabase.from('inventory_items').select('current_qty').eq('id', itemId).single();
    await supabase.from('inventory_items').update({ current_qty: Math.max(0, (item?.current_qty || 0) - qty) }).eq('id', itemId);
    await supabase.from('inventory_transactions').insert([{
      item_id: itemId, txn_type: 'dispense', quantity: qty,
      department_id: meta.deptId || null, performed_by: meta.userId, notes: meta.notes || '',
    }]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function transactions(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, inventory_items(name), departments(name)')
      .order('txn_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}
