
  create table "public"."showcases_members" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "updated_at" timestamp with time zone default now(),
    "display_order" smallint not null,
    "showcase_id" uuid not null
      );


alter table "public"."showcases_members" enable row level security;

CREATE UNIQUE INDEX showcases_members_pkey ON public.showcases_members USING btree (id);

alter table "public"."showcases_members" add constraint "showcases_members_pkey" PRIMARY KEY using index "showcases_members_pkey";

alter table "public"."showcases_members" add constraint "showcases_members_showcase_id_fkey" FOREIGN KEY (showcase_id) REFERENCES public.showcases(id) ON DELETE CASCADE not valid;

alter table "public"."showcases_members" validate constraint "showcases_members_showcase_id_fkey";

alter table "public"."showcases_members" add constraint "showcases_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."showcases_members" validate constraint "showcases_members_user_id_fkey";

grant delete on table "public"."showcases_members" to "anon";

grant insert on table "public"."showcases_members" to "anon";

grant references on table "public"."showcases_members" to "anon";

grant select on table "public"."showcases_members" to "anon";

grant trigger on table "public"."showcases_members" to "anon";

grant truncate on table "public"."showcases_members" to "anon";

grant update on table "public"."showcases_members" to "anon";

grant delete on table "public"."showcases_members" to "authenticated";

grant insert on table "public"."showcases_members" to "authenticated";

grant references on table "public"."showcases_members" to "authenticated";

grant select on table "public"."showcases_members" to "authenticated";

grant trigger on table "public"."showcases_members" to "authenticated";

grant truncate on table "public"."showcases_members" to "authenticated";

grant update on table "public"."showcases_members" to "authenticated";

grant delete on table "public"."showcases_members" to "postgres";

grant insert on table "public"."showcases_members" to "postgres";

grant references on table "public"."showcases_members" to "postgres";

grant select on table "public"."showcases_members" to "postgres";

grant trigger on table "public"."showcases_members" to "postgres";

grant truncate on table "public"."showcases_members" to "postgres";

grant update on table "public"."showcases_members" to "postgres";

grant delete on table "public"."showcases_members" to "service_role";

grant insert on table "public"."showcases_members" to "service_role";

grant references on table "public"."showcases_members" to "service_role";

grant select on table "public"."showcases_members" to "service_role";

grant trigger on table "public"."showcases_members" to "service_role";

grant truncate on table "public"."showcases_members" to "service_role";

grant update on table "public"."showcases_members" to "service_role";


