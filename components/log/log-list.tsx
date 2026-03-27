"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "@/components/log/log-card";
import { ActivityCard } from "@/components/log/activity-card";
import { Button } from "@/components/ui/button";
import { getUnifiedFeed, FeedQueryResult, FeedItem } from "@/lib/queries/feed-queries";
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
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const queryKey = useMemo(() => {
    const filters: { [key: string]: string | number } = { currentPage };
    if (filterByUserId) filters.filterByUserId = filterByUserId;
    if (filterByCommentedUserId) filters.filterByCommentedUserId = filterByCommentedUserId;
    if (filterByLikedUserId) filters.filterByLikedUserId = filterByLikedUserId;
    if (filterByBookmarkedUserId) filters.filterByBookmarkedUserId = filterByBookmarkedUserId;
    if (searchQuery) filters.searchQuery = searchQuery;
    return ["feed", filters];
  }, [
    currentPage,
    filterByUserId,
    filterByCommentedUserId,
    filterByLikedUserId,
    filterByBookmarkedUserId,
    searchQuery,
  ]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => getUnifiedFeed(supabase, {
      currentUserId: propCurrentUserId,
      currentPage,
      logsPerPage: ITEMS_PER_PAGE,
      filterByUserId,
      filterByCommentedUserId,
      filterByLikedUserId,
      filterByBookmarkedUserId,
      searchQuery,
    }),
    staleTime: 30000,
    initialData: currentPage === 1 && !filterByUserId && !filterByCommentedUserId && !filterByLikedUserId && !filterByBookmarkedUserId && !searchQuery ? initialFeed : undefined,
  });

  const feedItems: FeedItem[] = useMemo(() => data?.items || [], [data?.items]);
  const totalCount = data?.totalCount || 0;
  const mentionedProfiles = data?.mentionedProfiles || [];

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
      <div className="w-full max-w-2xl mx-auto pb-4">
        <div className="px-4">
          <LoadingList count={5} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-2xl mx-auto pb-4">
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
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-4">
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
        feedItems.map((item, index) => (
          <div key={item.feed_type === "log" ? `log-${item.data.id}` : `activity-${item.data.id}`} className="px-4">
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
              <ActivityCard activity={item.data} />
            )}
            {index < feedItems.length - 1 && (
              <div className="border-b border-gray-200 my-4"></div>
            )}
          </div>
        ))
      )}
      {/* Pagination Controls */}
      {Math.ceil(totalCount / ITEMS_PER_PAGE) > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            이전
          </Button>
          {Array.from({ length: Math.ceil(totalCount / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              disabled={isLoading}
            >
              {isLoading && currentPage === page ? (
                <CenteredLoading message="" className="py-0" />
              ) : (
                page
              )}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE) || isLoading}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
