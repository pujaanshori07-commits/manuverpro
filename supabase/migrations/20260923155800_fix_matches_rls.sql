SET search_path = public, extensions;

-- 1. Drop unsafe policies that allow clients to forge matches
DROP POLICY IF EXISTS "Users can insert matches if they are involved." ON public.matches;
DROP POLICY IF EXISTS "Users can update their matches." ON public.matches;

-- Notes: 
-- The "Users can view their matches." SELECT policy is left untouched so clients can fetch their chats.
-- Creation and manipulation of matches is strictly reserved to backend RPCs (like handle_swipe) 
-- running with SECURITY DEFINER privileges.
