// ====================================================================
// WALK WITH BUDDY - AUTHENTICATION SERVICE (SECURITY HARDENED)
// ====================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { GenderPreferenceType, GenderType } from '../types';

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  gender: GenderType;
  genderPreference: GenderPreferenceType;
}

export const authService = {
  async signUp(params: SignUpParams) {
    if (params.age < 18) {
      throw new Error('You must be at least 18 years old to join Walk With Buddy.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          display_name: params.displayName,
          date_of_birth: params.dateOfBirth,
          age: params.age,
          gender: params.gender,
          gender_preference: params.genderPreference,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'walkwithbuddy://auth/reset-password',
    });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Secure account deletion:
   * Uses server-side RPC delete_own_account to cleanly wipe auth.users and all cascading data.
   * Throws an error immediately if the server fails so the client never reports false success.
   */
  async deleteAccount(userId: string) {
    if (isSupabaseConfigured()) {
      const { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) {
        console.error('Account deletion RPC failed:', rpcError.message);
        throw new Error(`Failed to delete account: ${rpcError.message}`);
      }
      await supabase.auth.signOut();
    }
  },
};
