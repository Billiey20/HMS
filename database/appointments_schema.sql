-- ==============================================================================
-- APPOINTMENTS SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  clinic VARCHAR(100),
  doctor_id UUID REFERENCES public.users(id),
  visit_type VARCHAR(50) DEFAULT 'General Consultation',
  reason TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'missed'
  booked_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" 
  ON public.appointments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert appointments" 
  ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments" 
  ON public.appointments FOR UPDATE TO authenticated USING (true);
