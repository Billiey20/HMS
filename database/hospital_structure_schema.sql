-- ==============================================================================
-- HOSPITAL STRUCTURE (DESKS & WARDS MANAGEMENT)
-- ==============================================================================

-- Create working stations/desks configured per department
CREATE TABLE IF NOT EXISTS public.working_desks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, name)
);

-- Ensure wards table has a short name column for bed auto-generation
ALTER TABLE public.wards ADD COLUMN IF NOT EXISTS short_name VARCHAR(20);

-- Make sure we have proper references for beds
-- (Wards & Beds are pre-defined in schema.sql but we document structural ties here)

-- Optional: Enable RLS on desks
ALTER TABLE public.working_desks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can view desks" ON public.working_desks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage desks" ON public.working_desks FOR ALL TO authenticated USING (true); -- Assuming broad access in testing, tighten as needed based on JWT roles.
