-- 1. Add images array column to showcases table
ALTER TABLE "public"."showcases" ADD COLUMN "images" text[] DEFAULT '{}'::text[] NOT NULL;

-- 2. Drop the original showcases_images table and its constraints/dependencies
DROP TABLE IF EXISTS "public"."showcases_images" CASCADE;
