-- ============================================================
-- HMS SHA Integration Migration — Run in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Add new columns to the patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS id_number             VARCHAR(30),
  ADD COLUMN IF NOT EXISTS sha_number            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cr_number             VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_mode          VARCHAR(20) DEFAULT 'Private',
  ADD COLUMN IF NOT EXISTS private_copay         BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sha_status            VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sha_compliance_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_verified           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS date_of_birth         DATE;

-- Add check constraint for payment_mode (safe to re-run)
ALTER TABLE patients
  DROP CONSTRAINT IF EXISTS chk_payment_mode;

ALTER TABLE patients
  ADD CONSTRAINT chk_payment_mode
  CHECK (payment_mode IN ('SHA', 'PHC', 'Private'));

-- Column documentation comments
COMMENT ON COLUMN patients.id_number             IS 'National ID, Birth Certificate, or Passport number';
COMMENT ON COLUMN patients.sha_number            IS 'Social Health Authority member number (e.g. SHA-2024-XXXXXXXX)';
COMMENT ON COLUMN patients.cr_number             IS 'Kenya Client Registry master health ID (e.g. CR000000001)';
COMMENT ON COLUMN patients.payment_mode          IS 'Primary payment scheme: SHA (active SHIF), PHC (Level 2/3 primary care), or Private (self-pay)';
COMMENT ON COLUMN patients.private_copay         IS 'TRUE if patient also pays privately for items not covered by SHA/PHC';
COMMENT ON COLUMN patients.sha_status            IS 'SHA member status from DHA API: Active, Inactive, or Unknown';
COMMENT ON COLUMN patients.sha_compliance_status IS 'Compliance flag: used when member is Inactive but still registered (keeps SHA number on file for future claim switching)';
COMMENT ON COLUMN patients.is_verified           IS 'TRUE if patient demographics were fetched from a Government API (SHA or Client Registry)';
COMMENT ON COLUMN patients.last_verified_at      IS 'Timestamp of last government API verification';
COMMENT ON COLUMN patients.date_of_birth         IS 'Patient date of birth (ISO 8601 format — returned directly from SHA/CR APIs)';

-- Confirm completion
DO $$ BEGIN RAISE NOTICE 'SHA Integration migration applied successfully!'; END $$;
