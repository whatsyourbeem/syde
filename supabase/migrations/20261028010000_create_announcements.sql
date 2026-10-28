-- 사이트 상단 공지 띠 배너.
-- 운영자가 대시보드에서 row를 추가하고 is_visible 을 TRUE 로 바꾸면 모든 페이지 맨 위에 띠로 노출된다.
-- 여러 건이 켜져 있으면 가장 최근에 만든 1건만 보여준다.

CREATE TABLE public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    is_visible boolean NOT NULL DEFAULT false,
    link_url text,
    icon text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT announcements_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 200),
    -- 사이트 내부 경로(/...) 또는 http(s) 주소만 허용한다. javascript: 같은 스킴과 "//host" 형태는 막는다.
    CONSTRAINT announcements_link_url_format CHECK (
        link_url IS NULL OR link_url ~ '^(/([^/].*)?|https?://.+)$'
    ),
    -- 이모지 1개를 넣는 칸. ZWJ 조합 이모지(👨‍👩‍👧 등)도 들어가도록 여유를 둔다.
    CONSTRAINT announcements_icon_length CHECK (icon IS NULL OR char_length(icon) BETWEEN 1 AND 16)
);

COMMENT ON TABLE public.announcements IS
    '사이트 상단 공지 띠 배너. 쓰기는 service_role/대시보드 전용이고, 방문자는 is_visible 이 TRUE 인 행만 읽을 수 있다.';
COMMENT ON COLUMN public.announcements.content IS '공지 내용 (1~200자)';
COMMENT ON COLUMN public.announcements.is_visible IS '보여주기 상태. TRUE 인 행 중 가장 최근(created_at) 1건만 노출된다.';
COMMENT ON COLUMN public.announcements.link_url IS '클릭 시 이동할 링크. 비우면 클릭할 수 없는 띠가 된다. 내부 경로(/meetup) 또는 http(s) 주소.';
COMMENT ON COLUMN public.announcements.icon IS '공지 앞에 붙일 이모지. 비우면 아이콘 없이 글자만 보인다.';

-- 노출 대상 1건만 빠르게 찾는다.
CREATE INDEX announcements_visible_created_at_idx
    ON public.announcements (created_at DESC)
    WHERE is_visible;

-- updated_at 자동 갱신 (handle_updated_at 은 기존 마이그레이션에서 만든 함수를 재사용)
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 로그인 여부와 관계없이 노출 중인 공지만 읽을 수 있다. 쓰기 정책은 두지 않는다(service_role 은 RLS 를 우회).
CREATE POLICY "Anyone can read visible announcements" ON public.announcements
    FOR SELECT
    USING (is_visible);
