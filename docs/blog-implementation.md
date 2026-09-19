# SYDE 블로그 — 구현 명세

> 작성일: 2026-09-19 · 기준 코드: `develop` @ 98d71c3
> 성격: 블로그 전환을 위해 **코드에서 해야 할 일**의 목록과 명세. 왜 하는지는 [기획 배경과 방향](blog-direction.md)에 있다.
> 이전 기록: [인사이트 → 블로그 전환 UI/UX 분석](blog-conversion-ux-analysis.md)

## 이 문서를 관리하는 규칙

- 작업마다 ID가 있다. 에디터·작성 흐름은 `E`, 게시판(목록·상세)은 `B`.
- **진행 상태는 [2. 작업 목록](#2-작업-목록) 표의 "상태" 열에서만 갱신한다.** 완료되면 `✅ 커밋해시`를 적는다.
- 본문에 진행 기록을 덧붙이지 않는다. 명세가 바뀌면 해당 항목의 내용을 직접 고친다.
- 결정이 바뀌면 [방향 문서 6장](blog-direction.md#6-주요-결정과-근거)을 먼저 고친다.

---

## 1. 코드 지도

### 1-1. 에디터

| 파일 | 역할 |
|---|---|
| `components/common/tiptap-editor-wrapper.tsx` | 에디터 본체. 붙여넣기·드롭·이미지 업로드·외부 이미지 이전·툴바와 메뉴 조립 |
| `components/common/tiptap-extensions.ts` | 에디터용 확장 목록 (StarterKit, 표, 체크리스트, 유튜브, 형광펜, 콜아웃, 슬래시 등) |
| `components/common/tiptap-server-extensions.ts` | 독자 화면용 확장과 `getInitialHtmlFromTiptap()` (서버 HTML 렌더러) |
| `components/common/tiptap-toolbar.tsx` | 상단 툴바, 링크 입력창, 도움말 |
| `components/common/tiptap-bubble-menus.tsx` | 텍스트 선택·이미지·링크 카드·유튜브·표 메뉴 |
| `components/common/tiptap-slash-command.ts`, `slash-command-menu.tsx` | `/` 명령 메뉴 |
| `components/common/tiptap-markdown-paste.ts` | 마크다운 판별·변환 붙여넣기 |
| `components/common/tiptap-upload-placeholder.ts` | 업로드 중 위치 표시 |
| `components/common/tiptap-external-images.ts` | 만료되는 외부 이미지 판별 |
| `components/common/tiptap-code-block.tsx`, `tiptap-lowlight.ts` | 코드 블록(언어 선택·강조) |
| `components/common/tiptap-callout.tsx`, `tiptap-callout-shared.ts` | 콜아웃 |
| `components/common/editor-write-bar.tsx` | 상단 고정 작성 바 (인사이트·쇼케이스 공용) |
| `components/common/editor-preview-dialog.tsx` | 발행 전 미리보기 |
| `components/common/draft-restore-banner.tsx`, `hooks/use-local-draft.ts` | 브라우저 자동 임시저장과 복원 |
| `hooks/use-image-upload.ts`, `lib/image-compression.ts` | 이미지 압축·업로드 |
| `components/common/rich-content.tsx` | 서버 HTML 표시, 링크 카드를 OG 카드로 교체 |
| `app/globals.css`, `tailwind.config.ts` | 본문(prose) 스타일. 에디터와 독자 화면이 공유 |

**에디터 사용처 6곳**: `insight/insight-edit-form.tsx`, `showcase/project-registration-form.tsx`, `club/club-post-form.tsx`, `club/club-edit-form.tsx`, `meetup/meetup-description-editor.tsx`(`meetup-edit-form.tsx`에서 사용), `user/bio-editor.tsx`

### 1-2. 인사이트(블로그)

| 파일 | 역할 |
|---|---|
| `app/insight/insight-actions.ts` | `createInsight`, `updateInsight`, 댓글 |
| `app/insight/insight-data-actions.ts` | 목록 조회 (현재 최신순 고정) |
| `lib/queries/insight-queries.ts` | 상세·관련 조회 |
| `app/insight/page.tsx`, `components/insight/insight-feed.tsx`, `insight-card.tsx`, `insight-thumbnail.tsx` | 목록 |
| `app/insight/[id]/page.tsx`, `components/insight/insight-detail-client.tsx` | 상세 |
| `components/insight/insight-edit-form.tsx`, `app/insight/write`, `app/insight/[id]/edit` | 작성·수정 |

### 1-3. DB (`insights`)

```
id UUID PK · user_id → profiles · title TEXT NOT NULL · content TEXT NOT NULL (Tiptap JSON 문자열)
image_url TEXT · summary TEXT (nullable) · slug TEXT UNIQUE · views INT · created_at · updated_at
```

- 트리거: INSERT 시 slug 생성, INSERT 시 활동 피드 생성, DELETE 시 활동 정리
- 보안 정책(RLS): SELECT는 누구나, INSERT·UPDATE·DELETE는 본인만
- `insights`를 읽는 곳(8): `insight-data-actions.ts`, `insight-queries.ts`(4), `[id]/edit/page.tsx`, `search/all-search-results.tsx`, `app/sitemap.ts`, `feed-queries.ts`

---

## 2. 작업 목록

| ID | 작업 | 범위 | 규모 | 마일스톤 | 상태 |
|---|---|---|---|---|---|
| E0 | 에디터 버그 수정 | 에디터 6곳 | 0.5일 | M1 필수 | ✅ 62b4084 |
| E1 | 빈 줄 `/` 안내, 슬래시 메뉴 확장 | 에디터 6곳 | 1일 | M1 권장 | ✅ b2cbed4 |
| E2 | 링크 편집 메뉴 | 에디터 6곳 | 0.5일 | M1 권장 | ⏳ |
| E3 | 테두리 없는 작성 화면, 발행 창, 한 줄 소개 자동화 | 인사이트 | 1.5일 | M1 필수 | ⏳ |
| B1 | 글쓰기 진입점 | 목록 | 0.5일 | M1 필수 | ⏳ |
| B2 | 목록 제목·빈 상태 문구 | 목록 | 0.2일 | M1 필수 | ⏳ |
| E4 | 서버 임시저장, 카테고리·태그 | 인사이트 + DB | 2.5~3일 | M2 | ⏳ |
| B3 | 텍스트 우선 목록 | 목록 | 1일 | M2 | ⏳ |
| B4 | 목록 지표 정리 | 목록 | 0.3일 | M2 | ⏳ |
| B5 | 상세 헤더 좌측 정렬 | 상세 | 0.5일 | M2 | ⏳ |
| E5 | 제목 앵커, 목차, 코드 복사 | 상세 | 1.5일 | M2 | ⏳ |
| B6 | 작가 카드 + 다른 글 3개 | 상세 | 0.5일 | M2 | ⏳ |
| E6 | 고급 편집 (드래그·이미지·표·마크다운 불러오기·미리보기) | 에디터 6곳 | 3~4일 | M3 | ⏳ |
| B7 | 정렬 토글 (최신순 / 인기순) | 목록 | 0.5일 | M3 | ⏳ |
| B8 | 카테고리 필터, 태그 모아보기 | 목록 | 0.5일 | M3 (E4 후) | ⏳ |
| B9 | "인사이트" 문구 리네이밍 (메타데이터 제외) | 사이트 전체 | 0.3일 | M3 | ⏳ |

- **M1 합계 약 4.2일** (필수 2.7일 + 권장 1.5일). 콜드 시딩 DM 발송 전에 끝낸다.
- **M2 약 6.3~6.8일**, **M3 약 4.3~5.3일**.

---

## 3. 에디터·작성 흐름

### E0. 에디터 버그 수정

| # | 증상 | 수정 | 파일 |
|---|---|---|---|
| a | 슬래시 메뉴에서 Esc를 누르면 메뉴만 사라지고 명령 입력 상태가 남는다. 이어서 Enter를 누르면 보이지 않는 명령이 실행된다(`/코` → Esc → Enter = 코드 블록) | Esc는 Suggestion이 직접 종료하게 둔다(`false` 반환). Tiptap 3.22부터 Suggestion이 Esc로 닫은 것을 기억해, 같은 자리에서 이어 치거나 띄어 써도 다시 열리지 않는다(커서가 다른 곳에 갔다 돌아오면 다시 열림). 비동기 시작이 종료보다 늦게 끝나도 팝업이 남지 않게 `onStart`에서 기존 팝업을 먼저 정리한다 | `tiptap-slash-command.ts` |
| b | 일치하는 명령이 없어도 Enter가 막힌다(`/usr/local` + Enter). 방향키를 누르면 `% 0`으로 선택 번호가 NaN이 된다 | `items.length === 0`이면 모든 키에 `false`를 돌려준다 | `slash-command-menu.tsx` |
| c | 방향키로 선택해도 목록이 스크롤되지 않는다(14개 × 약 44px > `max-h-80`) | 항목 버튼 ref 배열을 두고, `selected`가 바뀌면 `scrollIntoView({ block: "nearest" })` | `slash-command-menu.tsx` |
| d | 여러 장 업로드 중 한 장만 끝나도 발행 버튼이 켜진다. 그때 발행하면 나머지 이미지가 빠진다 | `isUploading`을 진행 중 개수(ref 카운터)로 계산 | `hooks/use-image-upload.ts` |
| e | 본문 이미지 업로드 실패 시 오류 알림이 두 번 뜬다 | `onImageUpload` 규칙: 실패 사유를 이미 알렸으면 null을 반환하고, 예외는 예상치 못한 오류일 때만 던진다. 에디터는 예외(rejected)만 알린다. 6곳의 업로드 함수를 `uploadImage` 결과를 그대로 반환하도록 바꾸고, 훅의 오류 알림은 하나의 id로 묶어 여러 장이 실패해도 한 번만 뜨게 한다 | `tiptap-editor-wrapper.tsx`, `use-image-upload.ts`, 에디터 사용처 6곳 |
| f | 유튜브만 있는 글은 "본문을 입력해주세요"로 발행이 막힌다 | `NON_TEXT_CONTENT_NODES`에 `youtube`를 추가하고, `isBodyEmpty`를 `lib/tiptap-content.ts`로 옮겨 공용화 | `insight-edit-form.tsx` |
| g | `@tiptap/extension-link`가 StarterKit과 중복된 불필요한 의존성이다 | `package.json`에서 제거 | `package.json` |

**완료 조건**
- `/코` → Esc → Enter가 줄바꿈이 된다.
- 줄 맨 앞 `/usr/local` + Enter가 줄바꿈이 된다.
- 방향키로 마지막 항목까지 내려가면 목록이 따라온다.
- 이미지 3장을 붙여넣는 동안 발행 버튼이 계속 꺼져 있다.
- 업로드 실패 알림이 한 번만 뜬다.
- 유튜브만 있는 글을 발행할 수 있다.

### E1. 빈 줄 `/` 안내, 슬래시 메뉴 확장

1. **빈 줄 안내**
   - `tiptap-editor-wrapper.tsx`의 Placeholder 설정을 함수형으로 둔다: 이미지 캡션은 캡션 안내, 빈 제목 줄은 "제목 1/2/3", 문서 전체가 비면 폼별 문구, 그 밖의 빈 줄은 "'/'를 입력해 블록 추가".
   - Placeholder는 커서가 있는 **최상위** 빈 텍스트 블록에만 붙으므로 목록·표 칸·콜아웃 안에서는 자동으로 뜨지 않는다.
   - `globals.css`: 줄 안내는 `.ProseMirror.ProseMirror-focused > :is(p, h1, h2, h3).is-empty:not(.is-editor-empty)`에서만 보여 준다(쓰는 중일 때만, 빈 문서 안내보다 옅은 색).
   - 터치 기기(`pointer: coarse`)에서는 "/" 줄 안내를 빈 문자열로 둔다.
   - 툴바 작성 도움말 맨 위에 "/ 블록 메뉴" 항목을 추가한다.
2. **메뉴 그룹**
   - `SlashCommandItem`에 `group`을 추가한다: 기본 / 목록 / 미디어 / 강조. 항목은 메뉴 순서대로 선언하고, 그룹이 바뀌는 곳에 제목을 그린다.
   - 키보드 선택은 평평한 순서로 한다. 그룹의 첫 항목으로 이동하면 그룹 제목까지 보이게 스크롤한다.
3. **새 항목**
   - `유튜브`, `링크 카드`, `콜아웃 · 정보/팁/주의`(콜아웃을 종류별로 분리). 콜아웃 아이콘·이름은 `CALLOUT_META`에서 가져온다.
   - 검색어를 보강한다: 영상·video·동영상·쇼츠·bookmark·북마크·카드 등.
4. **URL 입력**
   - 래퍼에 `embedPrompt: EmbedKind | null` 상태를 두고, 슬래시 메뉴(`onEmbedClick`)와 툴바 "더보기"(유튜브 영상·링크 카드)가 연다.
   - `tiptap-embed-prompt.tsx`: 커서 위치에 붙는 팝오버(`PopoverAnchor`). 링크 입력창과 같은 모양이고, `https://` 없이 넣어도 받는다. 유튜브가 아닌 주소는 오류로 알린다.
   - `tiptap-embed.ts`: URL 판별(`toHttpUrl`)과 `youtube`·`linkPreview` 노드 생성을 붙여넣기와 공유한다. 삽입은 붙여넣기처럼 `replaceSelectionWith`로 빈 줄을 대체한다.
5. **위치 보정**: Suggestion의 `props.mount(element)`로 팝업을 띄운다. 커서에 고정되고 스크롤·리사이즈 때 자동으로 다시 배치되며, 바깥을 클릭하면 닫힌다. 옵션은 `placement: "bottom-start"`, `offset: 6`, `strategy: "fixed"`, `shift({ padding: 8 })`(`@floating-ui/dom` 직접 의존성)이고, 아래 공간이 부족하면 위로 뒤집힌다.

**완료 조건**
- 빈 줄에 커서를 두면 안내가 보인다. 목록 안에서는 보이지 않는다.
- `/유튜브`와 `/링크 카드`로 주소를 넣을 수 있다.
- 메뉴가 그룹별로 보인다.
- 메뉴를 띄운 채 스크롤해도 위치가 맞다.

### E2. 링크 편집 메뉴

- `tiptap-bubble-menus.tsx`에 `LinkBubbleMenu`를 추가한다.
  - **표시 조건**: `editor.isEditable && view.hasFocus() && selection.empty && editor.isActive("link")`
  - **내용**: 줄인 주소(도메인 + 경로 앞부분), `열기`(새 탭, http/https만), `수정`(기존 `LinkButton` 입력창 열기), `해제`(`extendMarkRange("link").unsetLink()`)
  - `해제`는 링크 범위를 선택해 풀기 때문에, 풀고 나서 커서를 원래 자리로 되돌린다(선택이 남으면 서식 메뉴가 뜬다).
- `TableBubbleMenu`의 표시 조건에 `!editor.isActive("link")`를 추가해 두 메뉴가 겹치지 않게 한다.
- 링크 입력창(`LinkButton`)이 닫힐 때 Radix가 포커스를 툴바 버튼으로 돌려놓아, 링크를 걸거나 고친 뒤 에디터 밖으로 빠지던 문제를 함께 고친다: `onCloseAutoFocus`에서 에디터로 포커스를 돌린다. 다른 입력칸을 눌러 닫은 경우는 그대로 둔다.

**완료 조건**: 링크 안에 커서를 두면 주소가 보이고 열기·수정·해제가 동작한다. 표 안 링크에서 메뉴가 하나만 뜬다. 링크를 걸거나 고치거나 Esc로 닫은 뒤 커서가 에디터에 있다.

### E3. 테두리 없는 작성 화면, 발행 창, 한 줄 소개 자동화

1. **작성 화면**
   - `TiptapEditorWrapper`에 `variant?: "boxed" | "document"`를 추가한다. 기본값은 `boxed`여서 나머지 5곳은 바뀌지 않는다.
   - `insight-edit-form.tsx`는 본문 박스의 테두리·최소 높이·둥근 모서리를 없애고 `document`를 쓴다.
   - 본문 첫 위치에서 Backspace를 누르면 제목 끝으로 포커스를 옮긴다(`onBackspaceAtStart` 콜백).
2. **발행 창** `components/insight/insight-publish-sheet.tsx`
   - 데스크톱(md 이상)은 `Dialog`, 모바일은 `Drawer`.
   - **흐름**: 상단 바 "발행하기" → 제목·본문 검사(기존 검증 재사용, 실패하면 해당 항목으로 이동) → 창 열림 → 창의 "발행하기"로 `createInsight`/`updateInsight` 호출.
   - **대표 이미지**: 본문의 `imageResize` src를 모아 썸네일로 나열하고 선택하게 한다. "직접 올리기"(기존 업로드)와 "없음"도 둔다.
   - **한 줄 소개**: 선택 입력. 비어 있으면 `extractPlainText`로 뽑은 문구를 placeholder로 미리 보여준다.
   - **카테고리·태그 자리**: E4에서 채운다.
   - 폼 하단의 "발행 정보" 섹션과 하단 버튼 두 개는 삭제한다.
3. **한 줄 소개 자동 추출**
   - `lib/tiptap-plain-text.ts`에 `extractPlainText(content, maxLength)`를 만든다. 블록 사이는 공백 하나로 잇는다.
   - `app/insight/[id]/page.tsx`에 두 번 중복된 `extractText`를 이것으로 바꾼다.
   - `createInsight`·`updateInsight`에서 summary가 비면 `extractPlainText(content, 120)`으로 채운다.
   - 폼 검증에서 summary 필수를 없앤다.
4. **문구**

   | 위치 | 현재 | 변경 |
   |---|---|---|
   | 상단 바 페이지 이름 | 인사이트 등록 / 인사이트 수정 | 글쓰기 / 글 수정 |
   | 상단 바 버튼 | 등록하기 / 수정하기 | 발행하기 / 수정하기 |
   | 에디터 안내 문구 | 인사이트 내용을 입력해주세요. | 오늘 어떤 일이 있었나요? 편하게 적어보세요. |
   | 토스트 | 인사이트가 등록되었습니다! | 글이 발행됐어요 |
5. **글자 수·읽는 시간**
   - `@tiptap/extensions`의 `CharacterCount`를 쓴다(신규 패키지 없음).
   - 래퍼에서 `onStatsChange`로 올려주고, `EditorWriteBar`에 선택 prop `stats`를 추가해 "1,234자 · 약 3분"(분당 500자 기준)을 보여준다.

**완료 조건**
- 작성 화면에 테두리 박스가 없다.
- 한 줄 소개 없이 발행되고, 목록 카드에 본문 앞부분이 보인다.
- 본문 이미지를 대표 이미지로 고를 수 있다.
- 쇼케이스 등 나머지 5곳의 에디터 모양이 그대로다.

### E4. 서버 임시저장, 카테고리·태그

**마이그레이션** `supabase/migrations/<timestamp>_insight_drafts_category_tags.sql`

```sql
create table public.insight_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  insight_id uuid references public.insights(id) on delete cascade, -- 발행된 글을 수정 중일 때
  title text not null default '',
  summary text,
  content jsonb,
  image_url text,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index insight_drafts_user_insight_key
  on public.insight_drafts (user_id, insight_id) where insight_id is not null;
create index insight_drafts_user_updated_idx on public.insight_drafts (user_id, updated_at desc);

alter table public.insight_drafts enable row level security;
create policy "owner select" on public.insight_drafts for select using (auth.uid() = user_id);
create policy "owner insert" on public.insight_drafts for insert with check (auth.uid() = user_id);
create policy "owner update" on public.insight_drafts for update using (auth.uid() = user_id);
create policy "owner delete" on public.insight_drafts for delete using (auth.uid() = user_id);

alter table public.insights
  add column category text check (category in ('story','launch','tech','growth','til')),
  add column tags text[] not null default '{}';
create index insights_tags_idx on public.insights using gin (tags);
create index insights_category_created_idx on public.insights (category, created_at desc);
```

- **카테고리 코드**: `story` 해프닝·회고 / `launch` 프로젝트 소개 / `tech` 기술 / `growth` 마케팅·그로스 / `til` TIL. 화면 이름과 코드는 `lib/insight-categories.ts` 한 곳에서 정의한다.
- `insights`를 읽는 8곳과 기존 트리거·보안 정책은 **수정하지 않는다.**
- 마이그레이션은 로컬 Supabase에서 먼저 적용해 검증한다.

**서버 액션** (`app/insight/draft-actions.ts`)

| 함수 | 동작 |
|---|---|
| `saveInsightDraft({ draftId?, insightId?, title, summary, content, imageUrl, category, tags })` | upsert하고 `{ draftId, updatedAt }`을 반환한다. 새 초안이면 사용자당 50개 제한을 확인한다 |
| `listInsightDrafts()` | 본인 초안 목록: id, title, 본문 앞 80자, updated_at |
| `getInsightDraft(id)` | 초안 하나를 불러온다 |
| `deleteInsightDraft(id)` | 초안을 삭제한다 |

- `createInsight`·`updateInsight`는 `draftId`를 선택 인자로 받고, 발행에 성공하면 해당 초안을 삭제한다. 삭제에 실패해도 발행은 성공으로 본다.
- 두 함수에 `category`, `tags` 저장을 추가한다. 서버에서도 검증한다: 카테고리 값, 태그 최대 5개·태그당 20자, trim·소문자화·중복 제거.

**작성 폼 연동**

- **저장 두 겹**
  - `useLocalDraft`(1초)는 그대로 둔다.
  - 새 훅 `useServerDraft`를 추가한다. 5초 디바운스로 저장하고, `visibilitychange`(hidden)와 `pagehide` 때 즉시 저장한다.
  - 첫 저장 뒤 `router.replace("/insight/write?draft=<id>")`로 주소를 바꾼다.
- **진입**
  - `/insight/write?draft=<id>`로 들어오면 서버 초안을 불러온다.
  - 수정 모드(`/insight/[id]/edit`)는 `insight_id`로 초안을 찾아 복원 배너로 안내한다.
- **충돌**
  - 서버와 브라우저 저장본의 `savedAt`/`updated_at`을 비교해 최근 것을 제안한다.
  - `DraftRestoreBanner`에 "다른 기기에서 저장됨" 같은 출처 표시를 추가한다.
- **상단 바**
  - `EditorWriteBar`의 저장 상태를 `저장 중…` / `저장됨 HH:mm` / `오프라인 · 이 기기에만 저장됨`의 3가지로 확장한다.
  - "임시저장" 버튼과 `임시저장 N` 목록 버튼을 둔다. 목록은 창으로 열고, 항목을 누르면 열고, 삭제할 수 있다.
- **발행 창**
  - 카테고리는 칩 5개 중 하나를 고르고, 다시 누르면 해제된다.
  - 태그 입력: Enter·쉼표로 추가, Backspace로 마지막 태그 삭제, 최대 5개.
- **상세 페이지**: 제목 위에 카테고리 라벨을, 본문 아래에 태그 칩을 보여준다. 태그 칩 링크는 B8에서 연결한다.

**완료 조건**
- 노트북에서 쓰던 글을 다른 브라우저에서 `임시저장` 목록으로 열어 이어 쓸 수 있다.
- 네트워크를 끊으면 "오프라인" 상태가 보이고, 다시 연결되면 저장된다.
- 발행하면 초안이 목록에서 사라진다.
- 다른 사용자의 초안은 조회되지 않는다(보안 정책 확인).
- 카테고리와 태그가 저장되고 상세에 표시된다.

### E5. 제목 앵커, 목차, 코드 복사

1. **제목 앵커**
   - `tiptap-server-extensions.ts`에 `getRenderedArticle(content): { html, toc }`를 추가한다.
     - 렌더링 전에 문서 JSON을 한 번 훑어 heading 노드에 `id`를 넣는다. `id`는 한글·영숫자를 유지하고 공백은 `-`, 중복이면 `-2`, `-3`을 붙인다.
     - `toc`는 `[{ level, text, id }]` 형태로 만든다.
   - 서버 heading 확장이 `id` 속성을 렌더링하도록 `ServerHeading`을 추가한다.
   - 기존 `getInitialHtmlFromTiptap`은 유지한다. 다른 게시판은 계속 이것을 쓴다.
   - CSS: `.prose h1~h3 { scroll-margin-top: <고정 헤더 높이> }`. 마우스를 올리면 `#` 링크가 보인다.
2. **목차** `components/insight/article-toc.tsx`
   - 헤딩이 3개 이상일 때만 렌더링한다.
   - xl 이상: 본문 오른쪽 `sticky` 목차. `IntersectionObserver`로 현재 섹션을 강조한다.
   - 그보다 좁은 화면: 본문 위 접힌 "목차".
   - 항목을 누르면 부드럽게 스크롤하고 주소 해시를 갱신한다.
3. **코드 복사**
   - `RichContent`의 효과(링크 카드 처리 옆)에서 각 `pre`에 `복사` 버튼과 언어 라벨(`language-xxx` 클래스)을 붙인다.
   - 효과가 다시 실행돼도 중복으로 붙지 않게 표시용 data 속성을 둔다.
   - 누르면 `navigator.clipboard.writeText(code.textContent)`로 복사하고 "복사됨"을 1.5초 보여준다.

**완료 조건**
- 헤딩에 id가 있고 `#id` 주소로 들어오면 해당 섹션으로 간다.
- 긴 글에서 목차가 보이고 현재 섹션이 강조된다.
- 코드 블록 복사가 동작한다.

### E6. 고급 편집

| # | 작업 | 구현 | 규모 |
|---|---|---|---|
| E6-1 | 문단 드래그 + "+" 버튼 | `@tiptap/extension-drag-handle-react`를 다른 `@tiptap/*`와 같은 버전으로 **고정**해 설치한다. 핸들 옆 "+"는 아래에 빈 문단을 만들고 `/`를 입력해 메뉴를 연다. `pointer: fine`에서만 보인다 | 1일 |
| E6-2 | 이미지 크기 버튼·교체 | `ImageBubbleMenu`에 작게(50%)·보통(75%)·꽉 차게(100%)를 추가해 `containerStyle` 너비를 바꾸고 가운데 정렬은 유지한다. `교체`는 파일 선택 → 업로드 → `src`만 바꿔 alt와 캡션을 유지한다 | 0.5일 |
| E6-3 | 이미지 나란히 놓기 | 새 노드 `imageGallery`: `attrs.images: { src, alt }[]`(2~3장), 뒤에 `imageCaption`을 둘 수 있다. 에디터는 격자 NodeView, `tiptap-server-extensions.ts`에는 서버 렌더링과 CSS를 둔다. 여러 장 업로드 후 알림에 "나란히 놓기" 버튼, `/갤러리` 명령 | 1.5일 |
| E6-4 | 표 메뉴 보강 | `TableBubbleMenu`에 드롭다운 하나를 두고 위에 행 추가(`addRowBefore`), 왼쪽에 열 추가(`addColumnBefore`), 머리글 행 켜기/끄기(`toggleHeaderRow`)를 넣는다 | 0.3일 |
| E6-5 | 마크다운 파일 불러오기 | 툴바 더보기 "마크다운 불러오기" → `.md` 선택 → front-matter를 떼고 `title:`이 있으면 `onTitleSuggest`로 제목에 넣는다(비어 있을 때만) → `pasteMarkdown`으로 커서 위치에 삽입한다. 상대 경로 이미지는 버리고 몇 장 빠졌는지 알린다. 외부 이미지를 모두 옮길지는 구현할 때 정한다 | 0.5일 |
| E6-6 | 미리보기 모바일 폭 | `EditorPreviewDialog`에 데스크톱/모바일(375px 프레임) 전환 | 0.2일 |

---

## 4. 게시판 (목록·상세)

### B1. 글쓰기 진입점

- `insight-feed.tsx`의 FAB(`+` 아이콘만 있음)를 라벨이 있는 알약 모양으로 바꾼다: `✏️ 글쓰기`. 모바일에서는 카드 지표를 가리지 않게 위치를 조정한다.
- 목록 상단에 인라인 작성 프롬프트를 둔다: 아바타 + *"오늘 만들면서 있었던 일, 편하게 적어보세요"* → 누르면 `/insight/write`. 비로그인이면 로그인으로 보낸다.

### B2. 목록 제목·빈 상태 문구

| 위치 | 현재 | 변경 |
|---|---|---|
| `app/insight/page.tsx` 제목 | Insights | 블로그 |
| `app/insight/page.tsx` 부제 | 1인개발자·솔로프리너들의 실전 노하우 아티클 | 만들면서 겪은 일, 배운 것, 삽질까지 |
| `insight-feed.tsx` 빈 상태 | 작성된 인사이트가 없습니다. | 아직 글이 없어요. 첫 글을 남겨보세요 |
| `insight-list.tsx` 프로필 빈 상태 | 작성된 인사이트가 없습니다. | 아직 쓴 글이 없어요 (본인 프로필이면 글쓰기 버튼) |

### B3. 텍스트 우선 목록

- `insight-feed.tsx`: 3열 그리드를 한 열 리스트로 바꾼다.
- `insight-card.tsx`
  - 왼쪽: 제목(`line-clamp-2`), 한 줄 소개 또는 본문 발췌(`line-clamp-2`), 작성자·날짜·지표.
  - 오른쪽: 작은 정사각형 썸네일.
- `insight-thumbnail.tsx`: 이미지가 없을 때 마스코트(`default_insight_thumbnail.png`)로 채우지 않고, **썸네일 영역 자체를 그리지 않는다.**
- summary가 빈 기존 글은 "소개 글이 없습니다." 대신 그 줄을 생략한다.

**완료 조건**: 모바일 한 화면에 글 4개 이상이 보이고, 이미지 없는 글에 빈 칸이나 마스코트가 없다.

### B4. 목록 지표 정리

- 목록 카드는 조회수와 좋아요만 보여준다. 값이 0이면 숫자를 숨긴다.
- 댓글과 북마크는 상세에서만 보여준다.

### B5. 상세 헤더 좌측 정렬

- `insight-detail-client.tsx`의 가운데 정렬 헤더(정사각형 300px 썸네일 + 가운데 제목·소개·작성자)를 바꾼다.
  - 좌측 정렬 제목, 그 아래 작성자 줄(아바타 20px + 이름 + 날짜 + 카테고리).
  - 대표 이미지는 상단 16:9 배너로, 없으면 생략한다.
- 헤더 전체 폭도 본문과 같은 768px 열로 맞춘다.

### B6. 작가 카드 + 다른 글 3개

- 댓글 섹션 위에 새 컴포넌트 `components/insight/author-card.tsx`를 둔다: 아바타, 이름, tagline, 프로필 링크, 같은 작가의 최근 글 3개(현재 글 제외).
- `insight-queries.ts`에 `getAuthorRecentInsights(userId, excludeId, limit = 3)`를 추가한다.

### B7. 정렬 토글

- `insight-data-actions.ts`의 `.order("created_at")` 고정을 풀어 `sort: "latest" | "popular"`를 받는다.
- 인기순 점수는 쇼케이스 트렌딩 RPC(`20260413000000_update_trending_rpc_scoring.sql`)의 방식을 참고해 조회·좋아요·최신성으로 정의한다. 필요하면 같은 방식의 RPC를 추가한다.
- 목록 상단에 최신순 / 인기순 토글을 둔다. 선택값은 URL 쿼리(`?sort=popular`)에 둔다.

### B8. 카테고리 필터, 태그 모아보기 (E4 이후)

- 목록 상단에 카테고리 칩(전체 + 5개)을 두고 `?category=tech`로 거른다.
- 태그 칩을 누르면 `?tag=<tag>`로 거른다(`tags @> array[tag]`, GIN 인덱스 사용).

### B9. "인사이트" 문구 리네이밍 (메타데이터 제외)

| 파일 | 내용 |
|---|---|
| `components/layout/header-navigation.tsx` | 데스크톱 메뉴 "인사이트" |
| `components/layout/mobile-menu.tsx` | 모바일 메뉴 "인사이트" |
| `components/search/category-tab.tsx` | 검색 탭 "인사이트" |
| `components/search/search-form.tsx` | "영감을 주는 인사이트 검색" |
| `components/user/profile-content-tabs.tsx` | 프로필 하위 탭 "인사이트" |
| `lib/queries/feed-queries.ts` | "…님이 인사이트를 등록했어요" |
| `components/feed/activity-card.tsx` | 삭제 안내 문구 |
| `app/guideline/page.tsx` | 가이드라인 본문 |
| 인사이트 관련 토스트 전반 | "인사이트가 등록/수정/삭제되었습니다" |

- `app/insight/layout.tsx`의 메타 제목·설명과 `/insight/` URL은 **바꾸지 않는다.** 2차 리네이밍 기준(작성자 20명 / 월 15건)에 도달하면 바꾼다.

---

## 5. 공통 규칙

- **새 노드는 두 곳에 등록한다.** 에디터 확장(`tiptap-extensions.ts`)과 서버 확장(`tiptap-server-extensions.ts`) 양쪽에 등록하지 않으면 독자 화면에서 내용이 사라진다. 같은 모양이어야 하는 스타일은 `globals.css`의 `.prose` 아래에 둔다.
- **공용 에디터를 바꾸면 6곳을 모두 확인한다.** 인사이트, 쇼케이스, 클럽 글, 클럽 수정, 모임, 프로필 소개. 블로그 전용 동작은 prop으로 켜고 기본값은 기존 동작으로 둔다.
- **Tiptap 패키지는 버전을 맞춘다.** 모든 `@tiptap/*`는 같은 버전(현재 `3.31.3`)을 정확히 고정하고(`^` 없이), 새 패키지도 같은 버전으로 추가한다. 올릴 때는 전부 한 번에 올리고, 실제 글 전체를 옛/새 버전으로 서버 렌더링해 결과 구조가 같은지 비교한다.
- **`@tiptap/html`은 서버에서 서버용 빌드로 불러야 한다.** Next는 자동으로 서버용(`import` + `node` 조건)을 고르지만, Node 스크립트에서 `require("@tiptap/html")`을 쓰면 브라우저 전용 빌드가 잡혀 오류가 난다. 스크립트에서는 `@tiptap/html/server`를 쓴다.
- **모바일 기준**: 입력 글자 16px 이상(iOS 확대 방지), 터치 영역 40px 이상, 메뉴의 버튼은 `onMouseDown` preventDefault로 에디터 선택을 유지한다.
- **한글 입력**: Enter 처리 코드는 `isComposing`을 확인한다.
- **검증**
  - 화면에 보이는 변경은 개발 서버에서 데스크톱(1024)·모바일(375) 양쪽으로 확인한다.
  - DB 변경은 로컬 Supabase에서 먼저 적용한다.
- **커밋**: 작업 ID 단위로 develop에 커밋하고, 이 문서 2장 표의 상태를 함께 갱신한다.

---

## 6. 보류

시리즈, 팔로우, 예약 발행, 공개 범위, 수식, 맞춤법 검사, 키보드 위 모바일 툴바, 마크다운 입력 모드. 이유는 [방향 문서 11장](blog-direction.md#11-범위-밖과-보류)을 본다.
