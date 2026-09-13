-- 쇼케이스 "끌어올리기" 기능
-- 정렬 기준이 되는 bumped_at 컬럼과 끌어올린 횟수(bump_count)를 추가한다.

-- 1. 컬럼 추가
--    bumped_at: 게시판 정렬 기준 타임스탬프. 생성 시점에는 created_at과 동일(now()).
--    bump_count: 끌어올린 누적 횟수.
ALTER TABLE public.showcases
  ADD COLUMN IF NOT EXISTS bumped_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bump_count integer NOT NULL DEFAULT 0;

-- 2. 기존 데이터 백필: bumped_at = created_at (없으면 now())
UPDATE public.showcases
SET bumped_at = COALESCE(created_at, now())
WHERE bumped_at IS DISTINCT FROM COALESCE(created_at, now());

-- 3. 정렬 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_showcases_bumped_at
  ON public.showcases (bumped_at DESC);

-- 4. 끌어올리기 RPC
--    소유자 + 마지막 끌어올리기(또는 생성)로부터 7일 경과 조건을 WHERE 절에서
--    원자적으로 검사하여 어뷰징/연타를 방지한다.
--    조건 미충족 시 0개 row를 반환한다.
CREATE OR REPLACE FUNCTION public.bump_showcase(p_showcase_id uuid)
RETURNS TABLE (bumped_at timestamptz, bump_count integer, next_bump_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  RETURN QUERY
  UPDATE public.showcases s
  SET bumped_at = v_now,
      bump_count = s.bump_count + 1
  WHERE s.id = p_showcase_id
    AND s.user_id = auth.uid()
    AND s.bumped_at <= v_now - interval '7 days'
  RETURNING s.bumped_at, s.bump_count, s.bumped_at + interval '7 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_showcase(uuid) TO authenticated;

-- 5. PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
