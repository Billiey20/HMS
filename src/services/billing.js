import { supabase } from '../lib/supabase';

export const billingService = {
  async list({ status = null, search = '' } = {}) {
    let q = supabase
      .from('bills')
      .select('*, patients(patient_no, first_name, last_name, phone), bill_items(*), payments(*)')
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    if (search) q = q.or(`bill_no.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async create(patientId, visitId, items, userId) {
    const total = items.reduce((s, i) => s + (i.qty || 1) * i.unitPrice, 0);
    const { data: bill, error } = await supabase.from('bills').insert([{
      patient_id: patientId, visit_id: visitId || null,
      total_amount: total, status: 'pending', created_by: userId,
    }]).select().single();
    if (error) throw error;
    await supabase.from('bill_items').insert(
      items.map(i => ({ bill_id: bill.id, description: i.desc, category: i.cat, quantity: i.qty || 1, unit_price: i.unitPrice }))
    );
    return bill;
  },

  async appendCharge(patientId, visitId, description, category, unitPrice, quantity = 1, userId) {
    if (!patientId) return;
    // Find active pending bill
    let { data: bills } = await supabase.from('bills')
      .select('id, total_amount')
      .eq('patient_id', patientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    
    let bill = bills && bills.length > 0 ? bills[0] : null;

    if (!bill) {
      const { data: newBill } = await supabase.from('bills').insert([{
        patient_id: patientId, visit_id: visitId || null,
        total_amount: 0, status: 'pending', created_by: userId,
      }]).select('id, total_amount').single();
      bill = newBill;
    }

    const totalPrice = quantity * unitPrice;
    await supabase.from('bill_items').insert([{
      bill_id: bill.id, description, category, quantity, unit_price: unitPrice
    }]);

    await supabase.from('bills').update({
      total_amount: parseFloat(bill.total_amount || 0) + totalPrice
    }).eq('id', bill.id);
  },

  async recordPayment(billId, amount, method, referenceNo, userId) {
    await supabase.from('payments').insert([{ bill_id: billId, amount, method, reference_no: referenceNo || null, received_by: userId }]);
    const { data: pmts } = await supabase.from('payments').select('amount').eq('bill_id', billId);
    const paidAmount = (pmts || []).reduce((s, p) => s + parseFloat(p.amount), 0);
    const { data: bill } = await supabase.from('bills').select('total_amount').eq('id', billId).single();
    const totalAmount = parseFloat(bill?.total_amount || 0);
    const newStatus = method === 'Waiver' ? 'waived' : paidAmount >= totalAmount ? 'paid' : 'partial';
    await supabase.from('bills').update({ paid_amount: paidAmount, status: newStatus }).eq('id', billId);
  },

  async todayRevenue() {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('bills').select('paid_amount').eq('status', 'paid').gte('created_at', `${today}T00:00:00`);
    return (data || []).reduce((s, b) => s + parseFloat(b.paid_amount || 0), 0);
  },
};
