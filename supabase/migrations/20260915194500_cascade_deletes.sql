
-- Ensure swipes cascade on profile deletion
ALTER TABLE IF EXISTS public.swipes
  DROP CONSTRAINT IF EXISTS swipes_user_id_fkey,
  DROP CONSTRAINT IF EXISTS swipes_target_user_id_fkey;

ALTER TABLE IF EXISTS public.swipes
  ADD CONSTRAINT swipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT swipes_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure matches cascade on profile deletion
ALTER TABLE IF EXISTS public.matches
  DROP CONSTRAINT IF EXISTS matches_user_a_id_fkey,
  DROP CONSTRAINT IF EXISTS matches_user_b_id_fkey;

ALTER TABLE IF EXISTS public.matches
  ADD CONSTRAINT matches_user_a_id_fkey FOREIGN KEY (user_a_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT matches_user_b_id_fkey FOREIGN KEY (user_b_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
