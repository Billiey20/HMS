-- ============================================================
-- Biopassion HMS — Phase 3: SHA Claims Batching Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS sha_claims_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_no        VARCHAR(50) UNIQUE NOT NULL,
  total_claims    INTEGER NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'pending_payout', -- 'pending_payout', 'reimbursed'
  generated_by    UUID REFERENCES auth.users(id),
  reimbursed_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Protect the batches table
ALTER TABLE sha_claims_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to manage claims batches"
  ON sha_claims_batches FOR ALL
  USING (true) WITH CHECK (true);

-- Add tracking to the payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS sha_batch_id UUID REFERENCES sha_claims_batches(id);
