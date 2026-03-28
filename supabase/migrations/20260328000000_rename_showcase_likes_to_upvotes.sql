-- Rename the table
ALTER TABLE "public"."showcase_likes" RENAME TO "showcase_upvotes";

-- Rename constraints and indexes for clarity (optional but good practice)
ALTER INDEX IF EXISTS "showcase_likes_pkey" RENAME TO "showcase_upvotes_pkey";
ALTER TABLE "public"."showcase_upvotes" RENAME CONSTRAINT "unique_like_per_showcase_or_comment" TO "unique_upvote_per_showcase_or_comment";
ALTER TABLE "public"."showcase_upvotes" RENAME CONSTRAINT "showcase_likes_showcase_id_fkey" TO "showcase_upvotes_showcase_id_fkey";
ALTER TABLE "public"."showcase_upvotes" RENAME CONSTRAINT "showcase_likes_user_id_fkey" TO "showcase_upvotes_user_id_fkey";
ALTER TABLE "public"."showcase_upvotes" RENAME CONSTRAINT "showcase_likes_comment_id_fkey" TO "showcase_upvotes_comment_id_fkey";

-- Notify PostgREST to reload the schema cache so the frontend can recognize the new relationship
NOTIFY pgrst, 'reload schema';

-- Update the notification trigger function to check for the new table name
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

  ELSIF TG_TABLE_NAME = 'showcase_upvotes' THEN
    -- Logic for showcases with renamed table
    SELECT user_id INTO target_author_id FROM showcases WHERE id = NEW.showcase_id;
    
    IF target_author_id <> NEW.user_id THEN
      INSERT INTO notifications (recipient_user_id, trigger_user_id, showcase_id, type)
      VALUES (target_author_id, NEW.user_id, NEW.showcase_id, 'upvote');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Update the type string in notifications if we want to distinguish upvotes (optional, but let's change it for consistency if it was 'like')
UPDATE notifications SET type = 'upvote' WHERE type = 'like' AND showcase_id IS NOT NULL;
