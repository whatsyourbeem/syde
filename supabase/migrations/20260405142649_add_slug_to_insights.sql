-- Add slug column to insights table
ALTER TABLE public.insights ADD COLUMN slug TEXT UNIQUE;

-- Function to generate slug
CREATE OR REPLACE FUNCTION public.generate_insight_slug(title_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  IF title_text IS NULL OR title_text = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN 
    regexp_replace(
      regexp_replace(
        lower(trim(title_text)),
        '[^a-z0-9가-힣\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    );
END;
$$ LANGUAGE plpgsql;

-- Initialize existing slugs securely to avoid UNIQUE constraint violations
DO $$
DECLARE
    r RECORD;
    base_slug TEXT;
    new_slug TEXT;
BEGIN
    FOR r IN SELECT id, title FROM public.insights WHERE slug IS NULL AND title IS NOT NULL LOOP
        base_slug := public.generate_insight_slug(r.title);
        new_slug := base_slug;
        IF EXISTS (SELECT 1 FROM public.insights WHERE slug = new_slug AND id != r.id) THEN
            new_slug := base_slug || '-' || substr(r.id::text, 1, 8);
        END IF;
        UPDATE public.insights SET slug = new_slug WHERE id = r.id;
    END LOOP;
END $$;

-- Trigger function to auto-generate slug on insert if null
CREATE OR REPLACE FUNCTION public.trig_handle_insight_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL AND NEW.title IS NOT NULL THEN
        NEW.slug := public.generate_insight_slug(NEW.title);
        -- If slug already exists, append partial ID for uniqueness
        IF EXISTS (SELECT 1 FROM public.insights WHERE slug = NEW.slug) THEN
            NEW.slug := NEW.slug || '-' || substr(NEW.id::text, 1, 8);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS handle_insight_slug_on_insert ON public.insights;
CREATE TRIGGER handle_insight_slug_on_insert
BEFORE INSERT ON public.insights
FOR EACH ROW
EXECUTE FUNCTION public.trig_handle_insight_slug();
