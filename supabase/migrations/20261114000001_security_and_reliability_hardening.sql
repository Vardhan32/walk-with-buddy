-- ====================================================================
-- WALK WITH BUDDY - SECURITY & RELIABILITY HARDENING MIGRATION
-- Migration Version: 20261114000001
-- ====================================================================

-- 1. SECURE HELPER FUNCTION FOR ADMIN ROLE VERIFICATION
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

-- 2. AGE ASSURANCE AND ACCOUNT FIELDS IN PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_age_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS age_assurance_status TEXT NOT NULL DEFAULT 'pending'
CHECK (age_assurance_status IN ('pending', 'verified', 'rejected'));

-- Update existing profiles with valid age
UPDATE public.profiles
SET is_age_verified = true,
    age_assurance_status = 'verified'
WHERE age >= 18;

-- 3. ISOLATED SENSITIVE LOCATION TABLE (RLS PROTECTED)
CREATE TABLE IF NOT EXISTS public.user_locations (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    approx_area TEXT DEFAULT 'Hyderabad',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill user_locations from profiles if existing coordinates exist
INSERT INTO public.user_locations (user_id, latitude, longitude, approx_area, updated_at)
SELECT id, latitude, longitude, approx_area, updated_at
FROM public.profiles
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Enable RLS on user_locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view only their own location" ON public.user_locations;
CREATE POLICY "Users can view only their own location"
ON public.user_locations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update only their own location" ON public.user_locations;
CREATE POLICY "Users can update only their own location"
ON public.user_locations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
CREATE POLICY "Users can insert their own location"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. HARDEN PROFILES ROW LEVEL SECURITY & PREVENT DIRECT COLUMN LEAKS
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

-- Authenticated users can only read their own private profile record directly
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- Profile updates: cannot modify if suspended, must match user id
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id AND is_suspended = false)
WITH CHECK (auth.uid() = id AND is_suspended = false);

-- 5. TRIGGER TO PREVENT PRIVILEGE ESCALATION & UNTRUSTED AGE IN PROFILES
CREATE OR REPLACE FUNCTION public.handle_profile_before_update()
RETURNS TRIGGER AS $$
DECLARE
    caller_is_admin BOOLEAN := public.is_admin();
    calculated_age INTEGER;
BEGIN
    NEW.updated_at = now();

    -- Ordinary users cannot tamper with administrative, status, or verification fields
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

    -- Strict backend age calculation & validation if DOB changes (Never trust client age)
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

-- 6. SAFE PUBLIC PROFILE VIEW (ALLOWLISTED COLUMNS ONLY)
-- Hides email, exact coordinates, DOB, internal role, and suspension status
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

-- 7. REGISTRATION TRIGGER: NO DEFAULT FABRICATED AGES / DOBS
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

    -- Validate date_of_birth strictly if provided; NEVER fabricate defaults
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

-- 8. SECURE READ-RECEIPT RPC & MESSAGES UPDATE PROTECTION
-- Revoke direct broad UPDATE policy on messages
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

-- Dedicated secure RPC for updating read receipts
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify that caller is an active participant in this match and neither is blocked
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

    -- Safely update ONLY is_read flag on incoming messages
    UPDATE public.messages
    SET is_read = true
    WHERE match_id = p_match_id
      AND sender_id != curr_uid
      AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.mark_messages_read(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;

-- 9. PREVENT MESSAGING BY SUSPENDED ACCOUNTS OR IN INACTIVE MATCHES
DROP POLICY IF EXISTS "Matched users can send messages" ON public.messages;
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

-- 10. LOCATION UPDATE WITH SERVER-SIDE RATE LIMIT & RANGE VALIDATION
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

    -- Coordinate bounds validation
    IF lat IS NULL OR lon IS NULL OR lat < -90.0 OR lat > 90.0 OR lon < -180.0 OR lon > 180.0 THEN
        RAISE EXCEPTION 'Invalid coordinates provided';
    END IF;

    -- Server-side rate limiting (min 30 seconds between updates)
    SELECT updated_at INTO last_up FROM public.user_locations WHERE user_id = curr_uid;
    IF last_up IS NOT NULL AND (now() - last_up) < INTERVAL '30 seconds' THEN
        -- Rate limited: silently skip to avoid spamming
        RETURN;
    END IF;

    -- Store in isolated location table
    INSERT INTO public.user_locations (user_id, latitude, longitude, approx_area, updated_at)
    VALUES (curr_uid, lat, lon, COALESCE(area_name, 'Hyderabad'), now())
    ON CONFLICT (user_id)
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        approx_area = EXCLUDED.approx_area,
        updated_at = now();

    -- Update safe approximate area on profile
    UPDATE public.profiles
    SET approx_area = COALESCE(area_name, approx_area, 'Hyderabad'),
        updated_at = now()
    WHERE id = curr_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.update_approx_location(DOUBLE PRECISION, DOUBLE PRECISION, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_approx_location(DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated;

-- 11. HARDENED CANDIDATE DISCOVERY RPC (ENFORCES ONBOARDING & AGE ELIGIBILITY)
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

    -- Verify current user profile
    SELECT * INTO my_p FROM public.profiles WHERE public.profiles.id = curr_uid;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Block suspended users from discovery
    IF my_p.is_suspended THEN
        RAISE EXCEPTION 'Account is suspended';
    END IF;

    -- Enforce age assurance and onboarding requirement
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
            -- Approximate distance calculated internally via isolated location table
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
          -- Exclude users already liked or passed
          AND NOT EXISTS (
              SELECT 1 FROM public.likes l
              WHERE l.sender_id = curr_uid AND l.receiver_id = p.id
          )
          -- Exclude blocked users in either direction
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = curr_uid AND b.blocked_id = p.id)
                 OR (b.blocker_id = p.id AND b.blocked_id = curr_uid)
          )
          -- Mutual gender preference compatibility
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

-- 12. HARDENED LIKE & MUTUAL MATCH RPC (DYNAMIC SCORE & SUSPENSION CHECKS)
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

    -- If action is 'like', check for mutual like
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

            -- Calculate real dynamic score based on shared interests
            SELECT COUNT(*) INTO shared_interests_cnt
            FROM public.user_interests ui1
            JOIN public.user_interests ui2 ON ui1.interest_id = ui2.interest_id
            WHERE ui1.user_id = curr_uid AND ui2.user_id = target_user_id;

            calculated_compat := LEAST(100, GREATEST(50, 70 + (shared_interests_cnt * 6)));

            -- Insert match atomically
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

-- 13. HARDENED GET_USER_MATCHES (SUSPENSION CHECK & ACTIVE VALIDATION)
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

-- 14. SECURE SERVER-SIDE ACCOUNT DELETION RPC
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID AS $$
DECLARE
    curr_uid UUID := auth.uid();
BEGIN
    IF curr_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Deleting from auth.users cascades down to profiles, user_locations, user_interests, etc.
    DELETE FROM auth.users WHERE id = curr_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- 15. HARDEN BLOCK & REPORT RPCS
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

    -- Deactivate any match between the two users
    UPDATE public.matches
    SET is_active = false
    WHERE (user1_id = LEAST(curr_uid, target_user_id) AND user2_id = GREATEST(curr_uid, target_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.block_user_rpc(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_user_rpc(UUID, TEXT) TO authenticated;

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

-- 16. HARDEN ADMIN FUNCTIONS (SEARCH PATH & ROLE CHECK)
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
