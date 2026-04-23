-- 1. Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- 2. Migrate existing emails from auth.users to public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    DEFAULT_AVATAR_URL TEXT := 'https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/profiles/default_avatar.png';
    BASE_USERNAME TEXT;
    FINAL_USERNAME TEXT;
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
            INSERT INTO public.profiles (id, username, full_name, avatar_url, email)
            VALUES (
                NEW.id,
                FINAL_USERNAME,
                COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'avatar_url', DEFAULT_AVATAR_URL),
                NEW.email
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
END;
$$;

-- 4. Add a trigger to profiles to sync email from auth.users on insert if not provided
-- This ensures that seeds or direct inserts also get the email.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger AS $$
BEGIN
    IF NEW.email IS NULL THEN
        SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_profile_insert_sync_email ON public.profiles;
CREATE TRIGGER on_profile_insert_sync_email
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- seed.sql에서 triggers를 비활성화(session_replication_role = replica)하더라도 
-- 이 트리거는 실행되도록 설정합니다.
ALTER TABLE public.profiles ENABLE ALWAYS TRIGGER on_profile_insert_sync_email;
