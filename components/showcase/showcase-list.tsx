"use client";

import { useEffect, useState, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";
import { fetchShowcasesAction } from "@/app/showcase/showcase-data-actions";
import {
  OptimizedShowcase,
  ShowcaseQueryResult,
} from "@/lib/queries/showcase-queries";
import { LoadingList, CenteredLoading } from "@/components/ui/loading-states";
import { InlineError } from "@/components/error/error-boundary";

const SHOWCASES_PER_PAGE = 20; // Define showcases per page

export function ShowcaseList({
  currentUserId: propCurrentUserId,
  filterByUserId,
  filterByParticipantUserId,
  filterByCommentedUserId,
  filterByUpvotedUserId,
  searchQuery,
  initialShowcases,
}: {
  currentUserId: string | null;
  filterByUserId?: string;
  filterByParticipantUserId?: string;
  filterByCommentedUserId?: string;
  filterByUpvotedUserId?: string;
  searchQuery?: string;
  initialShowcases?: ShowcaseQueryResult;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    propCurrentUserId,
  );

  // Fetch current user ID if not provided
  useEffect(() => {
    if (!propCurrentUserId) {
      async function fetchCurrentUserId() {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      }
      fetchCurrentUserId();
    }
  }, [supabase, propCurrentUserId]);

  const queryKey = [
    "showcases",
    {
      filterByUserId,
      filterByParticipantUserId,
      filterByCommentedUserId,
      filterByUpvotedUserId,
      searchQuery,
    },
  ];

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
    queryFn: ({ pageParam = 1 }) =>
      fetchShowcasesAction({
        currentUserId,
        currentPage: pageParam,
        showcasesPerPage: SHOWCASES_PER_PAGE,
        filterByUserId,
        filterByParticipantUserId,
        filterByCommentedUserId,
        filterByUpvotedUserId,
        searchQuery,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentLoadedCount = lastPage.currentPage * SHOWCASES_PER_PAGE;
      if (currentLoadedCount < lastPage.count) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 30000,
    initialData:
      initialShowcases &&
      !filterByUserId &&
      !filterByCommentedUserId &&
      !filterByUpvotedUserId &&
      !searchQuery
        ? {
            pages: [initialShowcases],
            pageParams: [1],
          }
        : undefined,
  });

  const showcases: OptimizedShowcase[] = useMemo(
    () => data?.pages.flatMap((page) => page.showcases) || [],
    [data?.pages],
  );
  
  const mentionedProfiles = useMemo(
    () => data?.pages.flatMap((page) => page.mentionedProfiles) || [],
    [data?.pages]
  );

  useEffect(() => {
    const showcaseIdsForFilter: string[] = showcases
      .map((showcase) => showcase.id)
      .filter((id): id is string => id !== null);

    if (showcaseIdsForFilter.length === 0) return;

    const channel = supabase
      .channel("syde-showcase-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "showcases" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["showcases"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "showcase_upvotes",
          filter: `showcase_id=in.(${showcaseIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedShowcaseId =
            (
              payload.new as Database["public"]["Tables"]["showcase_upvotes"]["Row"]
            ).showcase_id ||
            (
              payload.old as Database["public"]["Tables"]["showcase_upvotes"]["Row"]
            ).showcase_id;
          if (showcases.some((showcase) => showcase.id === changedShowcaseId)) {
            queryClient.invalidateQueries({ queryKey: ["showcases"] });
          }
        },
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "showcase_comments",
          filter: `showcase_id=in.(${showcaseIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedShowcaseId =
            (
              payload.new as Database["public"]["Tables"]["showcase_comments"]["Row"]
            ).showcase_id ||
            (
              payload.old as Database["public"]["Tables"]["showcase_comments"]["Row"]
            ).showcase_id;
          if (showcases.some((showcase) => showcase.id === changedShowcaseId)) {
            queryClient.invalidateQueries({ queryKey: ["showcases"] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, showcases]);

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto pb-4">
        <div className="px-4">
          <LoadingList count={5} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-3xl mx-auto pb-4">
        <div className="px-4">
          <InlineError
            error={
              error?.message || "쇼케이스를 불러오는 중 오류가 발생했습니다."
            }
            retry={() =>
              queryClient.invalidateQueries({ queryKey: ["showcases"] })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showcases.length === 0 && !isLoading ? (
        <div className="px-4">
          <p className="text-center text-muted-foreground py-10">
            아직 기록된 글이 없습니다. 첫 글을 작성해보세요!
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-full">
            {showcases.map((showcase) => (
              <div key={showcase.id} className="w-full">
                <ShowcaseCard
                  showcase={showcase}
                  currentUserId={currentUserId}
                  initialUpvotesCount={showcase.upvotesCount}
                  initialHasUpvoted={showcase.hasUpvoted}
                  initialCommentsCount={showcase.showcase_comments.length}
                  initialViewsCount={showcase.views_count || 0}
                  mentionedProfiles={mentionedProfiles}
                  isDetailPage={false}
                />
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
