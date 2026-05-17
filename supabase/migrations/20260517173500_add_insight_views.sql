-- ===================================================
-- Add Views Column & View Count RPC for Insights
-- ===================================================

-- 1. Add views column with a default of 0
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.insights.views IS '인사이트 게시글 조회수';

-- 2. Create function to increment views safely avoiding race conditions
CREATE OR REPLACE FUNCTION public.increment_insight_views(insight_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.insights
  SET views = views + 1
  WHERE id = insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions to API clients
GRANT EXECUTE ON FUNCTION public.increment_insight_views(uuid) TO anon, authenticated;
