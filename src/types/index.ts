// ====================================================================
// WALK WITH BUDDY - CORE TYPE DEFINITIONS
// ====================================================================

export type GenderType = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';
export type GenderPreferenceType = 'all' | 'men' | 'women' | 'non_binary';

export type WalkingDistancePref = 'short_1_2km' | 'medium_3_5km' | 'long_5km_plus';
export type WalkingPace = 'relaxed' | 'moderate' | 'brisk';
export type DiscoveryRadius = 1 | 2 | 5 | 10 | 15;

export type UserRole = 'user' | 'moderator' | 'admin';

export type DaySlot = 'weekday_morning' | 'weekday_evening' | 'weekend_morning' | 'weekend_evening';

export interface Profile {
  id: string;
  email?: string;
  display_name: string;
  date_of_birth?: string;
  age: number;
  avatar_url?: string;
  gender: GenderType;
  gender_preference: GenderPreferenceType;
  bio?: string;
  profession?: string;
  is_profession_verified: boolean;
  verification_badge_title?: string;
  preferred_activities: string[];
  preferred_walking_distance: WalkingDistancePref;
  walking_pace: WalkingPace;
  discovery_radius_km: DiscoveryRadius;
  latitude?: number;
  longitude?: number;
  approx_city: string;
  approx_area: string;
  is_location_visible: boolean;
  is_onboarded: boolean;
  is_age_verified: boolean;
  age_assurance_status: 'pending' | 'verified' | 'rejected';
  is_suspended: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest_id: string;
  interest?: Interest;
}

export interface CandidateBuddy {
  id: string;
  display_name: string;
  age: number;
  bio: string;
  avatar_url?: string;
  profession?: string;
  is_profession_verified: boolean;
  verification_badge_title?: string;
  preferred_activities: string[];
  preferred_walking_distance: WalkingDistancePref;
  walking_pace: WalkingPace;
  approx_distance_km: number;
  approx_area: string;
  shared_interests: string[];
  compatibility_score: number;
}

export interface MatchItem {
  match_id: string;
  matched_at: string;
  compatibility_score: number;
  last_message_at: string;
  last_message_snippet?: string;
  unread_count: number;
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  partner_profession?: string;
  partner_verified: boolean;
  partner_approx_area: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  delivery_status?: 'sending' | 'sent' | 'failed';
  client_id?: string;
}

export interface LikeActionResponse {
  matched: boolean;
  match_id?: string;
  partner?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    profession?: string;
    is_profession_verified: boolean;
    approx_area: string;
  };
}

export type ReportCategory =
  | 'harassment'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'spam'
  | 'safety_concern'
  | 'scam_or_commercial'
  | 'other';

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  category: ReportCategory;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  reported_user?: Profile;
  reporter_user?: Profile;
}

export interface BlockRecord {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string;
  created_at: string;
  blocked_user?: Profile;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  profession: string;
  organization_or_details: string;
  document_url?: string;
  document_type: 'id_card' | 'license' | 'degree_certificate' | 'work_email_or_badge' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  user?: Profile;
}
