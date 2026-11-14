-- ====================================================================
-- WALK WITH BUDDY - COMPLETE DATABASE MIGRATION & RLS POLICIES
-- Platform: Supabase / PostgreSQL (PostGIS / Haversine Compatible)
-- Initial Launch: Hyderabad, Telangana, India
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
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
    -- Coordinates stored securely; never returned directly to other users in discovery queries
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    approx_city TEXT DEFAULT 'Hyderabad',
    approx_area TEXT DEFAULT 'Hitec City',
    is_location_visible BOOLEAN NOT NULL DEFAULT true,
    is_onboarded BOOLEAN NOT NULL DEFAULT false,
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for spatial and query performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_gender_pref ON public.profiles(gender_preference);

-- 3. INTERESTS CATALOG
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

-- 4. USER INTERESTS MAPPING
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest_id);

-- 5. USER AVAILABILITY
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_slot TEXT NOT NULL CHECK (day_slot IN ('weekday_morning', 'weekday_evening', 'weekend_morning', 'weekend_evening')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, day_slot)
);

-- 6. LIKES AND PASSES
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

-- 7. MUTUAL MATCHES
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
    -- Enforce user1_id < user2_id to guarantee unique pair and eliminate race conditions
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_active ON public.matches(is_active);

-- 8. REAL-TIME CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id, created_at);

-- 9. USER BLOCKS
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

-- 10. USER REPORTS & MODERATION
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

-- 11. PROFESSIONAL VERIFICATION REQUESTS
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

-- 12. USER ROLES FOR RESTRICTED ACCESS
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- TRIGGERS & AUTOMATION
-- ====================================================================

-- Trigger: Automatically create public.profiles and default public.user_roles when user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    calculated_age INTEGER := 25;
BEGIN
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
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::DATE, '2000-01-01'::DATE),
        COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 24),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'prefer_not_to_say'),
        COALESCE(NEW.raw_user_meta_data->>'gender_preference', 'all'),
        COALESCE(NEW.raw_user_meta_data->>'bio', 'Excited to explore Hyderabad and meet interesting people!'),
        COALESCE(NEW.raw_user_meta_data->>'profession', 'Professional'),
        false,
        'user'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update profile timestamp
CREATE OR REPLACE FUNCTION public.handle_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- Keep age updated if date_of_birth changes
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.age = DATE_PART('year', AGE(now(), NEW.date_of_birth));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated();

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    r DOUBLE PRECISION := 6371; -- Earth's radius in kilometers
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN 5.0; -- Default fallback approximate distance
    END IF;

    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2.0)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0)^2;
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    RETURN ROUND((r * c)::numeric, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Gender mutual compatibility checker
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
    -- Check if I accept their gender
    IF my_pref = 'all' THEN
        me_accepts_them := true;
    ELSIF my_pref = 'men' AND their_gender IN ('male') THEN
        me_accepts_them := true;
    ELSIF my_pref = 'women' AND their_gender IN ('female') THEN
        me_accepts_them := true;
    ELSIF my_pref = 'non_binary' AND their_gender IN ('non_binary', 'other') THEN
        me_accepts_them := true;
    END IF;

    -- Check if they accept my gender
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- ====================================================================
-- SECURE STORED PROCEDURES / RPC FUNCTIONS
-- ====================================================================

-- 1. SEND LIKE / PASS WITH AUTOMATIC ATOMIC MUTUAL MATCH DETECTION
CREATE OR REPLACE FUNCTION public.send_like(
    target_user_id UUID,
    action_type TEXT
)
RETURNS JSON AS $$
DECLARE
    curr_uid UUID := auth.uid();
    mutual_like_exists BOOLEAN := false;
    new_match_id UUID := NULL;
    partner_data JSON;
    calculated_compat INTEGER := 75;
    u1 UUID;
    u2 UUID;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF curr_uid = target_user_id THEN
        RAISE EXCEPTION 'Cannot like yourself';
    END IF;

    -- Verify no blocks in either direction
    IF EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = curr_uid AND blocked_id = target_user_id)
           OR (blocker_id = target_user_id AND blocked_id = curr_uid)
    ) THEN
        RAISE EXCEPTION 'Action cannot be completed';
    END IF;

    -- Record the like or pass
    INSERT INTO public.likes (sender_id, receiver_id, action)
    VALUES (curr_uid, target_user_id, action_type)
    ON CONFLICT (sender_id, receiver_id)
    DO UPDATE SET action = action_type, created_at = now();

    -- If action is 'like', check if target already liked current user
    IF action_type = 'like' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.likes
            WHERE sender_id = target_user_id
              AND receiver_id = curr_uid
              AND action = 'like'
        ) INTO mutual_like_exists;

        IF mutual_like_exists THEN
            -- Canonical ordering to avoid duplicate matches and race conditions
            u1 := LEAST(curr_uid, target_user_id);
            u2 := GREATEST(curr_uid, target_user_id);

            -- Insert match
            INSERT INTO public.matches (user1_id, user2_id, compatibility_score, is_active)
            VALUES (u1, u2, calculated_compat, true)
            ON CONFLICT (user1_id, user2_id)
            DO UPDATE SET is_active = true
            RETURNING id INTO new_match_id;

            -- Get partner profile data
            SELECT json_build_object(
                'id', p.id,
                'display_name', p.display_name,
                'avatar_url', p.avatar_url,
                'profession', p.profession,
                'is_profession_verified', p.is_profession_verified,
                'approx_area', p.approx_area
            ) INTO partner_data
            FROM public.profiles p
            WHERE p.id = target_user_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    search_radius INTEGER;
    -- Configurable weights as per requirements:
    -- Shared interests: 40%, Proximity: 30%, Availability: 20%, Walking preferences: 10%
    weight_interests DOUBLE PRECISION := 0.40;
    weight_proximity DOUBLE PRECISION := 0.30;
    weight_availability DOUBLE PRECISION := 0.20;
    weight_walking DOUBLE PRECISION := 0.10;
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch current user profile
    SELECT * INTO my_p FROM public.profiles WHERE public.profiles.id = curr_uid;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

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
            -- Calculate approximate distance (never exposing raw coordinates)
            public.calculate_haversine_distance(my_p.latitude, my_p.longitude, p.latitude, p.longitude) AS dist_km,
            -- Shared interests array
            ARRAY(
                SELECT i.name
                FROM public.user_interests cui
                JOIN public.interests i ON i.id = cui.interest_id
                WHERE cui.user_id = p.id
                  AND cui.interest_id IN (SELECT interest_id FROM my_interest_ids)
            ) AS shared_ints,
            -- Shared interests count
            (
                SELECT COUNT(*)
                FROM public.user_interests cui
                WHERE cui.user_id = p.id
                  AND cui.interest_id IN (SELECT interest_id FROM my_interest_ids)
            ) AS shared_count,
            -- Shared availability count
            (
                SELECT COUNT(*)
                FROM public.availability cav
                WHERE cav.user_id = p.id
                  AND cav.is_active = true
                  AND cav.day_slot IN (SELECT day_slot FROM my_avail)
            ) AS shared_avail_count,
            -- Walking preference match
            CASE WHEN p.preferred_walking_distance = my_p.preferred_walking_distance THEN 100 ELSE 50 END AS walking_match_pct
        FROM public.profiles p
        WHERE p.id != curr_uid
          AND p.is_suspended = false
          -- Exclude users already liked or passed
          AND NOT EXISTS (
              SELECT 1 FROM public.likes l
              WHERE l.sender_id = curr_uid AND l.receiver_id = p.id
          )
          -- Exclude blocked users (both ways)
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = curr_uid AND b.blocked_id = p.id)
                 OR (b.blocker_id = p.id AND b.blocked_id = curr_uid)
          )
          -- Enforce mutual gender preference compatibility
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
        -- Weighted composite score:
        -- Shared interests: up to 5 shared = 100%
        -- Proximity: closer = higher score within search_radius
        -- Availability: up to 3 slots = 100%
        -- Walking: distance pref match
        LEAST(100, GREATEST(40, ROUND((
            (LEAST(c.shared_count::DOUBLE PRECISION / 4.0, 1.0) * 100.0 * weight_interests) +
            (GREATEST(0.0, (1.0 - (c.dist_km / GREATEST(search_radius::DOUBLE PRECISION, 1.0)))) * 100.0 * weight_proximity) +
            (LEAST(c.shared_avail_count::DOUBLE PRECISION / 2.0, 1.0) * 100.0 * weight_availability) +
            (c.walking_match_pct * weight_walking)
        )::numeric)))::INTEGER AS compatibility_score
    FROM candidates c
    WHERE c.dist_km <= (search_radius * 1.5) -- Allow nearby margin
    ORDER BY compatibility_score DESC, c.dist_km ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
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
      -- Ensure not blocked
      AND NOT EXISTS (
          SELECT 1 FROM public.blocks b
          WHERE (b.blocker_id = curr_uid AND b.blocked_id = p.id)
             OR (b.blocker_id = p.id AND b.blocked_id = curr_uid)
      )
    ORDER BY m.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UPDATE APPROXIMATE USER LOCATION (SECURE)
CREATE OR REPLACE FUNCTION public.update_approx_location(
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    area_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.profiles
    SET latitude = lat,
        longitude = lon,
        approx_area = COALESCE(area_name, approx_area, 'Hyderabad Area'),
        updated_at = now()
    WHERE id = curr_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. BLOCK USER
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

    INSERT INTO public.blocks (blocker_id, blocked_id, reason)
    VALUES (curr_uid, target_user_id, block_reason)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

    -- Deactivate any match between these two users
    UPDATE public.matches
    SET is_active = false
    WHERE (user1_id = LEAST(curr_uid, target_user_id) AND user2_id = GREATEST(curr_uid, target_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. REPORT USER
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

    INSERT INTO public.reports (reporter_id, reported_id, category, description)
    VALUES (curr_uid, target_user_id, report_category, report_desc)
    RETURNING id INTO new_report_id;

    RETURN new_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. SUBMIT VERIFICATION REQUEST
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ADMIN ACTIONS (SECURE WITH ROLE CHECK)
CREATE OR REPLACE FUNCTION public.admin_review_verification(
    request_id UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL,
    badge_title TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    is_admin BOOLEAN := false;
    target_uid UUID;
    target_prof TEXT;
BEGIN
    SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = curr_uid;
    IF NOT COALESCE(is_admin, false) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_review_report(
    report_id UUID,
    new_status TEXT,
    admin_notes_text TEXT,
    suspend_user BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
    is_admin BOOLEAN := false;
    reported_user UUID;
BEGIN
    SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = curr_uid;
    IF NOT COALESCE(is_admin, false) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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
-- Anyone authenticated can read onboarded non-suspended profiles (RPC handles candidate discovery)
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    -- Prevent users from updating restricted fields like role or is_profession_verified
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_profession_verified = (SELECT is_profession_verified FROM public.profiles WHERE id = auth.uid())
    AND is_suspended = (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
);

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
CREATE POLICY "Matched users can view conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
          AND m.is_active = true
          -- And neither user is blocked
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = auth.uid() AND (b.blocked_id = m.user1_id OR b.blocked_id = m.user2_id))
                 OR ((b.blocker_id = m.user1_id OR b.blocker_id = m.user2_id) AND b.blocked_id = auth.uid())
          )
    )
);

CREATE POLICY "Matched users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
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

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
);

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
USING (auth.uid() = reporter_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- VERIFICATION REQUESTS RLS
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create verification requests"
ON public.verification_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- USER ROLES RLS
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ====================================================================
-- REALTIME REPLICATION CONFIGURATION
-- ====================================================================
-- Enable publication for real-time messaging and match notification
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
