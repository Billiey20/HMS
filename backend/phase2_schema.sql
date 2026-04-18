-- ==============================================================================
-- PHASE 2: SPECIALIZED & VERTICAL CLINICS EXPANSION
-- ==============================================================================
-- Note: Requires `public.patients` and `public.users` tables to exist.

-- ==========================================
-- 3.16.1 Comprehensive Care Clinic (CCC/ART)
-- ==========================================
CREATE TABLE public.ccc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  nascop_upi TEXT, -- Unique Patient Identifier
  who_stage TEXT, -- 'I', 'II', 'III', 'IV'
  current_regimen TEXT,
  regimen_start_date DATE,
  pmtct_linked_child_id UUID REFERENCES public.patients(id), -- If mother-to-child tracking
  tb_coinfection BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active', -- 'Active', 'Defaulter', 'LTFU', 'Transferred Out', 'Dead'
  attending_clinician UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.ccc_lab_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cd4_count INT,
  viral_load_copies INT,
  viral_load_suppressed BOOLEAN, -- Typically < 1000 or < 50 copies depending on guideline
  notes TEXT,
  recorded_by UUID REFERENCES public.users(id)
);

-- ==========================================
-- 3.16.2 TB DOTS Clinic
-- ==========================================
CREATE TABLE public.tb_dots_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tb_registration_number TEXT,
  disease_classification TEXT, -- 'Pulmonary', 'Extra-Pulmonary'
  patient_type TEXT, -- 'New', 'Relapse', 'Treatment after failure'
  treatment_regimen TEXT,
  treatment_start_date DATE,
  treatment_outcome TEXT, -- 'Cured', 'Completed', 'Failed', 'Died', 'LTFU'
  sputum_smear_results TEXT,
  genexpert_results TEXT,
  clinician_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3.16.3 Maternal & Child Health (MCH)
-- ==========================================
CREATE TABLE public.mch_immunizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose_number INT,
  batch_number TEXT,
  vvm_status TEXT, -- Vaccine Vial Monitor status
  date_administered DATE NOT NULL DEFAULT CURRENT_DATE,
  adverse_events TEXT,
  administered_by UUID REFERENCES public.users(id)
);

-- ==========================================
-- 3.16.4 Mental Health Clinic
-- ==========================================
CREATE TABLE public.mental_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  icd11_diagnosis_code TEXT,
  clinical_notes TEXT,
  medication_prescription TEXT,
  referral_to_psychiatric BOOLEAN DEFAULT FALSE,
  severity_score TEXT, -- generic severity tracking mapping
  attending_specialist UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3.16.5 Nutrition Clinic
-- ==========================================
CREATE TABLE public.nutrition_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  muac_cm numeric(4,1), -- Mid-Upper Arm Circumference
  malnutrition_status TEXT, -- 'SAM', 'MAM', 'Normal'
  rutf_dispensed_sachets INT, -- Ready-to-Use Therapeutic Food
  dietary_prescription TEXT,
  dietitian_id UUID REFERENCES public.users(id)
);

-- ==========================================
-- 3.17 Physiotherapy & Rehab
-- ==========================================
CREATE TABLE public.physio_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  referral_source TEXT, -- 'OPD', 'IPD', 'External'
  initial_pain_score INT, -- 1-10
  functional_score_type TEXT, -- e.g., 'Barthel Index'
  functional_score_value numeric(5,2),
  goals_of_therapy TEXT,
  status TEXT DEFAULT 'Active',
  therapist_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.physio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.physio_assessments(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_notes TEXT,
  pain_score_post INT,
  therapist_id UUID REFERENCES public.users(id)
);

-- ==========================================
-- 3.18 Dental Clinic
-- ==========================================
CREATE TABLE public.dental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fdi_32_array JSONB, -- JSON representation of the 32 teeth conditions
  procedures_performed JSONB, -- Array of objects: { tooth: 14, procedure: 'Extraction', cpt: 'D7140' }
  clinical_notes TEXT,
  dentist_id UUID REFERENCES public.users(id)
);

-- ==========================================
-- 3.19 Eye Clinic
-- ==========================================
CREATE TABLE public.eye_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  va_distance_od TEXT, -- Visual Acuity Right (snellen)
  va_distance_os TEXT, -- Visual Acuity Left (snellen)
  va_near_od TEXT,
  va_near_os TEXT,
  iop_od numeric(4,1), -- Intraocular pressure
  iop_os numeric(4,1),
  refraction_od JSONB, -- { sphere, cylinder, axis }
  refraction_os JSONB,
  slit_lamp_notes TEXT,
  optometrist_id UUID REFERENCES public.users(id)
);

-- ==========================================
-- 3.20 Social Work & Counselling
-- ==========================================
CREATE TABLE public.social_work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  case_type TEXT, -- 'Psychosocial', 'GBV', 'Child Protection', 'Financial'
  assessment_notes TEXT,
  prc_form_1_completed BOOLEAN DEFAULT FALSE, -- Post Rape Care
  police_ob_number TEXT,
  community_linkage TEXT, -- e.g., 'Referred to CHP'
  security_lock BOOLEAN DEFAULT FALSE, -- Requires maximum RBAC
  social_worker_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
