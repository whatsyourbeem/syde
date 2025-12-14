"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  filterByCommentedUserId,
  filterByLikedUserId,
  filterByBookmarkedUserId,
  searchQuery,
  initialShowcases,
}: {
  currentUserId: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  filterByBookmarkedUserId?: string;
  searchQuery?: string;
  initialShowcases?: ShowcaseQueryResult;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    propCurrentUserId
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const queryKey = [
    "showcases",
    {
      currentPage,
      filterByUserId,
      filterByCommentedUserId,
      filterByLikedUserId,
      filterByBookmarkedUserId,
      searchQuery,
    },
  ];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: () =>
      fetchShowcasesAction({
        currentUserId,
        currentPage,
        showcasesPerPage: SHOWCASES_PER_PAGE,
        filterByUserId,
        filterByCommentedUserId,
        filterByLikedUserId,
        filterByBookmarkedUserId,
        searchQuery,
      }),
    staleTime: 30000,
    initialData:
      currentPage === 1 &&
      !filterByUserId &&
      !filterByCommentedUserId &&
      !filterByLikedUserId &&
      !filterByBookmarkedUserId &&
      !searchQuery
        ? initialShowcases
        : undefined,
  });

  const showcases: OptimizedShowcase[] = useMemo(
    () => data?.showcases || [],
    [data?.showcases]
  );
  const totalShowcasesCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || []; // Get mentionedProfiles from data

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
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "showcase_likes",
          filter: `showcase_id=in.(${showcaseIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedShowcaseId =
            (
              payload.new as Database["public"]["Tables"]["showcase_likes"]["Row"]
            ).showcase_id ||
            (
              payload.old as Database["public"]["Tables"]["showcase_likes"]["Row"]
            ).showcase_id;
          if (showcases.some((showcase) => showcase.id === changedShowcaseId)) {
            queryClient.invalidateQueries({ queryKey: ["showcases"] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "showcase_bookmarks",
          filter: `showcase_id=in.(${showcaseIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedShowcaseId =
            (
              payload.new as Database["public"]["Tables"]["showcase_bookmarks"]["Row"]
            ).showcase_id ||
            (
              payload.old as Database["public"]["Tables"]["showcase_bookmarks"]["Row"]
            ).showcase_id;
          if (showcases.some((showcase) => showcase.id === changedShowcaseId)) {
            queryClient.invalidateQueries({ queryKey: ["showcases"] });
          }
        }
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, showcases]); // Add showcases to dependencies

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
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-4">
      {showcases.length === 0 && !isLoading ? (
        <div className="px-4">
          <p className="text-center text-muted-foreground">
            아직 기록된 글이 없습니다. 첫 글을 작성해보세요!
          </p>
        </div>
      ) : (
        showcases.map((showcase, index) => (
          <div key={showcase.id} className="px-4">
            <ShowcaseCard
              showcase={showcase}
              currentUserId={currentUserId}
              initialLikesCount={showcase.likesCount}
              initialHasLiked={showcase.hasLiked}
              initialBookmarksCount={showcase.bookmarksCount}
              initialHasBookmarked={showcase.hasBookmarked}
              initialCommentsCount={showcase.showcase_comments.length}
              mentionedProfiles={mentionedProfiles} // Pass mentionedProfiles to ShowcaseCard
              searchQuery={searchQuery} // Pass searchQuery to ShowcaseCard
              isDetailPage={false} // Add this prop
            />
            {index < showcases.length - 1 && (
              <div className="border-b border-gray-200 my-4"></div>
            )}
          </div>
        ))
      )}
      {/* Pagination Controls */}
      {Math.ceil(totalShowcasesCount / SHOWCASES_PER_PAGE) > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            이전
          </Button>
          {Array.from(
            { length: Math.ceil(totalShowcasesCount / SHOWCASES_PER_PAGE) },
            (_, i) => i + 1
          ).map((page) => (
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
            disabled={
              currentPage ===
                Math.ceil(totalShowcasesCount / SHOWCASES_PER_PAGE) || isLoading
            }
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
