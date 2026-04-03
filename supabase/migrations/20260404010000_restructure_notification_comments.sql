-- 1. Drop existing FK constraint
ALTER TABLE "public"."notifications" DROP CONSTRAINT IF EXISTS "notifications_comment_id_fkey";

-- 2. Rename existing comment_id to log_comment_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'comment_id') THEN
        ALTER TABLE "public"."notifications" RENAME COLUMN "comment_id" TO "log_comment_id";
    END IF;
END $$;

-- 3. Add FK for log_comment_id
ALTER TABLE "public"."notifications"
ADD CONSTRAINT "notifications_log_comment_id_fkey"
FOREIGN KEY ("log_comment_id") REFERENCES "public"."log_comments"("id") ON DELETE CASCADE;

-- 4. Add showcase_comment_id column with FK
ALTER TABLE "public"."notifications"
ADD COLUMN IF NOT EXISTS "showcase_comment_id" uuid REFERENCES "public"."showcase_comments"("id") ON DELETE CASCADE;

-- 5. Update the trigger function create_notification_on_comment to use correct columns
CREATE OR REPLACE FUNCTION public.create_notification_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_author_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'log_comments' THEN
    -- logic for logs: use log_comment_id
    SELECT user_id INTO target_author_id FROM logs WHERE id = NEW.log_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, log_id, log_comment_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.log_id, NEW.id, 'comment');
    END IF;
    
  ELSIF TG_TABLE_NAME = 'showcase_comments' THEN
    -- logic for showcases: use showcase_comment_id
    SELECT user_id INTO target_author_id FROM showcases WHERE id = NEW.showcase_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, showcase_id, showcase_comment_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.showcase_id, NEW.id, 'comment');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
