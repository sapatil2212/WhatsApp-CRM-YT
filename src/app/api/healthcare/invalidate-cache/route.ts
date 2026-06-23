import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateClinicCache } from '@/lib/healthcare/clinic-cache'

/**
 * POST /api/healthcare/invalidate-cache
 *
 * Invalidates the in-memory clinic context cache for the current user.
 * Call this after saving clinic settings, doctors, services, FAQs, or
 * AI settings to ensure the next patient message uses fresh data.
 *
 * Without this, changes would only take effect after the 5-minute
 * cache TTL expires.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  invalidateClinicCache(user.id)

  return NextResponse.json({ success: true, message: 'Cache invalidated' })
}
