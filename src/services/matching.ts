// ====================================================================
// WALK WITH BUDDY - MATCHING ENGINE SERVICE (SECURITY HARDENED)
// ====================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import {
  CandidateBuddy,
  MatchItem,
  LikeActionResponse,
  ConversationalDiscoveryFilter,
  MeetingPlan,
  MeetingProposalStatus,
  GroupWalk,
} from '../types';
import { matchingLogic } from '../utils/matchingLogic';

export interface CandidatesResult {
  data: CandidateBuddy[];
  error?: string;
}

export const matchingService = {
  /**
   * Fetches eligible buddies nearby using the server-side RPC get_candidate_matches.
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
   * Fetches buddies using conversational discovery preferences
   */
  async fetchConversationalMatches(
    filter: ConversationalDiscoveryFilter,
    limit = 20,
    offset = 0
  ): Promise<CandidatesResult> {
    if (!isSupabaseConfigured()) {
      return { data: [] };
    }

    const { data, error } = await supabase.rpc('get_conversational_matches', {
      p_mode: filter.mode,
      p_professions: filter.selectedProfessions && filter.selectedProfessions.length > 0 ? filter.selectedProfessions : null,
      p_activities: filter.activities && filter.activities.length > 0 ? filter.activities : null,
      p_min_age: filter.minAge || 18,
      p_max_age: filter.maxAge || 99,
      p_radius_km: filter.radiusKm || 5,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('RPC get_conversational_matches error:', error.message);
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

  // ==================================================================
  // MEETING PLANS ("PLAN OUR WALK")
  // ==================================================================

  /**
   * Fetches meeting plans for a specific match
   */
  async fetchMeetingPlans(matchId: string): Promise<MeetingPlan[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('meeting_plans')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching meeting plans:', error.message);
      return [];
    }
    return (data || []) as MeetingPlan[];
  },

  /**
   * Proposes a new meeting plan
   */
  async proposeMeetingPlan(params: {
    match_id: string;
    location_name: string;
    address_or_area: string;
    meeting_time: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }): Promise<MeetingPlan | null> {
    if (!isSupabaseConfigured()) return null;

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('meeting_plans')
      .insert({
        match_id: params.match_id,
        proposer_id: user.user.id,
        location_name: params.location_name,
        address_or_area: params.address_or_area,
        meeting_time: params.meeting_time,
        latitude: params.latitude || null,
        longitude: params.longitude || null,
        notes: params.notes || null,
        status: 'proposed',
      })
      .select()
      .single();

    if (error) throw error;
    return data as MeetingPlan;
  },

  /**
   * Responds to a meeting proposal (accept, decline, cancel)
   */
  async respondToMeetingPlan(planId: string, status: MeetingProposalStatus): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('meeting_plans')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) throw error;
  },

  // ==================================================================
  // GROUP WALKS (SMALL GROUP DISCOVERY)
  // ==================================================================

  /**
   * Fetches upcoming group walks
   */
  async fetchGroupWalks(): Promise<GroupWalk[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('group_walks')
      .select(`
        *,
        creator:profiles(id, display_name, avatar_url, profession, is_profession_verified),
        participants:group_walk_participants(
          id, walk_id, user_id, status,
          user:profiles(id, display_name, avatar_url, profession)
        )
      `)
      .eq('status', 'upcoming')
      .order('meeting_time', { ascending: true });

    if (error) {
      console.warn('Error fetching group walks:', error.message);
      return [];
    }
    return (data || []) as GroupWalk[];
  },

  /**
   * Joins a small group walk
   */
  async joinGroupWalk(walkId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_walk_participants')
      .insert({
        walk_id: walkId,
        user_id: user.user.id,
        status: 'joined',
      });

    if (error) throw error;
  },

  /**
   * Leaves a group walk
   */
  async leaveGroupWalk(walkId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_walk_participants')
      .delete()
      .eq('walk_id', walkId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  },

  calculateCompatibility: matchingLogic.calculateCompatibility,
  calculate5FactorCompatibility: matchingLogic.calculate5FactorCompatibility,
  generateMatchReasons: matchingLogic.generateMatchReasons,
  isGenderCompatible: matchingLogic.isGenderCompatible,
  haversineDistance: matchingLogic.haversineDistance,
  getCanonicalMatchPair: matchingLogic.getCanonicalMatchPair,
};
