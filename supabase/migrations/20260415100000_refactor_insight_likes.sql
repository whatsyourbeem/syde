-- 1. 인사이트 댓글 전용 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS public.insight_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.insight_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- 2. 기존 통합 테이블에서 댓글 좋아요 데이터 이전
INSERT INTO public.insight_comment_likes (id, comment_id, user_id, created_at)
SELECT id, comment_id, user_id, created_at
FROM public.insight_likes
WHERE comment_id IS NOT NULL
ON CONFLICT (comment_id, user_id) DO NOTHING;

-- 3. 기존 통합 테이블(insight_likes) 정리
-- 제약 조건 및 컬럼 삭제
ALTER TABLE public.insight_likes DROP CONSTRAINT IF EXISTS chk_insight_or_comment_id;
ALTER TABLE public.insight_likes DROP CONSTRAINT IF EXISTS unique_insight_like_per_user;
ALTER TABLE public.insight_likes DROP COLUMN IF EXISTS comment_id;

-- 인사이트 ID를 다시 NOT NULL로 설정 (본문 전용이 되었으므로)
ALTER TABLE public.insight_likes ALTER COLUMN insight_id SET NOT NULL;

-- 본문 좋아요 고유 제약 조건 재설정
ALTER TABLE public.insight_likes ADD CONSTRAINT insight_likes_insight_id_user_id_key UNIQUE (insight_id, user_id);

-- 4. RLS 정책 설정 (새 테이블)
ALTER TABLE public.insight_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view insight comment likes" 
ON public.insight_comment_likes FOR SELECT USING (true);

CREATE POLICY "users can insert their own comment likes" 
ON public.insight_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete their own comment likes" 
ON public.insight_comment_likes FOR DELETE USING (auth.uid() = user_id);
