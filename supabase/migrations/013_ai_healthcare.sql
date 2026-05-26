-- ============================================================
-- 013_AI_HEALTHCARE.SQL
-- Migration to set up AI Healthcare Automation schema and RLS policies
-- ============================================================

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  clinic_name TEXT NOT NULL,
  clinic_type TEXT,
  clinic_description TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  google_map_link TEXT,
  date_exceptions JSONB DEFAULT '[]'::jsonb, -- Clinic-wide holidays/schedule overrides
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own clinic" ON clinics;
CREATE POLICY "Users can manage own clinic" ON clinics FOR ALL USING (auth.uid() = user_id);

-- Create clinic_timings table
CREATE TABLE IF NOT EXISTS clinic_timings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  opening_time TEXT,
  closing_time TEXT,
  is_closed BOOLEAN DEFAULT false,
  lunch_break_start TEXT,
  lunch_break_end TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for clinic_timings
ALTER TABLE clinic_timings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own clinic timings" ON clinic_timings;
CREATE POLICY "Users can manage own clinic timings" ON clinic_timings FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_timings.clinic_id AND clinics.user_id = auth.uid()));

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialization TEXT,
  qualification TEXT,
  experience TEXT,
  available_days TEXT[], -- Array of weekdays e.g. ['Monday', 'Tuesday']
  available_start_time TEXT,
  available_end_time TEXT,
  consultation_fee NUMERIC(12,2) DEFAULT 0,
  languages_spoken TEXT,
  profile_photo TEXT,
  weekly_slots JSONB DEFAULT '{}'::jsonb, -- Weekday slot structures
  date_exceptions JSONB DEFAULT '[]'::jsonb, -- Doctor-specific leaves and timing overrides
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own doctors" ON doctors;
CREATE POLICY "Users can manage own doctors" ON doctors FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = doctors.clinic_id AND clinics.user_id = auth.uid()));

-- Create clinic_services table
CREATE TABLE IF NOT EXISTS clinic_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC(12,2) DEFAULT 0,
  duration INTEGER DEFAULT 30, -- In minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for clinic_services
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own clinic services" ON clinic_services;
CREATE POLICY "Users can manage own clinic services" ON clinic_services FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_services.clinic_id AND clinics.user_id = auth.uid()));

-- Create clinic_faqs table
CREATE TABLE IF NOT EXISTS clinic_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT, -- Comma separated keywords
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for clinic_faqs
ALTER TABLE clinic_faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own clinic faqs" ON clinic_faqs;
CREATE POLICY "Users can manage own clinic faqs" ON clinic_faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_faqs.clinic_id AND clinics.user_id = auth.uid()));

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  ai_enabled BOOLEAN DEFAULT true,
  ai_tone TEXT DEFAULT 'polite',
  supported_languages TEXT[] DEFAULT ARRAY['English'],
  greeting_message TEXT,
  after_hours_message TEXT,
  escalation_keywords TEXT[] DEFAULT ARRAY['human', 'agent', 'operator', 'talk to someone', 'help'],
  emergency_keywords TEXT[] DEFAULT ARRAY['emergency', 'heart attack', 'bleeding', 'accident', 'dying', 'severe pain'],
  human_handover_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for ai_settings
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own ai settings" ON ai_settings;
CREATE POLICY "Users can manage own ai settings" ON ai_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = ai_settings.clinic_id AND clinics.user_id = auth.uid()));

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments;
CREATE POLICY "Users can manage own appointments" ON appointments FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = appointments.clinic_id AND clinics.user_id = auth.uid()));

-- Create ai_chat_logs table
CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  detected_intent TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for ai_chat_logs
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai chat logs" ON ai_chat_logs;
CREATE POLICY "Users can view own ai chat logs" ON ai_chat_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = ai_chat_logs.clinic_id AND clinics.user_id = auth.uid()));

-- Apply set_updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at ON clinics;
DROP TRIGGER IF EXISTS set_updated_at ON clinic_timings;
DROP TRIGGER IF EXISTS set_updated_at ON doctors;
DROP TRIGGER IF EXISTS set_updated_at ON clinic_services;
DROP TRIGGER IF EXISTS set_updated_at ON clinic_faqs;
DROP TRIGGER IF EXISTS set_updated_at ON ai_settings;
DROP TRIGGER IF EXISTS set_updated_at ON appointments;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinic_timings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinic_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinic_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure columns exist in case tables were already created previously
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS date_exceptions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS weekly_slots JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS date_exceptions JSONB DEFAULT '[]'::jsonb;

-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
