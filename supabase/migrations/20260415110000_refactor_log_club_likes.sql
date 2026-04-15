
-- 1. Create log_comment_likes table
CREATE TABLE IF NOT EXISTS "public"."log_comment_likes" (
    "comment_id" "uuid" NOT NULL REFERENCES "public"."log_comments"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("comment_id", "user_id")
);

-- 2. Create club_comment_likes table
CREATE TABLE IF NOT EXISTS "public"."club_comment_likes" (
    "comment_id" "uuid" NOT NULL REFERENCES "public"."club_forum_post_comments"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("comment_id", "user_id")
);

-- 3. Migrate data from comment_likes to log_comment_likes
-- (User confirmed all current data in comment_likes belongs to logs)
INSERT INTO "public"."log_comment_likes" (comment_id, user_id, created_at)
SELECT comment_id, user_id, created_at FROM "public"."comment_likes"
ON CONFLICT DO NOTHING;

-- 4. Clean up log_likes table
-- (User confirmed log_likes has no comment data)
ALTER TABLE "public"."log_likes" DROP CONSTRAINT IF EXISTS "chk_log_or_comment_id";
ALTER TABLE "public"."log_likes" DROP COLUMN IF EXISTS "comment_id";
ALTER TABLE "public"."log_likes" ALTER COLUMN "log_id" SET NOT NULL;

-- 5. Drop the old generic comment_likes table
DROP TABLE IF EXISTS "public"."comment_likes";

-- 6. Set up RLS for new tables
ALTER TABLE "public"."log_comment_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."club_comment_likes" ENABLE ROW LEVEL SECURITY;

-- RLS for log_comment_likes
CREATE POLICY "Anyone can view log comment likes" 
ON "public"."log_comment_likes" FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can toggle log comment likes" 
ON "public"."log_comment_likes" FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RLS for club_comment_likes
CREATE POLICY "Anyone can view club comment likes" 
ON "public"."club_comment_likes" FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can toggle club comment likes" 
ON "public"."club_comment_likes" FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 7. Update Realtime for new tables (Optional but recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."log_comment_likes";
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."club_comment_likes";
