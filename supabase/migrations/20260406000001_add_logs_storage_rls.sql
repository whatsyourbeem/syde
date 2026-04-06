-- 읽기: 전체 공개
CREATE POLICY "Public Access Logs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logs');

-- 업로드: 인증된 유저는 본인 userId 폴더에만
CREATE POLICY "Auth Upload Logs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 삭제: 본인 userId 폴더 파일만
CREATE POLICY "Auth Delete Logs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
