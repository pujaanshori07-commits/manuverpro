CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  participants TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  price TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone."
  ON public.events FOR SELECT
  USING ( true );
