-- Update trending showcases scoring:
-- - Extend window from 14 days to 30 days
-- - Upvotes within 7 days have equal weight (1.0)
-- - Upvotes older than 7 days decay: 1 / (floor(days - 7) + 2) ^ 1.5
DROP FUNCTION IF EXISTS public.get_trending_showcases();

CREATE OR REPLACE FUNCTION public.get_trending_showcases()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  short_description text,
  thumbnail_url text,
  score numeric,
  upvotes_count bigint,
  views_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH recent_upvotes AS (
    SELECT
      showcase_id,
      COUNT(u.id) AS upvotes_count,
      SUM(
        CASE
          WHEN EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 <= 7 THEN 1.0
          ELSE 1.0 / POWER(
            FLOOR(EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 - 7) + 2,
            1.5
          )
        END
      ) AS computed_score
    FROM public.showcase_upvotes u
    WHERE u.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY showcase_id
  )
  SELECT
    s.id,
    s.name,
    s.slug,
    s.short_description,
    s.thumbnail_url,
    COALESCE(ru.computed_score, 0)::numeric AS score,
    COALESCE(ru.upvotes_count, 0) AS upvotes_count,
    s.views_count
  FROM public.showcases s
  JOIN recent_upvotes ru ON s.id = ru.showcase_id
  ORDER BY
    ru.computed_score DESC,
    s.created_at DESC
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_showcases() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
