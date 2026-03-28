-- 1. Add views_count column to showcases table
ALTER TABLE public.showcases
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- 2. Create a SECURITY DEFINER function to increment view count
--    This bypasses RLS so any visitor can increment the count
CREATE OR REPLACE FUNCTION public.increment_showcase_view(p_showcase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.showcases
  SET views_count = views_count + 1
  WHERE id = p_showcase_id;
END;
$$;

-- 3. Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_showcase_view(uuid) TO anon, authenticated;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
