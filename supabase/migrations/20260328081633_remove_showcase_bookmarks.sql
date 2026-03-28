-- Drop the showcase_bookmarks table
DROP TABLE IF EXISTS "public"."showcase_bookmarks" CASCADE;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
