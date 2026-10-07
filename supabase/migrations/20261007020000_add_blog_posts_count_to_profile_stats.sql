-- 프로필 통계에 블로그 글 개수(blog_posts_count)를 추가한다.
-- 반환 컬럼이 늘어나므로 CREATE OR REPLACE 대신 DROP 후 재생성한다.
DROP FUNCTION IF EXISTS public.get_profile_stats(uuid);

CREATE FUNCTION public.get_profile_stats(p_user_id uuid)
RETURNS TABLE (
  showcases_count bigint,
  total_upvotes bigint,
  total_views bigint,
  syde_pick_count bigint,
  meetups_attended_count bigint,
  active_developing_id uuid,
  active_developing_name text,
  active_developing_slug text,
  blog_posts_count bigint
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
    (SELECT slug FROM active_dev),
    (SELECT COUNT(*) FROM my_blog_posts);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
