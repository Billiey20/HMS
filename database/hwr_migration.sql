-- ============================================================
-- HMS HWR Number Migration — Run in Supabase SQL Editor
-- Adds Health Worker Registry (HWR) number to the users table
-- for SHA claims compliance (practitioner credential in FHIR bundles)
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hwr_number   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS license_body VARCHAR(100);

COMMENT ON COLUMN users.hwr_number
  IS 'Health Worker Registry (HWR) identifier from the DHA — required for SHA FHIR claim bundles';

COMMENT ON COLUMN users.license_body
  IS 'Licensing council (e.g. Kenya Medical Practitioners and Dentists Council, Nursing Council of Kenya)';

-- Confirm completion
DO $$ BEGIN RAISE NOTICE 'HWR number migration applied successfully!'; END $$;
