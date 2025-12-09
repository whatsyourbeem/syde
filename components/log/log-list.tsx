"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "@/components/log/log-card";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";
import { getOptimizedLogs, OptimizedLog, LogQueryResult } from "@/lib/queries/log-queries";
import { LoadingList, CenteredLoading } from "@/components/ui/loading-states";
import { InlineError } from "@/components/error/error-boundary";


const LOGS_PER_PAGE = 20; // Define logs per page

export function LogList({
  currentUserId: propCurrentUserId,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  filterByBookmarkedUserId,
  searchQuery,
  initialLogs,
}: {
  currentUserId: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  filterByBookmarkedUserId?: string;
  searchQuery?: string;
  initialLogs?: LogQueryResult;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    console.log("LogList: useEffect - Scroll to Top. Deps:", { currentPage });
    window.scrollTo(0, 0);
  }, [currentPage]);

  const queryKey = useMemo(() => {
    const filters: { [key: string]: string | number } = { currentPage };
    if (filterByUserId) filters.filterByUserId = filterByUserId;
    if (filterByCommentedUserId) filters.filterByCommentedUserId = filterByCommentedUserId;
    if (filterByLikedUserId) filters.filterByLikedUserId = filterByLikedUserId;
    if (filterByBookmarkedUserId) filters.filterByBookmarkedUserId = filterByBookmarkedUserId;
    if (searchQuery) filters.searchQuery = searchQuery;
    console.log("LogList: useMemo - Query Key. Result:", ["logs", filters]);
    return ["logs", filters];
  }, [
    currentPage,
    filterByUserId,
    filterByCommentedUserId,
    filterByLikedUserId,
    filterByBookmarkedUserId,
    searchQuery,
  ]);

  console.log("LogList: Before useQuery. QueryKey:", queryKey);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => getOptimizedLogs({
      currentUserId: propCurrentUserId,
      currentPage,
      logsPerPage: LOGS_PER_PAGE,
      filterByUserId,
      filterByCommentedUserId,
      filterByLikedUserId,
      filterByBookmarkedUserId,
      searchQuery,
    }),
    staleTime: 30000,
    initialData: currentPage === 1 && !filterByUserId && !filterByCommentedUserId && !filterByLikedUserId && !filterByBookmarkedUserId && !searchQuery ? initialLogs : undefined,
  });

  const logs: OptimizedLog[] = useMemo(() => data?.logs || [], [data?.logs]);
  console.log("LogList: After logs memo. logsLength:", logs.length, "isLoading:", isLoading, "data:", data);
  const totalLogsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || []; // Get mentionedProfiles from data

  useEffect(() => {
    console.log("LogList: useEffect - Realtime. Deps:", { supabase, queryClient });
    // We will listen for any changes in relevant tables and invalidate the query.
    // This decouples the subscription from specific log IDs on the current page,
    // which prevents complex dependency loops and ensures a stable `useEffect`.
    // The `queryClient.invalidateQueries` will ensure the latest data is fetched.
    const channel = supabase
      .channel("syde-log-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs" },
        () => {
          console.log("Realtime: Invalidating logs query - table: logs");
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_likes" },
        () => {
          console.log("Realtime: Invalidating logs query - table: log_likes");
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_bookmarks" },
        () => {
          console.log("Realtime: Invalidating logs query - table: log_bookmarks");
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_comments" },
        () => {
          console.log("Realtime: Invalidating logs query - table: log_comments");
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]); // Stable dependencies only. No `logs`.

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
            error={error?.message || "로그를 불러오는 중 오류가 발생했습니다."}
            retry={() => queryClient.invalidateQueries({ queryKey: ["logs"] })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-4">
      {logs.length === 0 && !isLoading ? (
        <div className="px-4">
          <p className="text-center text-muted-foreground">
            아직 기록된 글이 없습니다. 첫 글을 작성해보세요!
          </p>
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={log.id} className="px-4">
            <LogCard
              log={log}
              currentUserId={propCurrentUserId}
              initialLikesCount={log.likesCount}
              initialHasLiked={log.hasLiked}
              initialBookmarksCount={log.bookmarksCount}
              initialHasBookmarked={log.hasBookmarked}
              initialCommentsCount={log.log_comments.length}
              mentionedProfiles={mentionedProfiles} // Pass mentionedProfiles to LogCard
              searchQuery={searchQuery} // Pass searchQuery to LogCard
              isDetailPage={false} // Add this prop
            />
            {index < logs.length - 1 && (
              <div className="border-b border-gray-200 my-4"></div>
            )}
          </div>
        ))
      )}
      {/* Pagination Controls */}
      {Math.ceil(totalLogsCount / LOGS_PER_PAGE) > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            이전
          </Button>
          {Array.from({ length: Math.ceil(totalLogsCount / LOGS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
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
            disabled={currentPage === Math.ceil(totalLogsCount / LOGS_PER_PAGE) || isLoading}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
