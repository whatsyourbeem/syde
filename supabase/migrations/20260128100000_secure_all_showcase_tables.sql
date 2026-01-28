-- Helper macro to enable RLS if not already enabled (optional, but standard pg commands are idempotent enough with manual checks or just running it)
-- We will just run standard commands. If policy exists, it might error, so we drop first to be clean or use unique names.
-- Since this is a migration, we assume it runs once.

-- 1. Showcases Table
ALTER TABLE "public"."showcases" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view showcases"
ON "public"."showcases" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create showcases"
ON "public"."showcases" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own showcases"
ON "public"."showcases" FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own showcases"
ON "public"."showcases" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 2. Showcase Likes
ALTER TABLE "public"."showcase_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view showcase likes"
ON "public"."showcase_likes" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like showcases"
ON "public"."showcase_likes" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike (delete) their own likes"
ON "public"."showcase_likes" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 3. Showcase Comments
ALTER TABLE "public"."showcase_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view showcase comments"
ON "public"."showcase_comments" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON "public"."showcase_comments" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON "public"."showcase_comments" FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON "public"."showcase_comments" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 4. Showcase Bookmarks
ALTER TABLE "public"."showcase_bookmarks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view showcase bookmarks"
ON "public"."showcase_bookmarks" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can data bookmark"
ON "public"."showcase_bookmarks" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks"
ON "public"."showcase_bookmarks" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 5. Showcases Images
-- (Replacing/Extending the previous partial policy)
ALTER TABLE "public"."showcases_images" ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid conflicts if they exist from previous steps
DROP POLICY IF EXISTS "Users can insert images to their own showcases" ON "public"."showcases_images";
DROP POLICY IF EXISTS "Everyone can view showcase images" ON "public"."showcases_images";
DROP POLICY IF EXISTS "Users can delete images from their own showcases" ON "public"."showcases_images";

CREATE POLICY "Public can view showcase images"
ON "public"."showcases_images" FOR SELECT
USING (true);

CREATE POLICY "Users can insert images to their own showcases"
ON "public"."showcases_images" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_images.showcase_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update images in their own showcases"
ON "public"."showcases_images" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_images.showcase_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images from their own showcases"
ON "public"."showcases_images" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_images.showcase_id
    AND user_id = auth.uid()
  )
);


-- 6. Showcases Links
ALTER TABLE "public"."showcases_links" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view showcase links"
ON "public"."showcases_links" FOR SELECT
USING (true);

CREATE POLICY "Users can insert links to their own showcases"
ON "public"."showcases_links" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_links.showcase_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update links in their own showcases"
ON "public"."showcases_links" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_links.showcase_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete links from their own showcases"
ON "public"."showcases_links" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_links.showcase_id
    AND user_id = auth.uid()
  )
);
