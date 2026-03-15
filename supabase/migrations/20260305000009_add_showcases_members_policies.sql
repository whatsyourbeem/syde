-- Add RLS policies for showcases_members
-- RLS was enabled in a previous migration but no policies were added, blocking all access.

-- 1. Public can view members
CREATE POLICY "Public can view showcase members"
ON "public"."showcases_members" FOR SELECT
USING (true);

-- 2. Users can add members to their own showcases
CREATE POLICY "Users can insert members to their own showcases"
ON "public"."showcases_members" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_members.showcase_id
    AND user_id = auth.uid()
  )
);

-- 3. Users can update members in their own showcases
CREATE POLICY "Users can update members in their own showcases"
ON "public"."showcases_members" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_members.showcase_id
    AND user_id = auth.uid()
  )
);

-- 4. Users can remove members from their own showcases
CREATE POLICY "Users can remove members from their own showcases"
ON "public"."showcases_members" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM showcases
    WHERE id = showcases_members.showcase_id
    AND user_id = auth.uid()
  )
);
