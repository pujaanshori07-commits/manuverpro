-- Phase 6: Edit Profile Additions

-- 1. Add new columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS looking_for TEXT;

-- 2. Create profile_photos table
CREATE TABLE IF NOT EXISTS public.profile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS) for profile_photos
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profile photos"
    ON public.profile_photos FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own photos"
    ON public.profile_photos FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own photos"
    ON public.profile_photos FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own photos"
    ON public.profile_photos FOR DELETE
    USING (auth.uid() = profile_id);

-- 4. Storage Bucket Check (Must be done manually in dashboard if not created yet)
-- The bucket should be named "profile-photos" and set to Public.
-- Make sure the bucket has RLS policies to allow inserts and selects!
