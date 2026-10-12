-- 1. Pastikan kolom-kolom ini benar-benar ada di tabel
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pendidikan TEXT,
ADD COLUMN IF NOT EXISTS pekerjaan TEXT,
ADD COLUMN IF NOT EXISTS home_venue TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- 2. RESET CACHE API SUPABASE (Paling Penting!)
NOTIFY pgrst, 'reload schema';
