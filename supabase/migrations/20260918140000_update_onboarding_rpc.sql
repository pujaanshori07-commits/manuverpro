-- Migration 20260918140000_update_onboarding_rpc.sql
-- Updates complete_user_onboarding to capture the user's own birthdate and gender.

CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
  p_primary_sport TEXT,
  p_sports JSONB,
  p_age_pref_min INT,
  p_age_pref_max INT,
  p_gender_pref TEXT,
  p_location_granted BOOLEAN DEFAULT false,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_birthdate DATE DEFAULT NULL,
  p_gender TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_item JSONB;
BEGIN
  -- Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Update Profile Settings
  UPDATE public.profiles
  SET
    has_completed_onboarding = true,
    onboarding_complete = true, -- Also update old column just in case
    terms_accepted_at = COALESCE(terms_accepted_at, now()),
    primary_sport = p_primary_sport,
    age_pref_min = p_age_pref_min,
    age_pref_max = p_age_pref_max,
    gender_pref = p_gender_pref,
    location_permission_granted = p_location_granted,
    last_latitude = COALESCE(p_latitude, last_latitude),
    last_longitude = COALESCE(p_longitude, last_longitude),
    tanggal_lahir = COALESCE(p_birthdate, tanggal_lahir),
    gender = COALESCE(p_gender, gender),
    updated_at = now()
  WHERE id = v_user_id;

  -- 2. Clear previous sports for this user to avoid stale records
  DELETE FROM public.user_sports WHERE user_id = v_user_id;

  -- 3. Insert each sport with experience level from the JSONB array
  IF p_sports IS NOT NULL AND jsonb_array_length(p_sports) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_sports)
    LOOP
      INSERT INTO public.user_sports (user_id, sport_id, experience_level)
      VALUES (
        v_user_id,
        v_item->>'sport_id',
        COALESCE(v_item->>'experience', '1-3 thn')
      )
      ON CONFLICT (user_id, sport_id) DO UPDATE
      SET experience_level = EXCLUDED.experience_level;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
