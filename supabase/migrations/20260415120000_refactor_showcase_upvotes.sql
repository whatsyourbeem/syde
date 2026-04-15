-- 1. Create the new showcase_comment_likes table
CREATE TABLE IF NOT EXISTS "public"."showcase_comment_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "comment_id" "uuid" NOT NULL REFERENCES "public"."showcase_comments"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "unique_like_per_showcase_comment" UNIQUE ("user_id", "comment_id")
);

-- 2. Migrate existing comment upvotes from showcase_upvotes to showcase_comment_likes
INSERT INTO "public"."showcase_comment_likes" ("user_id", "comment_id", "created_at")
SELECT "user_id", "comment_id", "created_at"
FROM "public"."showcase_upvotes"
WHERE "comment_id" IS NOT NULL;

-- 3. Clean up showcase_upvotes table
-- First, remove the records we just migrated
DELETE FROM "public"."showcase_upvotes" WHERE "comment_id" IS NOT NULL;

-- Remove the unique constraint that involves comment_id
ALTER TABLE "public"."showcase_upvotes" DROP CONSTRAINT IF EXISTS "unique_upvote_per_showcase_or_comment";
-- Note: 'unique_upvote_per_showcase_or_comment' was renamed from 'unique_like_per_showcase_or_comment' in migration 20260328000000

-- Add a new unique constraint for showcase upvotes
ALTER TABLE "public"."showcase_upvotes" ADD CONSTRAINT "unique_upvote_per_showcase" UNIQUE ("user_id", "showcase_id");

-- Remove the comment_id column and the check constraint
ALTER TABLE "public"."showcase_upvotes" DROP CONSTRAINT IF EXISTS "chk_showcase_or_comment_id";
ALTER TABLE "public"."showcase_upvotes" DROP COLUMN IF EXISTS "comment_id";

-- 4. Set up RLS for showcase_comment_likes
ALTER TABLE "public"."showcase_comment_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissive_select_showcase_comment_likes"
ON "public"."showcase_comment_likes" FOR SELECT
USING (true);

CREATE POLICY "permissive_insert_showcase_comment_likes"
ON "public"."showcase_comment_likes" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "permissive_delete_showcase_comment_likes"
ON "public"."showcase_comment_likes" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
