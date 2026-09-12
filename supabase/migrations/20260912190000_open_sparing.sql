-- 1. Create open_sessions table
CREATE TABLE IF NOT EXISTS public.open_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  title TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_lat DOUBLE PRECISION,
  venue_lng DOUBLE PRECISION,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 120,
  slots_total INTEGER NOT NULL CHECK (slots_total >= 2 AND slots_total <= 20),
  slots_filled INTEGER NOT NULL DEFAULT 1 CHECK (slots_filled >= 0),
  gender_pref TEXT NOT NULL DEFAULT 'any' CHECK (gender_pref IN ('any', 'male', 'female')),
  skill_note TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '7 days')
);

-- 2. Create session_participants table
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.open_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_session_participant UNIQUE (session_id, user_id)
);

-- 3. Indexes for fast query lookups
CREATE INDEX IF NOT EXISTS idx_open_sessions_creator_id ON public.open_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_open_sessions_sport ON public.open_sessions(sport);
CREATE INDEX IF NOT EXISTS idx_open_sessions_status ON public.open_sessions(status);
CREATE INDEX IF NOT EXISTS idx_open_sessions_scheduled_at ON public.open_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON public.session_participants(user_id);

-- 4. PostgreSQL Trigger to auto-maintain slots_filled and session status
CREATE OR REPLACE FUNCTION public.fn_sync_session_slots()
RETURNS TRIGGER AS $$
DECLARE
  target_session_id UUID;
  current_count INTEGER;
  max_slots INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_session_id := NEW.session_id;
  ELSE
    target_session_id := OLD.session_id;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.session_participants
  WHERE session_id = target_session_id;

  SELECT slots_total INTO max_slots
  FROM public.open_sessions
  WHERE id = target_session_id;

  UPDATE public.open_sessions
  SET 
    slots_filled = current_count,
    status = CASE 
      WHEN status = 'cancelled' THEN 'cancelled'
      WHEN current_count >= max_slots THEN 'full'
      ELSE 'open'
    END
  WHERE id = target_session_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_session_slots ON public.session_participants;
CREATE TRIGGER trg_sync_session_slots
AFTER INSERT OR DELETE ON public.session_participants
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_session_slots();

-- 5. Row Level Security (RLS)
ALTER TABLE public.open_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- open_sessions policies
CREATE POLICY "Anyone can view open sessions"
  ON public.open_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON public.open_sessions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own sessions"
  ON public.open_sessions FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own sessions"
  ON public.open_sessions FOR DELETE
  USING (auth.uid() = creator_id);

-- session_participants policies
CREATE POLICY "Anyone can view session participants"
  ON public.session_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join sessions"
  ON public.session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions"
  ON public.session_participants FOR DELETE
  USING (auth.uid() = user_id);
