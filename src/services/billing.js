import { supabase } from '../lib/supabase';

// ── SHA Split Helper ───────────────────────────────────────────────────────────
async function invokeShaFunction(body) {
  const { data, error } = await supabase.functions.invoke('calculate-sha-split', { body });
  if (error) throw new Error(error.message || 'SHA split function error');
  return data;
}

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

  // ── SHA-Aware Methods ────────────────────────────────────────────────────────

  /** Call the Edge Function to get a real-time SHA payment split preview. */
  async calculateShaSplit({ patient_id, sha_id, services, is_emergency = false }) {
    return invokeShaFunction({ patient_id, sha_id, services, is_emergency });
  },

  /**
   * Create a bill with full SHA split data persisted on each line item.
   * On success, optionally consumes the active referral.
   */
  async createWithSha({ patientId, visitId, shaResult, userId }) {
    const { lines, totals, referral_uuid, is_indigent } = shaResult;
    const patient_copay_total = totals.patient_total + (is_indigent ? 0 : 0); // pure patient
    const sha_total = totals.sha_total;
    const hospital_total = totals.hospital_total;

    // Insert the master bill (total_amount is the FULL hospital charge so billing sees it)
    const { data: bill, error: billErr } = await supabase.from('bills').insert([{
      patient_id: patientId,
      visit_id: visitId || null,
      total_amount: hospital_total,
      paid_amount: sha_total,   // SHA's portion is pre-credited
      status: patient_copay_total <= 0 ? 'paid' : 'partial',
      created_by: userId,
      is_emergency: shaResult.is_emergency ?? false,
      referral_used: referral_uuid || null,
    }]).select().single();
    if (billErr) throw billErr;

    // Insert line items with SHA breakdown
    const lineItems = lines.map(l => ({
      bill_id: bill.id,
      description: l.description,
      category: l.category || 'general',
      quantity: l.quantity,
      unit_price: l.hospital_price,
      hospital_price: l.hospital_price * l.quantity,
      sha_covered_amount: l.sha_covered_amount,
      patient_copay: l.patient_copay,
      funding_source_used: l.funding_source_used,
      invoice_item_status: l.invoice_item_status,
    }));
    const { error: itemsErr } = await supabase.from('bill_items').insert(lineItems);
    if (itemsErr) throw itemsErr;

    // Record SHA payment entry (claimed from SHIF/PHF/ECCIF)
    if (sha_total > 0) {
      await supabase.from('payments').insert([{
        bill_id: bill.id,
        amount: sha_total,
        method: 'Insurance',
        reference_no: `SHA-AUTO-${bill.id.slice(0, 8).toUpperCase()}`,
        received_by: userId,
      }]);
    }

    // If indigent copay → record govt debtor payment
    if (totals.govt_debtor_total > 0) {
      await supabase.from('payments').insert([{
        bill_id: bill.id,
        amount: totals.govt_debtor_total,
        method: 'Insurance',
        reference_no: `GOVT-DEBTOR-${bill.id.slice(0, 8).toUpperCase()}`,
        received_by: userId,
      }]);
    }

    // Consume the referral
    if (referral_uuid) {
      await supabase.from('referrals')
        .update({ status: 'Consumed', consumed_at: new Date().toISOString() })
        .eq('referral_uuid', referral_uuid);
    }

    return bill;
  },

  /** List SHA claims (bill_items with a non-null funding_source_used not 'Patient'). */
  async listShaClaims() {
    const { data, error } = await supabase
      .from('bill_items')
      .select(`
        id, description, category, quantity, unit_price,
        hospital_price, sha_covered_amount, patient_copay,
        funding_source_used, invoice_item_status,
        bills!inner(id, bill_no, status, created_at, patients(first_name, last_name, patient_no, sha_number))
      `)
      .not('funding_source_used', 'in', '("Patient",null)')
      .order('bills(created_at)', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** Submit a pre-auth request (stub — integrate with SHA portal URL). */
  async requestPreAuth(billItemId, auth_code = null) {
    if (auth_code) {
      // Auth code received → approve
      const { error } = await supabase.from('bill_items')
        .update({ invoice_item_status: 'Approved', preauth_code: auth_code })
        .eq('id', billItemId);
      if (error) throw error;
      return { approved: true };
    }
    // No code → mark as submitted pending
    const { error } = await supabase.from('bill_items')
      .update({ invoice_item_status: 'PreAuth_Submitted' })
      .eq('id', billItemId);
    if (error) throw error;
    return { approved: false, message: 'Pre-auth submitted to SHA provider portal.' };
  },
};
