-- ============================================================
-- Biopassion HMS — Complete Database Schema v1.0
-- Run this in your Supabase project SQL Editor:
--   Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- ── 1. ENUMS ─────────────────────────────────────────────────────────────────

CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE marital_status AS ENUM ('Single','Married','Widowed','Divorced','Separated');
CREATE TYPE patient_status AS ENUM ('active','admitted','discharged','referred_out','deceased');
CREATE TYPE visit_type AS ENUM ('Walk-In','Referred','Emergency','Scheduled');
CREATE TYPE bed_status AS ENUM ('available','occupied','maintenance','reserved');
CREATE TYPE admission_status AS ENUM ('active','discharged','transferred','deceased');
CREATE TYPE prescription_status AS ENUM ('pending','dispensed','partial','cancelled');
CREATE TYPE order_status AS ENUM ('pending','processing','completed','cancelled');
CREATE TYPE payment_status AS ENUM ('pending','partial','paid','waived','insurance');
CREATE TYPE stock_transaction_type AS ENUM ('receive','dispense','transfer','adjustment','expired','return');

-- ── 2. CORE LOOKUP TABLES ────────────────────────────────────────────────────

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('admin',     'Full system access'),
  ('doctor',    'Clinical consultation and prescriptions'),
  ('nurse',     'Ward nursing and medication administration'),
  ('reception', 'Patient registration and OPD queue'),
  ('pharmacy',  'Medication dispensing'),
  ('lab_staff', 'Laboratory test processing'),
  ('billing',   'Billing and payments'),
  ('hr',        'Human resources management')
ON CONFLICT (name) DO NOTHING;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  dept_type   VARCHAR(50),  -- 'clinical', 'support', 'admin'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO departments (name, description, dept_type) VALUES
  ('Outpatient (OPD)',       'General outpatient clinic',         'clinical'),
  ('Inpatient (IPD)',        'General inpatient ward management', 'clinical'),
  ('Emergency',              'Accident & Emergency department',   'clinical'),
  ('Maternity',              'Obstetrics & Gynaecology',          'clinical'),
  ('Surgical',               'Surgical ward',                     'clinical'),
  ('Paediatric',             'Children ward',                     'clinical'),
  ('ICU / HDU',              'Intensive & High Dependency Care',  'clinical'),
  ('Laboratory',             'Diagnostic laboratory services',    'support'),
  ('Pharmacy',               'Medication dispensing',             'support'),
  ('Radiology / Imaging',    'X-ray, Ultrasound, CT',             'support'),
  ('Administration',         'Hospital administration',           'admin'),
  ('Finance & Billing',      'Billing and accounts',              'admin'),
  ('Human Resources',        'Staff management',                  'admin')
ON CONFLICT (name) DO NOTHING;

-- ── 3. USERS & AUTH ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(200) UNIQUE NOT NULL,
  phone        VARCHAR(20),
  department_id UUID REFERENCES departments(id),
  employee_no  VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- ── 4. PATIENTS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_no        VARCHAR(20) UNIQUE NOT NULL,
  first_name        VARCHAR(100) NOT NULL,
  middle_name       VARCHAR(100),
  last_name         VARCHAR(100) NOT NULL,
  date_of_birth     DATE,
  age               VARCHAR(20),
  gender            gender_type NOT NULL,
  nationality       VARCHAR(60)  DEFAULT 'Kenyan',
  national_id       VARCHAR(30),
  phone             VARCHAR(20),
  email             VARCHAR(150),
  race              VARCHAR(50)  DEFAULT 'African',
  religion          VARCHAR(50)  DEFAULT 'Christian',
  occupation        VARCHAR(100),
  marital_status    marital_status,
  location          VARCHAR(200),
  next_of_kin_name  VARCHAR(150),
  next_of_kin_phone VARCHAR(20),
  next_of_kin_rel   VARCHAR(50),
  status            patient_status DEFAULT 'active',
  blood_group       VARCHAR(5),
  allergies         TEXT,
  chronic_conditions TEXT,
  insurance_provider VARCHAR(100),
  insurance_no      VARCHAR(100),
  registered_by     UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS patient_seq START 1;

CREATE OR REPLACE FUNCTION generate_patient_no()
RETURNS TRIGGER AS $$
BEGIN
  NEW.patient_no := 'BP-' || LPAD(nextval('patient_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_patient_no ON patients;
CREATE TRIGGER set_patient_no
  BEFORE INSERT ON patients
  FOR EACH ROW
  WHEN (NEW.patient_no IS NULL OR NEW.patient_no = '')
  EXECUTE FUNCTION generate_patient_no();

-- ── 5. OPD VISITS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opd_visits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES patients(id),
  visit_no              VARCHAR(20) UNIQUE,
  visit_type            visit_type DEFAULT 'Walk-In',
  referred_by           VARCHAR(200),
  presenting_complaint  TEXT,
  provisional_diagnosis TEXT,
  triage_priority       VARCHAR(20) DEFAULT 'normal',
  temperature           NUMERIC(4,1),
  pulse                 INTEGER,
  bp_systolic           INTEGER,
  bp_diastolic          INTEGER,
  respiratory_rate      INTEGER,
  weight_kg             NUMERIC(5,1),
  height_cm             NUMERIC(5,1),
  spo2                  NUMERIC(4,1),
  blood_glucose         NUMERIC(5,1),
  triaged_by            UUID REFERENCES users(id),
  assigned_doctor_id    UUID REFERENCES users(id),
  department_id         UUID REFERENCES departments(id),
  status                VARCHAR(30) DEFAULT 'waiting',
  queue_no              INTEGER,
  visit_date            DATE DEFAULT CURRENT_DATE,
  check_in_time         TIMESTAMPTZ DEFAULT NOW(),
  consultation_start    TIMESTAMPTZ,
  consultation_end      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. CONSULTATION / EMR ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id              UUID NOT NULL REFERENCES opd_visits(id),
  patient_id            UUID NOT NULL REFERENCES patients(id),
  doctor_id             UUID NOT NULL REFERENCES users(id),
  history_presenting    TEXT,
  history_past_medical  TEXT,
  history_family        TEXT,
  history_social        TEXT,
  history_medications   TEXT,
  history_allergies     TEXT,
  examination_findings  TEXT,
  primary_diagnosis     TEXT,
  secondary_diagnoses   TEXT,
  icd10_code            VARCHAR(20),
  management_plan       TEXT,
  follow_up_date        DATE,
  follow_up_notes       TEXT,
  decision              VARCHAR(30) DEFAULT 'discharge',
  referral_details      TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  prescribed_by   UUID NOT NULL REFERENCES users(id),
  status          prescription_status DEFAULT 'pending',
  notes           TEXT,
  prescribed_at   TIMESTAMPTZ DEFAULT NOW(),
  dispensed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id  UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_name        VARCHAR(200) NOT NULL,
  dose             VARCHAR(100),
  frequency        VARCHAR(100),
  duration         VARCHAR(100),
  route            VARCHAR(50),
  quantity         INTEGER,
  quantity_dispensed INTEGER DEFAULT 0,
  notes            TEXT
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  visit_id        UUID REFERENCES opd_visits(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  ordered_by      UUID NOT NULL REFERENCES users(id),
  status          order_status DEFAULT 'pending',
  urgency         VARCHAR(20) DEFAULT 'routine',
  notes           TEXT,
  ordered_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id  UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_name     VARCHAR(200) NOT NULL,
  status        order_status DEFAULT 'pending',
  result        TEXT,
  result_at     TIMESTAMPTZ
);

-- ── 7. INPATIENT / WARDS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) UNIQUE NOT NULL,
  department_id   UUID REFERENCES departments(id),
  ward_type       VARCHAR(50),
  total_beds      INTEGER NOT NULL DEFAULT 0,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO wards (name, ward_type, total_beds) VALUES
  ('General Ward',     'general',    30),
  ('Maternity Ward',   'maternity',  15),
  ('Surgical Ward',    'surgical',   20),
  ('Paediatric Ward',  'paediatric', 12),
  ('ICU / HDU',        'icu',         8)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS beds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id     UUID NOT NULL REFERENCES wards(id),
  bed_no      VARCHAR(20) NOT NULL,
  status      bed_status DEFAULT 'available',
  notes       TEXT,
  UNIQUE(ward_id, bed_no)
);

CREATE TABLE IF NOT EXISTS admissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id),
  visit_id            UUID REFERENCES opd_visits(id),
  admission_no        VARCHAR(20) UNIQUE,
  ward_id             UUID NOT NULL REFERENCES wards(id),
  bed_id              UUID REFERENCES beds(id),
  admitted_by         UUID NOT NULL REFERENCES users(id),
  admitting_diagnosis TEXT,
  status              admission_status DEFAULT 'active',
  admitted_at         TIMESTAMPTZ DEFAULT NOW(),
  discharged_at       TIMESTAMPTZ,
  discharge_summary   TEXT,
  discharge_by        UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS clinical_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id  UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id),
  written_by    UUID NOT NULL REFERENCES users(id),
  note_type     VARCHAR(50) DEFAULT 'nursing',
  note          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vitals_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  admission_id  UUID REFERENCES admissions(id),
  visit_id      UUID REFERENCES opd_visits(id),
  recorded_by   UUID NOT NULL REFERENCES users(id),
  temperature   NUMERIC(4,1),
  pulse         INTEGER,
  bp_systolic   INTEGER,
  bp_diastolic  INTEGER,
  resp_rate     INTEGER,
  weight_kg     NUMERIC(5,1),
  height_cm     NUMERIC(5,1),
  spo2          NUMERIC(4,1),
  blood_glucose NUMERIC(5,1),
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. PHARMACY & INVENTORY ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drug_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  generic_name    VARCHAR(200),
  category        VARCHAR(100),
  formulation     VARCHAR(100),
  unit            VARCHAR(50),
  reorder_level   INTEGER DEFAULT 20,
  selling_price   NUMERIC(10,2),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drug_stock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id         UUID NOT NULL REFERENCES drug_catalog(id),
  batch_no        VARCHAR(100),
  expiry_date     DATE,
  quantity        INTEGER NOT NULL DEFAULT 0,
  supplier        VARCHAR(200),
  purchase_price  NUMERIC(10,2),
  received_at     TIMESTAMPTZ DEFAULT NOW(),
  received_by     UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS drug_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id         UUID NOT NULL REFERENCES drug_catalog(id),
  stock_id        UUID REFERENCES drug_stock(id),
  txn_type        stock_transaction_type NOT NULL,
  quantity        INTEGER NOT NULL,
  patient_id      UUID REFERENCES patients(id),
  prescription_id UUID REFERENCES prescriptions(id),
  performed_by    UUID NOT NULL REFERENCES users(id),
  notes           TEXT,
  txn_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(100),
  unit            VARCHAR(50),
  current_qty     INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER DEFAULT 10,
  description     TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES inventory_items(id),
  txn_type        stock_transaction_type NOT NULL,
  quantity        INTEGER NOT NULL,
  department_id   UUID REFERENCES departments(id),
  supplier        VARCHAR(200),
  batch_no        VARCHAR(100),
  expiry_date     DATE,
  cost            NUMERIC(10,2),
  performed_by    UUID NOT NULL REFERENCES users(id),
  notes           TEXT,
  txn_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. BILLING ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no         VARCHAR(20) UNIQUE,
  patient_id      UUID NOT NULL REFERENCES patients(id),
  visit_id        UUID REFERENCES opd_visits(id),
  admission_id    UUID REFERENCES admissions(id),
  total_amount    NUMERIC(12,2) DEFAULT 0,
  paid_amount     NUMERIC(12,2) DEFAULT 0,
  balance         NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status          payment_status DEFAULT 'pending',
  insurance_claim VARCHAR(200),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bill_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id       UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description   VARCHAR(300) NOT NULL,
  category      VARCHAR(100),
  quantity      INTEGER DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id         UUID NOT NULL REFERENCES bills(id),
  amount          NUMERIC(12,2) NOT NULL,
  method          VARCHAR(50),
  reference_no    VARCHAR(100),
  received_by     UUID REFERENCES users(id),
  paid_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patients"
  ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert patients"
  ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage consultations"
  ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage admissions"
  ON admissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage bills"
  ON bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 11. HELPFUL VIEWS ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_current_inpatients AS
SELECT
  a.id AS admission_id, a.admission_no,
  p.patient_no, p.first_name || ' ' || p.last_name AS patient_name,
  p.gender, p.age,
  w.name AS ward, b.bed_no,
  a.admitting_diagnosis, a.admitted_at,
  u.first_name || ' ' || u.last_name AS admitted_by
FROM admissions a
JOIN patients p ON p.id = a.patient_id
JOIN wards w ON w.id = a.ward_id
LEFT JOIN beds b ON b.id = a.bed_id
LEFT JOIN users u ON u.id = a.admitted_by
WHERE a.status = 'active';

CREATE OR REPLACE VIEW v_opd_queue_today AS
SELECT
  v.id AS visit_id, v.queue_no,
  p.patient_no, p.first_name || ' ' || p.last_name AS patient_name,
  p.gender, p.age, v.triage_priority, v.presenting_complaint,
  v.status, v.check_in_time,
  u.first_name || ' ' || u.last_name AS assigned_doctor
FROM opd_visits v
JOIN patients p ON p.id = v.patient_id
LEFT JOIN users u ON u.id = v.assigned_doctor_id
WHERE v.visit_date = CURRENT_DATE
ORDER BY
  CASE v.triage_priority WHEN 'emergency' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END,
  v.queue_no;

CREATE OR REPLACE VIEW v_bed_occupancy AS
SELECT
  w.name AS ward, w.total_beds,
  COUNT(b.id) FILTER (WHERE b.status = 'occupied')    AS occupied,
  COUNT(b.id) FILTER (WHERE b.status = 'available')   AS available,
  COUNT(b.id) FILTER (WHERE b.status = 'maintenance') AS maintenance
FROM wards w
LEFT JOIN beds b ON b.ward_id = w.id
GROUP BY w.id, w.name, w.total_beds;

DO $$ BEGIN RAISE NOTICE 'HMS Database schema created successfully!'; END $$;
