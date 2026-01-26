drop extension if exists "pg_net";

create type "public"."club_member_role_enum" as enum ('LEADER', 'FULL_MEMBER', 'GENERAL_MEMBER');

create type "public"."club_permission_level_enum" as enum ('PUBLIC', 'MEMBER', 'FULL_MEMBER', 'LEADER');

create type "public"."meetup_participant_status_enum" as enum ('PENDING', 'APPROVED', 'REJECTED');

create type "public"."meetup_status_enum" as enum ('UPCOMING', 'APPLY_AVAILABLE', 'APPLY_CLOSED', 'ENDED');

create type "public"."meetup_type_enum" as enum ('INSYDE', 'SPINOFF');


  create table "public"."club_forum_post_comments" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone,
    "parent_comment_id" uuid
      );


alter table "public"."club_forum_post_comments" enable row level security;


  create table "public"."club_forum_posts" (
    "id" uuid not null default gen_random_uuid(),
    "forum_id" uuid not null,
    "user_id" uuid not null,
    "content" jsonb,
    "created_at" timestamp with time zone default now(),
    "title" text not null,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."club_forum_posts" enable row level security;


  create table "public"."club_forums" (
    "id" uuid not null default gen_random_uuid(),
    "club_id" uuid not null,
    "name" text not null,
    "description" text,
    "read_permission" public.club_permission_level_enum not null default 'MEMBER'::public.club_permission_level_enum,
    "write_permission" public.club_permission_level_enum not null default 'MEMBER'::public.club_permission_level_enum,
    "position" integer not null default 0
      );


alter table "public"."club_forums" enable row level security;


  create table "public"."club_members" (
    "club_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "role" public.club_member_role_enum not null default 'GENERAL_MEMBER'::public.club_member_role_enum
      );


alter table "public"."club_members" enable row level security;


  create table "public"."clubs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "description" jsonb,
    "owner_id" uuid,
    "thumbnail_url" text,
    "updated_at" timestamp with time zone default now(),
    "tagline" text
      );


alter table "public"."clubs" enable row level security;


  create table "public"."comment_likes" (
    "comment_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."comment_likes" enable row level security;


  create table "public"."log_bookmarks" (
    "log_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."log_bookmarks" enable row level security;


  create table "public"."log_comments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "log_id" uuid not null,
    "parent_comment_id" uuid,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."log_comments" enable row level security;


  create table "public"."log_likes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "log_id" uuid,
    "comment_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."log_likes" enable row level security;


  create table "public"."logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "content" text not null,
    "image_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."logs" enable row level security;


  create table "public"."meetup_participants" (
    "meetup_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone not null default now(),
    "status" public.meetup_participant_status_enum not null default 'PENDING'::public.meetup_participant_status_enum,
    "username" text,
    "mobile" text,
    "depositor" text,
    "story" text
      );


alter table "public"."meetup_participants" enable row level security;


  create table "public"."meetups" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "description" jsonb,
    "organizer_id" uuid not null,
    "thumbnail_url" text default '''https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png''::text'::text,
    "status" public.meetup_status_enum not null default 'UPCOMING'::public.meetup_status_enum,
    "start_datetime" timestamp with time zone,
    "end_datetime" timestamp with time zone,
    "max_participants" integer,
    "club_id" uuid,
    "fee" integer,
    "location" text,
    "address" text,
    "type" public.meetup_type_enum
      );


alter table "public"."meetups" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "recipient_user_id" uuid not null,
    "trigger_user_id" uuid not null,
    "log_id" uuid not null,
    "comment_id" uuid,
    "type" text not null,
    "is_read" boolean not null default false
      );


alter table "public"."notifications" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "updated_at" timestamp with time zone default now(),
    "username" text,
    "full_name" text,
    "avatar_url" text,
    "bio" jsonb,
    "link" text,
    "tagline" character varying(30) default ''::character varying,
    "certified" boolean default false
      );


alter table "public"."profiles" enable row level security;


  create table "public"."showcase_bookmarks" (
    "showcase_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."showcase_comments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "showcase_id" uuid not null,
    "parent_comment_id" uuid,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."showcase_likes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "showcase_id" uuid,
    "comment_id" uuid,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."showcases" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "content" text not null,
    "image_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX club_forum_post_comments_pkey ON public.club_forum_post_comments USING btree (id);

CREATE UNIQUE INDEX club_forum_posts_pkey ON public.club_forum_posts USING btree (id);

CREATE UNIQUE INDEX club_forums_pkey ON public.club_forums USING btree (id);

CREATE UNIQUE INDEX club_members_pkey ON public.club_members USING btree (club_id, user_id);

CREATE UNIQUE INDEX clubs_pkey ON public.clubs USING btree (id);

CREATE UNIQUE INDEX comment_likes_pkey ON public.comment_likes USING btree (comment_id, user_id);

CREATE INDEX idx_club_forum_posts_forum_id ON public.club_forum_posts USING btree (forum_id);

CREATE INDEX idx_club_forum_posts_user_id ON public.club_forum_posts USING btree (user_id);

CREATE INDEX idx_club_forums_club_id ON public.club_forums USING btree (club_id);

CREATE UNIQUE INDEX log_bookmarks_pkey ON public.log_bookmarks USING btree (log_id, user_id);

CREATE UNIQUE INDEX log_comments_pkey ON public.log_comments USING btree (id);

CREATE UNIQUE INDEX log_likes_pkey ON public.log_likes USING btree (id);

CREATE UNIQUE INDEX logs_pkey ON public.logs USING btree (id);

CREATE UNIQUE INDEX meetup_participants_pkey ON public.meetup_participants USING btree (meetup_id, user_id);

CREATE UNIQUE INDEX meetups_pkey ON public.meetups USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_idx ON public.profiles USING btree (username);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX showcase_bookmarks_pkey ON public.showcase_bookmarks USING btree (showcase_id, user_id);

CREATE UNIQUE INDEX showcase_comments_pkey ON public.showcase_comments USING btree (id);

CREATE UNIQUE INDEX showcase_likes_pkey ON public.showcase_likes USING btree (id);

CREATE UNIQUE INDEX showcases_pkey ON public.showcases USING btree (id);

CREATE UNIQUE INDEX unique_like_per_log_or_comment ON public.log_likes USING btree (user_id, log_id, comment_id);

CREATE UNIQUE INDEX unique_like_per_showcase_or_comment ON public.showcase_likes USING btree (user_id, showcase_id, comment_id);

alter table "public"."club_forum_post_comments" add constraint "club_forum_post_comments_pkey" PRIMARY KEY using index "club_forum_post_comments_pkey";

alter table "public"."club_forum_posts" add constraint "club_forum_posts_pkey" PRIMARY KEY using index "club_forum_posts_pkey";

alter table "public"."club_forums" add constraint "club_forums_pkey" PRIMARY KEY using index "club_forums_pkey";

alter table "public"."club_members" add constraint "club_members_pkey" PRIMARY KEY using index "club_members_pkey";

alter table "public"."clubs" add constraint "clubs_pkey" PRIMARY KEY using index "clubs_pkey";

alter table "public"."comment_likes" add constraint "comment_likes_pkey" PRIMARY KEY using index "comment_likes_pkey";

alter table "public"."log_bookmarks" add constraint "log_bookmarks_pkey" PRIMARY KEY using index "log_bookmarks_pkey";

alter table "public"."log_comments" add constraint "log_comments_pkey" PRIMARY KEY using index "log_comments_pkey";

alter table "public"."log_likes" add constraint "log_likes_pkey" PRIMARY KEY using index "log_likes_pkey";

alter table "public"."logs" add constraint "logs_pkey" PRIMARY KEY using index "logs_pkey";

alter table "public"."meetup_participants" add constraint "meetup_participants_pkey" PRIMARY KEY using index "meetup_participants_pkey";

alter table "public"."meetups" add constraint "meetups_pkey" PRIMARY KEY using index "meetups_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."showcase_bookmarks" add constraint "showcase_bookmarks_pkey" PRIMARY KEY using index "showcase_bookmarks_pkey";

alter table "public"."showcase_comments" add constraint "showcase_comments_pkey" PRIMARY KEY using index "showcase_comments_pkey";

alter table "public"."showcase_likes" add constraint "showcase_likes_pkey" PRIMARY KEY using index "showcase_likes_pkey";

alter table "public"."showcases" add constraint "showcases_pkey" PRIMARY KEY using index "showcases_pkey";

alter table "public"."club_forum_post_comments" add constraint "club_forum_post_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.club_forum_post_comments(id) ON DELETE CASCADE not valid;

alter table "public"."club_forum_post_comments" validate constraint "club_forum_post_comments_parent_comment_id_fkey";

alter table "public"."club_forum_post_comments" add constraint "club_forum_post_comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.club_forum_posts(id) ON DELETE CASCADE not valid;

alter table "public"."club_forum_post_comments" validate constraint "club_forum_post_comments_post_id_fkey";

alter table "public"."club_forum_post_comments" add constraint "club_forum_post_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."club_forum_post_comments" validate constraint "club_forum_post_comments_user_id_fkey";

alter table "public"."club_forum_posts" add constraint "club_forum_posts_forum_id_fkey" FOREIGN KEY (forum_id) REFERENCES public.club_forums(id) ON DELETE CASCADE not valid;

alter table "public"."club_forum_posts" validate constraint "club_forum_posts_forum_id_fkey";

alter table "public"."club_forum_posts" add constraint "club_forum_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."club_forum_posts" validate constraint "club_forum_posts_user_id_fkey";

alter table "public"."club_forums" add constraint "club_forums_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE not valid;

alter table "public"."club_forums" validate constraint "club_forums_club_id_fkey";

alter table "public"."club_members" add constraint "club_members_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE not valid;

alter table "public"."club_members" validate constraint "club_members_club_id_fkey";

alter table "public"."club_members" add constraint "club_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."club_members" validate constraint "club_members_user_id_fkey";

alter table "public"."clubs" add constraint "clubs_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."clubs" validate constraint "clubs_owner_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.log_comments(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_comment_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_user_id_fkey";

alter table "public"."log_bookmarks" add constraint "log_bookmarks_log_id_fkey" FOREIGN KEY (log_id) REFERENCES public.logs(id) ON DELETE CASCADE not valid;

alter table "public"."log_bookmarks" validate constraint "log_bookmarks_log_id_fkey";

alter table "public"."log_bookmarks" add constraint "log_bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."log_bookmarks" validate constraint "log_bookmarks_user_id_fkey";

alter table "public"."log_comments" add constraint "log_comments_log_id_fkey" FOREIGN KEY (log_id) REFERENCES public.logs(id) ON DELETE CASCADE not valid;

alter table "public"."log_comments" validate constraint "log_comments_log_id_fkey";

alter table "public"."log_comments" add constraint "log_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.log_comments(id) ON DELETE CASCADE not valid;

alter table "public"."log_comments" validate constraint "log_comments_parent_comment_id_fkey";

alter table "public"."log_comments" add constraint "log_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."log_comments" validate constraint "log_comments_user_id_fkey";

alter table "public"."log_likes" add constraint "chk_log_or_comment_id" CHECK ((((log_id IS NOT NULL) AND (comment_id IS NULL)) OR ((log_id IS NULL) AND (comment_id IS NOT NULL)))) not valid;

alter table "public"."log_likes" validate constraint "chk_log_or_comment_id";

alter table "public"."log_likes" add constraint "log_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.log_comments(id) ON DELETE CASCADE not valid;

alter table "public"."log_likes" validate constraint "log_likes_comment_id_fkey";

alter table "public"."log_likes" add constraint "log_likes_log_id_fkey" FOREIGN KEY (log_id) REFERENCES public.logs(id) ON DELETE CASCADE not valid;

alter table "public"."log_likes" validate constraint "log_likes_log_id_fkey";

alter table "public"."log_likes" add constraint "log_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."log_likes" validate constraint "log_likes_user_id_fkey";

alter table "public"."log_likes" add constraint "unique_like_per_log_or_comment" UNIQUE using index "unique_like_per_log_or_comment";

alter table "public"."logs" add constraint "logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."logs" validate constraint "logs_user_id_fkey";

alter table "public"."meetup_participants" add constraint "meetup_participants_meetup_id_fkey" FOREIGN KEY (meetup_id) REFERENCES public.meetups(id) ON DELETE CASCADE not valid;

alter table "public"."meetup_participants" validate constraint "meetup_participants_meetup_id_fkey";

alter table "public"."meetup_participants" add constraint "meetup_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."meetup_participants" validate constraint "meetup_participants_user_id_fkey";

alter table "public"."meetups" add constraint "meetups_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL not valid;

alter table "public"."meetups" validate constraint "meetups_club_id_fkey";

alter table "public"."meetups" add constraint "meetups_fee_check" CHECK ((fee >= 0)) not valid;

alter table "public"."meetups" validate constraint "meetups_fee_check";

alter table "public"."meetups" add constraint "meetups_organizer_id_fkey" FOREIGN KEY (organizer_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."meetups" validate constraint "meetups_organizer_id_fkey";

alter table "public"."notifications" add constraint "notifications_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.log_comments(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_comment_id_fkey";

alter table "public"."notifications" add constraint "notifications_log_id_fkey" FOREIGN KEY (log_id) REFERENCES public.logs(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_log_id_fkey";

alter table "public"."notifications" add constraint "notifications_recipient_user_id_fkey" FOREIGN KEY (recipient_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_recipient_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_trigger_user_id_fkey" FOREIGN KEY (trigger_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_trigger_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."profiles" add constraint "username_length" CHECK ((char_length(username) >= 3)) not valid;

alter table "public"."profiles" validate constraint "username_length";

alter table "public"."showcase_bookmarks" add constraint "showcase_bookmarks_showcase_id_fkey" FOREIGN KEY (showcase_id) REFERENCES public.showcases(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_bookmarks" validate constraint "showcase_bookmarks_showcase_id_fkey";

alter table "public"."showcase_bookmarks" add constraint "showcase_bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_bookmarks" validate constraint "showcase_bookmarks_user_id_fkey";

alter table "public"."showcase_comments" add constraint "showcase_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.showcase_comments(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_comments" validate constraint "showcase_comments_parent_comment_id_fkey";

alter table "public"."showcase_comments" add constraint "showcase_comments_showcase_id_fkey" FOREIGN KEY (showcase_id) REFERENCES public.showcases(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_comments" validate constraint "showcase_comments_showcase_id_fkey";

alter table "public"."showcase_comments" add constraint "showcase_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_comments" validate constraint "showcase_comments_user_id_fkey";

alter table "public"."showcase_likes" add constraint "chk_showcase_or_comment_id" CHECK ((((showcase_id IS NOT NULL) AND (comment_id IS NULL)) OR ((showcase_id IS NULL) AND (comment_id IS NOT NULL)))) not valid;

alter table "public"."showcase_likes" validate constraint "chk_showcase_or_comment_id";

alter table "public"."showcase_likes" add constraint "showcase_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.showcase_comments(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_likes" validate constraint "showcase_likes_comment_id_fkey";

alter table "public"."showcase_likes" add constraint "showcase_likes_showcase_id_fkey" FOREIGN KEY (showcase_id) REFERENCES public.showcases(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_likes" validate constraint "showcase_likes_showcase_id_fkey";

alter table "public"."showcase_likes" add constraint "showcase_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."showcase_likes" validate constraint "showcase_likes_user_id_fkey";

alter table "public"."showcase_likes" add constraint "unique_like_per_showcase_or_comment" UNIQUE using index "unique_like_per_showcase_or_comment";

alter table "public"."showcases" add constraint "showcases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."showcases" validate constraint "showcases_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_notification_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
     DECLARE
       log_author_id UUID;
     BEGIN
       -- 로그 작성자 가져오기
       SELECT user_id INTO log_author_id FROM logs WHERE id = NEW.log_id;
    
       -- 댓글 작성자가 작성자가 아닌 경우 알림 생성
      IF log_author_id <> NEW.user_id THEN
        INSERT INTO notifications (recipient_user_id, trigger_user_id, log_id, comment_id, type)
        VALUES (log_author_id, NEW.user_id, NEW.log_id, NEW.id, 'comment');
      END IF;
   
      RETURN NEW;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.create_notification_on_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
     DECLARE
       log_author_id UUID;
     BEGIN
       -- 로그 작성자 가져오기
       SELECT user_id INTO log_author_id FROM logs WHERE id = NEW.log_id;
    
       -- 좋아요를 누른 사람이 작성자가 아닌 경우 알림 생성
      IF log_author_id <> NEW.user_id THEN
        INSERT INTO notifications (recipient_user_id, trigger_user_id, log_id, type)
        VALUES (log_author_id, NEW.user_id, NEW.log_id, 'like');
      END IF;
   
      RETURN NEW;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.get_club_member_role(p_club_id uuid, p_user_id uuid)
 RETURNS public.club_member_role_enum
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
     DECLARE
       member_role public.club_member_role_enum;
     BEGIN
       SELECT role INTO member_role
       FROM public.club_members
       WHERE club_id = p_club_id AND user_id = p_user_id;
      RETURN member_role;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.get_club_owner(club_id_text text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
     DECLARE
       owner_uuid UUID;
     BEGIN
       SELECT owner_id
       INTO owner_uuid
       FROM public.clubs
       WHERE id = club_id_text::UUID;
      RETURN owner_uuid;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
         DEFAULT_AVATAR_URL TEXT := 'https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/profiles/default_avatar.png';
         BASE_USERNAME TEXT;
         FINAL_USERNAME TEXT;
         _full_name TEXT;
         _avatar_url TEXT;
         username_suffix INT := 0;
     BEGIN
       RAISE NOTICE 'handle_new_user: Function started for NEW.id = %', NEW.id;
      RAISE NOTICE 'handle_new_user: NEW.email = %', NEW.email;
      RAISE NOTICE 'handle_new_user: NEW.raw_user_meta_data = %', NEW.raw_user_meta_data;
   
      -- 1. 기본 사용자 이름 생성
      IF NEW.email IS NULL OR NEW.email = '' THEN
        BASE_USERNAME := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
        RAISE NOTICE 'handle_new_user: Email is NULL/empty, BASE_USERNAME = %', BASE_USERNAME;
      ELSE
        BASE_USERNAME := SPLIT_PART(NEW.email, '@', 1);
        RAISE NOTICE 'handle_new_user: Email found, BASE_USERNAME = %', BASE_USERNAME;
      END IF;
   
      -- 2. 사용자 이름 고유성 보장
      FINAL_USERNAME := BASE_USERNAME;
      LOOP
        BEGIN
          -- 현재 FINAL_USERNAME으로 삽입 시도
          INSERT INTO public.profiles (id, username, full_name, avatar_url)
          VALUES (
            NEW.id,
            FINAL_USERNAME,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- full_name이 NULL인 경우 빈 문자열로 대체
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', DEFAULT_AVATAR_URL)
          );
          RAISE NOTICE 'handle_new_user: Profile inserted successfully for NEW.id = % with username %', NEW.id, FINAL_USERNAME;
          RETURN NEW;
        EXCEPTION
          WHEN unique_violation THEN
            -- 사용자 이름이 이미 존재하면 접미사 추가 후 재시도
            username_suffix := username_suffix + 1;
            FINAL_USERNAME := BASE_USERNAME || username_suffix::text;
            RAISE NOTICE 'handle_new_user: Username % already exists, trying %', BASE_USERNAME, FINAL_USERNAME;
            -- 무한 루프 방지를 위한 안전 장치
            IF username_suffix > 10 THEN
              RAISE EXCEPTION 'handle_new_user: Could not find unique username after 10 attempts for base %', BASE_USERNAME;
            END IF;
        END;
      END LOOP;
   
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'handle_new_user: ERROR occurred for NEW.id = %. Message: %', NEW.id, SQLERRM;
        RAISE; -- 에러 다시 발생
    END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
     BEGIN
       NEW.updated_at = now();
      RETURN NEW;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
     BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
     END;
     $function$
;

grant delete on table "public"."club_forum_post_comments" to "anon";

grant insert on table "public"."club_forum_post_comments" to "anon";

grant references on table "public"."club_forum_post_comments" to "anon";

grant select on table "public"."club_forum_post_comments" to "anon";

grant trigger on table "public"."club_forum_post_comments" to "anon";

grant truncate on table "public"."club_forum_post_comments" to "anon";

grant update on table "public"."club_forum_post_comments" to "anon";

grant delete on table "public"."club_forum_post_comments" to "authenticated";

grant insert on table "public"."club_forum_post_comments" to "authenticated";

grant references on table "public"."club_forum_post_comments" to "authenticated";

grant select on table "public"."club_forum_post_comments" to "authenticated";

grant trigger on table "public"."club_forum_post_comments" to "authenticated";

grant truncate on table "public"."club_forum_post_comments" to "authenticated";

grant update on table "public"."club_forum_post_comments" to "authenticated";

grant delete on table "public"."club_forum_post_comments" to "service_role";

grant insert on table "public"."club_forum_post_comments" to "service_role";

grant references on table "public"."club_forum_post_comments" to "service_role";

grant select on table "public"."club_forum_post_comments" to "service_role";

grant trigger on table "public"."club_forum_post_comments" to "service_role";

grant truncate on table "public"."club_forum_post_comments" to "service_role";

grant update on table "public"."club_forum_post_comments" to "service_role";

grant delete on table "public"."club_forum_posts" to "anon";

grant insert on table "public"."club_forum_posts" to "anon";

grant references on table "public"."club_forum_posts" to "anon";

grant select on table "public"."club_forum_posts" to "anon";

grant trigger on table "public"."club_forum_posts" to "anon";

grant truncate on table "public"."club_forum_posts" to "anon";

grant update on table "public"."club_forum_posts" to "anon";

grant delete on table "public"."club_forum_posts" to "authenticated";

grant insert on table "public"."club_forum_posts" to "authenticated";

grant references on table "public"."club_forum_posts" to "authenticated";

grant select on table "public"."club_forum_posts" to "authenticated";

grant trigger on table "public"."club_forum_posts" to "authenticated";

grant truncate on table "public"."club_forum_posts" to "authenticated";

grant update on table "public"."club_forum_posts" to "authenticated";

grant delete on table "public"."club_forum_posts" to "service_role";

grant insert on table "public"."club_forum_posts" to "service_role";

grant references on table "public"."club_forum_posts" to "service_role";

grant select on table "public"."club_forum_posts" to "service_role";

grant trigger on table "public"."club_forum_posts" to "service_role";

grant truncate on table "public"."club_forum_posts" to "service_role";

grant update on table "public"."club_forum_posts" to "service_role";

grant delete on table "public"."club_forums" to "anon";

grant insert on table "public"."club_forums" to "anon";

grant references on table "public"."club_forums" to "anon";

grant select on table "public"."club_forums" to "anon";

grant trigger on table "public"."club_forums" to "anon";

grant truncate on table "public"."club_forums" to "anon";

grant update on table "public"."club_forums" to "anon";

grant delete on table "public"."club_forums" to "authenticated";

grant insert on table "public"."club_forums" to "authenticated";

grant references on table "public"."club_forums" to "authenticated";

grant select on table "public"."club_forums" to "authenticated";

grant trigger on table "public"."club_forums" to "authenticated";

grant truncate on table "public"."club_forums" to "authenticated";

grant update on table "public"."club_forums" to "authenticated";

grant delete on table "public"."club_forums" to "service_role";

grant insert on table "public"."club_forums" to "service_role";

grant references on table "public"."club_forums" to "service_role";

grant select on table "public"."club_forums" to "service_role";

grant trigger on table "public"."club_forums" to "service_role";

grant truncate on table "public"."club_forums" to "service_role";

grant update on table "public"."club_forums" to "service_role";

grant delete on table "public"."club_members" to "anon";

grant insert on table "public"."club_members" to "anon";

grant references on table "public"."club_members" to "anon";

grant select on table "public"."club_members" to "anon";

grant trigger on table "public"."club_members" to "anon";

grant truncate on table "public"."club_members" to "anon";

grant update on table "public"."club_members" to "anon";

grant delete on table "public"."club_members" to "authenticated";

grant insert on table "public"."club_members" to "authenticated";

grant references on table "public"."club_members" to "authenticated";

grant select on table "public"."club_members" to "authenticated";

grant trigger on table "public"."club_members" to "authenticated";

grant truncate on table "public"."club_members" to "authenticated";

grant update on table "public"."club_members" to "authenticated";

grant delete on table "public"."club_members" to "service_role";

grant insert on table "public"."club_members" to "service_role";

grant references on table "public"."club_members" to "service_role";

grant select on table "public"."club_members" to "service_role";

grant trigger on table "public"."club_members" to "service_role";

grant truncate on table "public"."club_members" to "service_role";

grant update on table "public"."club_members" to "service_role";

grant delete on table "public"."clubs" to "anon";

grant insert on table "public"."clubs" to "anon";

grant references on table "public"."clubs" to "anon";

grant select on table "public"."clubs" to "anon";

grant trigger on table "public"."clubs" to "anon";

grant truncate on table "public"."clubs" to "anon";

grant update on table "public"."clubs" to "anon";

grant delete on table "public"."clubs" to "authenticated";

grant insert on table "public"."clubs" to "authenticated";

grant references on table "public"."clubs" to "authenticated";

grant select on table "public"."clubs" to "authenticated";

grant trigger on table "public"."clubs" to "authenticated";

grant truncate on table "public"."clubs" to "authenticated";

grant update on table "public"."clubs" to "authenticated";

grant delete on table "public"."clubs" to "service_role";

grant insert on table "public"."clubs" to "service_role";

grant references on table "public"."clubs" to "service_role";

grant select on table "public"."clubs" to "service_role";

grant trigger on table "public"."clubs" to "service_role";

grant truncate on table "public"."clubs" to "service_role";

grant update on table "public"."clubs" to "service_role";

grant delete on table "public"."comment_likes" to "anon";

grant insert on table "public"."comment_likes" to "anon";

grant references on table "public"."comment_likes" to "anon";

grant select on table "public"."comment_likes" to "anon";

grant trigger on table "public"."comment_likes" to "anon";

grant truncate on table "public"."comment_likes" to "anon";

grant update on table "public"."comment_likes" to "anon";

grant delete on table "public"."comment_likes" to "authenticated";

grant insert on table "public"."comment_likes" to "authenticated";

grant references on table "public"."comment_likes" to "authenticated";

grant select on table "public"."comment_likes" to "authenticated";

grant trigger on table "public"."comment_likes" to "authenticated";

grant truncate on table "public"."comment_likes" to "authenticated";

grant update on table "public"."comment_likes" to "authenticated";

grant delete on table "public"."comment_likes" to "service_role";

grant insert on table "public"."comment_likes" to "service_role";

grant references on table "public"."comment_likes" to "service_role";

grant select on table "public"."comment_likes" to "service_role";

grant trigger on table "public"."comment_likes" to "service_role";

grant truncate on table "public"."comment_likes" to "service_role";

grant update on table "public"."comment_likes" to "service_role";

grant delete on table "public"."log_bookmarks" to "anon";

grant insert on table "public"."log_bookmarks" to "anon";

grant references on table "public"."log_bookmarks" to "anon";

grant select on table "public"."log_bookmarks" to "anon";

grant trigger on table "public"."log_bookmarks" to "anon";

grant truncate on table "public"."log_bookmarks" to "anon";

grant update on table "public"."log_bookmarks" to "anon";

grant delete on table "public"."log_bookmarks" to "authenticated";

grant insert on table "public"."log_bookmarks" to "authenticated";

grant references on table "public"."log_bookmarks" to "authenticated";

grant select on table "public"."log_bookmarks" to "authenticated";

grant trigger on table "public"."log_bookmarks" to "authenticated";

grant truncate on table "public"."log_bookmarks" to "authenticated";

grant update on table "public"."log_bookmarks" to "authenticated";

grant delete on table "public"."log_bookmarks" to "service_role";

grant insert on table "public"."log_bookmarks" to "service_role";

grant references on table "public"."log_bookmarks" to "service_role";

grant select on table "public"."log_bookmarks" to "service_role";

grant trigger on table "public"."log_bookmarks" to "service_role";

grant truncate on table "public"."log_bookmarks" to "service_role";

grant update on table "public"."log_bookmarks" to "service_role";

grant delete on table "public"."log_comments" to "anon";

grant insert on table "public"."log_comments" to "anon";

grant references on table "public"."log_comments" to "anon";

grant select on table "public"."log_comments" to "anon";

grant trigger on table "public"."log_comments" to "anon";

grant truncate on table "public"."log_comments" to "anon";

grant update on table "public"."log_comments" to "anon";

grant delete on table "public"."log_comments" to "authenticated";

grant insert on table "public"."log_comments" to "authenticated";

grant references on table "public"."log_comments" to "authenticated";

grant select on table "public"."log_comments" to "authenticated";

grant trigger on table "public"."log_comments" to "authenticated";

grant truncate on table "public"."log_comments" to "authenticated";

grant update on table "public"."log_comments" to "authenticated";

grant delete on table "public"."log_comments" to "service_role";

grant insert on table "public"."log_comments" to "service_role";

grant references on table "public"."log_comments" to "service_role";

grant select on table "public"."log_comments" to "service_role";

grant trigger on table "public"."log_comments" to "service_role";

grant truncate on table "public"."log_comments" to "service_role";

grant update on table "public"."log_comments" to "service_role";

grant delete on table "public"."log_likes" to "anon";

grant insert on table "public"."log_likes" to "anon";

grant references on table "public"."log_likes" to "anon";

grant select on table "public"."log_likes" to "anon";

grant trigger on table "public"."log_likes" to "anon";

grant truncate on table "public"."log_likes" to "anon";

grant update on table "public"."log_likes" to "anon";

grant delete on table "public"."log_likes" to "authenticated";

grant insert on table "public"."log_likes" to "authenticated";

grant references on table "public"."log_likes" to "authenticated";

grant select on table "public"."log_likes" to "authenticated";

grant trigger on table "public"."log_likes" to "authenticated";

grant truncate on table "public"."log_likes" to "authenticated";

grant update on table "public"."log_likes" to "authenticated";

grant delete on table "public"."log_likes" to "service_role";

grant insert on table "public"."log_likes" to "service_role";

grant references on table "public"."log_likes" to "service_role";

grant select on table "public"."log_likes" to "service_role";

grant trigger on table "public"."log_likes" to "service_role";

grant truncate on table "public"."log_likes" to "service_role";

grant update on table "public"."log_likes" to "service_role";

grant delete on table "public"."logs" to "anon";

grant insert on table "public"."logs" to "anon";

grant references on table "public"."logs" to "anon";

grant select on table "public"."logs" to "anon";

grant trigger on table "public"."logs" to "anon";

grant truncate on table "public"."logs" to "anon";

grant update on table "public"."logs" to "anon";

grant delete on table "public"."logs" to "authenticated";

grant insert on table "public"."logs" to "authenticated";

grant references on table "public"."logs" to "authenticated";

grant select on table "public"."logs" to "authenticated";

grant trigger on table "public"."logs" to "authenticated";

grant truncate on table "public"."logs" to "authenticated";

grant update on table "public"."logs" to "authenticated";

grant delete on table "public"."logs" to "service_role";

grant insert on table "public"."logs" to "service_role";

grant references on table "public"."logs" to "service_role";

grant select on table "public"."logs" to "service_role";

grant trigger on table "public"."logs" to "service_role";

grant truncate on table "public"."logs" to "service_role";

grant update on table "public"."logs" to "service_role";

grant delete on table "public"."meetup_participants" to "anon";

grant insert on table "public"."meetup_participants" to "anon";

grant references on table "public"."meetup_participants" to "anon";

grant select on table "public"."meetup_participants" to "anon";

grant trigger on table "public"."meetup_participants" to "anon";

grant truncate on table "public"."meetup_participants" to "anon";

grant update on table "public"."meetup_participants" to "anon";

grant delete on table "public"."meetup_participants" to "authenticated";

grant insert on table "public"."meetup_participants" to "authenticated";

grant references on table "public"."meetup_participants" to "authenticated";

grant select on table "public"."meetup_participants" to "authenticated";

grant trigger on table "public"."meetup_participants" to "authenticated";

grant truncate on table "public"."meetup_participants" to "authenticated";

grant update on table "public"."meetup_participants" to "authenticated";

grant delete on table "public"."meetup_participants" to "service_role";

grant insert on table "public"."meetup_participants" to "service_role";

grant references on table "public"."meetup_participants" to "service_role";

grant select on table "public"."meetup_participants" to "service_role";

grant trigger on table "public"."meetup_participants" to "service_role";

grant truncate on table "public"."meetup_participants" to "service_role";

grant update on table "public"."meetup_participants" to "service_role";

grant delete on table "public"."meetups" to "anon";

grant insert on table "public"."meetups" to "anon";

grant references on table "public"."meetups" to "anon";

grant select on table "public"."meetups" to "anon";

grant trigger on table "public"."meetups" to "anon";

grant truncate on table "public"."meetups" to "anon";

grant update on table "public"."meetups" to "anon";

grant delete on table "public"."meetups" to "authenticated";

grant insert on table "public"."meetups" to "authenticated";

grant references on table "public"."meetups" to "authenticated";

grant select on table "public"."meetups" to "authenticated";

grant trigger on table "public"."meetups" to "authenticated";

grant truncate on table "public"."meetups" to "authenticated";

grant update on table "public"."meetups" to "authenticated";

grant delete on table "public"."meetups" to "service_role";

grant insert on table "public"."meetups" to "service_role";

grant references on table "public"."meetups" to "service_role";

grant select on table "public"."meetups" to "service_role";

grant trigger on table "public"."meetups" to "service_role";

grant truncate on table "public"."meetups" to "service_role";

grant update on table "public"."meetups" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."showcase_bookmarks" to "anon";

grant insert on table "public"."showcase_bookmarks" to "anon";

grant references on table "public"."showcase_bookmarks" to "anon";

grant select on table "public"."showcase_bookmarks" to "anon";

grant trigger on table "public"."showcase_bookmarks" to "anon";

grant truncate on table "public"."showcase_bookmarks" to "anon";

grant update on table "public"."showcase_bookmarks" to "anon";

grant delete on table "public"."showcase_bookmarks" to "authenticated";

grant insert on table "public"."showcase_bookmarks" to "authenticated";

grant references on table "public"."showcase_bookmarks" to "authenticated";

grant select on table "public"."showcase_bookmarks" to "authenticated";

grant trigger on table "public"."showcase_bookmarks" to "authenticated";

grant truncate on table "public"."showcase_bookmarks" to "authenticated";

grant update on table "public"."showcase_bookmarks" to "authenticated";

grant delete on table "public"."showcase_bookmarks" to "service_role";

grant insert on table "public"."showcase_bookmarks" to "service_role";

grant references on table "public"."showcase_bookmarks" to "service_role";

grant select on table "public"."showcase_bookmarks" to "service_role";

grant trigger on table "public"."showcase_bookmarks" to "service_role";

grant truncate on table "public"."showcase_bookmarks" to "service_role";

grant update on table "public"."showcase_bookmarks" to "service_role";

grant delete on table "public"."showcase_comments" to "anon";

grant insert on table "public"."showcase_comments" to "anon";

grant references on table "public"."showcase_comments" to "anon";

grant select on table "public"."showcase_comments" to "anon";

grant trigger on table "public"."showcase_comments" to "anon";

grant truncate on table "public"."showcase_comments" to "anon";

grant update on table "public"."showcase_comments" to "anon";

grant delete on table "public"."showcase_comments" to "authenticated";

grant insert on table "public"."showcase_comments" to "authenticated";

grant references on table "public"."showcase_comments" to "authenticated";

grant select on table "public"."showcase_comments" to "authenticated";

grant trigger on table "public"."showcase_comments" to "authenticated";

grant truncate on table "public"."showcase_comments" to "authenticated";

grant update on table "public"."showcase_comments" to "authenticated";

grant delete on table "public"."showcase_comments" to "service_role";

grant insert on table "public"."showcase_comments" to "service_role";

grant references on table "public"."showcase_comments" to "service_role";

grant select on table "public"."showcase_comments" to "service_role";

grant trigger on table "public"."showcase_comments" to "service_role";

grant truncate on table "public"."showcase_comments" to "service_role";

grant update on table "public"."showcase_comments" to "service_role";

grant delete on table "public"."showcase_likes" to "anon";

grant insert on table "public"."showcase_likes" to "anon";

grant references on table "public"."showcase_likes" to "anon";

grant select on table "public"."showcase_likes" to "anon";

grant trigger on table "public"."showcase_likes" to "anon";

grant truncate on table "public"."showcase_likes" to "anon";

grant update on table "public"."showcase_likes" to "anon";

grant delete on table "public"."showcase_likes" to "authenticated";

grant insert on table "public"."showcase_likes" to "authenticated";

grant references on table "public"."showcase_likes" to "authenticated";

grant select on table "public"."showcase_likes" to "authenticated";

grant trigger on table "public"."showcase_likes" to "authenticated";

grant truncate on table "public"."showcase_likes" to "authenticated";

grant update on table "public"."showcase_likes" to "authenticated";

grant delete on table "public"."showcase_likes" to "service_role";

grant insert on table "public"."showcase_likes" to "service_role";

grant references on table "public"."showcase_likes" to "service_role";

grant select on table "public"."showcase_likes" to "service_role";

grant trigger on table "public"."showcase_likes" to "service_role";

grant truncate on table "public"."showcase_likes" to "service_role";

grant update on table "public"."showcase_likes" to "service_role";

grant delete on table "public"."showcases" to "anon";

grant insert on table "public"."showcases" to "anon";

grant references on table "public"."showcases" to "anon";

grant select on table "public"."showcases" to "anon";

grant trigger on table "public"."showcases" to "anon";

grant truncate on table "public"."showcases" to "anon";

grant update on table "public"."showcases" to "anon";

grant delete on table "public"."showcases" to "authenticated";

grant insert on table "public"."showcases" to "authenticated";

grant references on table "public"."showcases" to "authenticated";

grant select on table "public"."showcases" to "authenticated";

grant trigger on table "public"."showcases" to "authenticated";

grant truncate on table "public"."showcases" to "authenticated";

grant update on table "public"."showcases" to "authenticated";

grant delete on table "public"."showcases" to "service_role";

grant insert on table "public"."showcases" to "service_role";

grant references on table "public"."showcases" to "service_role";

grant select on table "public"."showcases" to "service_role";

grant trigger on table "public"."showcases" to "service_role";

grant truncate on table "public"."showcases" to "service_role";

grant update on table "public"."showcases" to "service_role";


  create policy "Allow service role to delete any record"
  on "public"."club_forum_post_comments"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."club_forum_post_comments"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Enable delete for users who own comment"
  on "public"."club_forum_post_comments"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."club_forum_post_comments"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Enable read access for all authenticated users"
  on "public"."club_forum_post_comments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for users who own comment"
  on "public"."club_forum_post_comments"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "Allow author to delete their own post"
  on "public"."club_forum_posts"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Allow author to update their own post"
  on "public"."club_forum_posts"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Allow members to create posts based on forum permissions"
  on "public"."club_forum_posts"
  as permissive
  for insert
  to public
with check (( SELECT
        CASE
            WHEN (f.write_permission = 'MEMBER'::public.club_permission_level_enum) THEN (public.get_club_member_role(f.club_id, auth.uid()) IS NOT NULL)
            WHEN (f.write_permission = 'FULL_MEMBER'::public.club_permission_level_enum) THEN (public.get_club_member_role(f.club_id, auth.uid()) = ANY (ARRAY['FULL_MEMBER'::public.club_member_role_enum, 'LEADER'::public.club_member_role_enum]))
            WHEN (f.write_permission = 'LEADER'::public.club_permission_level_enum) THEN (public.get_club_member_role(f.club_id, auth.uid()) = 'LEADER'::public.club_member_role_enum)
            ELSE false
        END AS "case"
   FROM public.club_forums f
  WHERE (f.id = club_forum_posts.forum_id)));



  create policy "Allow members to read posts based on forum permissions"
  on "public"."club_forum_posts"
  as permissive
  for select
  to public
using (( SELECT
        CASE
            WHEN (f.read_permission = 'PUBLIC'::public.club_permission_level_enum) THEN true
            WHEN (f.read_permission = 'MEMBER'::public.club_permission_level_enum) THEN (public.get_club_member_role(f.club_id, auth.uid()) IS NOT NULL)
            WHEN (f.read_permission = 'FULL_MEMBER'::public.club_permission_level_enum) THEN (public.get_club_member_role(f.club_id, auth.uid()) = ANY (ARRAY['FULL_MEMBER'::public.club_member_role_enum, 'LEADER'::public.club_member_role_enum]))
            WHEN (f.read_permission = 'LEADER'::public.club_permission_level_enum) THEN (public.get_club_member_role(f.club_id, auth.uid()) = 'LEADER'::public.club_member_role_enum)
            ELSE false
        END AS "case"
   FROM public.club_forums f
  WHERE (f.id = club_forum_posts.forum_id)));



  create policy "Allow service role to delete any record"
  on "public"."club_forum_posts"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."club_forum_posts"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Allow club owners to create forums"
  on "public"."club_forums"
  as permissive
  for insert
  to public
with check ((auth.uid() = ( SELECT clubs.owner_id
   FROM public.clubs
  WHERE (clubs.id = club_forums.club_id))));



  create policy "Allow club owners to delete forums"
  on "public"."club_forums"
  as permissive
  for delete
  to public
using ((auth.uid() = ( SELECT clubs.owner_id
   FROM public.clubs
  WHERE (clubs.id = club_forums.club_id))));



  create policy "Allow club owners to update forums"
  on "public"."club_forums"
  as permissive
  for update
  to public
using ((auth.uid() = ( SELECT clubs.owner_id
   FROM public.clubs
  WHERE (clubs.id = club_forums.club_id))));



  create policy "Allow read access to all users"
  on "public"."club_forums"
  as permissive
  for select
  to public
using (true);



  create policy "Allow service role to delete any record"
  on "public"."club_forums"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."club_forums"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Allow any users to view members"
  on "public"."club_members"
  as permissive
  for select
  to public
using (true);



  create policy "Allow service role to delete any record"
  on "public"."club_members"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."club_members"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Allow users to join clubs"
  on "public"."club_members"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Allow users to leave or be removed from clubs"
  on "public"."club_members"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) OR (auth.uid() = ( SELECT clubs.owner_id
   FROM public.clubs
  WHERE (clubs.id = club_members.club_id)))));



  create policy "Club owners can update member roles"
  on "public"."club_members"
  as permissive
  for update
  to public
using ((( SELECT clubs.owner_id
   FROM public.clubs
  WHERE (clubs.id = club_members.club_id)) = auth.uid()))
with check ((( SELECT clubs.owner_id
   FROM public.clubs
  WHERE (clubs.id = club_members.club_id)) = auth.uid()));



  create policy "Allow authenticated users to create clubs"
  on "public"."clubs"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow owner to delete their club"
  on "public"."clubs"
  as permissive
  for delete
  to public
using ((auth.uid() = owner_id));



  create policy "Allow owner to update their club"
  on "public"."clubs"
  as permissive
  for update
  to public
using ((auth.uid() = owner_id));



  create policy "Allow public read access to clubs"
  on "public"."clubs"
  as permissive
  for select
  to public
using (true);



  create policy "Allow service role to delete any record"
  on "public"."clubs"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."clubs"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Allow service role to delete any record"
  on "public"."comment_likes"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."comment_likes"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Users can delete their own comment likes."
  on "public"."comment_likes"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can like their own comments."
  on "public"."comment_likes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view comment likes."
  on "public"."comment_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all users to read log bookmarks"
  on "public"."log_bookmarks"
  as permissive
  for select
  to public
using (true);



  create policy "Allow authenticated users to delete their own log bookmarks"
  on "public"."log_bookmarks"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Allow authenticated users to insert their own log bookmarks"
  on "public"."log_bookmarks"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Allow service role to delete any record"
  on "public"."log_bookmarks"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."log_bookmarks"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Allow service role to delete any record"
  on "public"."log_comments"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."log_comments"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Authenticated users can create log comments."
  on "public"."log_comments"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Log comments are viewable by everyone."
  on "public"."log_comments"
  as permissive
  for select
  to public
using (true);



  create policy "Owners can delete their log comments."
  on "public"."log_comments"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Owners can update their log comments."
  on "public"."log_comments"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Allow service role to delete any record"
  on "public"."log_likes"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."log_likes"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Authenticated users can create log likes."
  on "public"."log_likes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Log likes are viewable by everyone."
  on "public"."log_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Owners can delete their log likes."
  on "public"."log_likes"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Allow service role to delete any record"
  on "public"."logs"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."logs"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Authenticated users can create logs."
  on "public"."logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Logs are viewable by everyone."
  on "public"."logs"
  as permissive
  for select
  to public
using (true);



  create policy "Owners can delete their logs."
  on "public"."logs"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Owners can update their logs."
  on "public"."logs"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Allow organizer to update participant status"
  on "public"."meetup_participants"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.meetups
  WHERE ((meetups.id = meetup_participants.meetup_id) AND (meetups.organizer_id = auth.uid())))))
with check ((status = ANY (ARRAY['APPROVED'::public.meetup_participant_status_enum, 'REJECTED'::public.meetup_participant_status_enum])));



  create policy "Allow service role to delete any record"
  on "public"."meetup_participants"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."meetup_participants"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Authenticated users can join meetups."
  on "public"."meetup_participants"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Everyone can view meetup participants."
  on "public"."meetup_participants"
  as permissive
  for select
  to public
using (true);



  create policy "Organizers can update participant status"
  on "public"."meetup_participants"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.meetups
  WHERE ((meetups.id = meetup_participants.meetup_id) AND (meetups.organizer_id = auth.uid())))));



  create policy "Participants can leave meetups."
  on "public"."meetup_participants"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Allow service role to delete any record"
  on "public"."meetups"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."meetups"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Authenticated users can create meetups."
  on "public"."meetups"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Everyone can view meetups."
  on "public"."meetups"
  as permissive
  for select
  to public
using (true);



  create policy "Organizers can delete their own meetups."
  on "public"."meetups"
  as permissive
  for delete
  to public
using ((auth.uid() = organizer_id));



  create policy "Organizers can update their own meetups."
  on "public"."meetups"
  as permissive
  for update
  to public
using ((auth.uid() = organizer_id));



  create policy "Allow service role to delete any record"
  on "public"."notifications"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."notifications"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Users can see their own notifications."
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = recipient_user_id));



  create policy "Users can update their own notifications."
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = recipient_user_id));



  create policy "Allow service role to delete any record"
  on "public"."profiles"
  as permissive
  for delete
  to service_role
using (true);



  create policy "Allow supabase auth admin to delete any record"
  on "public"."profiles"
  as permissive
  for delete
  to supabase_auth_admin
using (true);



  create policy "Enable insert for all users"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check (true);



  create policy "Public profiles are viewable by everyone."
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Users can update their own profile."
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER on_club_forum_post_update BEFORE UPDATE ON public.club_forum_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_create_notification_on_comment AFTER INSERT ON public.log_comments FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_comment();

CREATE TRIGGER update_log_comments_updated_at BEFORE UPDATE ON public.log_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_create_notification_on_like AFTER INSERT ON public.log_likes FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_like();

CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON public.logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_create_notification_on_comment AFTER INSERT ON public.showcase_comments FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_comment();

CREATE TRIGGER update_showcase_comments_updated_at BEFORE UPDATE ON public.showcase_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_create_notification_on_like AFTER INSERT ON public.showcase_likes FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_like();

CREATE TRIGGER update_showcases_updated_at BEFORE UPDATE ON public.showcases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow authenticated users to delete their own files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'profiles'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Allow authenticated users to insert into their own folder"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'profiles'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Allow authenticated users to update their own files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'profiles'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Allow club members to upload to posts"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'posts'::text) AND (( SELECT f.club_id
   FROM (public.club_forums f
     JOIN public.club_forum_posts p ON ((f.id = p.forum_id)))
  WHERE ((p.id)::text = (storage.foldername(f.name))[2])) IN ( SELECT club_members.club_id
   FROM public.club_members
  WHERE (club_members.user_id = auth.uid())))));



  create policy "Allow club owners to manage description images v2"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'descriptions'::text) AND (public.get_club_owner((storage.foldername(name))[2]) = auth.uid())))
with check (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'descriptions'::text) AND (public.get_club_owner((storage.foldername(name))[2]) = auth.uid())));



  create policy "Allow club owners to manage thumbnails v2"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'thumbnails'::text) AND (public.get_club_owner((storage.foldername(name))[2]) = auth.uid())))
with check (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'thumbnails'::text) AND (public.get_club_owner((storage.foldername(name))[2]) = auth.uid())));



  create policy "Allow post authors to manage their post files"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'posts'::text) AND (( SELECT club_forum_posts.user_id
   FROM public.club_forum_posts
  WHERE ((club_forum_posts.id)::text = (storage.foldername(objects.name))[2])) = auth.uid())))
with check (((bucket_id = 'clubs'::text) AND ((storage.foldername(name))[1] = 'posts'::text) AND (( SELECT club_forum_posts.user_id
   FROM public.club_forum_posts
  WHERE ((club_forum_posts.id)::text = (storage.foldername(objects.name))[2])) = auth.uid())));



  create policy "Allow public read access to log images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'logs'::text));



  create policy "Allow public read access to meetup images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'meetups'::text));



  create policy "Allow public read access to profiles"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profiles'::text));



  create policy "Public read access for all club files"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'clubs'::text));



