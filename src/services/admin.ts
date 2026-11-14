// ====================================================================
// WALK WITH BUDDY - ADMIN SERVICE
// ====================================================================

import { supabase } from './supabase';
import { Report, VerificationRequest } from '../types';

export const adminService = {
  /**
   * Fetches all user reports for admin review
   */
  async fetchReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter_user:profiles!reporter_id(display_name, email), reported_user:profiles!reported_id(display_name, email, is_suspended)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Report[];
  },

  /**
   * Reviews a report, updates status and optionally suspends the offending account
   */
  async reviewReport(
    reportId: string,
    newStatus: 'pending' | 'investigating' | 'resolved' | 'dismissed',
    adminNotes: string,
    suspendUser = false
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_review_report', {
      report_id: reportId,
      new_status: newStatus,
      admin_notes_text: adminNotes,
      suspend_user: suspendUser,
    });

    if (error) throw error;
  },

  /**
   * Fetches pending professional verification requests
   */
  async fetchVerificationRequests(): Promise<VerificationRequest[]> {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*, user:profiles!user_id(display_name, email, is_profession_verified)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VerificationRequest[];
  },

  /**
   * Approves or rejects a verification request
   */
  async reviewVerificationRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    reason = '',
    badgeTitle = ''
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_review_verification', {
      request_id: requestId,
      new_status: status,
      reason: reason || null,
      badge_title: badgeTitle || null,
    });

    if (error) throw error;
  },

  /**
   * Toggles account suspension directly
   */
  async toggleUserSuspension(userId: string, isSuspended: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: isSuspended })
      .eq('id', userId);

    if (error) throw error;
  },
};
