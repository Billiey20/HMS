-- ==============================================================================
-- PHASE 1: CORE WARD & SURGICAL EXPANSION
-- ==============================================================================
-- Note: Replace UUIDs with exact references your system uses if needed.

-- ==========================================
-- 1. MATERNITY & NEONATAL UNIT
-- ==========================================

-- Antenatal Care (ANC) Visits
CREATE TABLE public.anc_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gestational_age_weeks INT,
  fundal_height_cm INT,
  fetal_heart_rate INT,
  presentation TEXT,
  pmtct_hiv_status TEXT, -- e.g., 'Negative', 'Positive', 'Unknown'
  pmtct_prophylaxis TEXT,
  ultrasound_notes TEXT,
  attending_doctor_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partograph (Active Labour)
CREATE TABLE public.partographs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID, -- Optional linkage to IPD admission
  cervical_dilation_cm numeric(3,1),
  fetal_descent INT,
  contractions_per_10m INT,
  maternal_hr INT,
  maternal_bp_systolic INT,
  maternal_bp_diastolic INT,
  fetal_hr INT,
  amniotic_fluid_status TEXT, -- 'Clear', 'Meconium', 'Blood'
  recorded_by UUID REFERENCES public.users(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery Records
CREATE TABLE public.delivery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE, -- Mother
  delivery_time TIMESTAMP WITH TIME ZONE,
  mode_of_delivery TEXT, -- 'SVD', 'CS', 'Assisted', etc.
  estimated_blood_loss_ml INT,
  apgar_1_min INT,
  apgar_5_min INT,
  complications TEXT,
  infant_gender TEXT,
  infant_weight_kg numeric(4,2),
  crvs_notified BOOLEAN DEFAULT FALSE,
  crvs_notification_id TEXT, -- Tracking ID from mock webhook
  attending_staff_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PAEDIATRIC WARD
-- ==========================================

-- Growth Monitoring
CREATE TABLE public.growth_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  head_circumference_cm numeric(4,1),
  z_score_weight_age numeric(3,2),
  z_score_height_age numeric(3,2),
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IMCI Assessments
CREATE TABLE public.imci_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  danger_signs JSONB, -- Array of danger signs present
  main_symptoms JSONB, -- Array of symptoms e.g., cough, diarrhea, fever
  nutritional_status TEXT,
  classification TEXT, -- Green, Yellow, Pink
  treatment_plan TEXT,
  assessor_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guardian Consents
CREATE TABLE public.guardian_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_relation TEXT NOT NULL,
  guardian_id_number TEXT,
  consent_granted BOOLEAN DEFAULT TRUE,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. SURGICAL WARD & THEATRE
-- ==========================================

-- Surgical Bookings
CREATE TABLE public.surgical_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  priority TEXT, -- 'Elective', 'Emergency', 'Urgent'
  schedule_date TIMESTAMP WITH TIME ZONE,
  surgeon_id UUID REFERENCES public.users(id),
  anaesthetist_id UUID REFERENCES public.users(id),
  theatre_number TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in-progress', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-op Checklist (WHO)
CREATE TABLE public.pre_op_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.surgical_bookings(id) ON DELETE CASCADE,
  sign_in_completed BOOLEAN DEFAULT FALSE,
  time_out_completed BOOLEAN DEFAULT FALSE,
  sign_out_completed BOOLEAN DEFAULT FALSE,
  asa_grade TEXT,
  airway_risk TEXT,
  allergies_checked BOOLEAN DEFAULT FALSE,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intraoperative Records
CREATE TABLE public.intraop_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.surgical_bookings(id) ON DELETE CASCADE,
  cpt_code TEXT,
  duration_minutes INT,
  blood_loss_ml INT,
  implants_used TEXT,
  complications TEXT,
  anaesthesia_agent TEXT,
  reversal_agent TEXT,
  cssd_batch_used TEXT, -- Tied to CSSD module later
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-op Recovery
CREATE TABLE public.post_op_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.surgical_bookings(id) ON DELETE CASCADE,
  aldrete_score INT,
  recovery_vitals JSONB, -- Snapshot of vitals object
  cleared_for_ward BOOLEAN DEFAULT FALSE,
  ssi_surveillance_flag BOOLEAN DEFAULT FALSE, -- Flagged for 30-day monitoring
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. HIGH DEPENDENCY UNIT (HDU) / ICU
-- ==========================================

-- High-Frequency ICU Vitals
CREATE TABLE public.icu_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID,
  record_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hr INT,
  bp_sys INT,
  bp_dia INT,
  map INT, -- Mean Arterial Pressure
  spo2 INT,
  temp numeric(3,1),
  respiratory_rate INT,
  ventilator_mode TEXT,
  fio2 numeric(3,2),
  peep INT,
  tidal_volume INT,
  recorded_by UUID REFERENCES public.users(id)
);

-- Clinical Scoring
CREATE TABLE public.icu_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL, -- 'RASS', 'CPOT', 'APACHE II', 'SOFA'
  score_value INT NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fluid Balance (I/O)
CREATE TABLE public.icu_fluid_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  input_type TEXT, -- e.g., 'IV NS', 'Oral', 'NG Tube'
  input_amount_ml INT DEFAULT 0,
  output_type TEXT, -- e.g., 'Urine', 'Drain', 'Emesis'
  output_amount_ml INT DEFAULT 0,
  recorded_by UUID REFERENCES public.users(id)
);

-- MDT Round Notes
CREATE TABLE public.mdt_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL, -- 'Doctor', 'Nurse', 'Physiotherapist', 'Nutritionist'
  notes TEXT NOT NULL,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. ISOLATION WARD
-- ==========================================

-- Isolation Logs
CREATE TABLE public.isolation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  isolation_type TEXT NOT NULL, -- 'Airborne', 'Droplet', 'Contact', 'Strict'
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  notifiable_disease TEXT, -- e.g. 'Cholera', 'Measles'
  reported_to_county BOOLEAN DEFAULT FALSE,
  ordered_by UUID REFERENCES public.users(id)
);

-- PPE Usage Log
CREATE TABLE public.ppe_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isolation_id UUID NOT NULL REFERENCES public.isolation_logs(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.users(id),
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ppe_type TEXT, -- 'Full HAZMAT', 'N95 + Gown', etc.
  exposure_risk TEXT -- 'Low', 'High', 'Breach'
);

-- Contact Tracing
CREATE TABLE public.contact_tracing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isolation_id UUID NOT NULL REFERENCES public.isolation_logs(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  relationship TEXT,
  risk_level TEXT,
  symptoms_reported BOOLEAN DEFAULT FALSE,
  followed_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RLS (Row Level Security) - Basic Setup allowing authenticated access
-- Requires the supabase instance to have authenticated configured. Replace with your actual RLS rules.
-- ALTER TABLE public.anc_visits ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read/write for authenticated users" ON public.anc_visits FOR ALL TO authenticated USING (true);
