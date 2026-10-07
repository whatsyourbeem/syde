-- 쇼케이스 "끌어올리기" 시에도 피드(activity_feed)에 노출되도록 트리거 추가
-- bump_showcase()가 UPDATE로 bumped_at을 변경할 때만 SHOWCASE_BUMPED 활동을 기록한다.

CREATE OR REPLACE FUNCTION public.create_activity_on_showcase_bumped()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id)
    VALUES (NEW.user_id, 'SHOWCASE_BUMPED', NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_activity_showcase_bumped
    AFTER UPDATE OF bumped_at ON public.showcases
    FOR EACH ROW
    WHEN (NEW.bumped_at IS DISTINCT FROM OLD.bumped_at)
    EXECUTE FUNCTION public.create_activity_on_showcase_bumped();

NOTIFY pgrst, 'reload schema';
