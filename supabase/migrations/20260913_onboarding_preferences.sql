-- 1. Ensure required onboarding columns exist on public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS primary_sport TEXT DEFAULT 'badminton',
  ADD COLUMN IF NOT EXISTS age_pref_min INT DEFAULT 18,
  ADD COLUMN IF NOT EXISTS age_pref_max INT DEFAULT 35,
  ADD COLUMN IF NOT EXISTS gender_pref TEXT DEFAULT 'all' CHECK (gender_pref IN ('all', 'men', 'women')),
  ADD COLUMN IF NOT EXISTS location_permission_granted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_longitude DOUBLE PRECISION;

-- 2. Create user_sports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_id TEXT NOT NULL,
  experience_level TEXT NOT NULL DEFAULT '1-3 thn',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_sports_unique_user_sport UNIQUE (user_id, sport_id)
);

-- 3. Create index for fast matching queries
CREATE INDEX IF NOT EXISTS idx_user_sports_user_id ON public.user_sports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_sport_id ON public.user_sports(sport_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_sports
DROP POLICY IF EXISTS "Public can view user sports" ON public.user_sports;
CREATE POLICY "Public can view user sports"
  ON public.user_sports FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own sports" ON public.user_sports;
CREATE POLICY "Users can insert own sports"
  ON public.user_sports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sports" ON public.user_sports;
CREATE POLICY "Users can update own sports"
  ON public.user_sports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sports" ON public.user_sports;
CREATE POLICY "Users can delete own sports"
  ON public.user_sports FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Atomic RPC Function to complete onboarding in a single transaction
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
  p_primary_sport TEXT,
  p_sports JSONB,
  p_age_pref_min INT,
  p_age_pref_max INT,
  p_gender_pref TEXT,
  p_location_granted BOOLEAN DEFAULT false,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL
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
    updated_at = now()
  WHERE id = v_user_id;

  -- 2. Clear previous sports for this user to avoid stale records
  DELETE FROM public.user_sports WHERE user_id = v_user_id;

  -- 3. Insert each sport with experience level from the JSONB array
  -- Expected format: [{"sport_id": "badminton", "experience": "1-3 thn"}, ...]
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
