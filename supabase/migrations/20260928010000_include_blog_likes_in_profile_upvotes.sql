-- 프로필 증거 바의 "누적 업보트"에 쇼케이스 업보트뿐 아니라 블로그 글 좋아요도 합산한다.
-- (라벨은 "누적 호응"으로 바뀌었지만 값은 이 함수의 total_upvotes 컬럼을 그대로 재사용)
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
  my_blog_posts AS (
    SELECT id, views
    FROM public.blog_posts
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
       WHERE su.showcase_id IN (SELECT id FROM my_showcases))
      + (SELECT COUNT(*) FROM public.blog_post_likes bl
       WHERE bl.blog_post_id IN (SELECT id FROM my_blog_posts)),
    (SELECT COALESCE(SUM(views_count), 0) FROM my_showcases)
      + (SELECT COALESCE(SUM(views), 0) FROM my_blog_posts),
    (SELECT COUNT(*) FROM public.showcase_awards sa
       WHERE sa.showcase_id IN (SELECT id FROM my_showcases)),
    (SELECT COUNT(*) FROM public.meetup_participants
       WHERE user_id = p_user_id AND status = 'APPROVED'),
    (SELECT id FROM active_dev),
    (SELECT name FROM active_dev),
    (SELECT slug FROM active_dev);
END;
$$;

NOTIFY pgrst, 'reload schema';
