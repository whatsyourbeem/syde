-- 프로필 "부캐 명함" 개편: 대표 프로젝트(핀) 최대 3개
-- showcases_members와 동일한 조인 테이블 패턴. 쇼케이스 삭제 시 ON DELETE CASCADE로 자동 정리된다.
CREATE TABLE IF NOT EXISTS public.profile_pinned_showcases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  showcase_id uuid NOT NULL REFERENCES public.showcases(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_pinned_showcases_pkey PRIMARY KEY (id),
  CONSTRAINT profile_pinned_showcases_user_showcase_unique UNIQUE (user_id, showcase_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_pinned_showcases_user
  ON public.profile_pinned_showcases (user_id, display_order);

ALTER TABLE public.profile_pinned_showcases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profile_pinned_showcases' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.profile_pinned_showcases
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profile_pinned_showcases' AND policyname = 'Owner can insert own pins'
  ) THEN
    CREATE POLICY "Owner can insert own pins" ON public.profile_pinned_showcases
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profile_pinned_showcases' AND policyname = 'Owner can update own pins'
  ) THEN
    CREATE POLICY "Owner can update own pins" ON public.profile_pinned_showcases
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profile_pinned_showcases' AND policyname = 'Owner can delete own pins'
  ) THEN
    CREATE POLICY "Owner can delete own pins" ON public.profile_pinned_showcases
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 원자적 핀 설정: 본인 소유 검증 + 최대 3개 제한 + 순서 저장을 한 트랜잭션으로 처리
CREATE OR REPLACE FUNCTION public.set_pinned_showcases(p_showcase_ids uuid[])
RETURNS SETOF public.profile_pinned_showcases
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owned_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF array_length(p_showcase_ids, 1) > 3 THEN
    RAISE EXCEPTION 'Cannot pin more than 3 showcases';
  END IF;

  SELECT COUNT(*) INTO v_owned_count
  FROM public.showcases
  WHERE id = ANY(p_showcase_ids) AND user_id = v_user_id;

  IF v_owned_count <> COALESCE(array_length(p_showcase_ids, 1), 0) THEN
    RAISE EXCEPTION 'Can only pin your own showcases';
  END IF;

  DELETE FROM public.profile_pinned_showcases WHERE user_id = v_user_id;

  INSERT INTO public.profile_pinned_showcases (user_id, showcase_id, display_order)
  SELECT v_user_id, sid, ord - 1
  FROM unnest(p_showcase_ids) WITH ORDINALITY AS t(sid, ord);

  RETURN QUERY
    SELECT * FROM public.profile_pinned_showcases
    WHERE user_id = v_user_id ORDER BY display_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_pinned_showcases(uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
