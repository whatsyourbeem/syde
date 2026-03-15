

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."club_member_role_enum" AS ENUM (
    'LEADER',
    'FULL_MEMBER',
    'GENERAL_MEMBER'
);


ALTER TYPE "public"."club_member_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."club_permission_level_enum" AS ENUM (
    'PUBLIC',
    'MEMBER',
    'FULL_MEMBER',
    'LEADER'
);


ALTER TYPE "public"."club_permission_level_enum" OWNER TO "postgres";


COMMENT ON TYPE "public"."club_permission_level_enum" IS '클럽 내 게시판 읽기/쓰기 권한';



CREATE TYPE "public"."meetup_participant_status_enum" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "public"."meetup_participant_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."meetup_status_enum" AS ENUM (
    'UPCOMING',
    'APPLY_AVAILABLE',
    'APPLY_CLOSED',
    'ENDED'
);


ALTER TYPE "public"."meetup_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."meetup_type_enum" AS ENUM (
    'INSYDE',
    'SPINOFF'
);


ALTER TYPE "public"."meetup_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_on_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    $$;


ALTER FUNCTION "public"."create_notification_on_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_on_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    $$;


ALTER FUNCTION "public"."create_notification_on_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_club_member_role"("p_club_id" "uuid", "p_user_id" "uuid") RETURNS "public"."club_member_role_enum"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
     DECLARE
       member_role public.club_member_role_enum;
     BEGIN
       SELECT role INTO member_role
       FROM public.club_members
       WHERE club_id = p_club_id AND user_id = p_user_id;
      RETURN member_role;
    END;
    $$;


ALTER FUNCTION "public"."get_club_member_role"("p_club_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_club_owner"("club_id_text" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
     DECLARE
       owner_uuid UUID;
     BEGIN
       SELECT owner_id
       INTO owner_uuid
       FROM public.clubs
       WHERE id = club_id_text::UUID;
      RETURN owner_uuid;
    END;
    $$;


ALTER FUNCTION "public"."get_club_owner"("club_id_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
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
    END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
     BEGIN
       NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
     BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
     END;
     $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."club_forum_post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    "parent_comment_id" "uuid"
);


ALTER TABLE "public"."club_forum_post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_forum_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "forum_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."club_forum_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_forums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "read_permission" "public"."club_permission_level_enum" DEFAULT 'MEMBER'::"public"."club_permission_level_enum" NOT NULL,
    "write_permission" "public"."club_permission_level_enum" DEFAULT 'MEMBER'::"public"."club_permission_level_enum" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."club_forums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_members" (
    "club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "public"."club_member_role_enum" DEFAULT 'GENERAL_MEMBER'::"public"."club_member_role_enum" NOT NULL
);


ALTER TABLE "public"."club_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "jsonb",
    "owner_id" "uuid",
    "thumbnail_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tagline" "text"
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log_bookmarks" (
    "log_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."log_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "log_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."log_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "log_id" "uuid",
    "comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_log_or_comment_id" CHECK (((("log_id" IS NOT NULL) AND ("comment_id" IS NULL)) OR (("log_id" IS NULL) AND ("comment_id" IS NOT NULL))))
);


ALTER TABLE "public"."log_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetup_participants" (
    "meetup_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."meetup_participant_status_enum" DEFAULT 'PENDING'::"public"."meetup_participant_status_enum" NOT NULL,
    "username" "text",
    "mobile" "text",
    "depositor" "text",
    "story" "text"
);


ALTER TABLE "public"."meetup_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "jsonb",
    "organizer_id" "uuid" NOT NULL,
    "thumbnail_url" "text" DEFAULT '''https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png''::text'::"text",
    "status" "public"."meetup_status_enum" DEFAULT 'UPCOMING'::"public"."meetup_status_enum" NOT NULL,
    "start_datetime" timestamp with time zone,
    "end_datetime" timestamp with time zone,
    "max_participants" integer,
    "club_id" "uuid",
    "fee" integer,
    "location" "text",
    "address" "text",
    "type" "public"."meetup_type_enum",
    CONSTRAINT "meetups_fee_check" CHECK (("fee" >= 0))
);


ALTER TABLE "public"."meetups" OWNER TO "postgres";


COMMENT ON COLUMN "public"."meetups"."fee" IS 'The participation fee for the meetup.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recipient_user_id" "uuid" NOT NULL,
    "trigger_user_id" "uuid" NOT NULL,
    "log_id" "uuid" NOT NULL,
    "comment_id" "uuid",
    "type" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."notifications"."id" IS '알림의 고유 식별자';



COMMENT ON COLUMN "public"."notifications"."created_at" IS '알림이 생성된 타임스탬프';



COMMENT ON COLUMN "public"."notifications"."recipient_user_id" IS '알림을 받아야 하는 사용자 (로그 작성자)';



COMMENT ON COLUMN "public"."notifications"."trigger_user_id" IS '알림을 유발한 사용자 (예: 좋아요 또는 댓글 작성자)';



COMMENT ON COLUMN "public"."notifications"."log_id" IS '알림과 관련된 로그';



COMMENT ON COLUMN "public"."notifications"."comment_id" IS '알림과 관련된 댓글 (댓글 알림인 경우)';



COMMENT ON COLUMN "public"."notifications"."type" IS '알림 유형 (예: ''like'', ''comment'')';



COMMENT ON COLUMN "public"."notifications"."is_read" IS '사용자가 알림을 읽었는지 여부';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "bio" "jsonb",
    "link" "text",
    "tagline" character varying(30) DEFAULT ''::character varying,
    "certified" boolean DEFAULT false,
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."showcase_bookmarks" (
    "showcase_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."showcase_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."showcase_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "showcase_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."showcase_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."showcase_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "showcase_id" "uuid",
    "comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_showcase_or_comment_id" CHECK (((("showcase_id" IS NOT NULL) AND ("comment_id" IS NULL)) OR (("showcase_id" IS NULL) AND ("comment_id" IS NOT NULL))))
);


ALTER TABLE "public"."showcase_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."showcases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."showcases" OWNER TO "postgres";


ALTER TABLE ONLY "public"."club_forum_post_comments"
    ADD CONSTRAINT "club_forum_post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_forum_posts"
    ADD CONSTRAINT "club_forum_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_forums"
    ADD CONSTRAINT "club_forums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_pkey" PRIMARY KEY ("club_id", "user_id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("comment_id", "user_id");



ALTER TABLE ONLY "public"."log_bookmarks"
    ADD CONSTRAINT "log_bookmarks_pkey" PRIMARY KEY ("log_id", "user_id");



ALTER TABLE ONLY "public"."log_comments"
    ADD CONSTRAINT "log_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."log_likes"
    ADD CONSTRAINT "log_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetup_participants"
    ADD CONSTRAINT "meetup_participants_pkey" PRIMARY KEY ("meetup_id", "user_id");



ALTER TABLE ONLY "public"."meetups"
    ADD CONSTRAINT "meetups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."showcase_bookmarks"
    ADD CONSTRAINT "showcase_bookmarks_pkey" PRIMARY KEY ("showcase_id", "user_id");



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."log_likes"
    ADD CONSTRAINT "unique_like_per_log_or_comment" UNIQUE ("user_id", "log_id", "comment_id");



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "unique_like_per_showcase_or_comment" UNIQUE ("user_id", "showcase_id", "comment_id");



CREATE INDEX "idx_club_forum_posts_forum_id" ON "public"."club_forum_posts" USING "btree" ("forum_id");



CREATE INDEX "idx_club_forum_posts_user_id" ON "public"."club_forum_posts" USING "btree" ("user_id");



CREATE INDEX "idx_club_forums_club_id" ON "public"."club_forums" USING "btree" ("club_id");



CREATE UNIQUE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "on_club_forum_post_update" BEFORE UPDATE ON "public"."club_forum_posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_on_comment" AFTER INSERT ON "public"."log_comments" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_on_comment"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_on_comment" AFTER INSERT ON "public"."showcase_comments" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_on_comment"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_on_like" AFTER INSERT ON "public"."log_likes" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_on_like"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_on_like" AFTER INSERT ON "public"."showcase_likes" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_on_like"();



CREATE OR REPLACE TRIGGER "update_log_comments_updated_at" BEFORE UPDATE ON "public"."log_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_logs_updated_at" BEFORE UPDATE ON "public"."logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_showcase_comments_updated_at" BEFORE UPDATE ON "public"."showcase_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_showcases_updated_at" BEFORE UPDATE ON "public"."showcases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."club_forum_post_comments"
    ADD CONSTRAINT "club_forum_post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."club_forum_post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_forum_post_comments"
    ADD CONSTRAINT "club_forum_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."club_forum_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_forum_post_comments"
    ADD CONSTRAINT "club_forum_post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_forum_posts"
    ADD CONSTRAINT "club_forum_posts_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "public"."club_forums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_forum_posts"
    ADD CONSTRAINT "club_forum_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_forums"
    ADD CONSTRAINT "club_forums_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."log_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_bookmarks"
    ADD CONSTRAINT "log_bookmarks_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_bookmarks"
    ADD CONSTRAINT "log_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_comments"
    ADD CONSTRAINT "log_comments_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_comments"
    ADD CONSTRAINT "log_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."log_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_comments"
    ADD CONSTRAINT "log_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_likes"
    ADD CONSTRAINT "log_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."log_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_likes"
    ADD CONSTRAINT "log_likes_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_likes"
    ADD CONSTRAINT "log_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetup_participants"
    ADD CONSTRAINT "meetup_participants_meetup_id_fkey" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetup_participants"
    ADD CONSTRAINT "meetup_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetups"
    ADD CONSTRAINT "meetups_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meetups"
    ADD CONSTRAINT "meetups_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."log_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_trigger_user_id_fkey" FOREIGN KEY ("trigger_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_bookmarks"
    ADD CONSTRAINT "showcase_bookmarks_showcase_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "public"."showcases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_bookmarks"
    ADD CONSTRAINT "showcase_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."showcase_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_showcase_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "public"."showcases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_comments"
    ADD CONSTRAINT "showcase_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."showcase_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_showcase_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "public"."showcases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcase_likes"
    ADD CONSTRAINT "showcase_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."showcases"
    ADD CONSTRAINT "showcases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all users to read log bookmarks" ON "public"."log_bookmarks" FOR SELECT USING (true);



CREATE POLICY "Allow any users to view members" ON "public"."club_members" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated users to create clubs" ON "public"."clubs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to delete their own log bookmarks" ON "public"."log_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to insert their own log bookmarks" ON "public"."log_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow author to delete their own post" ON "public"."club_forum_posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow author to update their own post" ON "public"."club_forum_posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow club owners to create forums" ON "public"."club_forums" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "clubs"."owner_id"
   FROM "public"."clubs"
  WHERE ("clubs"."id" = "club_forums"."club_id"))));



CREATE POLICY "Allow club owners to delete forums" ON "public"."club_forums" FOR DELETE USING (("auth"."uid"() = ( SELECT "clubs"."owner_id"
   FROM "public"."clubs"
  WHERE ("clubs"."id" = "club_forums"."club_id"))));



CREATE POLICY "Allow club owners to update forums" ON "public"."club_forums" FOR UPDATE USING (("auth"."uid"() = ( SELECT "clubs"."owner_id"
   FROM "public"."clubs"
  WHERE ("clubs"."id" = "club_forums"."club_id"))));



CREATE POLICY "Allow members to create posts based on forum permissions" ON "public"."club_forum_posts" FOR INSERT WITH CHECK (( SELECT
        CASE
            WHEN ("f"."write_permission" = 'MEMBER'::"public"."club_permission_level_enum") THEN ("public"."get_club_member_role"("f"."club_id", "auth"."uid"()) IS NOT NULL)
            WHEN ("f"."write_permission" = 'FULL_MEMBER'::"public"."club_permission_level_enum") THEN ("public"."get_club_member_role"("f"."club_id", "auth"."uid"()) = ANY (ARRAY['FULL_MEMBER'::"public"."club_member_role_enum", 'LEADER'::"public"."club_member_role_enum"]))
            WHEN ("f"."write_permission" = 'LEADER'::"public"."club_permission_level_enum") THEN ("public"."get_club_member_role"("f"."club_id", "auth"."uid"()) = 'LEADER'::"public"."club_member_role_enum")
            ELSE false
        END AS "case"
   FROM "public"."club_forums" "f"
  WHERE ("f"."id" = "club_forum_posts"."forum_id")));



CREATE POLICY "Allow members to read posts based on forum permissions" ON "public"."club_forum_posts" FOR SELECT USING (( SELECT
        CASE
            WHEN ("f"."read_permission" = 'PUBLIC'::"public"."club_permission_level_enum") THEN true
            WHEN ("f"."read_permission" = 'MEMBER'::"public"."club_permission_level_enum") THEN ("public"."get_club_member_role"("f"."club_id", "auth"."uid"()) IS NOT NULL)
            WHEN ("f"."read_permission" = 'FULL_MEMBER'::"public"."club_permission_level_enum") THEN ("public"."get_club_member_role"("f"."club_id", "auth"."uid"()) = ANY (ARRAY['FULL_MEMBER'::"public"."club_member_role_enum", 'LEADER'::"public"."club_member_role_enum"]))
            WHEN ("f"."read_permission" = 'LEADER'::"public"."club_permission_level_enum") THEN ("public"."get_club_member_role"("f"."club_id", "auth"."uid"()) = 'LEADER'::"public"."club_member_role_enum")
            ELSE false
        END AS "case"
   FROM "public"."club_forums" "f"
  WHERE ("f"."id" = "club_forum_posts"."forum_id")));



CREATE POLICY "Allow organizer to update participant status" ON "public"."meetup_participants" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."meetups"
  WHERE (("meetups"."id" = "meetup_participants"."meetup_id") AND ("meetups"."organizer_id" = "auth"."uid"()))))) WITH CHECK (("status" = ANY (ARRAY['APPROVED'::"public"."meetup_participant_status_enum", 'REJECTED'::"public"."meetup_participant_status_enum"])));



CREATE POLICY "Allow owner to delete their club" ON "public"."clubs" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Allow owner to update their club" ON "public"."clubs" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Allow public read access to clubs" ON "public"."clubs" FOR SELECT USING (true);



CREATE POLICY "Allow read access to all users" ON "public"."club_forums" FOR SELECT USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."club_forum_post_comments" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."club_forum_posts" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."club_forums" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."club_members" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."clubs" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."comment_likes" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."log_bookmarks" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."log_comments" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."log_likes" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."logs" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."meetup_participants" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."meetups" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."notifications" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow service role to delete any record" ON "public"."profiles" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."club_forum_post_comments" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."club_forum_posts" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."club_forums" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."club_members" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."clubs" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."comment_likes" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."log_bookmarks" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."log_comments" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."log_likes" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."logs" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."meetup_participants" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."meetups" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."notifications" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase auth admin to delete any record" ON "public"."profiles" FOR DELETE TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow users to join clubs" ON "public"."club_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to leave or be removed from clubs" ON "public"."club_members" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = ( SELECT "clubs"."owner_id"
   FROM "public"."clubs"
  WHERE ("clubs"."id" = "club_members"."club_id")))));



CREATE POLICY "Authenticated users can create log comments." ON "public"."log_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create log likes." ON "public"."log_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create logs." ON "public"."logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create meetups." ON "public"."meetups" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can join meetups." ON "public"."meetup_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Club owners can update member roles" ON "public"."club_members" FOR UPDATE USING ((( SELECT "clubs"."owner_id"
   FROM "public"."clubs"
  WHERE ("clubs"."id" = "club_members"."club_id")) = "auth"."uid"())) WITH CHECK ((( SELECT "clubs"."owner_id"
   FROM "public"."clubs"
  WHERE ("clubs"."id" = "club_members"."club_id")) = "auth"."uid"()));



CREATE POLICY "Enable delete for users who own comment" ON "public"."club_forum_post_comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for all users" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."club_forum_post_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for all authenticated users" ON "public"."club_forum_post_comments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for users who own comment" ON "public"."club_forum_post_comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Everyone can view meetup participants." ON "public"."meetup_participants" FOR SELECT USING (true);



CREATE POLICY "Everyone can view meetups." ON "public"."meetups" FOR SELECT USING (true);



CREATE POLICY "Log comments are viewable by everyone." ON "public"."log_comments" FOR SELECT USING (true);



CREATE POLICY "Log likes are viewable by everyone." ON "public"."log_likes" FOR SELECT USING (true);



CREATE POLICY "Logs are viewable by everyone." ON "public"."logs" FOR SELECT USING (true);



CREATE POLICY "Organizers can delete their own meetups." ON "public"."meetups" FOR DELETE USING (("auth"."uid"() = "organizer_id"));



CREATE POLICY "Organizers can update participant status" ON "public"."meetup_participants" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."meetups"
  WHERE (("meetups"."id" = "meetup_participants"."meetup_id") AND ("meetups"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers can update their own meetups." ON "public"."meetups" FOR UPDATE USING (("auth"."uid"() = "organizer_id"));



CREATE POLICY "Owners can delete their log comments." ON "public"."log_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owners can delete their log likes." ON "public"."log_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owners can delete their logs." ON "public"."logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owners can update their log comments." ON "public"."log_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owners can update their logs." ON "public"."logs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Participants can leave meetups." ON "public"."meetup_participants" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own comment likes." ON "public"."comment_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like their own comments." ON "public"."comment_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own notifications." ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_user_id"));



CREATE POLICY "Users can update their own notifications." ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_user_id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view comment likes." ON "public"."comment_likes" FOR SELECT USING (true);



ALTER TABLE "public"."club_forum_post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_forum_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_forums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetup_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."club_forum_post_comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."log_comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."log_likes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."meetup_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_notification_on_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_on_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_on_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_on_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_on_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_on_like"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_club_member_role"("p_club_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_club_member_role"("p_club_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_club_member_role"("p_club_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_club_owner"("club_id_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_club_owner"("club_id_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_club_owner"("club_id_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."club_forum_post_comments" TO "anon";
GRANT ALL ON TABLE "public"."club_forum_post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."club_forum_post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."club_forum_posts" TO "anon";
GRANT ALL ON TABLE "public"."club_forum_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."club_forum_posts" TO "service_role";



GRANT ALL ON TABLE "public"."club_forums" TO "anon";
GRANT ALL ON TABLE "public"."club_forums" TO "authenticated";
GRANT ALL ON TABLE "public"."club_forums" TO "service_role";



GRANT ALL ON TABLE "public"."club_members" TO "anon";
GRANT ALL ON TABLE "public"."club_members" TO "authenticated";
GRANT ALL ON TABLE "public"."club_members" TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."log_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."log_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."log_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."log_comments" TO "anon";
GRANT ALL ON TABLE "public"."log_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."log_comments" TO "service_role";



GRANT ALL ON TABLE "public"."log_likes" TO "anon";
GRANT ALL ON TABLE "public"."log_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."log_likes" TO "service_role";



GRANT ALL ON TABLE "public"."logs" TO "anon";
GRANT ALL ON TABLE "public"."logs" TO "authenticated";
GRANT ALL ON TABLE "public"."logs" TO "service_role";



GRANT ALL ON TABLE "public"."meetup_participants" TO "anon";
GRANT ALL ON TABLE "public"."meetup_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."meetup_participants" TO "service_role";



GRANT ALL ON TABLE "public"."meetups" TO "anon";
GRANT ALL ON TABLE "public"."meetups" TO "authenticated";
GRANT ALL ON TABLE "public"."meetups" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."showcase_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."showcase_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."showcase_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."showcase_comments" TO "anon";
GRANT ALL ON TABLE "public"."showcase_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."showcase_comments" TO "service_role";



GRANT ALL ON TABLE "public"."showcase_likes" TO "anon";
GRANT ALL ON TABLE "public"."showcase_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."showcase_likes" TO "service_role";



GRANT ALL ON TABLE "public"."showcases" TO "anon";
GRANT ALL ON TABLE "public"."showcases" TO "authenticated";
GRANT ALL ON TABLE "public"."showcases" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























drop extension if exists "pg_net";

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



