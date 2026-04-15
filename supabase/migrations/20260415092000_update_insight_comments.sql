-- 1. 인사이트 댓글에 답글(대댓글) 기능 추가
ALTER TABLE public.insight_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.insight_comments(id) ON DELETE CASCADE;

-- 2. 기존 인사이트 좋아요 테이블 확장 (게시물 + 댓글 통합 관리)
-- 기존에 잘못 생성된 테이블이 있다면 삭제
DROP TABLE IF EXISTS public.insight_comment_likes;

-- 테이블 구조 변경
ALTER TABLE public.insight_likes 
ALTER COLUMN insight_id DROP NOT NULL,
ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.insight_comments(id) ON DELETE CASCADE;

-- 기존 유니크 제약 조건 삭제 및 통합 제약 조건 추가
ALTER TABLE public.insight_likes DROP CONSTRAINT IF EXISTS insight_likes_insight_id_user_id_key;
ALTER TABLE public.insight_likes DROP CONSTRAINT IF EXISTS insight_likes_pkey;
ALTER TABLE public.insight_likes ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- 게시물 또는 댓글 중 하나만 좋아요 할 수 있도록 체크 제약 조건 추가
ALTER TABLE public.insight_likes DROP CONSTRAINT IF EXISTS chk_insight_or_comment_id;
ALTER TABLE public.insight_likes ADD CONSTRAINT chk_insight_or_comment_id CHECK (
    (insight_id IS NOT NULL AND comment_id IS NULL) OR 
    (insight_id IS NULL AND comment_id IS NOT NULL)
);

-- 유저당 (게시물/댓글)별 고유 좋아요 제약 조건 추가
ALTER TABLE public.insight_likes DROP CONSTRAINT IF EXISTS unique_insight_like_per_user;
ALTER TABLE public.insight_likes ADD CONSTRAINT unique_insight_like_per_user UNIQUE (user_id, insight_id, comment_id);

-- 3. 인사이트 댓글 관련 추가 설정
-- 댓글 수정 RLS 정책 추가 (누락되어 있었음)
DROP POLICY IF EXISTS "users can update their own comments" ON public.insight_comments;
CREATE POLICY "users can update their own comments" ON public.insight_comments 
FOR UPDATE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거 추가
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_insight_comments_updated_at ON public.insight_comments;
CREATE TRIGGER set_insight_comments_updated_at
    BEFORE UPDATE ON public.insight_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

