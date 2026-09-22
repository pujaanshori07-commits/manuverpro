-- Add missing unique constraints that were assumed to exist in handle_swipe RPC

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'swipes_user_target_key') THEN
        ALTER TABLE public.swipes ADD CONSTRAINT swipes_user_target_key UNIQUE(user_id, target_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_user_a_b_key') THEN
        ALTER TABLE public.matches ADD CONSTRAINT matches_user_a_b_key UNIQUE(user_a_id, user_b_id);
    END IF;
END $$;
