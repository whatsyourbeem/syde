-- 기존 복잡한 정책 제거 (DB join 기반 소유권 검증)
DROP POLICY IF EXISTS "Allow club owners to manage thumbnails v2" ON storage.objects;
DROP POLICY IF EXISTS "Allow club owners to manage description images v2" ON storage.objects;
DROP POLICY IF EXISTS "Allow club members to upload to posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow post authors to manage their post files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Clubs" ON storage.objects;

-- 읽기: 전체 공개
CREATE POLICY "Public Access Clubs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'clubs');

-- 업로드: 인증된 유저는 본인 userId 폴더에만
CREATE POLICY "Auth Upload Clubs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clubs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 삭제: 본인 userId 폴더 파일만
CREATE POLICY "Auth Delete Clubs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'clubs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
