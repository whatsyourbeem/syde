"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "@/components/log/log-card";
import { ActivityCard } from "@/components/log/activity-card";
import { Button } from "@/components/ui/button";
import { getUnifiedFeed, FeedQueryResult, FeedItem, LogFeedItem, ActivityFeedEntry } from "@/lib/queries/feed-queries";
import { LoadingList, CenteredLoading } from "@/components/ui/loading-states";
import { InlineError } from "@/components/error/error-boundary";


const ITEMS_PER_PAGE = 20;

export function LogList({
  currentUserId: propCurrentUserId,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  filterByBookmarkedUserId,
  searchQuery,
  initialFeed,
  emptyState,
}: {
  currentUserId: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  filterByBookmarkedUserId?: string;
  searchQuery?: string;
  initialFeed?: FeedQueryResult;
  emptyState?: React.ReactNode;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    const filters: { [key: string]: string | number } = {};
    if (filterByUserId) filters.filterByUserId = filterByUserId;
    if (filterByCommentedUserId) filters.filterByCommentedUserId = filterByCommentedUserId;
    if (filterByLikedUserId) filters.filterByLikedUserId = filterByLikedUserId;
    if (filterByBookmarkedUserId) filters.filterByBookmarkedUserId = filterByBookmarkedUserId;
    if (searchQuery) filters.searchQuery = searchQuery;
    return ["feed", filters];
  }, [
    filterByUserId,
    filterByCommentedUserId,
    filterByLikedUserId,
    filterByBookmarkedUserId,
    searchQuery,
  ]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: ({ pageParam = 1 }) => getUnifiedFeed(supabase, {
      currentUserId: propCurrentUserId,
      currentPage: pageParam,
      logsPerPage: ITEMS_PER_PAGE,
      filterByUserId,
      filterByCommentedUserId,
      filterByLikedUserId,
      filterByBookmarkedUserId,
      searchQuery,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentLoadedCount = lastPage.currentPage * ITEMS_PER_PAGE;
      if (currentLoadedCount < lastPage.totalCount) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 30000,
    initialData: !filterByUserId && !filterByCommentedUserId && !filterByLikedUserId && !filterByBookmarkedUserId && !searchQuery && initialFeed 
      ? {
          pages: [initialFeed],
          pageParams: [1],
        }
      : undefined,
  });

  const feedItems: FeedItem[] = useMemo(
    () => data?.pages.flatMap((page) => page.items) || [],
    [data?.pages]
  );
  const mentionedProfiles = useMemo(
    () => data?.pages.flatMap((page) => page.mentionedProfiles) || [],
    [data?.pages]
  );

  useEffect(() => {
    const channel = supabase
      .channel("syde-log-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_likes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_bookmarks" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_comments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_feed" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  if (isLoading) {
    return (
      <div className="w-full pb-4">
        <div className="px-4">
          <LoadingList count={5} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full pb-4">
        <div className="px-4">
          <InlineError
            error={error?.message || "피드를 불러오는 중 오류가 발생했습니다."}
            retry={() => queryClient.invalidateQueries({ queryKey: ["feed"] })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-4">
      {feedItems.length === 0 && !isLoading ? (
        emptyState ? (
          emptyState
        ) : (
          <div className="px-4">
            <p className="text-center text-muted-foreground py-10">
              {searchQuery ? "검색 결과가 없습니다." : "작성된 로그가 없습니다."}
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="w-full">
            {feedItems.map((item, index) => (
              <div key={item.feed_type === "log" ? `log-${item.data.id}` : `activity-${item.data.id}`} className="w-full">
                <div className="px-4">
                  {item.feed_type === "log" ? (
                    <LogCard
                      log={item.data}
                      currentUserId={propCurrentUserId}
                      initialLikesCount={item.data.likesCount}
                      initialHasLiked={item.data.hasLiked}
                      initialBookmarksCount={item.data.bookmarksCount}
                      initialHasBookmarked={item.data.hasBookmarked}
                      initialCommentsCount={item.data.log_comments.length}
                      mentionedProfiles={mentionedProfiles}
                      searchQuery={searchQuery}
                      isDetailPage={false}
                      priority={index < 2}
                    />
                  ) : (
                    <ActivityCard activity={item.data} currentUserId={propCurrentUserId} />
                  )}
                </div>
                {index < feedItems.length - 1 && (
                  <div className="border-b border-gray-200"></div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button - Insight Style */}
          {hasNextPage && (
            <div className="flex justify-center mt-12 mb-12">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                className="rounded-full px-6 py-2 text-[0.875rem] font-[700] text-[#777777] border-[#E2E8F0] hover:bg-slate-50"
              >
                {isFetchingNextPage ? "불러오는 중..." : "더보기"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
