-- ============================================================
-- 017_APPOINTMENT_PATIENT_DETAILS.SQL
-- Adds patient intake fields (name, age, reason for visit)
-- directly on the appointments table for quick access, and
-- adds a Google Sheets sync tracking column.
-- ============================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS patient_name      TEXT,
  ADD COLUMN IF NOT EXISTS patient_age       TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_visit  TEXT,
  ADD COLUMN IF NOT EXISTS sheets_synced     BOOLEAN DEFAULT false;

-- Index for analytics by reason
CREATE INDEX IF NOT EXISTS idx_appointments_reason
  ON appointments (clinic_id, reason_for_visit)
  WHERE reason_for_visit IS NOT NULL;

-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
