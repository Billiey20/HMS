-- ==============================================================================
-- HR TIMETABLE, SCHEDULING, AND ATTENDANCE SCHEMA
-- ==============================================================================

-- 1. Weekly Recurring Master Schedules
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  duty_station TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure no overlapping weekly shifts for the same day
  -- (Complex overlapping logic is best handled in the application layer, but we can do a simple constraint)
  UNIQUE(user_id, day_of_week, start_time) 
);

-- 2. Date-Specific Shifts (for Overrides & Locums)
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  duty_station TEXT,
  is_locum BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Staff Leave and Days Off
CREATE TABLE IF NOT EXISTS public.staff_leave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL, -- e.g., 'Annual', 'Sick', 'Maternity', 'Locum Swap'
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  reason TEXT,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Attendance Tracking (Clock-in / Clock-out)
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- one attendance record per user per day max, makes querying simpler
  UNIQUE(user_id, record_date)
);

-- Note: In Supabase, if RLS is enabled on public tables, ensure appropriate policies exist.
-- To allow testing/usage immediately for all authenticated users (assuming basic RLS structure):
-- ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "All authenticated can read/write schedules" ON public.staff_schedules FOR ALL TO authenticated USING (true);
-- ... etc for other tables if RLS is strict.
