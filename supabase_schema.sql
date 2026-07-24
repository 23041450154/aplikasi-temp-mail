-- Langkah 1: Struktur Tabel Database (Supabase SQL)

-- Buat tabel emails
CREATE TABLE public.emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  to_address text NOT NULL,
  from_address text NOT NULL,
  subject text,
  body text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Buat policy agar client anonim bisa membaca email (untuk frontend Next.js)
CREATE POLICY "Allow public read access" ON public.emails
  FOR SELECT
  USING (true);

-- IMPORTANT: Mengaktifkan Supabase Realtime pada tabel emails
-- Ini memungkinkan frontend mendengarkan perubahan tabel secara live
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
