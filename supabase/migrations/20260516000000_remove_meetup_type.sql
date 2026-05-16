-- Remove meetup type classification (INSYDE/SPINOFF distinction removed)
ALTER TABLE "public"."meetups" DROP COLUMN IF EXISTS "type";

DROP TYPE IF EXISTS "public"."meetup_type_enum";
