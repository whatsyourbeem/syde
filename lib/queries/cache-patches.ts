import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import type { FeedItem, FeedQueryResult } from "./feed-queries";
import type { OptimizedLog } from "./log-queries";
import type { OptimizedShowcase, ShowcaseQueryResult } from "./showcase-queries";
import type { BlogPostQueryResult } from "@/app/blog/blog-data-actions";
import type { BlogCardProps } from "@/components/blog/blog-card";
import { blogKeys, feedKeys, showcaseKeys } from "./query-keys";

/**
 * 좋아요·북마크·업보트처럼 항목 하나만 바뀌는 변경은 목록 전체를 다시 받지 않고
 * 쿼리 캐시의 해당 항목만 고친다. 반환된 롤백 함수는 고치기 전의 그 항목만 되돌리므로,
 * 그 사이 다른 항목에 생긴 변경은 건드리지 않는다.
 */
export type Rollback = () => void;

type InfinitePages<TPage> = InfiniteData<TPage> | undefined;

/**
 * mapMatching은 페이지 안에서 대상 항목에만 fn을 적용한 새 페이지를 돌려준다.
 */
function patchMatching<TPage, TItem>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  mapMatching: (page: TPage, fn: (item: TItem) => TItem) => TPage,
  patch: (item: TItem) => TItem,
): Rollback {
  // 진행 중인 재요청이 낙관적 값을 덮어쓰지 않도록 취소한다. 기다리면 화면 반영이 늦어져 기다리지 않는다.
  void queryClient.cancelQueries({ queryKey });

  const apply = (fn: (item: TItem) => TItem) =>
    queryClient.setQueriesData<InfinitePages<TPage>>({ queryKey }, (old) => {
      // 같은 접두사 아래에 무한 쿼리가 아닌 캐시(상세 등)가 있을 수 있어 모양을 확인한다.
      if (!old || !Array.isArray(old.pages)) return old;
      return { ...old, pages: old.pages.map((page) => mapMatching(page, fn)) };
    });

  let original: TItem | undefined;
  let patched: TItem | undefined;
  let found = false;
  apply((item) => {
    const next = patch(item);
    if (!found) {
      original = item;
      patched = next;
      found = true;
    }
    return next;
  });

  // 패치가 바꾼 필드만 되돌린다. 그 사이 같은 항목의 다른 필드(예: 좋아요 중 성공한 북마크)가
  // 바뀌었다면 그대로 둔다.
  return () => {
    if (found) apply((item) => revertChanges(item, original, patched));
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * current에서 original→patched로 바뀐 값만 original로 되돌린다.
 * 현재 값이 patched와 다르면 그 뒤에 다른 변경이 덮어쓴 것이므로 건드리지 않는다.
 */
function revertChanges<T>(current: T, original: unknown, patched: unknown): T {
  if (Object.is(current, patched)) return original as T;
  if (!isPlainObject(current) || !isPlainObject(original) || !isPlainObject(patched)) return current;

  let result = current as Record<string, unknown>;
  for (const key of new Set([...Object.keys(original), ...Object.keys(patched)])) {
    if (Object.is(original[key], patched[key])) continue;
    const reverted = revertChanges(result[key], original[key], patched[key]);
    if (!Object.is(reverted, result[key])) {
      if (result === current) result = { ...result };
      result[key] = reverted;
    }
  }
  return result as T;
}

/** 피드 캐시에서 id가 일치하는 로그 하나를 고친다. */
export function patchFeedLog(
  queryClient: QueryClient,
  logId: string,
  patch: (log: OptimizedLog) => OptimizedLog,
): Rollback {
  return patchMatching<FeedQueryResult, OptimizedLog>(
    queryClient,
    feedKeys.all,
    (page, fn) => ({
      ...page,
      items: page.items.map((item): FeedItem =>
        item.feed_type === "log" && item.data.id === logId ? { ...item, data: fn(item.data) } : item,
      ),
    }),
    patch,
  );
}

/** 쇼케이스 목록 캐시에서 id가 일치하는 항목 하나를 고친다. */
export function patchShowcase(
  queryClient: QueryClient,
  showcaseId: string,
  patch: (showcase: OptimizedShowcase) => OptimizedShowcase,
): Rollback {
  return patchMatching<ShowcaseQueryResult, OptimizedShowcase>(
    queryClient,
    showcaseKeys.lists(),
    (page, fn) => ({
      ...page,
      showcases: page.showcases.map((s) => (s.id === showcaseId ? fn(s) : s)),
    }),
    patch,
  );
}

/** 블로그 목록 캐시에서 id가 일치하는 글 하나를 고친다. */
export function patchBlogPost(
  queryClient: QueryClient,
  postId: string,
  patch: (post: BlogCardProps) => BlogCardProps,
): Rollback {
  return patchMatching<BlogPostQueryResult, BlogCardProps>(
    queryClient,
    blogKeys.all,
    (page, fn) => ({
      ...page,
      blogPosts: page.blogPosts.map((p) => (p.id === postId ? fn(p) : p)),
    }),
    patch,
  );
}
