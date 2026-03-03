-- ==========================================
-- Insight Component All-in-One Migration
-- ==========================================

-- 1. 인사이트 관련 테이블 생성
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    summary TEXT, -- 한 줄 소개 컬럼 포함
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.insights.summary IS '인사이트 한 줄 소개';

-- 인사이트 댓글 테이블
CREATE TABLE IF NOT EXISTS public.insight_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인사이트 좋아요 테이블
CREATE TABLE IF NOT EXISTS public.insight_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(insight_id, user_id)
);

-- 인사이트 북마크 테이블
CREATE TABLE IF NOT EXISTS public.insight_bookmarks (
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (insight_id, user_id)
);

-- 2. RLS(Row Level Security) 설정
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_bookmarks ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "anyone can view insights" ON public.insights FOR SELECT USING (true);
CREATE POLICY "anyone can view insight comments" ON public.insight_comments FOR SELECT USING (true);
CREATE POLICY "anyone can view insight likes" ON public.insight_likes FOR SELECT USING (true);

CREATE POLICY "users can insert their own insights" ON public.insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update their own insights" ON public.insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete their own insights" ON public.insights FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users can insert their own comments" ON public.insight_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can delete their own comments" ON public.insight_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users can insert/delete their own likes" ON public.insight_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users can insert/delete their own bookmarks" ON public.insight_bookmarks FOR ALL USING (auth.uid() = user_id);

-- 3. Storage 설정 (인사이트 이미지)
INSERT INTO storage.buckets (id, name, public)
VALUES ('insight-images', 'insight-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'insight-images' );
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'insight-images' );
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'insight-images' AND auth.uid() = owner );
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'insight-images' AND auth.uid() = owner );
