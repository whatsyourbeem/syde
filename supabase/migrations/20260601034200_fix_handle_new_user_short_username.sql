-- username_length CHECK (char_length(username) >= 3) 위반 방지
-- 이메일 prefix가 2자 이하인 유저 가입 시 "Database error saving new user" 발생하던 버그 수정
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
    IF NEW.email IS NULL OR NEW.email = '' THEN
        BASE_USERNAME := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
    ELSE
        BASE_USERNAME := SPLIT_PART(NEW.email, '@', 1);
    END IF;

    -- username_length CHECK: char_length >= 3 보장
    IF char_length(BASE_USERNAME) < 3 THEN
        BASE_USERNAME := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;

    FINAL_USERNAME := BASE_USERNAME;
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, username, full_name, avatar_url, email)
            VALUES (
                NEW.id,
                FINAL_USERNAME,
                COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'avatar_url', DEFAULT_AVATAR_URL),
                NEW.email
            );
            RETURN NEW;
        EXCEPTION
            WHEN unique_violation THEN
                username_suffix := username_suffix + 1;
                FINAL_USERNAME := BASE_USERNAME || username_suffix::text;
                IF username_suffix > 10 THEN
                    RAISE EXCEPTION 'handle_new_user: Could not find unique username after 10 attempts for base %', BASE_USERNAME;
                END IF;
        END;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'handle_new_user: ERROR occurred for NEW.id = %. Message: %', NEW.id, SQLERRM;
        RAISE;
END;
$$;
