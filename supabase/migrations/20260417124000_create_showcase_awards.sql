-- 어워드 종류를 제한하기 위한 Enum 타입 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'showcase_award_type') THEN
        CREATE TYPE public.showcase_award_type AS ENUM ('SYDE_PICK');
    END IF;
END
$$;

-- 1. 신규 어워드 테이블 생성
CREATE TABLE IF NOT EXISTS public.showcase_awards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    showcase_id uuid NOT NULL REFERENCES public.showcases(id) ON DELETE CASCADE,
    date date NOT NULL,
    type public.showcase_award_type NOT NULL, -- Enum 적용
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT showcase_awards_pkey PRIMARY KEY (id)
);

-- 2. 기존 sydepick 데이터 마이그레이션 (컬럼이 존재할 경우에만 실행)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'showcases' 
        AND column_name = 'sydepick'
    ) THEN
        -- 데이터 삽입
        INSERT INTO public.showcase_awards (showcase_id, date, type)
        SELECT id, sydepick, 'SYDE_PICK'::public.showcase_award_type
        FROM public.showcases
        WHERE sydepick IS NOT NULL;

        -- 기존 컬럼 삭제
        ALTER TABLE public.showcases DROP COLUMN sydepick;
    END IF;
END
$$;

-- RLS 보안 설정
ALTER TABLE public.showcase_awards ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'showcase_awards' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.showcase_awards FOR SELECT USING (true);
    END IF;
END
$$;
