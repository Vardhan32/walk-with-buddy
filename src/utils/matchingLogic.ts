// ====================================================================
// WALK WITH BUDDY - PURE MATCHING & PROXIMITY LOGIC (CORE ENGINE)
// ====================================================================

import { APP_CONFIG } from '../constants/config';
import { Profile, DiscoveryMode } from '../types';

export interface MatchCalculationOptions {
  mode?: DiscoveryMode;
  targetProfessions?: string[];
  sharedActivitiesCount?: number;
  profileCompletenessScore?: number;
}

export const matchingLogic = {
  /**
   * 4-Factor legacy & baseline compatibility calculation
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
   * Enhanced 5-Factor Conversational Scoring Engine
   * Weights:
   *  - Shared Interests & Activities: 30%
   *  - Distance Proximity: 25%
   *  - Availability Overlap: 20%
   *  - Discovery / Profession Preference: 15%
   *  - Profile Completeness: 10%
   */
  calculate5FactorCompatibility(
    user: Partial<Profile>,
    candidate: Partial<Profile>,
    sharedInterestsCount = 0,
    distanceKm = 2.5,
    sharedAvailabilityCount = 0,
    options: MatchCalculationOptions = {}
  ): number {
    const searchRadius = user.discovery_radius_km || 10;
    const mode = options.mode || 'similar_interests';
    const targetProfessions = options.targetProfessions;
    const sharedActivitiesCount = options.sharedActivitiesCount || 0;
    const completeness = options.profileCompletenessScore || 90;

    // 1. Interests & Activity (30%)
    let interestScore: number;
    if (mode === 'surprise_me') {
      // In surprise me mode, broad novelty is favored: baseline 75, plus small bonus for any shared interest
      interestScore = Math.min(75 + sharedInterestsCount * 10, 100);
    } else if (mode === 'different_from_me') {
      // Distinct perspectives
      interestScore = candidate.profession !== user.profession ? 90 : 65;
    } else {
      interestScore = Math.min((sharedInterestsCount + sharedActivitiesCount) / 3, 1.0) * 100;
    }

    // 2. Proximity (25%)
    const proximityScore = Math.max(0, 1.0 - distanceKm / Math.max(searchRadius, 1.0)) * 100;

    // 3. Availability (20%)
    const availabilityScore = Math.min(Math.max(sharedAvailabilityCount, 1) / 2, 1.0) * 100;

    // 4. Discovery / Profession Preference (15%)
    let discoveryScore = 75;
    if (mode === 'profession' && targetProfessions && targetProfessions.length > 0) {
      discoveryScore = targetProfessions.some((p) => candidate.profession?.toLowerCase().includes(p.toLowerCase()))
        ? 100
        : 50;
    } else if (mode === 'surprise_me' || mode === 'different_from_me') {
      discoveryScore = candidate.profession !== user.profession ? 95 : 70;
    }

    // 5. Profile Completeness (10%)
    const profileScore = completeness;

    const composite =
      interestScore * 0.30 +
      proximityScore * 0.25 +
      availabilityScore * 0.20 +
      discoveryScore * 0.15 +
      profileScore * 0.10;

    return Math.round(Math.min(100, Math.max(45, composite)));
  },

  /**
   * Generates conversational explanations for why two buddies match
   */
  generateMatchReasons(
    user: Partial<Profile>,
    candidate: Partial<Profile>,
    sharedInterests: string[] = [],
    distanceKm = 2.5,
    mode: DiscoveryMode = 'similar_interests'
  ): string[] {
    const reasons: string[] = [];

    // Distance reason
    if (distanceKm <= 3.0) {
      reasons.push(`Super close by (~${distanceKm} km in ${candidate.approx_area || 'Hyderabad'})`);
    } else {
      reasons.push(`Within your walking radius (~${distanceKm} km)`);
    }

    // Mode-specific reasons
    if (mode === 'surprise_me') {
      if (candidate.profession && candidate.profession !== user.profession) {
        reasons.push(`New perspective from a ${candidate.profession}`);
      } else {
        reasons.push('Curated for serendipitous discovery');
      }
    } else if (mode === 'different_from_me') {
      if (candidate.profession && candidate.profession !== user.profession) {
        reasons.push(`Different professional journey (${candidate.profession})`);
      }
      reasons.push('Brings distinct experiences and hobbies');
    } else if (mode === 'profession') {
      if (candidate.profession) {
        reasons.push(`Matched by profession: ${candidate.profession}`);
      }
    }

    // Shared interests reason
    if (sharedInterests && sharedInterests.length > 0) {
      reasons.push(`Shared passion for ${sharedInterests.slice(0, 2).join(' & ')}`);
    }

    // Walking pace compatibility
    if (candidate.walking_pace && user.walking_pace && candidate.walking_pace === user.walking_pace) {
      reasons.push(`Matching ${candidate.walking_pace} walking pace`);
    }

    // Fallback if sparse
    if (reasons.length < 2) {
      reasons.push('Verified adult buddy ready for a friendly walk');
    }

    return reasons.slice(0, 3);
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
