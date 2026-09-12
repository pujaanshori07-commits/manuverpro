-- Create invite_status enum
CREATE TYPE public.invite_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'counter_proposed',
    'cancelled',
    'completed',
    'expired'
);

-- Create sparing_invites table
CREATE TABLE public.sparing_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sport VARCHAR(50) NOT NULL,
    mode VARCHAR(50),
    venue_name VARCHAR(255) NOT NULL,
    venue_lat DOUBLE PRECISION,
    venue_lng DOUBLE PRECISION,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INTEGER DEFAULT 120,
    note TEXT,
    status public.invite_status DEFAULT 'pending',
    counter_scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for querying by match and users
CREATE INDEX idx_sparing_invites_match_id ON public.sparing_invites(match_id);
CREATE INDEX idx_sparing_invites_sender_id ON public.sparing_invites(sender_id);
CREATE INDEX idx_sparing_invites_receiver_id ON public.sparing_invites(receiver_id);

-- Enable RLS
ALTER TABLE public.sparing_invites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own invites"
    ON public.sparing_invites FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create invites"
    ON public.sparing_invites FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own invites"
    ON public.sparing_invites FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
