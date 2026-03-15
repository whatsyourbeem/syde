-- 1. Add showcase_id column to notifications table
ALTER TABLE "public"."notifications"
ADD COLUMN IF NOT EXISTS "showcase_id" uuid REFERENCES "public"."showcases"("id") ON DELETE CASCADE;

-- 2. Update create_notification_on_comment function to handle showcase_comments
CREATE OR REPLACE FUNCTION public.create_notification_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_author_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'log_comments' THEN
    -- Existing logic for logs
    SELECT user_id INTO target_author_id FROM logs WHERE id = NEW.log_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, log_id, comment_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.log_id, NEW.id, 'comment');
    END IF;
    
  ELSIF TG_TABLE_NAME = 'showcase_comments' THEN
    -- New logic for showcases
    SELECT user_id INTO target_author_id FROM showcases WHERE id = NEW.showcase_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, showcase_id, comment_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.showcase_id, NEW.id, 'comment');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Update create_notification_on_like function to handle showcase_likes
CREATE OR REPLACE FUNCTION public.create_notification_on_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_author_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'log_likes' THEN
    -- Existing logic for logs
    SELECT user_id INTO target_author_id FROM logs WHERE id = NEW.log_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, log_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.log_id, 'like');
    END IF;

  ELSIF TG_TABLE_NAME = 'showcase_likes' THEN
    -- New logic for showcases
    SELECT user_id INTO target_author_id FROM showcases WHERE id = NEW.showcase_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, showcase_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.showcase_id, 'like');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
