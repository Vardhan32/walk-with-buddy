// ====================================================================
// WALK WITH BUDDY - PROFILE SERVICE
// ====================================================================

import { supabase } from './supabase';
import { Profile, Interest, DaySlot } from '../types';

export const profileService = {
  async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async fetchInterestsCatalog(): Promise<Interest[]> {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return (data || []) as Interest[];
  },

  async fetchUserInterests(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_interests')
      .select('interest_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((row) => row.interest_id);
  },

  async updateUserInterests(userId: string, interestIds: string[]): Promise<void> {
    // Delete existing interests
    const { error: delError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    if (interestIds.length > 0) {
      const rows = interestIds.map((id) => ({
        user_id: userId,
        interest_id: id,
      }));
      const { error: insError } = await supabase
        .from('user_interests')
        .insert(rows);
      if (insError) throw insError;
    }
  },

  async fetchUserAvailability(userId: string): Promise<DaySlot[]> {
    const { data, error } = await supabase
      .from('availability')
      .select('day_slot')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []).map((row) => row.day_slot as DaySlot);
  },

  async updateUserAvailability(userId: string, slots: DaySlot[]): Promise<void> {
    const { error: delError } = await supabase
      .from('availability')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    if (slots.length > 0) {
      const rows = slots.map((slot) => ({
        user_id: userId,
        day_slot: slot,
        is_active: true,
      }));
      const { error: insError } = await supabase
        .from('availability')
        .insert(rows);
      if (insError) throw insError;
    }
  },

  async uploadAvatar(userId: string, base64OrUri: string): Promise<string> {
    // In demo / starter mode, or when Supabase storage bucket 'avatars' is configured
    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Convert uri to blob if necessary
      const response = await fetch(base64OrUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await this.updateProfile(userId, { avatar_url: urlData.publicUrl });
      return urlData.publicUrl;
    } catch {
      // Gracefully set avatar_url to the URI directly if storage bucket is not yet created
      await this.updateProfile(userId, { avatar_url: base64OrUri });
      return base64OrUri;
    }
  },
};
