-- 프로필 "부캐 명함" 개편: 공개 소셜 정보(이메일/깃헙/트위터/인스타그램)
-- 기존 profiles.email은 로그인용 PII라 비공개, profiles.link(홈페이지)는 이미 존재함.
-- 여기 추가하는 값들은 본인이 명함에 공개하기로 직접 입력한 것들이라 별도 컬럼으로 분리한다.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS github_username text,
  ADD COLUMN IF NOT EXISTS twitter_username text,
  ADD COLUMN IF NOT EXISTS instagram_username text;

NOTIFY pgrst, 'reload schema';
