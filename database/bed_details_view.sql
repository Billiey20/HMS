-- ==============================================================================
-- DETAILED BEDS VIEW FOR WARD MAP
-- ==============================================================================

-- This view joins all beds with any CURRENTLY active admissions mapped to them.
-- It exposes patient demographics to the Ward Map UI so it can render occupied slots.
CREATE OR REPLACE VIEW public.v_detailed_beds AS
SELECT
  b.id AS bed_id,
  b.ward_id,
  b.bed_no,
  b.status,
  p.patient_no,
  p.first_name || ' ' || p.last_name AS patient_name,
  p.age,
  p.gender,
  a.admitting_diagnosis AS diagnosis,
  a.admitted_at
FROM public.beds b
LEFT JOIN public.admissions a ON a.bed_id = b.id AND a.status = 'active'
LEFT JOIN public.patients p ON p.id = a.patient_id;
