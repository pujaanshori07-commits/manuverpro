-- Phase 12: Bumble-Grade Profile & Bio Experience Migration

-- 1. Add Sports Badges & About You Attributes columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS overall_frequency TEXT,
  ADD COLUMN IF NOT EXISTS preferred_time TEXT,
  ADD COLUMN IF NOT EXISTS home_venue TEXT,
  ADD COLUMN IF NOT EXISTS height_cm INT,
  ADD COLUMN IF NOT EXISTS domisili TEXT,
  ADD COLUMN IF NOT EXISTS sport_role TEXT;

-- 2. Create prompt_questions table (Curated sports question bank)
CREATE TABLE IF NOT EXISTS public.prompt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create profile_prompts table (User selected prompts + answers)
CREATE TABLE IF NOT EXISTS public.profile_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.prompt_questions(id),
  answer_text TEXT NOT NULL CHECK (LENGTH(answer_text) <= 150),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_prompts_user ON public.profile_prompts(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.prompt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active questions" ON public.prompt_questions;
CREATE POLICY "Anyone can view active questions" ON public.prompt_questions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view profile prompts" ON public.profile_prompts;
CREATE POLICY "Anyone can view profile prompts" ON public.profile_prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own prompts" ON public.profile_prompts;
CREATE POLICY "Users manage own prompts" ON public.profile_prompts FOR ALL USING (auth.uid() = user_id);

-- 5. Enforce Max 3 Prompts constraint trigger
CREATE OR REPLACE FUNCTION enforce_max_prompts()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profile_prompts WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 prompts allowed per profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_max_prompts ON public.profile_prompts;
CREATE TRIGGER trg_enforce_max_prompts
  BEFORE INSERT ON public.profile_prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_max_prompts();

-- 6. Seed Sports-Themed Prompt Questions (5 Focused Curated Questions)
INSERT INTO public.prompt_questions (question_text, category) VALUES
  ('My dream training session is...', 'general'),
  ('I need a partner who...', 'general'),
  ('My signature move on the court/field is...', 'skill'),
  ('You''ll definitely catch me playing on...', 'social'),
  ('I''m competitive about...', 'competitive')
ON CONFLICT DO NOTHING;
