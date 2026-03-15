-- 1. Add fields to showcases table
ALTER TABLE "public"."showcases" ADD COLUMN "web_url" text;
ALTER TABLE "public"."showcases" ADD COLUMN "playstore_url" text;
ALTER TABLE "public"."showcases" ADD COLUMN "appstore_url" text;

-- 2. Drop the original showcases_links table and its constraints/dependencies
DROP TABLE IF EXISTS "public"."showcases_links" CASCADE;
