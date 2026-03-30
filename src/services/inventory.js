import { supabase } from '../lib/supabase';

export const inventoryService = {
  async list({ category = null, search = '' } = {}) {
    let q = supabase.from('inventory_items').select('*').eq('is_active', true).order('name');
    if (category) q = q.eq('category', category);
    if (search)   q = q.ilike('name', `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async receive(itemId, qty, meta) {
    const { data: item } = await supabase.from('inventory_items').select('current_qty').eq('id', itemId).single();
    await supabase.from('inventory_items').update({ current_qty: (item?.current_qty || 0) + qty }).eq('id', itemId);
    await supabase.from('inventory_transactions').insert([{
      item_id: itemId, txn_type: 'receive', quantity: qty,
      supplier: meta.supplier, batch_no: meta.batchNo, expiry_date: meta.expiry || null,
      cost: parseFloat(meta.cost) || 0, performed_by: meta.userId,
    }]);
  },

  async issue(itemId, qty, meta) {
    const { data: item } = await supabase.from('inventory_items').select('current_qty').eq('id', itemId).single();
    await supabase.from('inventory_items').update({ current_qty: Math.max(0, (item?.current_qty || 0) - qty) }).eq('id', itemId);
    await supabase.from('inventory_transactions').insert([{
      item_id: itemId, txn_type: 'dispense', quantity: qty,
      department_id: meta.deptId || null, performed_by: meta.userId, notes: meta.notes || '',
    }]);
  },

  async transactions() {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, inventory_items(name), departments(name)')
      .order('txn_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
};
