// ====================================================================
// WALK WITH BUDDY - REALTIME CHAT SERVICE (SECURITY HARDENED)
// ====================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Message } from '../types';

export const chatService = {
  /**
   * Fetches conversation messages with optional pagination
   */
  async fetchMessages(
    matchId: string,
    limit = 50,
    beforeTimestamp?: string
  ): Promise<Message[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Message[];
  },

  /**
   * Sends a message into a match conversation
   */
  async sendMessage(matchId: string, senderId: string, content: string): Promise<Message> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Message cannot be empty');
    }

    if (!isSupabaseConfigured()) {
      return {
        id: `mock-${Date.now()}`,
        match_id: matchId,
        sender_id: senderId,
        content: trimmed,
        is_read: false,
        created_at: new Date().toISOString(),
        delivery_status: 'sent',
      };
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content: trimmed,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, delivery_status: 'sent' } as Message;
  },

  /**
   * Secure read-receipt RPC call (Prevents message column tampering)
   */
  async markMessagesAsRead(matchId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.rpc('mark_messages_read', {
      p_match_id: matchId,
    });

    if (error) {
      console.warn('mark_messages_read RPC error:', error.message);
    }
  },

  /**
   * Subscribes to Supabase Realtime messages for an active match with reliable cleanup
   */
  subscribeToMessages(matchId: string, onNewMessage: (msg: Message) => void) {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const channelName = `realtime-chat-${matchId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
