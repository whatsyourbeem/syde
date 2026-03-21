-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  position TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active banners
CREATE POLICY "Enable read access for all users" ON public.banners
FOR SELECT USING (true);

-- Allow authenticated users to manage banners (temporarily, in production this should be restricted to admin roles)
CREATE POLICY "Enable all access for authenticated users" ON public.banners
FOR ALL USING (auth.role() = 'authenticated');
