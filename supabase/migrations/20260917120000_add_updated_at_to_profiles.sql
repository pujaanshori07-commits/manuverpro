-- Migration to add updated_at column to profiles table
-- This fixes the onboarding and profile save errors.

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
