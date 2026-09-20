-- B10 4단계: DB에 저장된 이미지 URL의 버킷 경로를 insight-images → blog-images로 교체한다.
--
-- 실행 순서 (반드시 이 순서):
--   1. scripts/migrate-blog-images.ts로 파일을 blog-images에 복사하고 검증 통과("✅")를 확인한다.
--   2. 이 SQL을 실행한다. 전체가 한 트랜잭션이고, 하나라도 어긋나면 예외로 전부 되돌아간다.
--   3. 맨 아래 "확인 쿼리"로 insight-images가 남아 있지 않은지 본다.
--
-- 이 파일은 마이그레이션이 아니다(supabase/migrations에 넣지 않는다). 데이터 교체이고 환경마다 한 번씩 손으로 실행한다.
-- 교체 대상은 호스트가 아니라 경로 조각이라서, 어떤 호스트를 가리키는 URL이든 경로만 바뀐다.
--
-- 이 SQL이 스스로 검증하는 것:
--   - 교체한 행 수가 교체 전에 센 대상 행 수와 같다 (image_url, content 각각)
--   - 교체 후 insight-images 경로가 남아 있지 않다
--   - blog_posts.updated_at이 하나도 바뀌지 않았다 (이 테이블에는 updated 트리거가 없고, 글의 수정 시각이 바뀌면 안 된다)

begin;

do $$
declare
  old_path constant text := '/storage/v1/object/public/insight-images/';
  new_path constant text := '/storage/v1/object/public/blog-images/';
  before_image   bigint;
  before_content bigint;
  digest_before  text;
  digest_after   text;
  updated_image   bigint;
  updated_content bigint;
  left_image   bigint;
  left_content bigint;
begin
  -- 교체 전 상태: 대상 행 수와 updated_at 지문
  select count(*) filter (where image_url like '%' || old_path || '%'),
         count(*) filter (where content   like '%' || old_path || '%'),
         md5(coalesce(string_agg(id::text || ':' || updated_at::text, ',' order by id), ''))
    into before_image, before_content, digest_before
    from public.blog_posts;
  raise notice '교체 전 대상 행: image_url % 건, content % 건', before_image, before_content;

  -- image_url은 URL 하나, content는 본문 JSON 문자열(text)이라 문자열 교체로 충분하다.
  update public.blog_posts
     set image_url = replace(image_url, old_path, new_path)
   where image_url like '%' || old_path || '%';
  get diagnostics updated_image = row_count;

  update public.blog_posts
     set content = replace(content, old_path, new_path)
   where content like '%' || old_path || '%';
  get diagnostics updated_content = row_count;

  -- 1단계 2번 조사에서 blog_posts 외의 칼럼이 나오면 여기에 같은 방식으로 추가한다.

  select count(*) filter (where image_url like '%' || old_path || '%'),
         count(*) filter (where content   like '%' || old_path || '%'),
         md5(coalesce(string_agg(id::text || ':' || updated_at::text, ',' order by id), ''))
    into left_image, left_content, digest_after
    from public.blog_posts;

  raise notice '교체한 행: image_url % 건, content % 건 / 남은 대상: image_url % 건, content % 건',
    updated_image, updated_content, left_image, left_content;

  if updated_image <> before_image or updated_content <> before_content then
    raise exception '교체한 행 수(%/%)가 교체 전 대상 행 수(%/%)와 다릅니다. 전체를 되돌립니다.',
      updated_image, updated_content, before_image, before_content;
  end if;
  if left_image <> 0 or left_content <> 0 then
    raise exception '교체 후에도 insight-images 경로가 남아 있습니다(image_url %, content %). 전체를 되돌립니다.',
      left_image, left_content;
  end if;
  if digest_after <> digest_before then
    raise exception 'blog_posts.updated_at이 바뀌었습니다. 전체를 되돌립니다.';
  end if;

  raise notice '✅ 검증 통과: 교체 %건(image_url), %건(content), updated_at 변경 없음', updated_image, updated_content;
end $$;

commit;

-- ---------------------------------------------------------------------------------------------------------------
-- 확인 쿼리 (읽기 전용). 결과가 한 줄도 없어야 한다.
--
--   do $$ declare r record; n bigint; begin
--     for r in select table_name, column_name from information_schema.columns
--              where table_schema='public' and data_type in ('text','character varying','jsonb','json','ARRAY') loop
--       execute format('select count(*) from public.%I where %I::text like %L', r.table_name, r.column_name, '%insight-images%') into n;
--       if n > 0 then raise notice '%.%: %', r.table_name, r.column_name, n; end if;
--     end loop; end $$;
