-- Migration: Add unique phone number constraint and update auth trigger

-- 1. Add no_hp column to profiles if it doesn't exist, with a UNIQUE constraint
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS no_hp TEXT UNIQUE;

-- 2. Update the auth trigger to capture no_hp during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, no_hp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', 'Pengguna Baru'),
    NEW.raw_user_meta_data->>'no_hp'
  );
  RETURN NEW;
END;
$$;
