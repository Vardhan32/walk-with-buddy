-- ====================================================================
-- WALK WITH BUDDY - COMPLETE DATABASE MIGRATION & RLS POLICIES
-- Platform: Supabase / PostgreSQL (PostGIS / Haversine Compatible)
-- Initial Launch: Hyderabad, Telangana, India
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER ROLES FOR RESTRICTED ACCESS (Created first for role checks)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- Secure helper function for admin role verification
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp STABLE;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. PROFILES TABLE (Protected with RLS; exact coordinates stored in isolated user_locations)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT NOT NULL DEFAULT '',
    date_of_birth DATE,
    age INTEGER,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other')),
    gender_preference TEXT DEFAULT 'all' CHECK (gender_preference IN ('all', 'men', 'women', 'non_binary')),
    bio TEXT,
    profession TEXT,
    is_profession_verified BOOLEAN NOT NULL DEFAULT false,
    verification_badge_title TEXT,
    preferred_activities TEXT[] DEFAULT '{}',
    preferred_walking_distance TEXT DEFAULT 'medium' CHECK (preferred_walking_distance IN ('short_1_2km', 'medium_3_5km', 'long_5km_plus')),
    walking_pace TEXT DEFAULT 'moderate' CHECK (walking_pace IN ('relaxed', 'moderate', 'brisk')),
    discovery_radius_km INTEGER DEFAULT 5 CHECK (discovery_radius_km IN (1, 2, 5, 10, 15)),
    approx_city TEXT DEFAULT 'Hyderabad',
    approx_area TEXT DEFAULT 'Hitec City',
    is_location_visible BOOLEAN NOT NULL DEFAULT true,
    is_onboarded BOOLEAN NOT NULL DEFAULT false,
    is_age_verified BOOLEAN NOT NULL DEFAULT false,
    age_assurance_status TEXT NOT NULL DEFAULT 'pending' CHECK (age_assurance_status IN ('pending', 'verified', 'rejected')),
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_gender_pref ON public.profiles(gender_preference);

-- 4. ISOLATED SENSITIVE LOCATION TABLE (RLS PROTECTED)
CREATE TABLE IF NOT EXISTS public.user_locations (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    approx_area TEXT DEFAULT 'Hyderabad',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON public.user_locations(latitude, longitude);

-- 5. INTERESTS CATALOG
CREATE TABLE IF NOT EXISTS public.interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed predefined Hyderabad social and professional discovery interests
INSERT INTO public.interests (name, category, icon) VALUES
('Technology', 'Career & Tech', 'code'),
('Startups', 'Career & Tech', 'rocket'),
('Entrepreneurship', 'Career & Tech', 'briefcase'),
('Business', 'Career & Tech', 'trending-up'),
('Design', 'Career & Tech', 'layout'),
('Science', 'Career & Tech', 'compass'),
('Fitness', 'Health & Sports', 'activity'),
('Sports', 'Health & Sports', 'award'),
('Nature', 'Outdoors & Travel', 'sun'),
('Travel', 'Outdoors & Travel', 'map-pin'),
('Photography', 'Creative & Arts', 'camera'),
('Art', 'Creative & Arts', 'feather'),
('Movies', 'Entertainment', 'film'),
('Music', 'Entertainment', 'music'),
('Gaming', 'Entertainment', 'tv'),
('Books', 'Culture & Mind', 'book-open'),
('Philosophy', 'Culture & Mind', 'smile'),
('Food', 'Lifestyle', 'coffee'),
('Education', 'Culture & Mind', 'book'),
('Learning', 'Culture & Mind', 'globe')
ON CONFLICT (name) DO NOTHING;

-- 6. USER INTERESTS MAPPING
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest_id);

-- 7. USER AVAILABILITY
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_slot TEXT NOT NULL CHECK (day_slot IN ('weekday_morning', 'weekday_evening', 'weekend_morning', 'weekend_evening')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, day_slot)
);

-- 8. LIKES AND PASSES
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(sender_id, receiver_id),
    CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_sender ON public.likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_receiver ON public.likes(receiver_id);

-- 9. MUTUAL MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    compatibility_score INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_snippet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_active ON public.matches(is_active);

-- 10. REAL-TIME CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id, created_at);

-- 11. USER BLOCKS
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

-- 12. USER REPORTS & MODERATION
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'harassment',
        'inappropriate_content',
        'fake_profile',
        'spam',
        'safety_concern',
        'scam_or_commercial',
        'other'
    )),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 13. PROFESSIONAL VERIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    profession TEXT NOT NULL,
    organization_or_details TEXT NOT NULL,
    document_url TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'license', 'degree_certificate', 'work_email_or_badge', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verification_requests(status);

-- ====================================================================
-- TRIGGERS & AUTOMATION
-- ====================================================================

-- Trigger: Automatically create public.profiles and default public.user_roles when user registers
-- NEVER trusts fabricated dates; strictly validates date_of_birth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    dob_text TEXT;
    parsed_dob DATE := NULL;
    calculated_age INTEGER := NULL;
    is_verified BOOLEAN := false;
    age_status TEXT := 'pending';
BEGIN
    dob_text := NEW.raw_user_meta_data->>'date_of_birth';

    IF dob_text IS NOT NULL AND dob_text != '' THEN
        BEGIN
            parsed_dob := dob_text::DATE;
            calculated_age := DATE_PART('year', AGE(CURRENT_DATE, parsed_dob))::INTEGER;
            IF calculated_age >= 18 THEN
                is_verified := true;
                age_status := 'verified';
            ELSE
                is_verified := false;
                age_status := 'rejected';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            parsed_dob := NULL;
            calculated_age := NULL;
            is_verified := false;
            age_status := 'pending';
        END;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        date_of_birth,
        age,
        avatar_url,
        gender,
        gender_preference,
        bio,
        profession,
        is_onboarded,
        is_age_verified,
        age_assurance_status,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        parsed_dob,
        calculated_age,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'prefer_not_to_say'),
        COALESCE(NEW.raw_user_meta_data->>'gender_preference', 'all'),
        COALESCE(NEW.raw_user_meta_data->>'bio', 'Excited to explore Hyderabad and meet interesting people!'),
        COALESCE(NEW.raw_user_meta_data->>'profession', 'Professional'),
        false,
        is_verified,
        age_status,
        'user'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Enforce security & validate age on profile update
CREATE OR REPLACE FUNCTION public.handle_profile_before_update()
RETURNS TRIGGER AS $$
DECLARE
    caller_is_admin BOOLEAN := public.is_admin();
    calculated_age INTEGER;
BEGIN
    NEW.updated_at = now();

    -- Protect administrative fields from client modification
    IF NOT caller_is_admin THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their role';
        END IF;
        IF NEW.is_profession_verified IS DISTINCT FROM OLD.is_profession_verified THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify profession verification status';
        END IF;
        IF NEW.verification_badge_title IS DISTINCT FROM OLD.verification_badge_title THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify verification badge';
        END IF;
        IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify account suspension status';
        END IF;
        IF NEW.age_assurance_status IS DISTINCT FROM OLD.age_assurance_status THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify age assurance status';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'Email must be changed via authentication service';
        END IF;
    END IF;

    -- Strict backend age calculation
    IF NEW.date_of_birth IS NOT NULL THEN
        calculated_age := DATE_PART('year', AGE(CURRENT_DATE, NEW.date_of_birth))::INTEGER;
        NEW.age := calculated_age;
        IF calculated_age < 18 THEN
            NEW.is_age_verified := false;
            NEW.age_assurance_status := 'rejected';
            NEW.is_onboarded := false;
        ELSE
            NEW.is_age_verified := true;
            NEW.age_assurance_status := 'verified';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_profile_before_update ON public.profiles;
CREATE TRIGGER on_profile_before_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_before_update();

-- Trigger: When message is sent, update match timestamp and snippet
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.matches
    SET last_message_at = NEW.created_at,
        last_message_snippet = LEFT(NEW.content, 60)
    WHERE id = NEW.match_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- ====================================================================
-- DISTANCE & SCORING HELPER FUNCTIONS (Haversine formula in KM)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.calculate_haversine_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371; -- Earth radius in km
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN 5.0;
    END IF;

    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2.0)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0)^2;
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    RETURN ROUND((r * c)::numeric, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.check_gender_compatibility(
    my_gender TEXT,
    my_pref TEXT,
    their_gender TEXT,
    their_pref TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    me_accepts_them BOOLEAN := false;
    them_accepts_me BOOLEAN := false;
BEGIN
    IF my_pref = 'all' THEN
        me_accepts_them := true;
    ELSIF my_pref = 'men' AND their_gender IN ('male') THEN
        me_accepts_them := true;
    ELSIF my_pref = 'women' AND their_gender IN ('female') THEN
        me_accepts_them := true;
    ELSIF my_pref = 'non_binary' AND their_gender IN ('non_binary', 'other') THEN
        me_accepts_them := true;
    END IF;

    IF their_pref = 'all' THEN
        them_accepts_me := true;
    ELSIF their_pref = 'men' AND my_gender IN ('male') THEN
        them_accepts_me := true;
    ELSIF their_pref = 'women' AND my_gender IN ('female') THEN
        them_accepts_me := true;
    ELSIF their_pref = 'non_binary' AND my_gender IN ('non_binary', 'other') THEN
        them_accepts_me := true;
    END IF;

    RETURN me_accepts_them AND them_accepts_me;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp;

-- ====================================================================
-- SAFE PUBLIC PROFILE VIEW (ALLOWLISTED DISCOVERY COLUMNS ONLY)
-- ====================================================================

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    p.id,
    p.display_name,
    p.age,
    p.avatar_url,
    p.gender,
    p.bio,
    p.profession,
    p.is_profession_verified,
    p.verification_badge_title,
    p.preferred_activities,
    p.preferred_walking_distance,
    p.walking_pace,
    p.approx_city,
    p.approx_area,
    p.is_location_visible,
    p.created_at
FROM public.profiles p
WHERE p.is_suspended = false
  AND p.is_onboarded = true
  AND p.is_age_verified = true
  AND p.age >= 18;

GRANT SELECT ON public.public_profiles TO authenticated;

-- ====================================================================
-- SECURE STORED PROCEDURES / RPC FUNCTIONS
-- ====================================================================

-- 1. SEND LIKE WITH ATOMIC MUTUAL MATCH DETECTION & DYNAMIC SCORE
CREATE OR REPLACE FUNCTION public.send_like(
    target_user_id UUID,
    action_type TEXT
)
RETURNS JSON AS $$
DECLARE
    curr_uid UUID := auth.uid();
    my_p RECORD;
    target_p RECORD;
    mutual_like_exists BOOLEAN := false;
    new_match_id UUID := NULL;
    partner_data JSON;
    calculated_compat INTEGER := 80;
    shared_interests_cnt INTEGER := 0;
    u1 UUID;
    u2 UUID;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF curr_uid = target_user_id THEN
        RAISE EXCEPTION 'Cannot like yourself';
    END IF;

    IF action_type NOT IN ('like', 'pass') THEN
        RAISE EXCEPTION 'Invalid action type';
    END IF;

    SELECT * INTO my_p FROM public.profiles WHERE id = curr_uid;
    IF my_p.is_suspended THEN
        RAISE EXCEPTION 'Account is suspended';
    END IF;

    IF NOT my_p.is_age_verified OR my_p.age < 18 THEN
        RAISE EXCEPTION 'Age assurance required (must be 18+)';
    END IF;

    SELECT * INTO target_p FROM public.profiles WHERE id = target_user_id;
    IF NOT FOUND OR target_p.is_suspended THEN
        RAISE EXCEPTION 'Target user is unavailable';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = curr_uid AND blocked_id = target_user_id)
           OR (blocker_id = target_user_id AND blocked_id = curr_uid)
    ) THEN
        RAISE EXCEPTION 'Action cannot be completed';
    END IF;

    INSERT INTO public.likes (sender_id, receiver_id, action)
    VALUES (curr_uid, target_user_id, action_type)
    ON CONFLICT (sender_id, receiver_id)
    DO UPDATE SET action = action_type, created_at = now();

    IF action_type = 'like' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.likes
            WHERE sender_id = target_user_id
              AND receiver_id = curr_uid
              AND action = 'like'
        ) INTO mutual_like_exists;

        IF mutual_like_exists THEN
            u1 := LEAST(curr_uid, target_user_id);
            u2 := GREATEST(curr_uid, target_user_id);

            SELECT COUNT(*) INTO shared_interests_cnt
            FROM public.user_interests ui1
            JOIN public.user_interests ui2 ON ui1.interest_id = ui2.interest_id
            WHERE ui1.user_id = curr_uid AND ui2.user_id = target_user_id;

            calculated_compat := LEAST(100, GREATEST(50, 70 + (shared_interests_cnt * 6)));

            INSERT INTO public.matches (user1_id, user2_id, compatibility_score, is_active)
            VALUES (u1, u2, calculated_compat, true)
            ON CONFLICT (user1_id, user2_id)
            DO UPDATE SET is_active = true
            RETURNING id INTO new_match_id;

            SELECT json_build_object(
                'id', target_p.id,
                'display_name', target_p.display_name,
                'avatar_url', target_p.avatar_url,
                'profession', target_p.profession,
                'is_profession_verified', target_p.is_profession_verified,
                'approx_area', target_p.approx_area
            ) INTO partner_data;

            RETURN json_build_object(
                'matched', true,
                'match_id', new_match_id,
                'partner', partner_data
            );
        END IF;
    END IF;

    RETURN json_build_object(
        'matched', false,
        'match_id', NULL,
        'partner', NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.send_like(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_like(UUID, TEXT) TO authenticated;

-- 2. GET CANDIDATE MATCHES (CORE MATCHING ENGINE WITH CONFIGURABLE WEIGHTS)
CREATE OR REPLACE FUNCTION public.get_candidate_matches(
    radius_km_override INTEGER DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    age INTEGER,
    bio TEXT,
    avatar_url TEXT,
    profession TEXT,
    is_profession_verified BOOLEAN,
    verification_badge_title TEXT,
    preferred_activities TEXT[],
    preferred_walking_distance TEXT,
    walking_pace TEXT,
    approx_distance_km DOUBLE PRECISION,
    approx_area TEXT,
    shared_interests TEXT[],
    compatibility_score INTEGER
) AS $$
DECLARE
    curr_uid UUID := auth.uid();
    my_p RECORD;
    my_loc RECORD;
    search_radius INTEGER;
    weight_interests DOUBLE PRECISION := 0.40;
    weight_proximity DOUBLE PRECISION := 0.30;
    weight_availability DOUBLE PRECISION := 0.20;
    weight_walking DOUBLE PRECISION := 0.10;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO my_p FROM public.profiles WHERE public.profiles.id = curr_uid;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    IF my_p.is_suspended THEN
        RAISE EXCEPTION 'Account is suspended';
    END IF;

    IF NOT my_p.is_age_verified OR my_p.age < 18 THEN
        RAISE EXCEPTION 'Age assurance verification required (must be 18+)';
    END IF;

    IF NOT my_p.is_onboarded THEN
        RAISE EXCEPTION 'Please complete profile setup before discovering candidates';
    END IF;

    SELECT * INTO my_loc FROM public.user_locations WHERE user_id = curr_uid;
    search_radius := COALESCE(radius_km_override, my_p.discovery_radius_km, 10);

    RETURN QUERY
    WITH my_interest_ids AS (
        SELECT ui.interest_id, i.name
        FROM public.user_interests ui
        JOIN public.interests i ON i.id = ui.interest_id
        WHERE ui.user_id = curr_uid
    ),
    my_avail AS (
        SELECT day_slot FROM public.availability WHERE user_id = curr_uid AND is_active = true
    ),
    candidates AS (
        SELECT
            p.id AS candidate_id,
            p.display_name AS c_name,
            p.age AS c_age,
            p.bio AS c_bio,
            p.avatar_url AS c_avatar,
            p.profession AS c_profession,
            p.is_profession_verified AS c_verified,
            p.verification_badge_title AS c_badge,
            p.preferred_activities AS c_activities,
            p.preferred_walking_distance AS c_distance_pref,
            p.walking_pace AS c_pace,
            p.approx_area AS c_area,
            public.calculate_haversine_distance(
                my_loc.latitude, my_loc.longitude,
                cloc.latitude, cloc.longitude
            ) AS dist_km,
            ARRAY(
                SELECT i.name
                FROM public.user_interests cui
                JOIN public.interests i ON i.id = cui.interest_id
                WHERE cui.user_id = p.id
                  AND cui.interest_id IN (SELECT interest_id FROM my_interest_ids)
            ) AS shared_ints,
            (
                SELECT COUNT(*)
                FROM public.user_interests cui
                WHERE cui.user_id = p.id
                  AND cui.interest_id IN (SELECT interest_id FROM my_interest_ids)
            ) AS shared_count,
            (
                SELECT COUNT(*)
                FROM public.availability cav
                WHERE cav.user_id = p.id
                  AND cav.is_active = true
                  AND cav.day_slot IN (SELECT day_slot FROM my_avail)
            ) AS shared_avail_count,
            CASE WHEN p.preferred_walking_distance = my_p.preferred_walking_distance THEN 100 ELSE 50 END AS walking_match_pct
        FROM public.profiles p
        LEFT JOIN public.user_locations cloc ON cloc.user_id = p.id
        WHERE p.id != curr_uid
          AND p.is_suspended = false
          AND p.is_onboarded = true
          AND p.is_age_verified = true
          AND p.age >= 18
          AND NOT EXISTS (
              SELECT 1 FROM public.likes l
              WHERE l.sender_id = curr_uid AND l.receiver_id = p.id
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = curr_uid AND b.blocked_id = p.id)
                 OR (b.blocker_id = p.id AND b.blocked_id = curr_uid)
          )
          AND public.check_gender_compatibility(my_p.gender, my_p.gender_preference, p.gender, p.gender_preference) = true
    )
    SELECT
        c.candidate_id AS id,
        c.c_name AS display_name,
        c.c_age AS age,
        c.c_bio AS bio,
        c.c_avatar AS avatar_url,
        c.c_profession AS profession,
        c.c_verified AS is_profession_verified,
        c.c_badge AS verification_badge_title,
        c.c_activities AS preferred_activities,
        c.c_distance_pref AS preferred_walking_distance,
        c.c_pace AS walking_pace,
        c.dist_km AS approx_distance_km,
        c.c_area AS approx_area,
        c.shared_ints AS shared_interests,
        LEAST(100, GREATEST(40, ROUND((
            (LEAST(c.shared_count::DOUBLE PRECISION / 4.0, 1.0) * 100.0 * weight_interests) +
            (GREATEST(0.0, (1.0 - (c.dist_km / GREATEST(search_radius::DOUBLE PRECISION, 1.0)))) * 100.0 * weight_proximity) +
            (LEAST(c.shared_avail_count::DOUBLE PRECISION / 2.0, 1.0) * 100.0 * weight_availability) +
            (c.walking_match_pct * weight_walking)
        )::numeric)))::INTEGER AS compatibility_score
    FROM candidates c
    WHERE c.dist_km <= (search_radius * 1.5)
    ORDER BY compatibility_score DESC, c.dist_km ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_candidate_matches(INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_candidate_matches(INTEGER, INTEGER, INTEGER) TO authenticated;

-- 3. GET ACTIVE MATCHES FOR USER
CREATE OR REPLACE FUNCTION public.get_user_matches()
RETURNS TABLE (
    match_id UUID,
    matched_at TIMESTAMPTZ,
    compatibility_score INTEGER,
    last_message_at TIMESTAMPTZ,
    last_message_snippet TEXT,
    unread_count BIGINT,
    partner_id UUID,
    partner_name TEXT,
    partner_avatar TEXT,
    partner_profession TEXT,
    partner_verified BOOLEAN,
    partner_approx_area TEXT
) AS $$
DECLARE
    curr_uid UUID := auth.uid();
    my_suspended BOOLEAN;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT is_suspended INTO my_suspended FROM public.profiles WHERE id = curr_uid;
    IF COALESCE(my_suspended, false) THEN
        RAISE EXCEPTION 'Account is suspended';
    END IF;

    RETURN QUERY
    SELECT
        m.id AS match_id,
        m.matched_at,
        m.compatibility_score,
        m.last_message_at,
        m.last_message_snippet,
        (
            SELECT COUNT(*)
            FROM public.messages msg
            WHERE msg.match_id = m.id
              AND msg.sender_id != curr_uid
              AND msg.is_read = false
        ) AS unread_count,
        p.id AS partner_id,
        p.display_name AS partner_name,
        p.avatar_url AS partner_avatar,
        p.profession AS partner_profession,
        p.is_profession_verified AS partner_verified,
        p.approx_area AS partner_approx_area
    FROM public.matches m
    JOIN public.profiles p ON p.id = (CASE WHEN m.user1_id = curr_uid THEN m.user2_id ELSE m.user1_id END)
    WHERE (m.user1_id = curr_uid OR m.user2_id = curr_uid)
      AND m.is_active = true
      AND p.is_suspended = false
      AND NOT EXISTS (
          SELECT 1 FROM public.blocks b
          WHERE (b.blocker_id = curr_uid AND b.blocked_id = p.id)
             OR (b.blocker_id = p.id AND b.blocked_id = curr_uid)
      )
    ORDER BY m.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_user_matches() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_matches() TO authenticated;

-- 4. UPDATE APPROXIMATE USER LOCATION (RATE LIMITED & STORED IN USER_LOCATIONS)
CREATE OR REPLACE FUNCTION public.update_approx_location(
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    area_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    last_up TIMESTAMPTZ;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF lat IS NULL OR lon IS NULL OR lat < -90.0 OR lat > 90.0 OR lon < -180.0 OR lon > 180.0 THEN
        RAISE EXCEPTION 'Invalid coordinates provided';
    END IF;

    SELECT updated_at INTO last_up FROM public.user_locations WHERE user_id = curr_uid;
    IF last_up IS NOT NULL AND (now() - last_up) < INTERVAL '30 seconds' THEN
        RETURN;
    END IF;

    INSERT INTO public.user_locations (user_id, latitude, longitude, approx_area, updated_at)
    VALUES (curr_uid, lat, lon, COALESCE(area_name, 'Hyderabad'), now())
    ON CONFLICT (user_id)
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        approx_area = EXCLUDED.approx_area,
        updated_at = now();

    UPDATE public.profiles
    SET approx_area = COALESCE(area_name, approx_area, 'Hyderabad'),
        updated_at = now()
    WHERE id = curr_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.update_approx_location(DOUBLE PRECISION, DOUBLE PRECISION, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_approx_location(DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated;

-- 5. SECURE READ RECEIPT RPC
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = p_match_id
          AND (m.user1_id = curr_uid OR m.user2_id = curr_uid)
          AND m.is_active = true
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = curr_uid AND (b.blocked_id = m.user1_id OR b.blocked_id = m.user2_id))
                 OR ((b.blocker_id = m.user1_id OR b.blocker_id = m.user2_id) AND b.blocked_id = curr_uid)
          )
    ) THEN
        RAISE EXCEPTION 'Not authorized or conversation is inactive';
    END IF;

    UPDATE public.messages
    SET is_read = true
    WHERE match_id = p_match_id
      AND sender_id != curr_uid
      AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.mark_messages_read(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;

-- 6. SECURE ACCOUNT DELETION RPC
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    DELETE FROM auth.users WHERE id = curr_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- 7. BLOCK USER
CREATE OR REPLACE FUNCTION public.block_user_rpc(
    target_user_id UUID,
    block_reason TEXT DEFAULT 'No reason provided'
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF curr_uid = target_user_id THEN
        RAISE EXCEPTION 'Cannot block yourself';
    END IF;

    INSERT INTO public.blocks (blocker_id, blocked_id, reason)
    VALUES (curr_uid, target_user_id, block_reason)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

    UPDATE public.matches
    SET is_active = false
    WHERE (user1_id = LEAST(curr_uid, target_user_id) AND user2_id = GREATEST(curr_uid, target_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.block_user_rpc(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_user_rpc(UUID, TEXT) TO authenticated;

-- 8. REPORT USER
CREATE OR REPLACE FUNCTION public.report_user_rpc(
    target_user_id UUID,
    report_category TEXT,
    report_desc TEXT
)
RETURNS UUID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    new_report_id UUID;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF curr_uid = target_user_id THEN
        RAISE EXCEPTION 'Cannot report yourself';
    END IF;

    INSERT INTO public.reports (reporter_id, reported_id, category, description)
    VALUES (curr_uid, target_user_id, report_category, report_desc)
    RETURNING id INTO new_report_id;

    RETURN new_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.report_user_rpc(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_user_rpc(UUID, TEXT, TEXT) TO authenticated;

-- 9. SUBMIT VERIFICATION REQUEST
CREATE OR REPLACE FUNCTION public.submit_verification_request(
    prof TEXT,
    org TEXT,
    doc_type TEXT,
    doc_url TEXT
)
RETURNS UUID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    req_id UUID;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.verification_requests (user_id, profession, organization_or_details, document_type, document_url, status)
    VALUES (curr_uid, prof, org, doc_type, doc_url, 'pending')
    RETURNING id INTO req_id;

    RETURN req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.submit_verification_request(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_verification_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 10. ADMIN ACTIONS (RESTRICTED VIA is_admin() & search_path)
CREATE OR REPLACE FUNCTION public.admin_review_verification(
    request_id UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL,
    badge_title TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    target_uid UUID;
    target_prof TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;

    SELECT user_id, profession INTO target_uid, target_prof
    FROM public.verification_requests
    WHERE id = request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Verification request not found';
    END IF;

    UPDATE public.verification_requests
    SET status = new_status,
        rejection_reason = reason,
        reviewed_by = curr_uid,
        reviewed_at = now()
    WHERE id = request_id;

    IF new_status = 'approved' THEN
        UPDATE public.profiles
        SET is_profession_verified = true,
            verification_badge_title = COALESCE(badge_title, target_prof, 'Verified Professional')
        WHERE id = target_uid;
    ELSIF new_status = 'rejected' THEN
        UPDATE public.profiles
        SET is_profession_verified = false,
            verification_badge_title = NULL
        WHERE id = target_uid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_report(
    report_id UUID,
    new_status TEXT,
    admin_notes_text TEXT,
    suspend_user BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    reported_user UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;

    SELECT reported_id INTO reported_user
    FROM public.reports
    WHERE id = report_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found';
    END IF;

    UPDATE public.reports
    SET status = new_status,
        admin_notes = admin_notes_text,
        reviewed_by = curr_uid,
        reviewed_at = now()
    WHERE id = report_id;

    IF suspend_user AND reported_user IS NOT NULL THEN
        UPDATE public.profiles
        SET is_suspended = true
        WHERE id = reported_user;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_review_report(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_report(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
-- Users can only view their own private profile record; public discovery uses public_profiles view & RPC
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id AND is_suspended = false)
WITH CHECK (auth.uid() = id AND is_suspended = false);

-- USER LOCATIONS RLS
CREATE POLICY "Users can view only their own location"
ON public.user_locations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update only their own location"
ON public.user_locations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- INTERESTS RLS
CREATE POLICY "Interests catalog is readable by all"
ON public.interests FOR SELECT
TO authenticated, anon
USING (true);

-- USER INTERESTS RLS
CREATE POLICY "Users can view user interests"
ON public.user_interests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own interests"
ON public.user_interests FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- AVAILABILITY RLS
CREATE POLICY "Users can view availability"
ON public.availability FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own availability"
ON public.availability FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- LIKES RLS
CREATE POLICY "Users can view their own sent likes"
ON public.likes FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Users can insert their own likes"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- MATCHES RLS
CREATE POLICY "Users can view matches they are part of"
ON public.matches FOR SELECT
TO authenticated
USING ((auth.uid() = user1_id OR auth.uid() = user2_id) AND is_active = true);

-- MESSAGES RLS
-- Users can read messages only if part of active match and not blocked
CREATE POLICY "Matched users can view conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
          AND m.is_active = true
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = auth.uid() AND (b.blocked_id = m.user1_id OR b.blocked_id = m.user2_id))
                 OR ((b.blocker_id = m.user1_id OR b.blocker_id = m.user2_id) AND b.blocked_id = auth.uid())
          )
    )
);

-- Users can send messages only if not suspended and in an active, unblocked match
CREATE POLICY "Matched users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND NOT (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
          AND m.is_active = true
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = auth.uid() AND (b.blocked_id = m.user1_id OR b.blocked_id = m.user2_id))
                 OR ((b.blocker_id = m.user1_id OR b.blocker_id = m.user2_id) AND b.blocked_id = auth.uid())
          )
    )
);

-- NOTE: Direct UPDATE on messages is REVOKED to prevent message tampering.
-- Read receipts must be marked exclusively via the secure RPC public.mark_messages_read(p_match_id)

-- BLOCKS RLS
CREATE POLICY "Users can view and manage their blocks"
ON public.blocks FOR ALL
TO authenticated
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

-- REPORTS RLS
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their submitted reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR public.is_admin());

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.is_admin());

-- VERIFICATION REQUESTS RLS
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create verification requests"
ON public.verification_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
TO authenticated
USING (public.is_admin());

-- USER ROLES RLS
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ====================================================================
-- REALTIME REPLICATION CONFIGURATION
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
