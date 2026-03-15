
  create table "public"."showcases_images" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "showcase_id" uuid not null,
    "image_url" text,
    "created_at" timestamp with time zone default now(),
    "display_order" smallint
      );



  create table "public"."showcases_links" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "showcase_id" uuid not null,
    "type" text,
    "created_at" timestamp with time zone default now(),
    "url" text
      );


CREATE UNIQUE INDEX showcases_images_pkey ON public.showcases_images USING btree (id);

CREATE UNIQUE INDEX showcases_links_pkey ON public.showcases_links USING btree (id);

alter table "public"."showcases_images" add constraint "showcases_images_pkey" PRIMARY KEY using index "showcases_images_pkey";

alter table "public"."showcases_links" add constraint "showcases_links_pkey" PRIMARY KEY using index "showcases_links_pkey";

alter table "public"."showcases_images" add constraint "showcases_images_showcase_id_fkey" FOREIGN KEY (showcase_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."showcases_images" validate constraint "showcases_images_showcase_id_fkey";

alter table "public"."showcases_links" add constraint "showcases_links_showcase_id_fkey" FOREIGN KEY (showcase_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."showcases_links" validate constraint "showcases_links_showcase_id_fkey";

grant delete on table "public"."showcases_images" to "anon";

grant insert on table "public"."showcases_images" to "anon";

grant references on table "public"."showcases_images" to "anon";

grant select on table "public"."showcases_images" to "anon";

grant trigger on table "public"."showcases_images" to "anon";

grant truncate on table "public"."showcases_images" to "anon";

grant update on table "public"."showcases_images" to "anon";

grant delete on table "public"."showcases_images" to "authenticated";

grant insert on table "public"."showcases_images" to "authenticated";

grant references on table "public"."showcases_images" to "authenticated";

grant select on table "public"."showcases_images" to "authenticated";

grant trigger on table "public"."showcases_images" to "authenticated";

grant truncate on table "public"."showcases_images" to "authenticated";

grant update on table "public"."showcases_images" to "authenticated";

grant delete on table "public"."showcases_images" to "postgres";

grant insert on table "public"."showcases_images" to "postgres";

grant references on table "public"."showcases_images" to "postgres";

grant select on table "public"."showcases_images" to "postgres";

grant trigger on table "public"."showcases_images" to "postgres";

grant truncate on table "public"."showcases_images" to "postgres";

grant update on table "public"."showcases_images" to "postgres";

grant delete on table "public"."showcases_images" to "service_role";

grant insert on table "public"."showcases_images" to "service_role";

grant references on table "public"."showcases_images" to "service_role";

grant select on table "public"."showcases_images" to "service_role";

grant trigger on table "public"."showcases_images" to "service_role";

grant truncate on table "public"."showcases_images" to "service_role";

grant update on table "public"."showcases_images" to "service_role";

grant delete on table "public"."showcases_links" to "anon";

grant insert on table "public"."showcases_links" to "anon";

grant references on table "public"."showcases_links" to "anon";

grant select on table "public"."showcases_links" to "anon";

grant trigger on table "public"."showcases_links" to "anon";

grant truncate on table "public"."showcases_links" to "anon";

grant update on table "public"."showcases_links" to "anon";

grant delete on table "public"."showcases_links" to "authenticated";

grant insert on table "public"."showcases_links" to "authenticated";

grant references on table "public"."showcases_links" to "authenticated";

grant select on table "public"."showcases_links" to "authenticated";

grant trigger on table "public"."showcases_links" to "authenticated";

grant truncate on table "public"."showcases_links" to "authenticated";

grant update on table "public"."showcases_links" to "authenticated";

grant delete on table "public"."showcases_links" to "postgres";

grant insert on table "public"."showcases_links" to "postgres";

grant references on table "public"."showcases_links" to "postgres";

grant select on table "public"."showcases_links" to "postgres";

grant trigger on table "public"."showcases_links" to "postgres";

grant truncate on table "public"."showcases_links" to "postgres";

grant update on table "public"."showcases_links" to "postgres";

grant delete on table "public"."showcases_links" to "service_role";

grant insert on table "public"."showcases_links" to "service_role";

grant references on table "public"."showcases_links" to "service_role";

grant select on table "public"."showcases_links" to "service_role";

grant trigger on table "public"."showcases_links" to "service_role";

grant truncate on table "public"."showcases_links" to "service_role";

grant update on table "public"."showcases_links" to "service_role";


