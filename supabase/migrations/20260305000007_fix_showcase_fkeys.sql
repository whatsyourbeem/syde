-- Fix faulty foreign key constraints that referenced profiles(id) instead of showcases(id)

-- 1. Fix showcases_images
ALTER TABLE "public"."showcases_images" 
DROP CONSTRAINT IF EXISTS "showcases_images_showcase_id_fkey";

ALTER TABLE "public"."showcases_images" 
ADD CONSTRAINT "showcases_images_showcase_id_fkey" 
FOREIGN KEY (showcase_id) 
REFERENCES public.showcases(id) 
ON DELETE CASCADE;

-- 2. Fix showcases_links
ALTER TABLE "public"."showcases_links" 
DROP CONSTRAINT IF EXISTS "showcases_links_showcase_id_fkey";

ALTER TABLE "public"."showcases_links" 
ADD CONSTRAINT "showcases_links_showcase_id_fkey" 
FOREIGN KEY (showcase_id) 
REFERENCES public.showcases(id) 
ON DELETE CASCADE;
