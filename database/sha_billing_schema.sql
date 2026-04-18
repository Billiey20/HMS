-- ============================================================
-- Biopassion HMS — SHA Billing & Splits Engine (2026/SHA)
-- ============================================================

-- 1. sha_tariffs
CREATE TABLE IF NOT EXISTS sha_tariffs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code     VARCHAR(50) UNIQUE NOT NULL,
  category         VARCHAR(100) NOT NULL,
  description      TEXT,
  level_4_rate     NUMERIC(12,2) NOT NULL DEFAULT 0,
  requires_preauth BOOLEAN DEFAULT FALSE,
  fund_source      VARCHAR(20) DEFAULT 'SHIF', -- SHIF, PHF, ECCIF
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Protect table
ALTER TABLE sha_tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view tariffs" ON sha_tariffs FOR SELECT USING (true);
CREATE POLICY "Admin users can manage tariffs" ON sha_tariffs FOR ALL USING (true); -- simplify for now

-- 2. patients extension (patients_sha_profile)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS household_id          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS means_testing_bracket INTEGER CHECK (means_testing_bracket >= 1 AND means_testing_bracket <= 5),
  ADD COLUMN IF NOT EXISTS is_indigent           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_referral_id   UUID;

-- 3. benefit_limits
CREATE TABLE IF NOT EXISTS benefit_limits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    VARCHAR(100) NOT NULL,
  category        VARCHAR(100) NOT NULL, -- e.g., 'Inpatient', 'Optical'
  limit_type      VARCHAR(50) NOT NULL,  -- 'days', 'amount'
  max_value       NUMERIC(12,2) NOT NULL,
  consumed_value  NUMERIC(12,2) NOT NULL DEFAULT 0,
  period_year     INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, category, period_year)
);

-- 4. referrals
CREATE TABLE IF NOT EXISTS referrals (
  referral_uuid        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id           UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  origin_facility_code VARCHAR(100) NOT NULL,
  target_facility_code VARCHAR(100),
  reason               TEXT,
  clinical_notes       TEXT,
  status               VARCHAR(30) DEFAULT 'Active', -- 'Active', 'Consumed', 'Expired'
  expiry_date          DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  consumed_at          TIMESTAMPTZ
);

ALTER TABLE patients
  ADD CONSTRAINT fk_current_referral
  FOREIGN KEY (current_referral_id) REFERENCES referrals(referral_uuid) ON DELETE SET NULL;

-- 5. invoices & invoice_items (bills & bill_items extension)
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS is_emergency       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preauth_code       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS referral_used      UUID REFERENCES referrals(referral_uuid);

ALTER TABLE bill_items
  ADD COLUMN IF NOT EXISTS hospital_price      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sha_covered_amount  NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS patient_copay       NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funding_source_used VARCHAR(20),     -- 'SHIF', 'PHF', 'ECCIF', 'Patient', 'Govt'
  ADD COLUMN IF NOT EXISTS invoice_item_status VARCHAR(50); -- 'Awaiting_SHA_Approval', 'Approved', 'Rejected'

-- Add sample tariffs for Kenya 2026 Level 4
INSERT INTO sha_tariffs (service_code, category, description, level_4_rate, requires_preauth, fund_source)
VALUES
  ('SHA-OUT-01', 'consultation', 'Outpatient Package (Includes consultation & basic labs)', 2000, FALSE, 'SHIF'),
  ('SHA-INP-01', 'ward',         'Inpatient Per night (Max 50 per household)', 3500, FALSE, 'SHIF'),
  ('SHA-MAT-01', 'procedure',    'C-Section Package', 32600, FALSE, 'SHIF'),
  ('SHA-ECC-01', 'procedure',    'Dialysis Per session', 10650, TRUE, 'ECCIF')
ON CONFLICT (service_code) DO UPDATE
SET level_4_rate = EXCLUDED.level_4_rate, category = EXCLUDED.category, fund_source = EXCLUDED.fund_source;
