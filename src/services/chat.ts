// ====================================================================
// WALK WITH BUDDY - REALTIME CHAT SERVICE
// ====================================================================

import { supabase } from './supabase';
import { Message } from '../types';

export const chatService = {
  /**
   * Fetches past conversation messages
   */
  async fetchMessages(matchId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

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
    return data as Message;
  },

  /**
   * Marks unread incoming messages as read
   */
  async markMessagesAsRead(matchId: string, currentUserId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);
  },

  /**
   * Subscribes to Supabase Realtime messages for an active match
   */
  subscribeToMessages(matchId: string, onNewMessage: (msg: Message) => void) {
    const channelName = `realtime-chat-${matchId}`;
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
