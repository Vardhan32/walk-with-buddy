// ====================================================================
// WALK WITH BUDDY - AUTHENTICATION CONTEXT
// ====================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Profile } from '../types';
import { profileService } from '../services/profile';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
}

const DEMO_USER_PROFILE: Profile = {
  id: 'demo-user-123',
  email: 'harsha@example.com',
  display_name: 'Harsha Vardhan',
  age: 26,
  date_of_birth: '1998-05-15',
  gender: 'male',
  gender_preference: 'all',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Software engineer passionate about AI, tech startups, and evening walks around Durgam Cheruvu lakefront.',
  profession: 'Senior Software Engineer',
  is_profession_verified: true,
  verification_badge_title: 'Verified Software Engineer',
  preferred_activities: ['evening_stroll', 'tech_talk', 'coffee_chat'],
  preferred_walking_distance: 'medium_3_5km',
  walking_pace: 'moderate',
  discovery_radius_km: 5,
  latitude: 17.4375,
  longitude: 78.3842,
  approx_city: 'Hyderabad',
  approx_area: 'Hitec City',
  is_location_visible: true,
  is_onboarded: true,
  is_age_verified: true,
  age_assurance_status: 'verified',
  is_suspended: false,
  role: 'admin', // Allows testing both user and admin views
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateCurrentProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const p = await profileService.fetchProfile(userId);
      if (p) {
        setProfile(p);
      } else {
        // Fallback profile if new signup hasn't populated trigger yet
        setProfile({
          ...DEMO_USER_PROFILE,
          id: userId,
          is_onboarded: false,
        });
      }
    } catch (e) {
      console.warn('Error fetching user profile:', e);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    } else if (!isSupabaseConfigured()) {
      // In demo mode, keep profile available
      setProfile(DEMO_USER_PROFILE);
    }
  };

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (user?.id && isSupabaseConfigured()) {
      const updated = await profileService.updateProfile(user.id, updates);
      setProfile(updated);
    } else {
      // Local state update for immediate testing
      setProfile((prev) => (prev ? { ...prev, ...updates } : { ...DEMO_USER_PROFILE, ...updates }));
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (!isSupabaseConfigured()) {
          // If Supabase keys are not set yet, load demo profile for full offline evaluation
          if (mounted) {
            setUser({ id: DEMO_USER_PROFILE.id, email: DEMO_USER_PROFILE.email });
            setProfile(DEMO_USER_PROFILE);
            setIsLoading(false);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const isOnboarded = Boolean(profile?.is_onboarded);
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isOnboarded,
        isAdmin,
        signOut,
        refreshProfile,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
