-- 1. Create trigger function for general content deletion
CREATE OR REPLACE FUNCTION public.delete_activity_on_target_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.activity_feed WHERE target_id = OLD.id;
    RETURN OLD;
END;
$$;

-- 2. Create trigger function for meetup leave (unjoin)
CREATE OR REPLACE FUNCTION public.delete_activity_on_meetup_left()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.activity_feed 
    WHERE user_id = OLD.user_id 
      AND target_id = OLD.meetup_id 
      AND activity_type = 'MEETUP_JOINED';
    RETURN OLD;
END;
$$;

-- 3. Apply triggers to tables

-- Showcase deletion
CREATE TRIGGER trigger_delete_activity_on_showcase_deleted
    AFTER DELETE ON public.showcases
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_activity_on_target_deleted();

-- Insight deletion
CREATE TRIGGER trigger_delete_activity_on_insight_deleted
    AFTER DELETE ON public.insights
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_activity_on_target_deleted();

-- Meetup deletion
CREATE TRIGGER trigger_delete_activity_on_meetup_deleted
    AFTER DELETE ON public.meetups
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_activity_on_target_deleted();

-- Meetup participation removal (unjoin)
CREATE TRIGGER trigger_delete_activity_on_meetup_left
    AFTER DELETE ON public.meetup_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_activity_on_meetup_left();
