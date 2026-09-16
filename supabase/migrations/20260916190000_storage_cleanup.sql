-- Phase: Medium Fix - Storage Clean Up
-- Automatically cleans up orphaned avatar images from storage when a user deletes their account.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi';
  END IF;

  -- 1. CLEAN UP STORAGE (Avatars)
  -- Deletes all images belonging to the user before deleting the user profile
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = v_user_id::text;

  -- 2. DELETE AUTH ACCOUNT
  -- Due to foreign key constraints with ON DELETE CASCADE, 
  -- this will also delete the user's profile (profiles, swipes, matches, messages).
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
