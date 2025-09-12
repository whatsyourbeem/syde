"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "@/components/log/log-card";
import { LogCreateButton } from "@/components/log/log-create-button";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId);
  const [userProfile, setUserProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*, updated_at")
          .eq("id", user.id)
          .single();
          
        if (!error && profile) {
          setUserProfile(profile);
          const url = profile.avatar_url && profile.updated_at
            ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
            : profile.avatar_url;
          setAvatarUrl(url);
        }
      }
    }
    
    fetchUserProfile();
  }, [supabase]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const queryKey = [
    "logs",
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
    queryFn: () => getOptimizedLogs({
      currentUserId,
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
  const totalLogsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || []; // Get mentionedProfiles from data

  useEffect(() => {
    const logIdsForFilter: string[] = logs
      .map((log) => log.id)
      .filter((id): id is string => id !== null);

    if (logIdsForFilter.length === 0) return;

    const channel = supabase
      .channel("syde-log-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "log_likes",
          filter: `log_id=in.(${logIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedLogId =
            (payload.new as Database["public"]["Tables"]["log_likes"]["Row"])
              .log_id ||
            (payload.old as Database["public"]["Tables"]["log_likes"]["Row"])
              .log_id;
          if (logs.some((log) => log.id === changedLogId)) {
            queryClient.invalidateQueries({ queryKey: ["logs"] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "log_bookmarks",
          filter: `log_id=in.(${logIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedLogId =
            (payload.new as Database["public"]["Tables"]["log_bookmarks"]["Row"])
              .log_id ||
            (payload.old as Database["public"]["Tables"]["log_bookmarks"]["Row"])
              .log_id;
          if (logs.some((log) => log.id === changedLogId)) {
            queryClient.invalidateQueries({ queryKey: ["logs"] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "log_comments",
          filter: `log_id=in.(${logIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedLogId =
            (payload.new as Database["public"]["Tables"]["log_comments"]["Row"])
              .log_id ||
            (payload.old as Database["public"]["Tables"]["log_comments"]["Row"])
              .log_id;
          if (logs.some((log) => log.id === changedLogId)) {
            queryClient.invalidateQueries({ queryKey: ["logs"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, logs]); // Add logs to dependencies

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto pb-4">
        {/* Create button skeleton */}
        <div className="px-4 py-3 border-b border-gray-200 animate-pulse">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0 mr-3" />
            <div className="h-4 bg-gray-200 rounded-md w-48" />
          </div>
        </div>
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
      {!filterByUserId && !filterByCommentedUserId && !filterByLikedUserId && !filterByBookmarkedUserId && !searchQuery && (
        <LogCreateButton user={userProfile} avatarUrl={avatarUrl} />
      )}
      
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
              currentUserId={currentUserId}
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
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from(
          { length: Math.ceil(totalLogsCount / LOGS_PER_PAGE) },
          (_, i) => (
            <Button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              variant="ghost"
              className={currentPage === i + 1 ? "bg-secondary" : ""}
              disabled={isLoading}
            >
              {isLoading && currentPage === i + 1 ? (
                <CenteredLoading message="" className="py-0" />
              ) : (
                i + 1
              )}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
