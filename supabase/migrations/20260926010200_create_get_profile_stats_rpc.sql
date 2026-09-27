-- 프로필 "부캐 명함" 개편: 증거 바(프로젝트 수/누적 업보트/누적 조회수/SYDE Pick/참석 모임)와
-- "지금 만드는 중" 배지용 데이터를 단일 쿼리로 반환한다 (N+1 방지).
-- 참조 테이블(showcase_upvotes/showcase_awards/blog_posts/meetup_participants)의 SELECT RLS가
-- 이미 전체 공개이므로 SECURITY DEFINER로 만들어도 노출되는 정보는 기존에 공개된 집계치뿐이다.
CREATE OR REPLACE FUNCTION public.get_profile_stats(p_user_id uuid)
RETURNS TABLE (
  showcases_count bigint,
  total_upvotes bigint,
  total_views bigint,
  syde_pick_count bigint,
  meetups_attended_count bigint,
  active_developing_id uuid,
  active_developing_name text,
  active_developing_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH my_showcases AS (
    SELECT id, name, slug, status, created_at, views_count
    FROM public.showcases
    WHERE user_id = p_user_id
  ),
  active_dev AS (
    SELECT id, name, slug FROM my_showcases
    WHERE status = 'DEVELOPING'
    ORDER BY created_at DESC LIMIT 1
  )
  SELECT
    (SELECT COUNT(*) FROM my_showcases),
    (SELECT COUNT(*) FROM public.showcase_upvotes su
       WHERE su.showcase_id IN (SELECT id FROM my_showcases)),
    (SELECT COALESCE(SUM(views_count), 0) FROM my_showcases)
      + (SELECT COALESCE(SUM(views), 0) FROM public.blog_posts WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM public.showcase_awards sa
       WHERE sa.showcase_id IN (SELECT id FROM my_showcases)),
    (SELECT COUNT(*) FROM public.meetup_participants
       WHERE user_id = p_user_id AND status = 'APPROVED'),
    (SELECT id FROM active_dev),
    (SELECT name FROM active_dev),
    (SELECT slug FROM active_dev);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
