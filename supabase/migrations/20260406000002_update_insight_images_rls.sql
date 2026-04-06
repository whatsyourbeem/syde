-- 기존 정책 제거 (경로 제한 없는 정책)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 신규: 인증된 유저는 본인 userId 폴더에만 업로드 가능
CREATE POLICY "Auth Upload Insight Images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'insight-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 신규: 인증된 유저는 본인 userId 폴더 파일만 삭제 가능
CREATE POLICY "Auth Delete Insight Images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'insight-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
