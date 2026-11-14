// ====================================================================
// WALK WITH BUDDY - PURE MATCHING & PROXIMITY LOGIC (CORE ENGINE)
// ====================================================================

import { APP_CONFIG } from '../constants/config';
import { Profile } from '../types';

export const matchingLogic = {
  /**
   * Client-side compatibility calculation (Exact parity with database algorithm)
   * Weights:
   *  - Shared Interests: 40%
   *  - Proximity: 30%
   *  - Availability Overlap: 20%
   *  - Walking Preferences: 10%
   */
  calculateCompatibility(
    user: Partial<Profile>,
    candidate: Partial<Profile>,
    sharedInterestsCount = 0,
    distanceKm = 3.0,
    sharedAvailabilityCount = 0
  ): number {
    const weights = APP_CONFIG.matchingWeights;
    const searchRadius = user.discovery_radius_km || 10;

    // 1. Interests score: 4+ shared interests gives 100%
    const interestScore = Math.min(sharedInterestsCount / 4, 1.0) * 100;

    // 2. Proximity score: closer = higher score
    const proximityScore = Math.max(0, 1.0 - distanceKm / Math.max(searchRadius, 1.0)) * 100;

    // 3. Availability score: 2+ slots overlap gives 100%
    const availabilityScore = Math.min(sharedAvailabilityCount / 2, 1.0) * 100;

    // 4. Walking preference score
    const walkingScore = user.preferred_walking_distance === candidate.preferred_walking_distance ? 100 : 50;

    const composite =
      interestScore * weights.sharedInterests +
      proximityScore * weights.proximity +
      availabilityScore * weights.availability +
      walkingScore * weights.walkingPreferences;

    // Constrain score between 40% (minimum baseline) and 100%
    return Math.round(Math.min(100, Math.max(40, composite)));
  },

  /**
   * Checks mutual gender preference compatibility
   */
  isGenderCompatible(
    genderA: string,
    prefA: string,
    genderB: string,
    prefB: string
  ): boolean {
    const aAcceptsB =
      prefA === 'all' ||
      (prefA === 'men' && genderB === 'male') ||
      (prefA === 'women' && genderB === 'female') ||
      (prefA === 'non_binary' && (genderB === 'non_binary' || genderB === 'other'));

    const bAcceptsA =
      prefB === 'all' ||
      (prefB === 'men' && genderA === 'male') ||
      (prefB === 'women' && genderA === 'female') ||
      (prefB === 'non_binary' && (genderA === 'non_binary' || genderA === 'other'));

    return aAcceptsB && bAcceptsA;
  },

  /**
   * Calculates distance between coordinates in km using Haversine formula
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const r = 6371; // Earth's radius in km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(r * c * 10) / 10;
  },

  /**
   * Generates unique canonical match pair to eliminate race conditions
   */
  getCanonicalMatchPair(uidA: string, uidB: string): [string, string] {
    return [uidA < uidB ? uidA : uidB, uidA < uidB ? uidB : uidA];
  },
};
