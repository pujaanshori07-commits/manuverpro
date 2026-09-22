-- Add missing updated_at columns that were assumed to exist in handle_swipe RPC

ALTER TABLE public.swipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
