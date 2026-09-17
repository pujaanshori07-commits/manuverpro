-- Phase: Feature - Event System (Verification & Registration)

-- 1. Modify existing `events` table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing events to have a default creator (if any) and approved status so they don't disappear
UPDATE public.events SET status = 'approved' WHERE status = 'pending';

-- 2. Create Event Registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 3. Row Level Security for event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view participants of events they are attending or created"
  ON public.event_registrations FOR SELECT
  USING (true); -- Simplified for MVP: anyone can see who is registered

CREATE POLICY "Users can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their registrations"
  ON public.event_registrations FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Update Event Policies
-- Drop existing select policy (assuming the one from 20260915183100_events_table.sql)
DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;

-- New Policies for Events
CREATE POLICY "Anyone can view approved events"
  ON public.events FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Creators can view their own pending/rejected events"
  ON public.events FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
