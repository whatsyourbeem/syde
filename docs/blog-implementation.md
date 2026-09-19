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

**에디터 사용처 6곳**: `blog/blog-edit-form.tsx`, `showcase/project-registration-form.tsx`, `club/club-post-form.tsx`, `club/club-edit-form.tsx`, `meetup/meetup-description-editor.tsx`(`meetup-edit-form.tsx`에서 사용), `user/bio-editor.tsx`

### 1-2. 블로그

| 파일 | 역할 |
|---|---|
| `app/blog/blog-actions.ts` | `createBlogPost`, `updateBlogPost`, 댓글, 좋아요·북마크, 조회수 |
| `app/blog/blog-data-actions.ts` | 목록 조회 |
| `lib/queries/blog-queries.ts` | 상세·관련 조회 |
| `app/blog/page.tsx`, `components/blog/blog-feed.tsx`, `blog-card.tsx`, `blog-thumbnail.tsx` | 목록 |
| `app/blog/[id]/page.tsx`, `components/blog/blog-detail-client.tsx`, `article-toc.tsx`, `author-card.tsx` | 상세 |
| `components/blog/blog-edit-form.tsx`, `blog-publish-sheet.tsx`, `app/blog/write`, `app/blog/[id]/edit` | 작성·수정 |

### 1-3. DB (`blog_posts`, B10 전에는 `insights`)

```
id UUID PK · user_id → profiles · title TEXT NOT NULL · content TEXT NOT NULL (Tiptap JSON 문자열)
image_url TEXT · summary TEXT (nullable) · slug TEXT UNIQUE · views INT · category TEXT · tags TEXT[] · created_at · updated_at
```

- 딸린 테이블: `blog_post_comments`, `blog_post_likes`, `blog_post_bookmarks`, `blog_post_comment_likes` (B10 전에는 `insight_*`)
- 이미지 버킷: `blog-images` (B10 전에는 `insight-images`)
- 트리거: INSERT 시 slug 생성, INSERT 시 활동 피드 생성(`BLOG_POST_CREATED`), DELETE 시 활동 정리
- 보안 정책(RLS): SELECT는 누구나, INSERT·UPDATE·DELETE는 본인만

---

## 2. 작업 목록

> 완료된 작업(✅)의 절에 나오는 `insight` 파일·테이블 이름은 작업 당시 기록이다. 현재 이름은 1장 코드 지도와 B10 대응표를 따른다.

| ID | 작업 | 범위 | 규모 | 마일스톤 | 상태 |
|---|---|---|---|---|---|
| E0 | 에디터 버그 수정 | 에디터 6곳 | 0.5일 | M1 필수 | ✅ 62b4084 |
| E1 | 빈 줄 `/` 안내, 슬래시 메뉴 확장 | 에디터 6곳 | 1일 | M1 권장 | ✅ b2cbed4 |
| E2 | 링크 편집 메뉴 | 에디터 6곳 | 0.5일 | M1 권장 | ✅ 68d1dd2 |
| E3 | 테두리 없는 작성 화면, 발행 창, 한 줄 소개 자동화 | 인사이트 | 1.5일 | M1 필수 | ✅ 258ba9b |
| B1 | 글쓰기 진입점 | 목록 | 0.5일 | M1 필수 | ✅ 36560fa |
| B2 | 목록 제목·빈 상태 문구 | 목록 | 0.2일 | M1 필수 | ✅ 36560fa |
| E4a | 카테고리·태그, 저장 상태 문구 | 인사이트 + DB | 1.2일 | M2 | ✅ 9764e13 |
| B3 | 텍스트 우선 목록 | 목록 | 1일 | M2 | ✅ c83f348 |
| B4 | 목록 지표 정리 | 목록 | 0.3일 | M2 | ✅ c83f348 |
| B5 | 상세 헤더 좌측 정렬 | 상세 | 0.5일 | M2 | ✅ c83f348 |
| E5 | 제목 앵커, 목차, 코드 복사 | 상세 | 1.5일 | M2 | ✅ c56bfbb, a75f6d0 |
| B6 | 작가 카드 + 다른 글 3개 | 상세 | 0.5일 | M2 | ✅ c56bfbb, a75f6d0 |
| E6 | 고급 편집 (드래그·이미지·표·마크다운 불러오기·미리보기) | 에디터 6곳 | 3~4일 | M3 | ⏳ |
| B7 | 정렬 토글 (최신순 / 인기순) | 목록 | 0.5일 | M3 | ⏳ |
| B8 | 카테고리 필터, 태그 모아보기 | 목록 | 0.5일 | M3 (E4a 후) | ⏳ |
| B9 | 블로그 리네이밍 (문구·URL·메타데이터) | 사이트 전체 | 0.8일 | M3 (가장 먼저) | ✅ 7b57862 (배포 후 확인 남음) |
| B10 | DB·스토리지 이름을 blog로 변경 | DB + 스토리지 + 코드 | 1~1.5일 | M3 (B9 다음) | ⏳ |
| E4b | 서버 임시저장 | 블로그 + DB | 1.5~2일 | 보류 | ⏸ |

- **M1 합계 약 4.2일** (필수 2.7일 + 권장 1.5일). 콜드 시딩 DM 발송 전에 끝낸다.
- **M2 약 5.0일**, **M3 약 5.8~7.3일**.
- **E4b는 보류**한다. 시작 조건은 [E4b](#e4b-서버-임시저장-보류)에 적는다.

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
   - **카테고리·태그 자리**: E4a에서 채운다.
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

### E4a. 카테고리·태그, 저장 상태 문구

**마이그레이션** `supabase/migrations/<timestamp>_insight_category_tags.sql`

```sql
alter table public.insights
  add column category text check (category in ('story','launch','tech','growth','til')),
  add column tags text[] not null default '{}';
create index insights_tags_idx on public.insights using gin (tags);
create index insights_category_created_idx on public.insights (category, created_at desc);
```

- **카테고리 코드**: `story` 해프닝·회고 / `launch` 프로젝트 소개 / `tech` 기술 / `growth` 마케팅·그로스 / `til` TIL. 화면 이름과 코드는 `lib/insight-categories.ts` 한 곳에서 정의한다.
- 두 열 모두 선택 값이다. 기존 글은 카테고리 없음, 태그 빈 배열로 남는다.
- `insights`를 읽는 8곳과 기존 트리거·보안 정책은 **수정하지 않는다.**
- 마이그레이션은 로컬 Supabase에서 먼저 적용해 검증한다.

**서버 액션**

- `createInsight`·`updateInsight`에 `category`, `tags` 저장을 추가한다.
- 서버에서도 검증한다: 카테고리 값, 태그 최대 5개·태그당 20자, trim·소문자화·중복 제거.

**작성 폼 연동**

- **발행 창**
  - 카테고리는 칩 5개 중 하나를 고르고, 다시 누르면 해제된다.
  - 태그 입력: Enter·쉼표로 추가, Backspace로 마지막 태그 삭제, 최대 5개.
  - 수정 모드에서는 저장된 카테고리·태그를 채워 연다.
- **로컬 임시저장**: `useLocalDraft`에 저장하는 폼 데이터에 카테고리·태그를 포함한다.
- **저장 상태 문구**: 로컬에만 저장된다는 것을 정직하게 알린다. `EditorWriteBar`는 인사이트·쇼케이스 두 곳이 함께 쓰므로 두 곳이 같이 바뀐다. 좁은 화면(sm 미만)은 자리가 없어 저장 시각만 보이고, "이 기기에" 안내는 접근성 라벨에만 넣는다.

  | 위치 | 현재 | 변경 |
  |---|---|---|
  | 저장 시각 | 임시저장됨 HH:mm | 이 기기에 저장됨 HH:mm |
  | 저장 전 안내 | 작성 내용은 자동 저장돼요 | 작성 내용은 이 기기에 자동 저장돼요 |

- **상세 페이지**: 제목 위에 카테고리 라벨을, 본문 아래에 태그 칩을 보여준다. 태그 칩 링크는 B8에서 연결한다.

**완료 조건**
- 카테고리와 태그가 저장되고 상세에 표시된다.
- 카테고리·태그 없이도 발행된다.
- 서버 검증: 태그 6개, 21자 태그, 없는 카테고리 값이 거부되거나 정리된다.
- 수정 창을 열면 저장된 카테고리·태그가 채워져 있다.
- 기존 글의 목록·상세·검색·사이트맵이 그대로 동작한다.

### E4b. 서버 임시저장 (보류)

로컬 임시저장(`useLocalDraft`)으로 시작하고, 서버 임시저장은 필요하다는 신호가 보일 때 만든다.

**보류 이유**
- Supabase 사용량은 부담이 작다. 비용은 복잡도에 있다: 새 테이블·보안 정책·서버 액션 4개, 로컬·서버 저장본 충돌 처리, 저장 상태 3가지, 임시저장 목록, 수정 모드 복원. 버그가 나면 글이 사라지는 영역이라 검증 부담도 크다.
- 로컬 저장만 쓸 때 빠지는 것은 다른 기기에서 이어 쓰기, 브라우저 데이터 삭제·시크릿 창에서의 보존, 새 글 초안 여러 개다. 한 번에 쓰는 회고 글, 데스크톱 작성이 대부분인 초기에는 영향이 작다.

**시작 조건** (하나라도 보이면 시작한다)
- "쓰던 글이 날아갔다"는 문의가 들어온다.
- 모바일 작성 비율이 의미 있게 늘어난다.
- 한 사람이 글을 동시에 여러 편 쓰는 패턴이 보인다.

**설계** (D3 결정 유지: 발행 글 테이블과 분리된 초안 테이블)

**마이그레이션** `supabase/migrations/<timestamp>_blog_post_drafts.sql`

```sql
create table public.blog_post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  blog_post_id uuid references public.blog_posts(id) on delete cascade, -- 발행된 글을 수정 중일 때
  title text not null default '',
  summary text,
  content jsonb,
  image_url text,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index blog_post_drafts_user_post_key
  on public.blog_post_drafts (user_id, blog_post_id) where blog_post_id is not null;
create index blog_post_drafts_user_updated_idx on public.blog_post_drafts (user_id, updated_at desc);

alter table public.blog_post_drafts enable row level security;
create policy "owner select" on public.blog_post_drafts for select using (auth.uid() = user_id);
create policy "owner insert" on public.blog_post_drafts for insert with check (auth.uid() = user_id);
create policy "owner update" on public.blog_post_drafts for update using (auth.uid() = user_id);
create policy "owner delete" on public.blog_post_drafts for delete using (auth.uid() = user_id);
```

**서버 액션** (`app/blog/draft-actions.ts`)

| 함수 | 동작 |
|---|---|
| `saveBlogPostDraft({ draftId?, blogPostId?, title, summary, content, imageUrl, category, tags })` | upsert하고 `{ draftId, updatedAt }`을 반환한다. 새 초안이면 사용자당 50개 제한을 확인한다 |
| `listBlogPostDrafts()` | 본인 초안 목록: id, title, 본문 앞 80자, updated_at |
| `getBlogPostDraft(id)` | 초안 하나를 불러온다 |
| `deleteBlogPostDraft(id)` | 초안을 삭제한다 |

- `createBlogPost`·`updateBlogPost`는 `draftId`를 선택 인자로 받고, 발행에 성공하면 해당 초안을 삭제한다. 삭제에 실패해도 발행은 성공으로 본다.

**작성 폼 연동**

- **저장 두 겹**
  - `useLocalDraft`(1초)는 그대로 둔다.
  - 새 훅 `useServerDraft`를 추가한다. 5초 디바운스로 저장하고, `visibilitychange`(hidden)와 `pagehide` 때 즉시 저장한다.
  - 첫 저장 뒤 `router.replace("/blog/write?draft=<id>")`로 주소를 바꾼다.
- **진입**
  - `/blog/write?draft=<id>`로 들어오면 서버 초안을 불러온다.
  - 수정 모드(`/blog/[id]/edit`)는 `blog_post_id`로 초안을 찾아 복원 배너로 안내한다.
- **충돌**
  - 서버와 브라우저 저장본의 `savedAt`/`updated_at`을 비교해 최근 것을 제안한다.
  - `DraftRestoreBanner`에 "다른 기기에서 저장됨" 같은 출처 표시를 추가한다.
- **상단 바**
  - `EditorWriteBar`의 저장 상태를 `저장 중…` / `저장됨 HH:mm` / `오프라인 · 이 기기에만 저장됨`의 3가지로 확장한다(E4a의 "이 기기에 저장됨" 문구를 대체).
  - "임시저장" 버튼과 `임시저장 N` 목록 버튼을 둔다. 목록은 창으로 열고, 항목을 누르면 열고, 삭제할 수 있다.

**완료 조건**
- 노트북에서 쓰던 글을 다른 브라우저에서 `임시저장` 목록으로 열어 이어 쓸 수 있다.
- 네트워크를 끊으면 "오프라인" 상태가 보이고, 다시 연결되면 저장된다.
- 발행하면 초안이 목록에서 사라진다.
- 다른 사용자의 초안은 조회되지 않는다(보안 정책 확인).

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
   - `pre`는 긴 줄을 가로로 스크롤하므로, 버튼과 라벨은 `pre` 안이 아니라 `pre`를 감싼 `.code-block` 요소에 붙인다. 그래야 옆으로 스크롤해도 버튼이 제자리에 있다.
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
- 한 줄 소개는 상세 헤더에서 보여주지 않는다. 비어 있으면 본문 앞부분으로 채워지므로, 헤더에 두면 본문 첫 문장과 겹친다. 한 줄 소개는 목록 카드와 공유 미리보기에서 쓴다.

### B6. 작가 카드 + 다른 글 3개

- 댓글 섹션 위에 새 컴포넌트 `components/insight/author-card.tsx`를 둔다: 아바타, 이름, tagline, 프로필 링크, 같은 작가의 최근 글 3개(현재 글 제외).
- `insight-queries.ts`에 `getAuthorRecentInsights(userId, excludeId, limit = 3)`를 추가한다. 조회에 실패하면 빈 목록을 돌려준다(곁가지 정보 때문에 글을 못 읽게 하지 않는다). 상세 페이지의 댓글·통계 조회와 함께 병렬로 실행한다.

**상세 하단 레이아웃** (B5·B6 이후 정리)
- 헤더, 본문, 태그, 반응 버튼, 작가 카드, 댓글이 모두 본문과 같은 768px 열에 선다.
- 영역 사이에 가로 구분선을 두지 않고 여백으로만 나눈다.
- 순서는 본문 → 태그 → 반응 버튼 → 작가 카드 → 댓글이다. 작가 카드와 다른 글은 다음 글로 이어지는 통로라서, 댓글이 길어져도 밀려나지 않게 댓글 위에 둔다.
- 댓글 제목은 "댓글 N"이다. 사이트 공통의 주황색 막대는 인사이트 상세에서만 쓰지 않는다(쇼케이스·프로필은 유지).

### B7. 정렬 토글

- `insight-data-actions.ts`의 `.order("created_at")` 고정을 풀어 `sort: "latest" | "popular"`를 받는다.
- 인기순 점수는 쇼케이스 트렌딩 RPC(`20260413000000_update_trending_rpc_scoring.sql`)의 방식을 참고해 조회·좋아요·최신성으로 정의한다. 필요하면 같은 방식의 RPC를 추가한다.
- 목록 상단에 최신순 / 인기순 토글을 둔다. 선택값은 URL 쿼리(`?sort=popular`)에 둔다.

### B8. 카테고리 필터, 태그 모아보기 (E4a 이후)

- 목록 상단에 카테고리 칩(전체 + 5개)을 두고 `?category=tech`로 거른다.
- 태그 칩을 누르면 `?tag=<tag>`로 거른다(`tags @> array[tag]`, GIN 인덱스 사용).

### B9. 블로그 리네이밍 (문구·URL·메타데이터)

사용자에게 보이는 이름을 "인사이트"에서 "블로그"로 한 번에 바꾼다. 메뉴 이름, 주소, 검색 제목이 서로 어긋나지 않게 하고, 링크가 퍼지기 전(콜드 시딩 전)에 끝낸다.

**URL**
- `app/insight/` 폴더를 `app/blog/`로 옮긴다. 목록 `/blog`, 상세 `/blog/<slug>`, 글쓰기 `/blog/write`, 수정 `/blog/<id>/edit`.
- `next.config.ts`의 `redirects()`에 영구 리다이렉트를 추가한다(`/log` → `/feed`와 같은 방식).
  - `/insight` → `/blog`
  - `/insight/:path*` → `/blog/:path*`
- 경로를 참조하는 곳을 모두 바꾼다: 링크, `router.push`·`redirect`, `revalidatePath`, `app/sitemap.ts`, canonical, 공유 URL, 피드·검색·프로필의 글 링크. `rg "/insight"`로 남은 곳이 없는지 확인한다.
- 본문 안에 이미 들어간 `/insight/...` 링크는 리다이렉트로 계속 열리므로 DB를 고치지 않는다.

**바꾸지 않는 내부 이름**
- ~~DB 테이블, 스토리지 경로, 파일명 등 내부 이름은 그대로 둔다.~~ → 블로그가 공개 전이고 글이 모두 운영자 글이라 지금 바꾸기로 했다. 코드 이름은 177cc14에서 바꿨고, DB·스토리지는 **B10**에서 바꾼다.

**메타데이터**
- 목록(`app/blog/layout.tsx`): 제목은 "사이드프로젝트 블로그 | SYDE"로 바꾼다. 설명에는 "기획·개발·수익화 인사이트" 같은 표현을 남겨 기존 검색 키워드를 유지한다. canonical은 `/blog`.
- 상세: 제목 접미사 "- SYDE 인사이트"를 "- SYDE 블로그"로 바꾸고, canonical과 OG URL을 `/blog/<slug>`로 바꾼다.

**검색 탭**
- `/search?tab=blog`를 새 값으로 쓴다. 기존 `?tab=insights`도 계속 받아 같은 결과를 보여준다.

**화면 문구**

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

- `rg "인사이트"`로 사용자에게 보이는 문구가 남았는지 확인한다. 주석과 내부 식별자는 그대로 둬도 된다.

**배포 후**
- Search Console에 새 사이트맵을 제출한다. 도메인이 같으므로 주소 변경 도구는 쓰지 않는다.
- 운영 환경에서 `/insight/<기존 slug>`가 `/blog/<slug>`로 한 번에 넘어가는지 확인한다.

**완료 조건**
- `/insight`, `/insight/<slug>`, `/insight/<uuid>`, `/insight/write`가 모두 `/blog/...`로 영구 리다이렉트된다.
- 사이트맵, canonical, OG URL이 `/blog/...`이다.
- 화면에 "인사이트"라는 이름이 보이지 않는다(검색 설명의 키워드 표현은 예외).
- `?tab=insights`와 `?tab=blog` 모두 블로그 검색 결과를 보여준다.
- 글쓰기, 수정, 삭제, 좋아요, 댓글이 새 주소에서 동작한다.

---|---|
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


### B10. DB·스토리지 이름을 blog로 변경

B9에서 화면·URL, 이어서 코드의 파일·컴포넌트 이름을 blog로 바꿨다. DB와 스토리지에는 아직 `insight` 이름이 남아 있다. 블로그가 공개 전이고 글이 모두 운영자 글인 지금 바꾼다. 다른 사람의 글과 이미지가 쌓이면 비용이 커지기 때문이다.

> **원칙**
> - 하나라도 빠지면 운영 장애가 난다. 아래 목록을 체크리스트로 쓰고, 단계마다 "확인" 쿼리로 빠진 것이 없는지 검증한다.
> - 데이터는 옮기지 않고 `RENAME`한다. 행·인덱스·외래키·보안 정책은 이름만 바뀌고 그대로 따라온다.
> - 함수 본문 안의 테이블 이름은 `RENAME`으로 바뀌지 않는다. 함수는 반드시 새로 쓴다.
> - 이미 적용된 마이그레이션 파일은 고치지 않는다. 항상 새 마이그레이션 파일을 추가한다.
> - 로컬에서 전 과정을 먼저 끝까지 해 보고, 같은 순서로 운영에 적용한다.

#### 0. 이름 대응표

| 종류 | 지금 | 변경 |
|---|---|---|
| 테이블 | `insights` | `blog_posts` |
| 테이블 | `insight_comments` | `blog_post_comments` |
| 테이블 | `insight_likes` | `blog_post_likes` |
| 테이블 | `insight_bookmarks` | `blog_post_bookmarks` |
| 테이블 | `insight_comment_likes` | `blog_post_comment_likes` |
| 컬럼 | `insight_comments.insight_id`, `insight_likes.insight_id`, `insight_bookmarks.insight_id` | `blog_post_id` (3곳) |
| 제약 | `insights_pkey`, `insights_user_id_fkey`, `insights_slug_key`, `insights_category_check` | `blog_posts_pkey`, `blog_posts_user_id_fkey`, `blog_posts_slug_key`, `blog_posts_category_check` |
| 제약 | `insight_comments_pkey`, `insight_comments_insight_id_fkey`, `insight_comments_user_id_fkey`, `insight_comments_parent_comment_id_fkey` | `blog_post_comments_pkey`, `blog_post_comments_blog_post_id_fkey`, `blog_post_comments_user_id_fkey`, `blog_post_comments_parent_comment_id_fkey` |
| 제약 | `insight_likes_insight_id_fkey`, `insight_likes_user_id_fkey`, `insight_likes_insight_id_user_id_key` | `blog_post_likes_blog_post_id_fkey`, `blog_post_likes_user_id_fkey`, `blog_post_likes_blog_post_id_user_id_key` |
| 제약 | `insight_bookmarks_pkey`, `insight_bookmarks_insight_id_fkey`, `insight_bookmarks_user_id_fkey` | `blog_post_bookmarks_pkey`, `blog_post_bookmarks_blog_post_id_fkey`, `blog_post_bookmarks_user_id_fkey` |
| 제약 | `insight_comment_likes_pkey`, `insight_comment_likes_comment_id_user_id_key`, `insight_comment_likes_comment_id_fkey`, `insight_comment_likes_user_id_fkey` | `blog_post_comment_likes_pkey`, `blog_post_comment_likes_comment_id_user_id_key`, `blog_post_comment_likes_comment_id_fkey`, `blog_post_comment_likes_user_id_fkey` |
| 인덱스(제약 아님) | `insights_tags_idx`, `insights_category_created_idx` | `blog_posts_tags_idx`, `blog_posts_category_created_idx` |
| 보안 정책 | `insights`: "anyone can view insights", "users can insert their own insights", "users can update their own insights", "users can delete their own insights" | "anyone can view blog posts", "users can insert their own blog posts", "users can update their own blog posts", "users can delete their own blog posts" |
| 보안 정책 | "anyone can view insight comments", "anyone can view insight likes", "anyone can view insight comment likes" | "anyone can view blog post comments", "anyone can view blog post likes", "anyone can view blog post comment likes" |
| 보안 정책 | 이름에 insight가 없는 정책(댓글·좋아요·북마크의 insert/update/delete 등) | 이름은 그대로. 테이블과 함께 따라온다 |
| 함수 | `generate_insight_slug(title_text)` | `generate_blog_post_slug(title_text)` |
| 함수 | `trig_handle_insight_slug()` (본문에 `public.insights`) | `trig_handle_blog_post_slug()` (본문을 `public.blog_posts`로) |
| 함수 | `create_activity_on_insight_created()` (값 `'INSIGHT_CREATED'`) | `create_activity_on_blog_post_created()` (값 `'BLOG_POST_CREATED'`) |
| 함수(RPC) | `increment_insight_views(insight_id uuid)` (본문에 `public.insights`, SECURITY DEFINER) | `increment_blog_post_views(p_blog_post_id uuid)` (쇼케이스의 `p_showcase_id`와 같은 형식) |
| 트리거 | `insights.handle_insight_slug_on_insert` | `blog_posts.handle_blog_post_slug_on_insert` |
| 트리거 | `insights.trigger_activity_insight_created` | `blog_posts.trigger_activity_blog_post_created` |
| 트리거 | `insights.trigger_delete_activity_on_insight_deleted` (공용 함수 `delete_activity_on_target_deleted` 사용) | `blog_posts.trigger_delete_activity_on_blog_post_deleted` (함수는 그대로) |
| 트리거 | `insight_comments.set_insight_comments_updated_at` (공용 함수 `handle_updated_at` 사용) | `blog_post_comments.set_blog_post_comments_updated_at` (함수는 그대로) |
| 데이터 값 | `activity_feed.activity_type = 'INSIGHT_CREATED'` | `'BLOG_POST_CREATED'` |
| 스토리지 버킷 | `insight-images` (public) | `blog-images` (public). 버킷 이름은 바꿀 수 없어 새로 만들고 파일을 복사한다 |
| 스토리지 정책 | `storage.objects`: "Public Access"(SELECT), "Auth Upload Insight Images"(INSERT), "Auth Delete Insight Images"(DELETE). 모두 `bucket_id = 'insight-images'` 조건 | 같은 조건을 `'blog-images'`로 바꾼 "Public Read Blog Images", "Auth Upload Blog Images", "Auth Delete Blog Images" |
| 저장된 URL | `blog_posts.image_url`, `blog_posts.content`(본문 JSON 문자열) 안의 `/storage/v1/object/public/insight-images/` | `/storage/v1/object/public/blog-images/` |

로컬 조사 결과 뷰, 머티리얼라이즈드 뷰, 시퀀스, enum, 크론 작업, Realtime 발행, 알림(`notifications`) 칼럼, 다른 저장소(`syde-studio`, `syde-studio-prototypes`)에는 insight 참조가 없다. **운영 DB도 1단계에서 같은 조사를 해서 이 표와 다른 것이 있으면 표에 추가한 뒤 진행한다.**

#### 1. 사전 조사와 백업 (운영, 읽기만)

1. 아래 조사 쿼리를 로컬과 운영에서 각각 실행해 결과를 비교한다. 운영에만 있는 객체가 있으면 0번 표와 마이그레이션에 추가한다.

   ```sql
   -- 테이블·컬럼
   select table_name, column_name from information_schema.columns
    where table_schema='public' and (table_name ilike '%insight%' or column_name ilike '%insight%');
   -- 제약
   select conrelid::regclass, conname, pg_get_constraintdef(oid) from pg_constraint
    where conrelid::regclass::text ilike '%insight%' or conname ilike '%insight%' or confrelid::regclass::text ilike '%insight%';
   -- 인덱스
   select tablename, indexname from pg_indexes
    where schemaname='public' and (tablename ilike '%insight%' or indexname ilike '%insight%');
   -- 보안 정책 (public, storage)
   select schemaname, tablename, policyname, cmd, qual, with_check from pg_policies
    where tablename ilike '%insight%' or policyname ilike '%insight%' or qual ilike '%insight%' or with_check ilike '%insight%';
   -- 함수 (이름 또는 본문에 insight)
   select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef from pg_proc p
     join pg_namespace n on n.oid=p.pronamespace
    where n.nspname not in ('pg_catalog','information_schema') and (p.proname ilike '%insight%' or p.prosrc ilike '%insight%');
   -- 트리거
   select event_object_table, trigger_name, action_statement from information_schema.triggers
    where event_object_table ilike '%insight%' or trigger_name ilike '%insight%' or action_statement ilike '%insight%';
   -- 뷰·머티리얼라이즈드 뷰·enum·크론·발행
   select table_name from information_schema.views where view_definition ilike '%insight%';
   select matviewname from pg_matviews where definition ilike '%insight%';
   select t.typname, e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where e.enumlabel ilike '%insight%';
   select jobname from cron.job where command ilike '%insight%';          -- cron 확장이 없으면 생략
   select pubname, tablename from pg_publication_tables where tablename ilike '%insight%';
   -- 함수 권한 (다시 만들 때 똑같이 부여)
   select grantee, privilege_type from information_schema.routine_privileges where routine_name = 'increment_insight_views';
   -- 데이터 값
   select activity_type, count(*) from activity_feed group by 1;
   -- 스토리지
   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'insight-images';
   select count(*), sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'insight-images';
   ```

2. 저장된 URL이 어디에 있는지 찾는다. 0번 표에 없는 칼럼에서 나오면 4단계 URL 교체 대상에 추가한다.

   ```sql
   do $$ declare r record; n bigint; begin
     for r in select table_name, column_name from information_schema.columns
              where table_schema='public' and data_type in ('text','character varying','jsonb','json','ARRAY') loop
       execute format('select count(*) from public.%I where %I::text like %L', r.table_name, r.column_name, '%insight-images%') into n;
       if n > 0 then raise notice '%.%: %', r.table_name, r.column_name, n; end if;
     end loop; end $$;
   ```

3. 백업한다.
   - 대시보드에서 최근 자동 백업이 있는지 확인한다.
   - 5개 테이블과 `activity_feed`를 데이터 덤프로 받아 둔다(`supabase db dump --linked --data-only` 등).
   - `insight-images` 버킷의 파일 목록(경로, 크기)을 파일로 저장해 둔다.

4. 되돌리기 SQL을 미리 써 둔다(2단계 마이그레이션 A의 반대 순서 RENAME). 저장소에 마이그레이션으로 넣지 말고 따로 보관한다.

#### 2. 마이그레이션 A: 이름 변경 + 호환 계층 (배포 직전 적용)

파일: `supabase/migrations/<timestamp>_rename_insights_to_blog_posts.sql`. 전체를 한 트랜잭션으로 실행한다.

1. **테이블**: `alter table public.insights rename to blog_posts;` 등 5개.
2. **컬럼**: `alter table public.blog_post_comments rename column insight_id to blog_post_id;` 등 3개.
3. **제약**: `alter table ... rename constraint ... to ...;` 0번 표의 제약 전부. 기본키·유니크 제약은 이름을 바꾸면 그 인덱스 이름도 같이 바뀐다.
4. **인덱스(제약 아님)**: `alter index public.insights_tags_idx rename to blog_posts_tags_idx;`, `insights_category_created_idx`도 같은 방식.
5. **보안 정책**: 이름에 insight가 있는 7개를 `alter policy "..." on public.<새 테이블> rename to "...";`로 바꾼다.
6. **함수**
   - `generate_insight_slug`: `alter function public.generate_insight_slug(text) rename to generate_blog_post_slug;`
   - `trig_handle_insight_slug`: 새 이름 `trig_handle_blog_post_slug()`로 `create`하고 본문의 `public.insights` → `public.blog_posts`, `generate_insight_slug` → `generate_blog_post_slug`로 바꾼다. 트리거를 새 함수로 다시 연결한 뒤 옛 함수를 `drop`한다.
   - `create_activity_on_insight_created`: 새 이름 `create_activity_on_blog_post_created()`로 만든다. **이 단계에서는 값 `'INSIGHT_CREATED'`를 그대로 쓴다**(옛 코드가 배포돼 있는 동안 피드가 깨지지 않게). SECURITY DEFINER 유지. 트리거를 새 함수로 다시 연결한 뒤 옛 함수를 `drop`한다.
   - `increment_insight_views`: 매개변수 이름은 `create or replace`로 바꿀 수 없다. 새 함수 `increment_blog_post_views(p_blog_post_id uuid)`를 SECURITY DEFINER, `set search_path = public`으로 만들고 본문은 `update public.blog_posts set views = views + 1 where id = p_blog_post_id;`. 1단계에서 확인한 권한을 똑같이 부여한다(`grant execute ... to anon, authenticated, service_role;`). **옛 함수 `increment_insight_views(insight_id uuid)`는 지우지 말고** 본문을 `perform public.increment_blog_post_views(insight_id);`로 바꿔 둔다(옛 코드 호환, 마이그레이션 B에서 삭제).
7. **트리거**: `alter trigger handle_insight_slug_on_insert on public.blog_posts rename to handle_blog_post_slug_on_insert;` 등 4개. 6번에서 함수를 바꾼 트리거는 `drop trigger` 후 새 이름으로 `create trigger`해도 된다. 발생 시점(BEFORE/AFTER, INSERT/UPDATE/DELETE, FOR EACH ROW)은 1단계 조사 결과와 똑같이 둔다.
8. **호환 뷰**: 배포가 끝나기 전까지 옛 코드가 옛 이름으로 읽고 쓰므로, 옛 이름의 뷰를 둔다.

   ```sql
   create view public.insights with (security_invoker = true) as select * from public.blog_posts;
   create view public.insight_comments with (security_invoker = true) as
     select id, blog_post_id as insight_id, user_id, content, created_at, updated_at, parent_comment_id from public.blog_post_comments;
   create view public.insight_likes with (security_invoker = true) as
     select id, blog_post_id as insight_id, user_id, created_at from public.blog_post_likes;
   create view public.insight_bookmarks with (security_invoker = true) as
     select blog_post_id as insight_id, user_id, created_at from public.blog_post_bookmarks;
   create view public.insight_comment_likes with (security_invoker = true) as select * from public.blog_post_comment_likes;
   grant select, insert, update, delete on public.insights, public.insight_comments, public.insight_likes,
     public.insight_bookmarks, public.insight_comment_likes to anon, authenticated, service_role;
   ```

   - 칼럼 목록은 1단계 조사 결과와 똑같이 맞춘다.
   - `security_invoker = true`여서 원래 테이블의 보안 정책이 그대로 적용된다.
   - 옛 코드의 관계 조회(`insights`에서 `insight_comments (id)` 등)가 뷰에서 동작하는지 로컬에서 옛 코드로 확인한다. 안 되면 배포 공백을 줄이는 방식(아래 5단계 순서를 바로 붙여서 실행)으로 대체한다.
9. **스토리지**: `blog-images` 버킷을 만든다(`public = true`, 1단계에서 확인한 `file_size_limit`, `allowed_mime_types`과 같게). `storage.objects`에 0번 표의 새 정책 3개를 만든다. **옛 버킷과 옛 정책은 그대로 둔다.**
10. 마지막에 `notify pgrst, 'reload schema';`

**확인 (로컬)**: 1단계 조사 쿼리를 다시 실행해 결과가 호환 뷰, 옛 호환 함수 `increment_insight_views`, 옛 버킷·정책뿐인지 확인한다.

#### 3. 코드 변경 (마이그레이션 A와 같은 배포)

1. 타입을 다시 생성한다: `supabase gen types typescript --local > types/database.types.ts`. 새 타입에 `blog_posts` 등과 호환 뷰가 함께 나오는데, 코드는 새 이름만 쓴다.
2. DB 이름을 쓰는 코드를 모두 바꾼다.
   - `.from("insights")` 등 테이블 5개, `.eq("insight_id", ...)`·`select("insight_id")` 등 칼럼, 관계 조회 문자열(`insight_comments (id)`, `insight_likes (id, user_id)`, `insight_bookmarks (insight_id, user_id)`)과 그 결과 필드(`item.insight_likes` 등).
   - RPC: `supabase.rpc("increment_insight_views", { insight_id })` → `supabase.rpc("increment_blog_post_views", { p_blog_post_id })`.
   - 버킷: `uploadImage(file, "insight-images", ...)`와 `extractStoragePath(url, "insight-images")` 등 → `"blog-images"`.
   - `lib/server-utils.ts`의 `generateUniqueSlug` 테이블 타입 `"showcases" | "insights"` → `"showcases" | "blog_posts"`.
   - 피드: `lib/queries/feed-queries.ts`는 **이 배포에서는 `'INSIGHT_CREATED'`와 `'BLOG_POST_CREATED'`를 둘 다** 블로그 글로 처리한다(마이그레이션 B에서 값을 바꾸므로).
3. 코드 안의 insight 이름도 이번에 정리한다(DB와 무관하지만 남으면 헷갈린다).
   - 변수·필드: `insight`, `insights`, `insightId`, `details.insight`, 프로필 탭 값 `"insight"`, `InteractionActions`의 `type: "insight"` 등.
   - 캐시 태그: `insight-all`, `insight-${id}`, `insight-slug-${slug}` → `blog-post-all` 등. 캐시를 만드는 곳과 `revalidateTagSafe`로 지우는 곳을 **함께** 바꾼다.
   - React Query 키 `["insights"]` → `["blog-posts"]`. `invalidateQueries`로 지우는 곳도 함께 바꾼다.
   - 로컬 임시저장 키 `syde:insight-draft:*` → `syde:blog-draft:*`. 블로그가 공개 전이라 기존 브라우저 초안이 사라져도 된다.
   - 문자열 `"SYDE insight article"`(JSON-LD 기본 설명) 등.
4. 저장소의 다른 파일
   - `supabase/seed.sql`: 테이블·칼럼 이름, `'INSIGHT_CREATED'` 값, 이미지 URL의 버킷 경로를 새 이름으로 바꾼다. 안 바꾸면 로컬 `supabase db reset`이 실패한다.
   - `scripts/migrate-images.ts`: `BUCKET_CONFIG`의 `'insight-images'`와 `table: 'insights'`.
   - 문서: 이 명세의 1-2·1-3 코드 지도, E4b의 초안 테이블 이름(`blog_post_drafts`, 칼럼 `blog_post_id`).
5. **확인**: `rg -n -i "insight" --glob '!node_modules' --glob '!.next' --glob '!supabase/migrations/**' --glob '!docs/**'` 결과가 아래 허용 목록뿐이어야 한다.
   - `next.config.ts`의 `/insight` 리다이렉트
   - `lib/search-tab.ts`의 옛 검색 탭 값 `insights`
   - `feed-queries.ts`의 `'INSIGHT_CREATED'` 호환 처리(마이그레이션 B 후 삭제)
   - `types/database.types.ts`의 호환 뷰·옛 함수 타입(마이그레이션 B 후 재생성하면 사라짐)

#### 4. 이미지 이전과 URL 교체 (배포 직후)

옛 코드가 배포돼 있는 동안 `insight-images`에 새 파일이 올라올 수 있으므로, 새 코드 배포가 끝난 **뒤에** 복사한다.

1. 스크립트 `scripts/migrate-blog-images.ts`(서비스 역할 키 사용, `--dry-run` 지원)를 만든다.
   - `insight-images`의 모든 파일을 **같은 경로 그대로** `blog-images`에 복사한다. `storage.from('insight-images').copy(path, path, { destinationBucket: 'blog-images' })`를 쓰고, 지원하지 않으면 내려받아 같은 `contentType`, `cacheControl`로 올린다.
   - 이미 복사된 파일은 건너뛴다(다시 실행해도 안전하게).
   - 끝나면 두 버킷의 파일 수와 전체 크기가 같은지 출력한다. 다르면 URL 교체를 하지 않는다.
2. URL을 교체한다(한 트랜잭션).

   ```sql
   begin;
   update public.blog_posts
      set image_url = replace(image_url, '/storage/v1/object/public/insight-images/', '/storage/v1/object/public/blog-images/')
    where image_url like '%/storage/v1/object/public/insight-images/%';
   update public.blog_posts
      set content = replace(content, '/storage/v1/object/public/insight-images/', '/storage/v1/object/public/blog-images/')
    where content like '%/storage/v1/object/public/insight-images/%';
   -- 1단계 2번에서 찾은 다른 칼럼도 같은 방식으로
   commit;
   ```

   - `content`는 JSON 문자열(text)이라 문자열 교체로 충분하다. 교체 전에 대상 행 수를 세어 두고 교체 후 같은지 본다.
   - `updated_at` 트리거가 없는 테이블이라 글의 수정 시각은 바뀌지 않는다(바뀌면 안 된다).
3. **확인**
   - 1단계 2번 쿼리를 다시 실행해 `insight-images`가 한 건도 없어야 한다.
   - 대표 이미지와 본문 이미지가 있는 글 몇 개를 열어 이미지가 모두 보이는지, 개발자 도구 네트워크 탭에 404가 없는지 본다.
   - 새 글을 올려 이미지가 `blog-images`에 저장되는지 본다.
   - 캐시된 상세 페이지가 옛 URL을 들고 있을 수 있으니 `blog-post-all` 태그를 한 번 무효화한다(또는 재배포).

#### 5. 마이그레이션 B: 호환 계층 제거와 값 변경 (배포·이미지 이전 확인 후)

파일: `supabase/migrations/<timestamp>_drop_insight_compat.sql`

1. `update public.activity_feed set activity_type = 'BLOG_POST_CREATED' where activity_type = 'INSIGHT_CREATED';`
2. `create_activity_on_blog_post_created()` 본문의 값을 `'BLOG_POST_CREATED'`로 바꾼다(`create or replace`).
3. 호환 뷰 5개를 `drop view`한다.
4. 옛 함수 `increment_insight_views(uuid)`를 `drop function`한다.
5. `notify pgrst, 'reload schema';`
6. 이어서 코드에서 `'INSIGHT_CREATED'` 호환 처리를 지우고 타입을 다시 생성해 배포한다.

**확인**: 1단계 조사 쿼리의 결과가 옛 버킷 `insight-images`와 그 정책 3개뿐이어야 한다. 피드에 블로그 글 활동이 그대로 보이는지 본다.

#### 6. 옛 버킷 정리 (나중에, 운영자가 직접)

- 1~2주 동안 이미지 404가 없으면 운영자가 대시보드에서 `insight-images` 버킷을 비우고 삭제한다.
- 그 뒤 마이그레이션 C로 옛 스토리지 정책 3개("Public Access", "Auth Upload Insight Images", "Auth Delete Insight Images")를 `drop policy`한다. **"Public Access"는 `insight-images` 조건만 가진 정책인지 다시 확인하고 지운다.**
- `next.config.ts`의 `/insight` 리다이렉트와 `lib/search-tab.ts`의 `insights` 호환은 지우지 않는다(외부 링크 보호).

#### 운영 적용 순서 요약

1. 운영 조사·백업·되돌리기 SQL 준비 (1단계)
2. 조용한 시간에 마이그레이션 A 적용 → 바로 새 코드 배포 (2~3단계)
3. 배포 확인 후 이미지 복사와 URL 교체 (4단계)
4. 확인 후 마이그레이션 B 적용 → 호환 처리 제거 코드 배포 (5단계)
5. 1~2주 뒤 옛 버킷 삭제와 마이그레이션 C (6단계)

**완료 조건**
- 조사 쿼리 결과에 옛 버킷과 그 정책 외에는 insight 이름이 없다(6단계 후에는 하나도 없다).
- 코드 검색 결과가 허용 목록뿐이다.
- 블로그 목록·상세·글쓰기(이미지 포함)·수정·삭제·좋아요·북마크·댓글·댓글 좋아요·조회수 증가, 피드의 블로그 활동, 검색, 프로필 블로그 탭, 사이트맵이 모두 동작한다.
- 모든 글의 대표·본문 이미지가 `blog-images` 주소로 보이고 404가 없다.
- `supabase db reset`(로컬)이 성공한다.
- 타입 검사와 빌드가 통과한다.

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
