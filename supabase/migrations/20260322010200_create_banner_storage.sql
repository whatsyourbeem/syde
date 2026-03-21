-- Create 'banners' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the 'banners' bucket
DO $$
BEGIN
    -- Public Read Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Banners'
    ) THEN
        CREATE POLICY "Public Access Banners"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'banners' );
    END IF;

    -- Authenticated Manage Access (Upload, Update, Delete)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Manage Banners'
    ) THEN
        CREATE POLICY "Manage Banners"
        ON storage.objects FOR ALL
        TO authenticated
        USING ( bucket_id = 'banners' )
        WITH CHECK ( bucket_id = 'banners' );
    END IF;
END $$;
