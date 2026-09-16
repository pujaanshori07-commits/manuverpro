CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
SET search_path = public, extensions;
-- 1. Add missing columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS is_ghost_mode BOOLEAN DEFAULT false;

-- 2. Update get_nearby_profiles with STRICT filtering
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_id_param UUID,
  max_distance_km FLOAT DEFAULT 50,
  max_age_val INT DEFAULT 60,
  min_age_val INT DEFAULT 18,
  filter_sports TEXT[] DEFAULT NULL,
  limit_val INT DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  nama TEXT,
  bio TEXT,
  skill_level TEXT,
  foto_url TEXT,
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
  distance_km FLOAT,
  match_score FLOAT,
  match_percentage INT
) AS $$
DECLARE
  requester_location geography;
  requester_sports TEXT[];
  requester_gender_pref TEXT;
  requester_age_min INT;
  requester_age_max INT;
BEGIN
  -- Fetch requester's location, selected sports, and strict preferences
  SELECT location, gender_pref, age_pref_min, age_pref_max
  INTO requester_location, requester_gender_pref, requester_age_min, requester_age_max
  FROM public.profiles WHERE public.profiles.id = user_id_param;

  SELECT ARRAY_AGG(sport_id) INTO requester_sports 
  FROM public.user_sports WHERE public.user_sports.user_id = user_id_param;

  RETURN QUERY
  WITH scored_profiles AS (
    SELECT 
      p.id,
      p.nama,
      p.bio,
      p.skill_level,
      p.foto_url,
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
      ROUND((ST_Distance(p.location, requester_location) / 1000)::numeric, 1)::float AS distance_km,
      
      (
        -- Distance score (40 pts inverse)
        (40 * (1 - LEAST(ST_Distance(p.location, requester_location) / 1000, max_distance_km) / GREATEST(max_distance_km, 1)))
        +
        -- Recency score (30 pts decay over 7 days)
        (30 * GREATEST(0, 1 - EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_active, NOW()))) / (7 * 86400)))
        +
        -- Sport overlap score (30 pts)
        (30 * (
          SELECT COUNT(*)::float / GREATEST(COALESCE(array_length(requester_sports, 1), 1), 1)
          FROM public.user_sports us 
          WHERE us.user_id = p.id AND us.sport_id = ANY(COALESCE(requester_sports, ARRAY[]::TEXT[]))
        ))
        +
        -- Mutual Interest Boost (+50 pts if target already liked requester)
        (
          CASE WHEN EXISTS (
            SELECT 1 FROM public.swipes s 
            WHERE s.user_id = p.id AND s.target_user_id = user_id_param AND s.action = 'like'
          ) THEN 50 ELSE 0 END
        )
      )::float AS raw_match_score

    FROM public.profiles p
    WHERE p.id != user_id_param
      AND COALESCE(p.flagged_for_review, false) = false
      AND COALESCE(p.is_ghost_mode, false) = false -- 🟢 GHOST MODE APPLIED
      
      -- 🟢 STRICT DISTANCE APPLIED
      AND (ST_Distance(p.location, requester_location) / 1000) <= max_distance_km
      
      -- 🟢 STRICT AGE APPLIED (Gabungan dari parameter UI dan preferensi Profil)
      -- Age is calculated dynamically based on tanggal_lahir
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.tanggal_lahir)) <= LEAST(max_age_val, COALESCE(requester_age_max, 100))
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.tanggal_lahir)) >= GREATEST(min_age_val, COALESCE(requester_age_min, 18))
      
      -- 🟢 STRICT GENDER PREFERENCE APPLIED
      AND (
        COALESCE(requester_gender_pref, 'all') = 'all' OR 
        (requester_gender_pref = 'men' AND p.gender = 'male') OR 
        (requester_gender_pref = 'women' AND p.gender = 'female')
      )
      
      -- 🟢 STRICT SPORTS FILTER APPLIED
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
        WHERE s.user_id = user_id_param AND s.target_user_id = p.id
      )
  )
  SELECT 
    sp.id,
    sp.nama,
    sp.bio,
    sp.skill_level,
    sp.foto_url,
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
    sp.distance_km,
    sp.raw_match_score AS match_score,
    ROUND(LEAST(sp.raw_match_score / 130.0 * 100, 100))::INT AS match_percentage
  FROM scored_profiles sp
  ORDER BY sp.raw_match_score DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
