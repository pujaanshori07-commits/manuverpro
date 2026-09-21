-- Phase 11: Growth Engineering Migration
-- PostGIS, Last Active Tracking, Profile Completeness, Auto-Flagging, and Weighted Matching Scoring

-- 1. Enable PostGIS Extension in extensions schema and update search path
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
SET search_path = public, extensions;

-- 2. Add Last Active, Location Geography, Profile Completeness & Review Flag columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS profile_completeness INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 3. Backfill Location from existing last_latitude/last_longitude
UPDATE public.profiles 
SET location = ST_SetSRID(ST_MakePoint(last_longitude, last_latitude), 4326)::geography
WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL AND location IS NULL;

-- 4. Spatial GIST Index for high-performance geospatial queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);

-- 5. Auto-sync trigger for location geography
CREATE OR REPLACE FUNCTION sync_profile_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_latitude IS NOT NULL AND NEW.last_longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.last_longitude, NEW.last_latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_location ON public.profiles;
CREATE TRIGGER trg_sync_location
  BEFORE INSERT OR UPDATE OF last_latitude, last_longitude ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_location();

-- 6. touch_last_active RPC
CREATE OR REPLACE FUNCTION touch_last_active()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET last_active = NOW() WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Calculate Profile Completeness Score (0-100)
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  score INT := 0;
  profile_row RECORD;
  photo_count INT := 0;
  sport_count INT := 0;
BEGIN
  SELECT * INTO profile_row FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  IF profile_row.bio IS NOT NULL AND LENGTH(profile_row.bio) >= 10 THEN score := score + 20; END IF;
  IF profile_row.skill_level IS NOT NULL THEN score := score + 10; END IF;
  IF profile_row.looking_for IS NOT NULL THEN score := score + 10; END IF;
  IF profile_row.availability IS NOT NULL THEN score := score + 10; END IF;
  
  SELECT COUNT(*) INTO photo_count FROM public.profile_photos WHERE profile_id = p_user_id;
  score := score + LEAST(photo_count * 10, 30);
  
  SELECT COUNT(*) INTO sport_count FROM public.user_sports WHERE user_id = p_user_id;
  score := score + LEAST(sport_count * 5, 20);
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Auto-flag repeat reported accounts (3+ reports in 30 days)
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
  report_count INT;
BEGIN
  SELECT COUNT(*) INTO report_count 
  FROM public.reports 
  WHERE reported_id = NEW.reported_id 
    AND created_at > NOW() - INTERVAL '30 days';
  
  IF report_count >= 3 THEN
    UPDATE public.profiles SET flagged_for_review = true WHERE id = NEW.reported_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reports ON public.reports;
CREATE TRIGGER trg_check_reports AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION check_report_threshold();

-- 9. Weighted get_nearby_profiles Scoring RPC (Tinder/Bumble-Grade Algorithm)
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
  availability TEXT,
  looking_for TEXT,
  last_active TIMESTAMP WITH TIME ZONE,
  profile_completeness INT,
  distance_km FLOAT,
  match_score FLOAT
) AS $$
DECLARE
  requester_location GEOGRAPHY;
  requester_sports TEXT[];
BEGIN
  SELECT location INTO requester_location FROM public.profiles WHERE public.profiles.id = user_id_param;
  SELECT ARRAY_AGG(sport_id) INTO requester_sports FROM public.user_sports WHERE public.user_sports.user_id = user_id_param;

  RETURN QUERY
  SELECT 
    p.id,
    p.nama,
    p.bio,
    p.skill_level,
    p.foto_url,
    p.alamat,
    p.availability,
    p.looking_for,
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
    ) AS match_score

  FROM public.profiles p
  WHERE p.id != user_id_param
    AND COALESCE(p.flagged_for_review, false) = false
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes s 
      WHERE s.user_id = user_id_param AND s.target_user_id = p.id
    )
  ORDER BY match_score DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
