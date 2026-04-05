-- Add slug column to showcases table
ALTER TABLE public.showcases ADD COLUMN slug TEXT UNIQUE;

-- Function to generate slug (matching our JS logic for consistency)
CREATE OR REPLACE FUNCTION public.generate_showcase_slug(name_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  IF name_text IS NULL OR name_text = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN 
    regexp_replace(
      regexp_replace(
        lower(trim(name_text)),
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
    FOR r IN SELECT id, name FROM public.showcases WHERE slug IS NULL AND name IS NOT NULL LOOP
        base_slug := public.generate_showcase_slug(r.name);
        new_slug := base_slug;
        IF EXISTS (SELECT 1 FROM public.showcases WHERE slug = new_slug AND id != r.id) THEN
            new_slug := base_slug || '-' || substr(r.id::text, 1, 8);
        END IF;
        UPDATE public.showcases SET slug = new_slug WHERE id = r.id;
    END LOOP;
END $$;

-- Trigger function to auto-generate slug on insert if null
CREATE OR REPLACE FUNCTION public.trig_handle_showcase_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
        NEW.slug := public.generate_showcase_slug(NEW.name);
        -- If slug already exists, append partial ID for uniqueness
        IF EXISTS (SELECT 1 FROM public.showcases WHERE slug = NEW.slug) THEN
            NEW.slug := NEW.slug || '-' || substr(NEW.id::text, 1, 8);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS handle_showcase_slug_on_insert ON public.showcases;
CREATE TRIGGER handle_showcase_slug_on_insert
BEFORE INSERT ON public.showcases
FOR EACH ROW
EXECUTE FUNCTION public.trig_handle_showcase_slug();
