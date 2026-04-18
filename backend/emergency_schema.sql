-- ==============================================================================
-- ACCIDENT & EMERGENCY / CASUALTY EXPANSION
-- ==============================================================================

CREATE TABLE public.emergency_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  arrival_mode TEXT, -- 'Ambulance', 'Walk-in', 'Police', 'Referral'
  acuity_level TEXT, -- SATS Scale: 'Red', 'Orange', 'Yellow', 'Green', 'Blue'
  chief_complaint TEXT,
  medico_legal_flag TEXT, -- 'Assault', 'RTA', 'GBV', 'Self-Harm', 'None'
  police_ob_number TEXT,
  discharge_disposition TEXT, -- 'Admitted', 'Theatre', 'ICU', 'Discharged', 'Deceased', 'Active'
  discharge_time TIMESTAMP WITH TIME ZONE,
  attending_doctor_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.emergency_ambulance_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.emergency_visits(id) ON DELETE CASCADE,
  ems_crew_details TEXT,
  pre_hospital_vitals JSONB, -- { hr, bp, spo2, gcs, rbs }
  handover_notes TEXT,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.emergency_resuscitation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.emergency_visits(id) ON DELETE CASCADE,
  action_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  abcde_category TEXT, -- 'Airway', 'Breathing', 'Circulation', 'Disability', 'Exposure', 'Medication'
  intervention_details TEXT,
  recorded_by UUID REFERENCES public.users(id)
);

CREATE TABLE public.emergency_trauma_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.emergency_visits(id) ON DELETE CASCADE,
  assessment_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mechanism_of_injury TEXT,
  gcs_eye INT DEFAULT 4,
  gcs_verbal INT DEFAULT 5,
  gcs_motor INT DEFAULT 6,
  fast_exam_result TEXT, -- 'Positive', 'Negative', 'Equivocal', 'Not Done'
  pelvic_binder_applied BOOLEAN DEFAULT FALSE,
  tourniquet_applied BOOLEAN DEFAULT FALSE,
  recorded_by UUID REFERENCES public.users(id)
);
