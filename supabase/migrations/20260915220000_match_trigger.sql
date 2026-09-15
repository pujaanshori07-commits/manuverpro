-- ==========================================
-- PHASE 2: SWIPE AND MATCH RPC
-- ==========================================

-- RPC for handling swipes and instantly returning if it's a mutual match
CREATE OR REPLACE FUNCTION public.handle_swipe(
  target_id UUID,
  swipe_action TEXT
)
RETURNS JSON AS $$
DECLARE
  is_mutual_match BOOLEAN := false;
  new_match_id UUID := null;
  requester_id UUID := auth.uid();
BEGIN
  IF requester_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert the swipe
  INSERT INTO public.swipes (user_id, target_user_id, action)
  VALUES (requester_id, target_id, swipe_action)
  ON CONFLICT (user_id, target_user_id) DO UPDATE
  SET action = EXCLUDED.action, updated_at = NOW();

  -- If it's a like, check for mutual match
  IF swipe_action = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE user_id = target_id 
        AND target_user_id = requester_id 
        AND action = 'like'
    ) THEN
      is_mutual_match := true;
      
      -- Insert into matches table (user_a_id < user_b_id)
      INSERT INTO public.matches (user_a_id, user_b_id)
      VALUES (
        LEAST(requester_id, target_id),
        GREATEST(requester_id, target_id)
      )
      ON CONFLICT (user_a_id, user_b_id) DO UPDATE SET updated_at = NOW()
      RETURNING id INTO new_match_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'is_match', is_mutual_match,
    'match_id', new_match_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
