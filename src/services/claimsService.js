import { supabase } from '../lib/supabase';

export const claimsService = {
  // 1. Fetch all 'Insurance' payments that haven't been batched yet
  async getUnbatchedClaims() {
    // First try with sha_batch_id filter (requires migration to have been run)
    const { data, error } = await supabase
      .from('payments')
      .select('*, bills(patient_id, patients(first_name, last_name, patient_no, sha_number))')
      .eq('method', 'Insurance')
      .is('sha_batch_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      // If the column doesn't exist yet (migration not run), fall back to all insurance payments
      if (error.message?.includes('sha_batch_id') || error.code === '42703') {
        const { data: fallback } = await supabase
          .from('payments')
          .select('*, bills(patient_id, patients(first_name, last_name, patient_no, sha_number))')
          .eq('method', 'Insurance')
          .order('created_at', { ascending: false });
        return fallback || [];
      }
      throw error;
    }
    return data || [];
  },

  // 2. Fetch all historic batches
  async listBatches() {
    const { data, error } = await supabase
      .from('sha_claims_batches')
      .select('*, generated_by_user:generated_by(first_name, last_name)')
      .order('created_at', { ascending: false });

    // If table doesn't exist yet (migration not run), return empty
    if (error) {
      if (error.message?.includes('sha_claims_batches') || error.code === '42P01') {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  // 3. Generate a new batch from an array of payment IDs
  async createBatch(paymentIds, totalAmount, userId) {
    if (!paymentIds || paymentIds.length === 0) return null;

    // Create tracking batch
    const batchNo = `SHA-BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
    const { data: batch, error: batchErr } = await supabase
      .from('sha_claims_batches')
      .insert([{
        batch_no: batchNo,
        total_claims: paymentIds.length,
        total_amount: totalAmount,
        generated_by: userId
      }])
      .select()
      .single();

    if (batchErr) throw batchErr;

    // Attach batch_id to the selected payments
    const { error: updateErr } = await supabase
      .from('payments')
      .update({ sha_batch_id: batch.id })
      .in('id', paymentIds);

    if (updateErr) throw updateErr;

    return batch;
  },

  // 4. Mark a batch as Reimbursed
  async markReimbursed(batchId) {
    const { error } = await supabase
      .from('sha_claims_batches')
      .update({ 
        status: 'reimbursed', 
        reimbursed_at: new Date().toISOString() 
      })
      .eq('id', batchId);

    if (error) throw error;
  }
};
