SET search_path = public, extensions;

-- Drop the old function that required user_id_param to prevent ambiguity
DROP FUNCTION IF EXISTS get_nearby_profiles(UUID, FLOAT, INT, INT, TEXT[], INT);

-- Create the secure version relying on auth.uid()
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  max_distance_km FLOAT DEFAULT 50,
  max_age_val INT DEFAULT 60,
  min_age_val INT DEFAULT 18,
  filter_sports TEXT[] DEFAULT NULL,
  limit_val INT DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  nama TEXT,
  umur INT,
  bio TEXT,
  skill_level TEXT,
  foto_url TEXT,
  photos TEXT[],
  hobi TEXT,
  alamat TEXT,
  domisili TEXT,
  availability TEXT,
  looking_for TEXT,
  overall_frequency TEXT,
  preferred_time TEXT,
  home_venue TEXT,
  height_cm INT,
  sport_role TEXT,
  last_active TIMESTAMP WITH TIME ZONE,
  profile_completeness INT,
  prompt_question TEXT,
  prompt_answer TEXT,
  distance_km FLOAT,
  match_score FLOAT,
  match_percentage INT
) AS $$
DECLARE
  uid UUID := auth.uid();
  requester_location geography;
  requester_sports TEXT[];
  requester_gender_pref TEXT;
  requester_age_min INT;
  requester_age_max INT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT location, gender_pref, age_pref_min, age_pref_max
  INTO requester_location, requester_gender_pref, requester_age_min, requester_age_max
  FROM public.profiles WHERE public.profiles.id = uid;

  SELECT ARRAY_AGG(sport_id) INTO requester_sports 
  FROM public.user_sports WHERE public.user_sports.user_id = uid;

  RETURN QUERY
  WITH scored_profiles AS (
    SELECT 
      p.id,
      p.nama,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.tanggal_lahir))::INT AS umur,
      p.bio,
      p.skill_level,
      p.foto_url,
      p.photos,
      (SELECT string_agg(sport_id, ', ') FROM public.user_sports us WHERE us.user_id = p.id) AS hobi,
      p.alamat,
      p.domisili,
      p.availability,
      p.looking_for,
      p.overall_frequency,
      p.preferred_time,
      p.home_venue,
      p.height_cm,
      p.sport_role,
      p.last_active,
      p.profile_completeness,
      p.prompt_question,
      p.prompt_answer,
      ROUND((ST_Distance(p.location, requester_location) / 1000)::numeric, 1)::float AS distance_km,
      
      (
        (40 * (1 - LEAST(COALESCE(ST_Distance(p.location, requester_location) / 1000, 0), GREATEST(max_distance_km, 1)) / GREATEST(max_distance_km, 1)))
        +
        (30 * GREATEST(0, 1 - EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_active, NOW()))) / (7 * 86400)))
        +
        (30 * (
          SELECT COUNT(*)::float / GREATEST(COALESCE(array_length(requester_sports, 1), 1), 1)
          FROM public.user_sports us 
          WHERE us.user_id = p.id AND us.sport_id = ANY(COALESCE(requester_sports, ARRAY[]::TEXT[]))
        ))
        +
        (
          CASE WHEN EXISTS (
            SELECT 1 FROM public.swipes s 
            WHERE s.user_id = p.id AND s.target_user_id = uid AND s.action = 'like'
          ) THEN 50 ELSE 0 END
        )
      )::float AS raw_match_score

    FROM public.profiles p
    WHERE p.id != uid
      AND COALESCE(p.flagged_for_review, false) = false
      AND COALESCE(p.is_ghost_mode, false) = false
      
      AND ST_DWithin(p.location, requester_location, max_distance_km * 1000)
      
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.tanggal_lahir)) <= LEAST(max_age_val, COALESCE(requester_age_max, 100))
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.tanggal_lahir)) >= GREATEST(min_age_val, COALESCE(requester_age_min, 18))
      
      AND (
        COALESCE(requester_gender_pref, 'all') = 'all' OR 
        (requester_gender_pref = 'men' AND p.gender = 'male') OR 
        (requester_gender_pref = 'women' AND p.gender = 'female')
      )
      
      AND (
        filter_sports IS NULL OR 
        array_length(filter_sports, 1) IS NULL OR
        EXISTS (
          SELECT 1 FROM public.user_sports us 
          WHERE us.user_id = p.id AND us.sport_id = ANY(filter_sports)
        )
      )
      
      AND NOT EXISTS (
        SELECT 1 FROM public.swipes s 
        WHERE s.user_id = uid AND s.target_user_id = p.id
      )

      -- Enforce blocks: Hide users blocked by me, or users who blocked me
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = uid AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = uid)
      )
  )
  SELECT 
    sp.id,
    sp.nama,
    sp.umur,
    sp.bio,
    sp.skill_level,
    sp.foto_url,
    sp.photos,
    sp.hobi,
    sp.alamat,
    sp.domisili,
    sp.availability,
    sp.looking_for,
    sp.overall_frequency,
    sp.preferred_time,
    sp.home_venue,
    sp.height_cm,
    sp.sport_role,
    sp.last_active,
    sp.profile_completeness,
    sp.prompt_question,
    sp.prompt_answer,
    sp.distance_km,
    sp.raw_match_score AS match_score,
    ROUND(LEAST(sp.raw_match_score / 130.0 * 100, 100))::INT AS match_percentage
  FROM scored_profiles sp
  ORDER BY sp.raw_match_score DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
