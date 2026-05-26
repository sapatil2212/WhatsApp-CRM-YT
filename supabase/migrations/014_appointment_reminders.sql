-- ============================================================
-- 014_APPOINTMENT_REMINDERS.SQL
-- Migration to add reminder sent tracking columns to appointments
-- ============================================================

-- Add reminder tracking columns
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_3h_sent BOOLEAN DEFAULT false;

-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
