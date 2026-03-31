import { supabase } from '../lib/supabase';
import { billingService } from './billing';

export const labService = {
  // ── ORDERS (Stage 1 - Lab Requests) ────────────────────────────────────────
  async listOrders({ status = null } = {}) {
    let q = supabase
      .from('lab_orders')
      .select('*, patients(patient_no, first_name, last_name, age, gender), lab_order_items(*)')
      .order('ordered_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  // Legacy alias used by Consultation.jsx
  async list({ status = null } = {}) {
    return this.listOrders({ status });
  },

  // ── ITEMS (Stages 2-5 - individual test tracking) ──────────────────────────
  async searchLaboratoryTests(query = '') {
    // Import dynamically to avoid circular dependencies if any, or just use hardcoded constants 
    // Wait, let's just use a static mock or we can import TEST_TEMPLATES.
    // Instead of importing, we'll return a static catalog list mapped to IDs.
    const categories = ['Full Haemogram / CBC', 'Urinalysis (UA)', 'Random Blood Sugar (RBS)', 'Malaria RDT', 'HIV 1 & 2 Antibody Test', 'Urea, Electrolytes & Creatinine (UECs)', 'Stool Analysis'];
    // Assuming each category name is a valid exact test name for the order:
    const results = categories.map(name => ({ id: name, name }));
    if (!query) return results;
    return results.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  },

  async listItems({ sampleStatus = null, itemStatus = null } = {}) {
    let q = supabase
      .from('lab_order_items')
      .select(`
        *,
        lab_orders(
          id, visit_id, patient_id, urgency, ordered_at, status,
          patients(patient_no, first_name, last_name, age, gender, phone)
        )
      `)
      .order('id', { ascending: true });
    if (sampleStatus) q = q.eq('sample_status', sampleStatus);
    if (itemStatus)   q = q.eq('status', itemStatus);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  // ── Stage 1: Create Order ───────────────────────────────────────────────────
  async create(orderPayload, tests = []) {
    const { data: order, error } = await supabase
      .from('lab_orders').insert([orderPayload]).select().single();
    if (error) throw error;
    if (tests.length) {
      const { error: itemErr } = await supabase.from('lab_order_items').insert(
        tests.map(t => ({ lab_order_id: order.id, test_name: t, status: 'pending', sample_status: 'pending' }))
      );
      if (itemErr) throw itemErr;
      try {
        for (const t of tests) {
          await billingService.appendCharge(
            orderPayload.patient_id, orderPayload.visit_id,
            `Lab Test: ${t}`, 'Laboratory', 1000, 1, orderPayload.ordered_by
          );
        }
      } catch (e) {
        console.error('Failed to append lab test charges:', e);
      }
    }
    return order;
  },

  // ── Stage 1→2: Receive order (lab acknowledges it) ─────────────────────────
  async receiveOrder(orderId) {
    const { error } = await supabase
      .from('lab_orders').update({ status: 'processing' }).eq('id', orderId);
    if (error) throw error;
    // Reset all items' sample_status to 'pending' (awaiting sample collection)
    await supabase
      .from('lab_order_items')
      .update({ sample_status: 'pending' })
      .eq('lab_order_id', orderId);
  },

  // ── Stage 2: Accept or Reject sample ───────────────────────────────────────
  async acceptSample(itemId) {
    const { error } = await supabase
      .from('lab_order_items')
      .update({ 
        sample_status: 'collected', 
        status: 'processing',
        sample_collected_at: new Date().toISOString() 
      })
      .eq('id', itemId);
    if (error) throw error;
  },

  async rejectSample(itemId, reason) {
    const { error } = await supabase
      .from('lab_order_items')
      .update({ sample_status: 'rejected', rejection_reason: reason, status: 'cancelled' })
      .eq('id', itemId);
    if (error) throw error;
  },

  // ── Stage 3: Enter result for a single item ─────────────────────────────────
  async saveItemResult(itemId, resultJson) {
    const { error } = await supabase
      .from('lab_order_items')
      .update({ result: JSON.stringify(resultJson), result_at: new Date().toISOString() })
      .eq('id', itemId);
    if (error) throw error;
  },

  // ── Stage 4: Validate item ──────────────────────────────────────────────────
  async validateItem(itemId, userId) {
    const { error } = await supabase
      .from('lab_order_items')
      .update({
        validated_by: userId,
        validated_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', itemId);
    if (error) throw error;
  },

  // ── Stage 5: Post all validated items for an order ─────────────────────────
  async postOrder(orderId) {
    const ts = new Date().toISOString();
    // Mark all completed items as posted
    await supabase
      .from('lab_order_items')
      .update({ posted_at: ts })
      .eq('lab_order_id', orderId)
      .eq('status', 'completed');

    // Mark order as completed
    await supabase.from('lab_orders').update({ status: 'completed' }).eq('id', orderId);

    // Send patient back to doctor queue
    const { data: order } = await supabase
      .from('lab_orders').select('visit_id').eq('id', orderId).single();
    if (order?.visit_id) {
      await supabase
        .from('opd_visits').update({ status: 'waiting_doctor' }).eq('id', order.visit_id);
    }
  },

  // ── Legacy saveResults (used by consultation + old code) ───────────────────
  async saveResults(orderId, items) {
    await Promise.all(items.map(i =>
      supabase.from('lab_order_items')
        .update({ result: i.result, status: 'completed', result_at: new Date().toISOString() })
        .eq('id', i.id)
    ));
    await supabase.from('lab_orders').update({ status: 'completed' }).eq('id', orderId);
    const { data: order } = await supabase
      .from('lab_orders').select('visit_id').eq('id', orderId).single();
    if (order?.visit_id) {
      await supabase.from('opd_visits').update({ status: 'waiting_doctor' }).eq('id', order.visit_id);
    }
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase.from('lab_orders').update({ status }).eq('id', id);
    if (error) throw error;
    return data;
  },

  async pendingCount() {
    const { count } = await supabase
      .from('lab_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    return count || 0;
  },
};
