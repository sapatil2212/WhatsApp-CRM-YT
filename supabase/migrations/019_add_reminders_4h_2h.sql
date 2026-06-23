-- ============================================================
-- 019_ADD_REMINDERS_4H_2H.SQL
-- Migration to add 4h and 2h reminder sent tracking columns to appointments
-- ============================================================

-- Add reminder tracking columns
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_4h_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;

-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
