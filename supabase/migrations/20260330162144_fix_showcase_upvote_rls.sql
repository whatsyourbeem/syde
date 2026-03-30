-- Drop any potentially restrictive policies on showcase_upvotes
DROP POLICY IF EXISTS "Public can view showcase likes" ON "public"."showcase_upvotes";
DROP POLICY IF EXISTS "Authenticated users can like showcases" ON "public"."showcase_upvotes";
DROP POLICY IF EXISTS "Users can unlike (delete) their own likes" ON "public"."showcase_upvotes";
DROP POLICY IF EXISTS "Public can view showcase upvotes" ON "public"."showcase_upvotes";
DROP POLICY IF EXISTS "Authenticated users can upvote showcases" ON "public"."showcase_upvotes";
DROP POLICY IF EXISTS "Users can remove their own upvotes" ON "public"."showcase_upvotes";

-- Recreate policies with correct permissions
CREATE POLICY "Public can view showcase upvotes"
ON "public"."showcase_upvotes" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can upvote showcases"
ON "public"."showcase_upvotes" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes"
ON "public"."showcase_upvotes" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE "public"."showcase_upvotes" ENABLE ROW LEVEL SECURITY;
