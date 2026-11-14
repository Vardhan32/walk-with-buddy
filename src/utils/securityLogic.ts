// ====================================================================
// WALK WITH BUDDY - SECURITY LOGIC & DATA SANITIZATION UTILITIES
// ====================================================================

/**
 * Validates whether latitude and longitude are within standard geographical boundaries.
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Calculates user age based on date of birth (ISO YYYY-MM-DD or parseable date string).
 * Strictly requires 18+ for adult community assurance.
 */
export function calculateAge(dobString: string): { age: number; isAdult: boolean; isValid: boolean } {
  if (!dobString) {
    return { age: 0, isAdult: false, isValid: false };
  }

  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) {
    return { age: 0, isAdult: false, isValid: false };
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Sanity check: age must be non-negative and realistic (< 120)
  if (age < 0 || age > 120) {
    return { age, isAdult: false, isValid: false };
  }

  return {
    age,
    isAdult: age >= 18,
    isValid: true,
  };
}

/**
 * Protected profile fields that ordinary users cannot self-update.
 */
export const PROTECTED_PROFILE_FIELDS = [
  'role',
  'is_profession_verified',
  'verification_badge_title',
  'is_suspended',
  'is_age_verified',
  'age_assurance_status',
  'email',
] as const;

/**
 * Strips privileged / protected fields from client update payload to prevent trigger errors or privilege escalation.
 */
export function sanitizeProfileUpdates<T extends Record<string, any>>(updates: T): Partial<T> {
  const sanitized = { ...updates };
  for (const field of PROTECTED_PROFILE_FIELDS) {
    delete sanitized[field as keyof T];
  }
  return sanitized;
}

/**
 * Checks if a payload contains any attempt to modify protected elevation fields.
 */
export function isElevationAttempt(payload: Record<string, any>): boolean {
  return PROTECTED_PROFILE_FIELDS.some((field) => payload[field] !== undefined);
}

/**
 * Safe public profile allowlist fields (Mirrors PostgreSQL view public_profiles).
 */
export const PUBLIC_PROFILE_ALLOWLIST = [
  'id',
  'display_name',
  'age',
  'avatar_url',
  'profession',
  'is_profession_verified',
  'verification_badge_title',
  'preferred_activities',
  'preferred_walking_distance',
  'walking_pace',
  'approx_city',
  'approx_area',
  'is_location_visible',
  'created_at',
] as const;

/**
 * Filters a raw profile record down to only allowlisted public fields.
 * Explicitly strips PII (email, exact coordinates, DOB, internal roles).
 */
export function projectSafePublicProfile<T extends Record<string, any>>(rawProfile: T): Partial<T> {
  const safe: Record<string, any> = {};
  for (const key of PUBLIC_PROFILE_ALLOWLIST) {
    if (rawProfile[key] !== undefined) {
      safe[key] = rawProfile[key];
    }
  }
  return safe as Partial<T>;
}

/**
 * Deduplicates messages based on unique server `id` or optimistic `client_id`.
 */
export function deduplicateMessages<T extends { id?: string; client_id?: string }>(
  existing: T[],
  incoming: T[]
): T[] {
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();
  const result: T[] = [];

  for (const msg of [...existing, ...incoming]) {
    const hasId = msg.id && seenIds.has(msg.id);
    const hasClientId = msg.client_id && seenClientIds.has(msg.client_id);

    if (hasId || hasClientId) {
      continue;
    }

    if (msg.id) seenIds.add(msg.id);
    if (msg.client_id) seenClientIds.add(msg.client_id);
    result.push(msg);
  }

  return result;
}
