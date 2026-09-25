-- 1. Tambahkan kolom yang hilang di tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS home_venue TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- 2. Buat storage bucket "profile-photos" (jika belum ada)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy untuk membaca foto (Public)
CREATE POLICY "Public profiles photos are accessible to everyone."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- 4. Policy untuk mengunggah foto profil (Hanya pemilik)
CREATE POLICY "Users can upload their own profile photos."
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Policy untuk update foto profil
CREATE POLICY "Users can update their own profile photos."
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Policy untuk menghapus foto profil
CREATE POLICY "Users can delete their own profile photos."
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
