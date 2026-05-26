-- ============================================================
-- 015_HEALTHCARE_RLS_FIX.SQL
-- Migration to re-create AI Healthcare RLS policies with proper insert permissions (WITH CHECK)
-- ============================================================

-- clinics RLS:
DROP POLICY IF EXISTS "Users can manage own clinic" ON clinics;
CREATE POLICY "Users can manage own clinic" ON clinics FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- clinic_timings RLS:
DROP POLICY IF EXISTS "Users can manage own clinic timings" ON clinic_timings;
CREATE POLICY "Users can manage own clinic timings" ON clinic_timings FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_timings.clinic_id AND clinics.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_timings.clinic_id AND clinics.user_id = auth.uid()));

-- doctors RLS:
DROP POLICY IF EXISTS "Users can manage own doctors" ON doctors;
CREATE POLICY "Users can manage own doctors" ON doctors FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = doctors.clinic_id AND clinics.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = doctors.clinic_id AND clinics.user_id = auth.uid()));

-- clinic_services RLS:
DROP POLICY IF EXISTS "Users can manage own clinic services" ON clinic_services;
CREATE POLICY "Users can manage own clinic services" ON clinic_services FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_services.clinic_id AND clinics.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_services.clinic_id AND clinics.user_id = auth.uid()));

-- clinic_faqs RLS:
DROP POLICY IF EXISTS "Users can manage own clinic faqs" ON clinic_faqs;
CREATE POLICY "Users can manage own clinic faqs" ON clinic_faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_faqs.clinic_id AND clinics.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = clinic_faqs.clinic_id AND clinics.user_id = auth.uid()));

-- ai_settings RLS:
DROP POLICY IF EXISTS "Users can manage own ai settings" ON ai_settings;
CREATE POLICY "Users can manage own ai settings" ON ai_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = ai_settings.clinic_id AND clinics.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = ai_settings.clinic_id AND clinics.user_id = auth.uid()));

-- appointments RLS:
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments;
CREATE POLICY "Users can manage own appointments" ON appointments FOR ALL
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = appointments.clinic_id AND clinics.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = appointments.clinic_id AND clinics.user_id = auth.uid()));

-- Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
