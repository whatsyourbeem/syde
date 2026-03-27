-- 1. Update trigger functions to remove target_title
CREATE OR REPLACE FUNCTION public.create_activity_on_showcase_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id)
    VALUES (NEW.user_id, 'SHOWCASE_CREATED', NEW.id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_activity_on_insight_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id)
    VALUES (NEW.user_id, 'INSIGHT_CREATED', NEW.id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_activity_on_meetup_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id)
    VALUES (NEW.organizer_id, 'MEETUP_CREATED', NEW.id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_activity_on_meetup_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_feed (user_id, activity_type, target_id)
    VALUES (NEW.user_id, 'MEETUP_JOINED', NEW.meetup_id);
    RETURN NEW;
END;
$$;

-- 2. Drop target_title column
ALTER TABLE public.activity_feed DROP COLUMN IF EXISTS target_title;
