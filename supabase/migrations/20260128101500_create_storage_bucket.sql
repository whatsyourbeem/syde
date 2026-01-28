-- Create 'showcases' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('showcases', 'showcases', true)
ON CONFLICT (id) DO NOTHING;



-- Helper block to safely create policies
DO $$
BEGIN
    -- Public Read Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Showcases'
    ) THEN
        CREATE POLICY "Public Access Showcases"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'showcases' );
    END IF;

    -- Authenticated Upload Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Auth Upload Showcases'
    ) THEN
        CREATE POLICY "Auth Upload Showcases"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'showcases' );
    END IF;

    -- Authenticated Update Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Auth Update Showcases'
    ) THEN
        CREATE POLICY "Auth Update Showcases"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'showcases' );
    END IF;

    -- Authenticated Delete Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Auth Delete Showcases'
    ) THEN
        CREATE POLICY "Auth Delete Showcases"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'showcases' );
    END IF;
END $$;
