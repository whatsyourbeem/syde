-- Fix storage bucket insertions to be more idempotent and avoid "duplicate key" errors during batch execution
DO $$
BEGIN
    -- profiles bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profiles') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);
    END IF;

    -- logs bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'logs') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('logs', 'logs', true);
    END IF;

    -- meetups bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'meetups') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('meetups', 'meetups', true);
    END IF;

    -- insight-images bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'insight-images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('insight-images', 'insight-images', true);
    END IF;

    -- showcases bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'showcases') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('showcases', 'showcases', true);
    END IF;

    -- banners bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
    END IF;

    -- clubs bucket
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'clubs') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('clubs', 'clubs', true);
    END IF;
END $$;
