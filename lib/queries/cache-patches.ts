import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import type { FeedItem, FeedQueryResult } from "./feed-queries";
import type { OptimizedLog } from "./log-queries";
import type { OptimizedShowcase, ShowcaseQueryResult } from "./showcase-queries";
import type { BlogPostQueryResult } from "@/app/blog/blog-data-actions";
import type { BlogCardProps } from "@/components/blog/blog-card";
import { blogKeys, feedKeys, showcaseKeys } from "./query-keys";

/**
 * 좋아요·북마크·업보트처럼 항목 하나만 바뀌는 변경은 목록 전체를 다시 받지 않고
 * 쿼리 캐시의 해당 항목만 고친다. 요청이 실패하면 반환된 스냅샷으로 되돌린다.
 */
export type CacheSnapshot = Array<[QueryKey, unknown]>;

type InfinitePages<TPage> = InfiniteData<TPage> | undefined;

async function patchInfinitePages<TPage>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  patchPage: (page: TPage) => TPage,
): Promise<CacheSnapshot> {
  // 진행 중인 재요청이 낙관적 값을 덮어쓰지 않도록 먼저 취소한다.
  await queryClient.cancelQueries({ queryKey });
  const snapshot = queryClient.getQueriesData<InfinitePages<TPage>>({ queryKey });

  queryClient.setQueriesData<InfinitePages<TPage>>({ queryKey }, (old) => {
    // 같은 접두사 아래에 무한 쿼리가 아닌 캐시(상세 등)가 있을 수 있어 모양을 확인한다.
    if (!old || !Array.isArray(old.pages)) return old;
    return { ...old, pages: old.pages.map(patchPage) };
  });

  return snapshot;
}

export function restoreSnapshot(queryClient: QueryClient, snapshot: CacheSnapshot) {
  snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

/** 피드 캐시에서 id가 일치하는 로그 하나를 고친다. */
export function patchFeedLog(
  queryClient: QueryClient,
  logId: string,
  patch: (log: OptimizedLog) => OptimizedLog,
) {
  return patchInfinitePages<FeedQueryResult>(queryClient, feedKeys.all, (page) => ({
    ...page,
    items: page.items.map((item): FeedItem =>
      item.feed_type === "log" && item.data.id === logId
        ? { ...item, data: patch(item.data) }
        : item,
    ),
  }));
}

/** 쇼케이스 목록 캐시에서 id가 일치하는 항목 하나를 고친다. */
export function patchShowcase(
  queryClient: QueryClient,
  showcaseId: string,
  patch: (showcase: OptimizedShowcase) => OptimizedShowcase,
) {
  return patchInfinitePages<ShowcaseQueryResult>(queryClient, showcaseKeys.lists(), (page) => ({
    ...page,
    showcases: page.showcases.map((s) => (s.id === showcaseId ? patch(s) : s)),
  }));
}

/** 블로그 목록 캐시에서 id가 일치하는 글 하나를 고친다. */
export function patchBlogPost(
  queryClient: QueryClient,
  postId: string,
  patch: (post: BlogCardProps) => BlogCardProps,
) {
  return patchInfinitePages<BlogPostQueryResult>(queryClient, blogKeys.all, (page) => ({
    ...page,
    blogPosts: page.blogPosts.map((p) => (p.id === postId ? patch(p) : p)),
  }));
}
