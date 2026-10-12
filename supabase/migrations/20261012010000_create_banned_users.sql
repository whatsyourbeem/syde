-- 스팸 유저 차단(블랙리스트).
-- 운영자가 DB에서 직접 row를 추가하고 계정을 삭제하면, 같은 이메일/소셜 계정으로의 재가입이
-- auth.users INSERT 단계(handle_new_user 트리거)에서 거부된다.

CREATE TABLE public.banned_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text,
    provider text,
    provider_user_id text,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    -- 이메일이 없는 소셜 계정(카카오 등)도 있으므로 둘 중 하나만 있어도 된다.
    CONSTRAINT banned_users_identifier_present CHECK (
        email IS NOT NULL
        OR (provider IS NOT NULL AND provider_user_id IS NOT NULL)
    ),
    CONSTRAINT banned_users_provider_pair CHECK (
        (provider IS NULL) = (provider_user_id IS NULL)
    )
);

COMMENT ON TABLE public.banned_users IS
    '재가입 차단 목록. 계정 삭제 후에도 남아야 하므로 auth.users 와 FK 를 두지 않는다. service_role/대시보드 전용.';
COMMENT ON COLUMN public.banned_users.email IS '대소문자 구분 없이 비교한다.';
COMMENT ON COLUMN public.banned_users.provider IS 'auth.identities.provider 값 (google, kakao ...)';
COMMENT ON COLUMN public.banned_users.provider_user_id IS 'auth.identities.provider_id 값 (소셜 서비스 고유 ID)';

CREATE INDEX banned_users_email_idx ON public.banned_users (lower(email));
CREATE INDEX banned_users_provider_idx ON public.banned_users (provider, provider_user_id);

-- RLS 활성화 + 정책 없음 = anon/authenticated 접근 전면 차단.
-- service_role 과 대시보드(postgres)만 읽고 쓸 수 있다.
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.banned_users FROM anon, authenticated;

-- handle_new_user: 기존 로직(20260601034200)은 그대로 두고, 맨 앞에 차단 검사를 추가한다.
-- 예외가 던져지면 auth.users INSERT 가 롤백되어 계정이 생성되지 않는다.
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
    new_provider TEXT := NEW.raw_app_meta_data->>'provider';
    new_provider_user_id TEXT := COALESCE(
        NEW.raw_user_meta_data->>'provider_id',
        NEW.raw_user_meta_data->>'sub'
    );
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.banned_users b
        WHERE (
                NULLIF(NEW.email, '') IS NOT NULL
                AND lower(b.email) = lower(NEW.email)
            )
            OR (
                new_provider IS NOT NULL
                AND new_provider_user_id IS NOT NULL
                AND b.provider = new_provider
                AND b.provider_user_id = new_provider_user_id
            )
    ) THEN
        RAISE EXCEPTION 'USER_BANNED';
    END IF;

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
