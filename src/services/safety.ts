// ====================================================================
// WALK WITH BUDDY - SAFETY, MODERATION & VERIFICATION SERVICE
// ====================================================================

import { supabase } from './supabase';
import { BlockRecord, ReportCategory, VerificationRequest } from '../types';

export const safetyService = {
  /**
   * Blocks a user and immediately deactivates any existing match
   */
  async blockUser(targetUserId: string, reason = 'User requested block'): Promise<void> {
    const { error } = await supabase.rpc('block_user_rpc', {
      target_user_id: targetUserId,
      block_reason: reason,
    });

    if (error) throw error;
  },

  /**
   * Retrieves list of blocked users for management
   */
  async fetchBlockedUsers(currentUserId: string): Promise<BlockRecord[]> {
    const { data, error } = await supabase
      .from('blocks')
      .select('*, blocked_user:profiles!blocked_id(*)')
      .eq('blocker_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BlockRecord[];
  },

  /**
   * Unblocks a previously blocked user
   */
  async unblockUser(blockId: string): Promise<void> {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;
  },

  /**
   * Submits a detailed report against a user
   */
  async reportUser(
    targetUserId: string,
    category: ReportCategory,
    description: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('report_user_rpc', {
      target_user_id: targetUserId,
      report_category: category,
      report_desc: description,
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Submits a professional identity verification request
   */
  async submitVerificationRequest(
    profession: string,
    organization: string,
    docType: 'id_card' | 'license' | 'degree_certificate' | 'work_email_or_badge' | 'other',
    docUrl = ''
  ): Promise<string> {
    const { data, error } = await supabase.rpc('submit_verification_request', {
      prof: profession,
      org: organization,
      doc_type: docType,
      doc_url: docUrl,
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Fetches verification status for current user
   */
  async fetchMyVerificationStatus(currentUserId: string): Promise<VerificationRequest | null> {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as VerificationRequest | null;
  },
};
