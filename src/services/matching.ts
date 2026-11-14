// ====================================================================
// WALK WITH BUDDY - MATCHING ENGINE SERVICE
// ====================================================================

import { supabase } from './supabase';
import { CandidateBuddy, MatchItem, LikeActionResponse, Profile } from '../types';
import { matchingLogic } from '../utils/matchingLogic';

export const matchingService = {
  /**
   * Fetches eligible buddies nearby using the server-side RPC get_candidate_matches
   */
  async fetchCandidates(radiusKm?: number, limit = 20, offset = 0): Promise<CandidateBuddy[]> {
    const { data, error } = await supabase.rpc('get_candidate_matches', {
      radius_km_override: radiusKm || null,
      limit_count: limit,
      offset_count: offset,
    });

    if (error) {
      console.warn('RPC get_candidate_matches failed, checking direct fallback:', error.message);
      return [];
    }

    return (data || []) as CandidateBuddy[];
  },

  /**
   * Sends a like or pass. Returns whether an atomic mutual match was created.
   */
  async sendAction(targetUserId: string, action: 'like' | 'pass'): Promise<LikeActionResponse> {
    const { data, error } = await supabase.rpc('send_like', {
      target_user_id: targetUserId,
      action_type: action,
    });

    if (error) throw error;
    return (data || { matched: false }) as LikeActionResponse;
  },

  /**
   * Fetches active mutual matches for the authenticated user
   */
  async fetchMatches(): Promise<MatchItem[]> {
    const { data, error } = await supabase.rpc('get_user_matches');

    if (error) {
      console.warn('RPC get_user_matches error:', error.message);
      return [];
    }

    return (data || []) as MatchItem[];
  },

  /**
   * Unmatches a buddy (deactivates match)
   */
  async unmatch(matchId: string): Promise<void> {
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
