-- Phase 14: Tinder/Bumble Parity - Wave 2 Migration
-- 1. Upgrade get_nearby_profiles with normalized match_percentage and full profile attributes
SET search_path = public, extensions;

DROP FUNCTION IF EXISTS get_nearby_profiles(UUID, FLOAT, INT, INT);

CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_id_param UUID,
  max_distance_km FLOAT DEFAULT 50,
  max_age_val INT DEFAULT 60,
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
  requester_location GEOGRAPHY;
  requester_sports TEXT[];
BEGIN
  SELECT location INTO requester_location FROM public.profiles WHERE public.profiles.id = user_id_param;
  SELECT ARRAY_AGG(sport_id) INTO requester_sports FROM public.user_sports WHERE public.user_sports.user_id = user_id_param;

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
