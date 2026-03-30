import { supabase } from '../config/supabase.js';

export async function list(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*, patients(patient_no, first_name, last_name), bill_items(*), payments(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const { patientId, visitId, items, userId } = req.body;
    const total = items.reduce((s, i) => s + (i.qty || 1) * i.unitPrice, 0);
    const { data: bill, error } = await supabase.from('bills').insert([{
      patient_id: patientId, visit_id: visitId || null,
      total_amount: total, status: 'pending', created_by: userId,
    }]).select().single();
    if (error) throw error;
    await supabase.from('bill_items').insert(
      items.map(i => ({ bill_id: bill.id, description: i.desc, category: i.cat, quantity: i.qty || 1, unit_price: i.unitPrice }))
    );
    res.status(201).json(bill);
  } catch (err) { next(err); }
}

export async function recordPayment(req, res, next) {
  try {
    const { billId, amount, method, referenceNo, userId } = req.body;
    await supabase.from('payments').insert([{ bill_id: billId, amount, method, reference_no: referenceNo || null, received_by: userId }]);
    const { data: pmts } = await supabase.from('payments').select('amount').eq('bill_id', billId);
    const paidAmount = (pmts || []).reduce((s, p) => s + parseFloat(p.amount), 0);
    const { data: bill } = await supabase.from('bills').select('total_amount').eq('id', billId).single();
    const totalAmount = parseFloat(bill?.total_amount || 0);
    const newStatus = method === 'Waiver' ? 'waived' : paidAmount >= totalAmount ? 'paid' : 'partial';
    await supabase.from('bills').update({ paid_amount: paidAmount, status: newStatus }).eq('id', billId);
    res.json({ success: true, status: newStatus });
  } catch (err) { next(err); }
}
