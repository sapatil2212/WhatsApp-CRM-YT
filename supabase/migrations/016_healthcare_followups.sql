-- ============================================================
-- 016_HEALTHCARE_FOLLOWUPS.SQL
-- Adds automated follow-up and feedback tracking columns,
-- plus patient intake and symptom triage support.
-- ============================================================

-- Add follow-up tracking columns to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS feedback_sent BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS followup_sent BOOLEAN DEFAULT false;

-- Index for efficient cron queries on pending follow-ups
CREATE INDEX IF NOT EXISTS idx_appointments_feedback_pending
  ON appointments (status, feedback_sent)
  WHERE status = 'completed' AND (feedback_sent IS NULL OR feedback_sent = false);

CREATE INDEX IF NOT EXISTS idx_appointments_followup_pending
  ON appointments (status, followup_sent)
  WHERE status = 'completed' AND (followup_sent IS NULL OR followup_sent = false);

-- Patient intake forms table — collected via WhatsApp before appointments
CREATE TABLE IF NOT EXISTS patient_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  symptoms TEXT,
  allergies TEXT,
  current_medications TEXT,
  medical_history TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('emergency', 'urgent', 'routine', 'self_care')),
  triage_result JSONB DEFAULT '{}'::jsonb,
  collected_via TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patient_intake ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own patient intake" ON patient_intake;
CREATE POLICY "Users can manage own patient intake" ON patient_intake FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = patient_intake.clinic_id AND clinics.user_id = auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON patient_intake
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Patient feedback responses table
CREATE TABLE IF NOT EXISTS patient_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patient_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own patient feedback" ON patient_feedback;
CREATE POLICY "Users can manage own patient feedback" ON patient_feedback FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = patient_feedback.clinic_id AND clinics.user_id = auth.uid()));

-- Performance index for AI chat logs analytics
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_intent
  ON ai_chat_logs (clinic_id, detected_intent, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_confidence
  ON ai_chat_logs (clinic_id, confidence_score)
  WHERE confidence_score < 0.7;

-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
