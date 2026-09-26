-- 프로필 "부캐 명함" 개편: 관심사/역할 태그 (예: #백엔드 #Next.js #N잡러)
-- 저장 시엔 '#' 접두어 없이 원문만 저장하고, 렌더링할 때만 붙인다.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tags_max_3'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tags_max_3
      CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 3);
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
