-- ==========================================
-- Activity Feed Table & Triggers
-- ==========================================

-- 1. activity_feed 테이블 생성
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,   -- 'USER_JOINED', 'SHOWCASE_CREATED', 'INSIGHT_CREATED', 'MEETUP_CREATED', 'MEETUP_JOINED'
    target_id UUID,               -- 해당 컨텐츠의 ID
    target_title TEXT,            -- 표시용 제목/이름 (캐시)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 인덱스
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed (created_at DESC);
CREATE INDEX idx_activity_feed_user_id ON public.activity_feed (user_id);

-- 3. RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view activity_feed"
    ON public.activity_feed FOR SELECT USING (true);

-- 쓰기는 트리거(SECURITY DEFINER)가 처리하므로 일반 유저에게는 불필요
-- 만약 직접 INSERT가 필요하면 별도 정책 추가

-- 4. 트리거 함수들

-- 4-1. 유저 가입 시
CREATE OR REPLACE FUNCTION public.create_activity_on_user_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type)
    VALUES (NEW.id, 'USER_JOINED');
    RETURN NEW;
END;
$$;

-- 4-2. 쇼케이스 등록 시
CREATE OR REPLACE FUNCTION public.create_activity_on_showcase_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id, target_title)
    VALUES (NEW.user_id, 'SHOWCASE_CREATED', NEW.id, NEW.name);
    RETURN NEW;
END;
$$;

-- 4-3. 인사이트 등록 시
CREATE OR REPLACE FUNCTION public.create_activity_on_insight_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id, target_title)
    VALUES (NEW.user_id, 'INSIGHT_CREATED', NEW.id, NEW.title);
    RETURN NEW;
END;
$$;

-- 4-4. 모임 개설 시
CREATE OR REPLACE FUNCTION public.create_activity_on_meetup_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id, target_title)
    VALUES (NEW.organizer_id, 'MEETUP_CREATED', NEW.id, NEW.title);
    RETURN NEW;
END;
$$;

-- 4-5. 모임 참가 시
CREATE OR REPLACE FUNCTION public.create_activity_on_meetup_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    meetup_title TEXT;
BEGIN
    SELECT title INTO meetup_title FROM public.meetups WHERE id = NEW.meetup_id;
    INSERT INTO public.activity_feed (user_id, activity_type, target_id, target_title)
    VALUES (NEW.user_id, 'MEETUP_JOINED', NEW.meetup_id, meetup_title);
    RETURN NEW;
END;
$$;

-- 5. 트리거 연결

CREATE TRIGGER trigger_activity_user_joined
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_activity_on_user_joined();

CREATE TRIGGER trigger_activity_showcase_created
    AFTER INSERT ON public.showcases
    FOR EACH ROW
    EXECUTE FUNCTION public.create_activity_on_showcase_created();

CREATE TRIGGER trigger_activity_insight_created
    AFTER INSERT ON public.insights
    FOR EACH ROW
    EXECUTE FUNCTION public.create_activity_on_insight_created();

CREATE TRIGGER trigger_activity_meetup_created
    AFTER INSERT ON public.meetups
    FOR EACH ROW
    EXECUTE FUNCTION public.create_activity_on_meetup_created();

CREATE TRIGGER trigger_activity_meetup_joined
    AFTER INSERT ON public.meetup_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.create_activity_on_meetup_joined();
