-- 1. Make log_id nullable in notifications table to support non-log notifications (like showcase upvotes)
ALTER TABLE "public"."notifications" ALTER COLUMN "log_id" DROP NOT NULL;

-- 2. Clean up any existing policies on showcase_upvotes to avoid conflicts/legacy restrictions
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'showcase_upvotes' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.showcase_upvotes', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-apply correct RLS policies for showcase_upvotes
ALTER TABLE "public"."showcase_upvotes" ENABLE ROW LEVEL SECURITY;

-- Allow everyone to see upvote counts/existence
CREATE POLICY "permissive_select_showcase_upvotes"
ON "public"."showcase_upvotes" FOR SELECT
USING (true);

-- Allow any authenticated user to upvote (mapping to their own user_id)
CREATE POLICY "permissive_insert_showcase_upvotes"
ON "public"."showcase_upvotes" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own upvotes
CREATE POLICY "permissive_delete_showcase_upvotes"
ON "public"."showcase_upvotes" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
