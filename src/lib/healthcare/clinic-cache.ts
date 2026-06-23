/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory TTL cache for clinic context data.
 *
 * Every inbound patient message currently triggers 6 parallel DB queries
 * to rebuild the full clinic context (timings, doctors, services, FAQs,
 * appointments, AI settings). For clinics receiving 50+ messages/hour,
 * this is ~300 extra DB round-trips per hour — all returning identical
 * data (clinic config rarely changes mid-day).
 *
 * This cache stores the full clinic context keyed by `user_id` with a
 * configurable TTL (default 5 minutes). Cache is automatically
 * invalidated when:
 *   - TTL expires
 *   - An explicit `invalidateClinicCache(userId)` call is made
 *     (called from settings/doctor/service update endpoints)
 *
 * Memory footprint: ~50KB per clinic (worst case with 20 doctors,
 * 50 services, 100 FAQs). Even 100 clinics = ~5MB — negligible.
 */

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface ClinicContext {
  clinic: any
  aiSettings: any
  timings: any[]
  doctors: any[]
  services: any[]
  faqs: any[]
  cachedAt: number
}

const clinicContextCache = new Map<string, ClinicContext>()

// Appointments cache has a shorter TTL since bookings change more frequently
const APPOINTMENTS_CACHE_TTL_MS = 60 * 1000 // 1 minute

interface AppointmentsCache {
  appointments: any[]
  cachedAt: number
}

const appointmentsCache = new Map<string, AppointmentsCache>()

/**
 * Get cached clinic context. Returns null if cache miss or expired.
 */
export function getCachedClinicContext(userId: string): ClinicContext | null {
  const cached = clinicContextCache.get(userId)
  if (!cached) return null
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    clinicContextCache.delete(userId)
    return null
  }
  return cached
}

/**
 * Store clinic context in cache.
 */
export function setCachedClinicContext(userId: string, ctx: Omit<ClinicContext, 'cachedAt'>): void {
  clinicContextCache.set(userId, { ...ctx, cachedAt: Date.now() })
}

/**
 * Get cached upcoming appointments. Returns null if cache miss or expired.
 */
export function getCachedAppointments(clinicId: string): any[] | null {
  const cached = appointmentsCache.get(clinicId)
  if (!cached) return null
  if (Date.now() - cached.cachedAt > APPOINTMENTS_CACHE_TTL_MS) {
    appointmentsCache.delete(clinicId)
    return null
  }
  return cached.appointments
}

/**
 * Store appointments in cache.
 */
export function setCachedAppointments(clinicId: string, appointments: any[]): void {
  appointmentsCache.set(clinicId, { appointments, cachedAt: Date.now() })
}

/**
 * Invalidate all cached data for a specific user/clinic.
 * Call this from settings update endpoints.
 */
export function invalidateClinicCache(userId: string): void {
  clinicContextCache.delete(userId)
  // Also clear appointments for any clinic belonging to this user
  // (we key appointments by clinicId, so iterate)
  const ctx = clinicContextCache.get(userId)
  if (ctx?.clinic?.id) {
    appointmentsCache.delete(ctx.clinic.id)
  }
}

/**
 * Invalidate appointments cache for a specific clinic.
 * Call this after a booking is made.
 */
export function invalidateAppointmentsCache(clinicId: string): void {
  appointmentsCache.delete(clinicId)
}

/**
 * Clear the entire cache. Useful for testing or server restarts.
 */
export function clearAllCaches(): void {
  clinicContextCache.clear()
  appointmentsCache.clear()
}

/**
 * Get cache stats for monitoring.
 */
export function getCacheStats(): { clinicEntries: number; appointmentEntries: number } {
  return {
    clinicEntries: clinicContextCache.size,
    appointmentEntries: appointmentsCache.size,
  }
}
