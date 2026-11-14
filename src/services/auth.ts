// ====================================================================
// WALK WITH BUDDY - AUTHENTICATION SERVICE
// ====================================================================

import { supabase } from './supabase';
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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

  async deleteAccount(userId: string) {
    // Delete profile and cascade will remove user data
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    await supabase.auth.signOut();
  },
};
