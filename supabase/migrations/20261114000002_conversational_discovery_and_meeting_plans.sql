-- ====================================================================
-- WALK WITH BUDDY - CONVERSATIONAL DISCOVERY, MEETING PLANS & GROUPS
-- Migration: 20261114000002_conversational_discovery_and_meeting_plans.sql
-- ====================================================================

-- 1. MEETING PLANS TABLE (FOR "PLAN OUR WALK" FEATURE)
CREATE TABLE IF NOT EXISTS public.meeting_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    address_or_area TEXT NOT NULL,
    latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    meeting_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'declined', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_plans_match ON public.meeting_plans(match_id);
CREATE INDEX IF NOT EXISTS idx_meeting_plans_proposer ON public.meeting_plans(proposer_id);

ALTER TABLE public.meeting_plans ENABLE ROW LEVEL SECURITY;

-- Meeting plans viewable only by active participants of the match
DROP POLICY IF EXISTS "Match participants can view meeting plans" ON public.meeting_plans;
CREATE POLICY "Match participants can view meeting plans"
ON public.meeting_plans FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
          AND m.is_active = true
    )
);

-- Match participants can create meeting proposals
DROP POLICY IF EXISTS "Match participants can propose meeting plans" ON public.meeting_plans;
CREATE POLICY "Match participants can propose meeting plans"
ON public.meeting_plans FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = proposer_id
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

-- Match participants can accept or decline meeting proposals
DROP POLICY IF EXISTS "Match participants can update meeting plans" ON public.meeting_plans;
CREATE POLICY "Match participants can update meeting plans"
ON public.meeting_plans FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
          AND m.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_id
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
          AND m.is_active = true
    )
);

-- 2. GROUP WALKS TABLE (FOR SMALL GROUP DISCOVERY)
CREATE TABLE IF NOT EXISTS public.group_walks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    meeting_place TEXT NOT NULL,
    approx_area TEXT NOT NULL,
    latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    meeting_time TIMESTAMPTZ NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 6 CHECK (max_participants BETWEEN 3 AND 12),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'tech_and_startups', 'fitness_and_speed', 'creative_and_arts', 'nature_and_parks', 'evening_social')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_walks_creator ON public.group_walks(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_walks_time ON public.group_walks(meeting_time);

ALTER TABLE public.group_walks ENABLE ROW LEVEL SECURITY;

-- Group walks viewable by all onboarded, age-verified users
DROP POLICY IF EXISTS "Group walks viewable by authenticated users" ON public.group_walks;
CREATE POLICY "Group walks viewable by authenticated users"
ON public.group_walks FOR SELECT
TO authenticated
USING (
    status != 'cancelled'
    AND NOT (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
);

-- Onboarded users can organize small group walks
DROP POLICY IF EXISTS "Verified users can create group walks" ON public.group_walks;
CREATE POLICY "Verified users can create group walks"
ON public.group_walks FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = creator_id
    AND NOT (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
    AND (SELECT is_age_verified FROM public.profiles WHERE id = auth.uid()) = true
);

-- Creator can update their own group walk
DROP POLICY IF EXISTS "Creator can update group walk" ON public.group_walks;
CREATE POLICY "Creator can update group walk"
ON public.group_walks FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

-- 3. GROUP WALK PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.group_walk_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    walk_id UUID NOT NULL REFERENCES public.group_walks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('pending', 'joined', 'declined', 'left')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(walk_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_participants_walk ON public.group_walk_participants(walk_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user ON public.group_walk_participants(user_id);

ALTER TABLE public.group_walk_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants viewable by authenticated" ON public.group_walk_participants;
CREATE POLICY "Participants viewable by authenticated"
ON public.group_walk_participants FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can join group walks" ON public.group_walk_participants;
CREATE POLICY "Users can join group walks"
ON public.group_walk_participants FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND NOT (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
    AND (SELECT is_age_verified FROM public.profiles WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "Users can manage own participation" ON public.group_walk_participants;
CREATE POLICY "Users can manage own participation"
ON public.group_walk_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.group_walks WHERE id = walk_id));

-- 4. CONVERSATIONAL DISCOVERY MATCHING RPC
-- Accepts discovery mode, profession filter, activities, and age range
CREATE OR REPLACE FUNCTION public.get_conversational_matches(
    p_mode TEXT DEFAULT 'similar_interests',
    p_professions TEXT[] DEFAULT NULL,
    p_activities TEXT[] DEFAULT NULL,
    p_min_age INTEGER DEFAULT 18,
    p_max_age INTEGER DEFAULT 99,
    p_radius_km INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
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
    compatibility_score INTEGER,
    match_reasons TEXT[]
) AS $$
DECLARE
    curr_uid UUID := auth.uid();
    my_p RECORD;
    my_loc RECORD;
    search_radius INTEGER;
    -- Suggested 5-Factor Weights:
    -- 1. Interests & Activity: 30%
    -- 2. Distance: 25%
    -- 3. Availability: 20%
    -- 4. Discovery / Profession: 15%
    -- 5. Profile Completeness: 10%
    w_interests DOUBLE PRECISION := 0.30;
    w_distance DOUBLE PRECISION := 0.25;
    w_availability DOUBLE PRECISION := 0.20;
    w_discovery DOUBLE PRECISION := 0.15;
    w_profile DOUBLE PRECISION := 0.10;
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
        RAISE EXCEPTION 'Please complete profile setup before discovering buddies';
    END IF;

    SELECT * INTO my_loc FROM public.user_locations WHERE user_id = curr_uid;
    search_radius := COALESCE(p_radius_km, my_p.discovery_radius_km, 10);

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
            p.id AS c_id,
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
            -- Approximate distance via isolated locations table
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
            ) AS shared_ints_count,
            (
                SELECT COUNT(*)
                FROM public.availability cav
                WHERE cav.user_id = p.id
                  AND cav.is_active = true
                  AND cav.day_slot IN (SELECT day_slot FROM my_avail)
            ) AS shared_avail_count,
            -- Activity overlap count
            (
                SELECT COUNT(*)
                FROM unnest(p.preferred_activities) act
                WHERE act = ANY(COALESCE(p_activities, my_p.preferred_activities))
            ) AS shared_act_count
        FROM public.profiles p
        LEFT JOIN public.user_locations cloc ON cloc.user_id = p.id
        WHERE p.id != curr_uid
          AND p.is_suspended = false
          AND p.is_onboarded = true
          AND p.is_age_verified = true
          AND p.age >= 18
          -- Age filter
          AND p.age BETWEEN p_min_age AND p_max_age
          -- Profession filter when specified
          AND (p_professions IS NULL OR cardinality(p_professions) = 0 OR p.profession = ANY(p_professions))
          -- Exclude already interacted
          AND NOT EXISTS (
              SELECT 1 FROM public.likes l
              WHERE l.sender_id = curr_uid AND l.receiver_id = p.id
          )
          -- Exclude blocked users in both directions
          AND NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = curr_uid AND b.blocked_id = p.id)
                 OR (b.blocker_id = p.id AND b.blocked_id = curr_uid)
          )
          -- Mutual gender preference compatibility
          AND public.check_gender_compatibility(my_p.gender, my_p.gender_preference, p.gender, p.gender_preference) = true
    )
    SELECT
        c.c_id AS id,
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
        -- Compatibility Score (100% scale) based on discovery mode
        CASE
            -- SURPRISE ME: Prioritise diversity and novelty while respecting baseline compatibility
            WHEN p_mode = 'surprise_me' THEN
                LEAST(100, GREATEST(45, ROUND((
                    -- Novelty bonus if different profession or different interests
                    (CASE WHEN c.c_profession != my_p.profession THEN 95.0 ELSE 75.0 END * w_discovery) +
                    (GREATEST(0.0, (1.0 - (c.dist_km / GREATEST(search_radius::DOUBLE PRECISION, 1.0)))) * 100.0 * w_distance) +
                    (LEAST(c.shared_avail_count::DOUBLE PRECISION / 1.5, 1.0) * 100.0 * w_availability) +
                    (LEAST(c.shared_ints_count::DOUBLE PRECISION / 3.0, 1.0) * 80.0 * w_interests) +
                    (85.0 * w_profile)
                )::numeric)))::INTEGER

            -- SOMEONE DIFFERENT FROM ME
            WHEN p_mode = 'different_from_me' THEN
                LEAST(100, GREATEST(45, ROUND((
                    (CASE WHEN c.c_profession != my_p.profession THEN 100.0 ELSE 60.0 END * w_discovery) +
                    (GREATEST(0.0, (1.0 - (c.dist_km / GREATEST(search_radius::DOUBLE PRECISION, 1.0)))) * 100.0 * w_distance) +
                    (LEAST(c.shared_avail_count::DOUBLE PRECISION / 1.5, 1.0) * 100.0 * w_availability) +
                    (65.0 * w_interests) +
                    (85.0 * w_profile)
                )::numeric)))::INTEGER

            -- DEFAULT / SIMILAR INTERESTS / PROFESSION
            ELSE
                LEAST(100, GREATEST(40, ROUND((
                    (LEAST((c.shared_ints_count + c.shared_act_count)::DOUBLE PRECISION / 4.0, 1.0) * 100.0 * w_interests) +
                    (GREATEST(0.0, (1.0 - (c.dist_km / GREATEST(search_radius::DOUBLE PRECISION, 1.0)))) * 100.0 * w_distance) +
                    (LEAST(c.shared_avail_count::DOUBLE PRECISION / 2.0, 1.0) * 100.0 * w_availability) +
                    (CASE WHEN p_professions IS NOT NULL AND c.c_profession = ANY(p_professions) THEN 100.0 ELSE 70.0 END * w_discovery) +
                    (90.0 * w_profile)
                )::numeric)))::INTEGER
        END AS compatibility_score,
        -- Human-readable match reasons
        ARRAY(
            SELECT reason FROM (
                SELECT 'Within your selected distance (~' || ROUND(c.dist_km::numeric, 1)::text || ' km)' AS reason WHERE c.dist_km <= search_radius
                UNION ALL
                SELECT 'Shared passion for ' || c.shared_ints[1] WHERE array_length(c.shared_ints, 1) >= 1
                UNION ALL
                SELECT 'Compatible walking schedule' WHERE c.shared_avail_count >= 1
                UNION ALL
                SELECT 'Different professional perspective (' || c.c_profession || ')' WHERE p_mode IN ('surprise_me', 'different_from_me') AND c.c_profession != my_p.profession
                UNION ALL
                SELECT 'Matching profession (' || c.c_profession || ')' WHERE p_professions IS NOT NULL AND c.c_profession = ANY(p_professions)
            ) sub
        ) AS match_reasons
    FROM candidates c
    WHERE c.dist_km <= (search_radius * 1.5)
    ORDER BY compatibility_score DESC, c.dist_km ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_conversational_matches(TEXT, TEXT[], TEXT[], INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_conversational_matches(TEXT, TEXT[], TEXT[], INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
