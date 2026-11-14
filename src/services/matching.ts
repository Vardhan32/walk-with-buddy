// ====================================================================
// WALK WITH BUDDY - MATCHING ENGINE SERVICE (SECURITY HARDENED)
// ====================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { CandidateBuddy, MatchItem, LikeActionResponse } from '../types';
import { matchingLogic } from '../utils/matchingLogic';

export interface CandidatesResult {
  data: CandidateBuddy[];
  error?: string;
}

export const matchingService = {
  /**
   * Fetches eligible buddies nearby using the server-side RPC get_candidate_matches.
   * Surfaces errors transparently to callers rather than silently returning an empty list.
   */
  async fetchCandidates(radiusKm?: number, limit = 20, offset = 0): Promise<CandidatesResult> {
    if (!isSupabaseConfigured()) {
      return { data: [] };
    }

    const { data, error } = await supabase.rpc('get_candidate_matches', {
      radius_km_override: radiusKm || null,
      limit_count: limit,
      offset_count: offset,
    });

    if (error) {
      console.error('RPC get_candidate_matches error:', error.message);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as CandidateBuddy[] };
  },

  /**
   * Sends a like or pass. Returns whether an atomic mutual match was created.
   */
  async sendAction(targetUserId: string, action: 'like' | 'pass'): Promise<LikeActionResponse> {
    if (!isSupabaseConfigured()) {
      return { matched: false };
    }

    const { data, error } = await supabase.rpc('send_like', {
      target_user_id: targetUserId,
      action_type: action,
    });

    if (error) {
      console.error('RPC send_like error:', error.message);
      throw error;
    }
    return (data || { matched: false }) as LikeActionResponse;
  },

  /**
   * Fetches active mutual matches for the authenticated user
   */
  async fetchMatches(): Promise<MatchItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_user_matches');

    if (error) {
      console.error('RPC get_user_matches error:', error.message);
      throw error;
    }

    return (data || []) as MatchItem[];
  },

  /**
   * Unmatches a buddy (deactivates match)
   */
  async unmatch(matchId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('matches')
      .update({ is_active: false })
      .eq('id', matchId);

    if (error) throw error;
  },

  calculateCompatibility: matchingLogic.calculateCompatibility,
  isGenderCompatible: matchingLogic.isGenderCompatible,
  haversineDistance: matchingLogic.haversineDistance,
  getCanonicalMatchPair: matchingLogic.getCanonicalMatchPair,
};
