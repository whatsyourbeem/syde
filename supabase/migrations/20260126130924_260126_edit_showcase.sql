alter table "public"."showcases" drop column "content";

alter table "public"."showcases" drop column "image_url";

alter table "public"."showcases" add column "description" text;

alter table "public"."showcases" add column "name" text;

alter table "public"."showcases" add column "short_description" text not null;

alter table "public"."showcases" add column "thumbnail_url" text;


